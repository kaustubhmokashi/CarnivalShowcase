import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const remoteConfig = window.DRIVEDECK_REMOTE_FIREBASE || {};
const firebaseConfig = remoteConfig.firebaseConfig || {};
const collectionName = remoteConfig.collectionName || "pairingCodes";
const temporaryCodeExpiryMs = Number(remoteConfig.temporaryCodeExpiryDays || 2) * 24 * 60 * 60 * 1000;
const enableAnonymousAuth = remoteConfig.enableAnonymousAuth !== false;

const remoteForm = document.getElementById("remote-form");
const remoteUrlInput = document.getElementById("remote-url");
const remoteCodeEl = document.getElementById("remote-code");
const remoteStatusEl = document.getElementById("remote-status");
const remoteResultPanel = document.getElementById("remote-result-panel");
const remoteResultNoteEl = document.getElementById("remote-result-note");
const shareCodeButton = document.getElementById("share-code-button");
const copyCodeButton = document.getElementById("copy-code-button");
const newCodeButton = document.getElementById("new-code-button");
const deleteModeButton = document.getElementById("delete-mode-button");
const cancelDeleteButton = document.getElementById("cancel-delete-button");
const deleteForm = document.getElementById("remote-delete-form");
const deleteCodeInput = document.getElementById("delete-code");
const deleteUrlInput = document.getElementById("delete-url");
const deleteFeedbackEl = document.getElementById("delete-feedback");
const permanentCheckbox = document.getElementById("remote-permanent");

let latestCode = "";
let latestFolderName = "";
let isDeleteMode = false;
let db = null;

function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function normalizeUrl(url) {
  return String(url || "").trim();
}

function extractFolderId(input) {
  if (!input) {
    return null;
  }

  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    const folderMatch = parsedUrl.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) {
      return folderMatch[1];
    }

    const idParam = parsedUrl.searchParams.get("id");
    if (idParam) {
      return idParam;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function isValidCode(code) {
  return /^\d{6}$|^\d{9}$/.test(String(code || "").trim());
}

function setRemoteStatus(message, isError = false) {
  remoteStatusEl.textContent = message;
  remoteStatusEl.classList.toggle("is-error", isError);
  remoteStatusEl.classList.toggle("is-success", !isError && Boolean(message));
}

function setDeleteFeedback(message = "", tone = "") {
  deleteFeedbackEl.textContent = message;
  deleteFeedbackEl.classList.toggle("hidden", !message);
  deleteFeedbackEl.classList.toggle("is-success", tone === "success");
  deleteFeedbackEl.classList.toggle("is-error", tone === "error");
}

function setResultMode(isResultMode) {
  remoteForm.classList.toggle("hidden", isResultMode);
  newCodeButton.classList.toggle("hidden", !isResultMode);
  remoteResultPanel.classList.toggle("hidden", !isResultMode || isDeleteMode);
}

function setDeleteMode(enabled) {
  isDeleteMode = enabled;
  remoteForm.classList.toggle("hidden", enabled);
  deleteForm.classList.toggle("hidden", !enabled);
  deleteModeButton.classList.toggle("hidden", enabled);
  cancelDeleteButton.classList.toggle("hidden", !enabled);
  newCodeButton.classList.toggle("hidden", enabled || !latestCode);
  remoteResultPanel.classList.toggle("hidden", enabled || !latestCode);

  if (enabled) {
    setDeleteFeedback();
    setRemoteStatus("Enter the code and original folder link to delete it.");
    deleteCodeInput.focus();
  } else {
    setDeleteFeedback();
    setRemoteStatus(latestCode ? "Use the code above on your TV." : "Paste a Google Drive folder link to get started.");
    remoteUrlInput.focus();
  }
}

function buildShareMessage() {
  const folderName = latestFolderName || "Google Drive folder";
  return `Your DriveDeck pairing code for ${folderName} is *${latestCode}*`;
}

function timestampToMs(value) {
  if (!value) {
    return Number.NaN;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function isExpired(entry) {
  if (entry?.permanent) {
    return false;
  }

  const createdAtMs = timestampToMs(entry?.createdAt);
  return Number.isNaN(createdAtMs) || Date.now() - createdAtMs > temporaryCodeExpiryMs;
}

function generateNumericCode(length) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

async function generateUniqueCode(length) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = generateNumericCode(length);
    const existingDoc = await getDoc(doc(db, collectionName, candidate));
    if (!existingDoc.exists()) {
      return candidate;
    }
  }

  throw new Error("We couldn’t create a unique code right now. Please try again.");
}

async function findReusableCode(normalizedUrl, permanent) {
  const codeQuery = query(
    collection(db, collectionName),
    where("normalizedUrl", "==", normalizedUrl),
    limit(10)
  );
  const snapshot = await getDocs(codeQuery);

  for (const codeDoc of snapshot.docs) {
    const data = codeDoc.data();

    if (isExpired(data)) {
      await deleteDoc(codeDoc.ref);
      continue;
    }

    if (Boolean(data.permanent) !== permanent) {
      continue;
    }

    return { code: codeDoc.id, data };
  }

  return null;
}

function explainFirebaseError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "");

  if (code.includes("permission-denied")) {
    return "We couldn’t create the code right now. Please try again.";
  }

  if (code.includes("failed-precondition") || message.toLowerCase().includes("index")) {
    return "Firestore needs an index or a simpler query. Refresh once and try again; if it persists, we’ll tighten the query path further.";
  }

  return message || "We couldn’t create the code right now.";
}

async function createCodeRecord(url, permanent) {
  const normalizedUrl = normalizeUrl(url);
  const reusable = await findReusableCode(normalizedUrl, permanent);
  const folderId = extractFolderId(url);

  if (reusable) {
    return {
      code: reusable.code,
      folderName: reusable.data.folderName || "Google Drive folder",
      reused: true,
      folderId,
    };
  }

  const code = await generateUniqueCode(permanent ? 9 : 6);
  await setDoc(doc(db, collectionName, code), {
    url: normalizedUrl,
    normalizedUrl,
    folderId: folderId || "",
    folderName: "",
    createdAt: new Date().toISOString(),
    permanent,
  });

  return {
    code,
    folderName: "Google Drive folder",
    reused: false,
    folderId,
  };
}

async function deleteCodeRecord(code, url) {
  const docRef = doc(db, collectionName, code);
  const existing = await getDoc(docRef);
  if (!existing.exists()) {
    throw new Error("We couldn’t match that code with the Google Drive link provided.");
  }

  const data = existing.data() || {};
  if (normalizeUrl(data.url) !== normalizeUrl(url)) {
    throw new Error("We couldn’t match that code with the Google Drive link provided.");
  }

  await deleteDoc(docRef);
}

remoteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const url = normalizeUrl(remoteUrlInput.value);
  const permanent = permanentCheckbox.checked;

  if (!url) {
    setRemoteStatus("Paste a Google Drive folder link first.", true);
    return;
  }

  if (!db) {
    setRemoteStatus("We couldn’t connect right now. Please try again.", true);
    return;
  }

  try {
    setRemoteStatus("Creating code...");
    const result = await createCodeRecord(url, permanent);
    latestCode = result.code;
    latestFolderName = result.folderName;
    remoteCodeEl.textContent = result.code;
    remoteResultNoteEl.textContent = result.reused
      ? "This code already points to the same folder."
      : "Enter this code on your TV.";

    setResultMode(true);
    deleteModeButton.classList.remove("hidden");
    setRemoteStatus("Code ready. Enter it on your TV.");
    remoteForm.reset();
  } catch (error) {
    setRemoteStatus(explainFirebaseError(error), true);
  }
});

copyCodeButton.addEventListener("click", async () => {
  if (!latestCode) {
    setRemoteStatus("Create a code first, then you can copy it.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(latestCode);
    setRemoteStatus("Code copied.");
  } catch (error) {
    setRemoteStatus("Copy failed. Please copy the code manually.", true);
  }
});

shareCodeButton.addEventListener("click", async () => {
  if (!latestCode) {
    setRemoteStatus("Create a code first, then you can share it.", true);
    return;
  }

  const message = buildShareMessage();
  try {
    if (navigator.share) {
      await navigator.share({ text: message });
      setRemoteStatus("Share sheet opened.");
      return;
    }

    await navigator.clipboard.writeText(message);
    setRemoteStatus("Sharing is unavailable here, so the message was copied instead.");
  } catch (error) {
    setRemoteStatus("Share failed. Try copying the code instead.", true);
  }
});

newCodeButton.addEventListener("click", () => {
  latestCode = "";
  latestFolderName = "";
  remoteCodeEl.textContent = "---------";
  remoteResultNoteEl.textContent = "Enter this code on your TV.";
  setResultMode(false);
  deleteModeButton.classList.remove("hidden");
  setRemoteStatus("Paste another Google Drive folder link to create a new code.");
  remoteUrlInput.focus();
});

deleteModeButton.addEventListener("click", () => {
  setDeleteMode(true);
});

cancelDeleteButton.addEventListener("click", () => {
  deleteForm.reset();
  setDeleteMode(false);
});

deleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const code = String(deleteCodeInput.value || "").trim();
  const url = normalizeUrl(deleteUrlInput.value);

  if (!isValidCode(code) || !url) {
    setDeleteFeedback("Enter the code and original folder link to continue.", "error");
    return;
  }

  if (!db) {
    setDeleteFeedback("We couldn’t connect right now. Please try again.", "error");
    return;
  }

  try {
    setDeleteFeedback();
    await deleteCodeRecord(code, url);
    deleteForm.reset();

    if (latestCode === code) {
      latestCode = "";
      latestFolderName = "";
      remoteCodeEl.textContent = "---------";
      remoteResultNoteEl.textContent = "Enter this code on your TV.";
      setResultMode(false);
    }

    setDeleteMode(false);
    setDeleteFeedback();
    setRemoteStatus("Code deleted successfully.");
  } catch (error) {
    setDeleteFeedback(error.message || "Could not delete code.", "error");
  }
});

async function boot() {
  if (!isFirebaseConfigured()) {
    setRemoteStatus("");
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  if (enableAnonymousAuth) {
    const auth = getAuth(app);
    await signInAnonymously(auth);
  }

  setRemoteStatus("");
}

boot().catch((error) => {
  setRemoteStatus(error.message || "We couldn’t connect right now.", true);
});
