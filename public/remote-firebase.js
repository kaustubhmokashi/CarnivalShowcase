import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const remoteConfig = window.GALLERY_REMOTE_FIREBASE || {};
const firebaseConfig = remoteConfig.firebaseConfig || {};
const collectionName = remoteConfig.collectionName || "pairingCodes";
const validateFolderEndpoint = remoteConfig.validateFolderEndpoint || "/api/folder-meta";
const temporaryCodeExpiryMs = Number(remoteConfig.temporaryCodeExpiryDays || 1) * 24 * 60 * 60 * 1000;

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

function isValidCode(code) {
  return /^\d{6}$|^\d{7}$/.test(String(code || "").trim());
}

function setRemoteStatus(message, isError = false) {
  remoteStatusEl.textContent = message;
  remoteStatusEl.classList.toggle("is-error", isError);
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
    setRemoteStatus("Enter the code and original Drive link to delete it.");
    deleteCodeInput.focus();
  } else {
    setDeleteFeedback();
    setRemoteStatus(latestCode ? `You’re all set. Enter ${latestCode} on your TV to continue.` : "Paste a Google Drive link whenever you're ready.");
    remoteUrlInput.focus();
  }
}

function buildShareMessage() {
  const folderName = latestFolderName || "Google Drive folder";
  return `Your pairing code for ${folderName} is *${latestCode}*`;
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

async function validateFolder(url) {
  const response = await fetch(`${validateFolderEndpoint}?url=${encodeURIComponent(url)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "We couldn’t validate that Google Drive folder.");
  }

  return {
    id: data.id || "",
    name: data.name || "Google Drive folder",
  };
}

async function findReusableCode(normalizedUrl, permanent) {
  const codeQuery = query(
    collection(db, collectionName),
    where("normalizedUrl", "==", normalizedUrl),
    where("permanent", "==", permanent),
    limit(10)
  );
  const snapshot = await getDocs(codeQuery);

  for (const codeDoc of snapshot.docs) {
    const data = codeDoc.data();

    if (isExpired(data)) {
      await deleteDoc(codeDoc.ref);
      continue;
    }

    return { code: codeDoc.id, data };
  }

  return null;
}

async function createCodeRecord(url, permanent, folderMeta) {
  const normalizedUrl = normalizeUrl(url);
  const reusable = await findReusableCode(normalizedUrl, permanent);
  if (reusable) {
    return {
      code: reusable.code,
      folderName: reusable.data.folderName || folderMeta.name,
      reused: true,
    };
  }

  const code = await generateUniqueCode(permanent ? 7 : 6);
  await setDoc(doc(db, collectionName, code), {
    url: normalizedUrl,
    normalizedUrl,
    folderId: folderMeta.id,
    folderName: folderMeta.name,
    createdAt: serverTimestamp(),
    permanent,
  });

  return {
    code,
    folderName: folderMeta.name,
    reused: false,
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
  if (!url) {
    setRemoteStatus("Paste a Google Drive folder link to get started.", true);
    return;
  }

  if (!db) {
    setRemoteStatus("Firebase is not configured yet. Update remote-firebase-config.js first.", true);
    return;
  }

  try {
    setRemoteStatus("Validating your Drive folder...");
    const folderMeta = await validateFolder(url);
    setRemoteStatus("Creating your pairing code...");

    const result = await createCodeRecord(url, false, folderMeta);
    latestCode = result.code;
    latestFolderName = result.folderName || folderMeta.name;
    remoteCodeEl.textContent = result.code;
    remoteResultNoteEl.textContent = result.reused
      ? "This existing code already points to the same folder."
      : "Enter this code on your TV to open the folder.";

    setResultMode(true);
    deleteModeButton.classList.remove("hidden");
    setRemoteStatus(`You’re all set. Enter ${result.code} on your TV to continue.`);
    remoteForm.reset();
  } catch (error) {
    setRemoteStatus(error.message || "We couldn’t create the code right now.", true);
  }
});

copyCodeButton.addEventListener("click", async () => {
  if (!latestCode) {
    setRemoteStatus("Create a code first, then you can copy it.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(latestCode);
    setRemoteStatus(`Copied ${latestCode}.`);
  } catch (error) {
    setRemoteStatus("We couldn’t copy it automatically, so please copy it manually.", true);
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
    setRemoteStatus("Sharing is not available here, so we copied the message instead.");
  } catch (error) {
    setRemoteStatus("We couldn’t open sharing right now.", true);
  }
});

newCodeButton.addEventListener("click", () => {
  latestCode = "";
  latestFolderName = "";
  remoteCodeEl.textContent = "---------";
  remoteResultNoteEl.textContent = "Enter this code on your TV to open the folder.";
  setResultMode(false);
  deleteModeButton.classList.remove("hidden");
  setRemoteStatus("Paste another Google Drive link whenever you're ready.");
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
    setDeleteFeedback("Enter the code and original Google Drive link to continue.", "error");
    return;
  }

  if (!db) {
    setDeleteFeedback("Firebase is not configured yet. Update remote-firebase-config.js first.", "error");
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
      remoteResultNoteEl.textContent = "Enter this code on your TV to open the folder.";
      setResultMode(false);
    }

    setDeleteFeedback("Code deleted successfully.", "success");
    setRemoteStatus("");
  } catch (error) {
    setDeleteFeedback(error.message || "Could not delete code.", "error");
  }
});

function boot() {
  if (!isFirebaseConfigured()) {
    setRemoteStatus("Update remote-firebase-config.js with your Firebase project settings before using this page.", true);
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  setRemoteStatus("Firebase remote is ready.");
}

boot();
