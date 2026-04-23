import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseSettings = window.CARNIVAL_FIREBASE || {};
const firebaseConfig = firebaseSettings.firebaseConfig || {};
const collections = {
  users: firebaseSettings.collections?.users || "users",
  studioNames: firebaseSettings.collections?.studioNames || "studioNames",
  publicPages: firebaseSettings.collections?.publicPages || "publicPages",
  pairingCodes: firebaseSettings.collections?.pairingCodes || "pairingCodes",
};

const screenDirectLink = document.getElementById("screen-direct-link");
const screenGallery = document.getElementById("screen-gallery");
const screenStudio = document.getElementById("screen-studio");
const openStudioLoginButton = document.getElementById("open-studio-login");
const googleLoginButton = document.getElementById("google-login-button");
const studioSignOutButton = document.getElementById("studio-sign-out");
const studioUserLabel = document.getElementById("studio-user-label");
const studioAuthPanel = document.getElementById("studio-auth-panel");
const studioNamePanel = document.getElementById("studio-name-panel");
const studioNameForm = document.getElementById("studio-name-form");
const studioNameInput = document.getElementById("studio-name-input");
const studioNameStatus = document.getElementById("studio-name-status");
const studioAuthStatus = document.getElementById("studio-auth-status");
const studioAdminPanel = document.getElementById("studio-admin-panel");
const adminAccountsList = document.getElementById("admin-accounts-list");
const adminAccountsStatus = document.getElementById("admin-accounts-status");
const adminSaveAccountsButton = document.getElementById("admin-save-accounts");
const adminTabs = Array.from(document.querySelectorAll("[data-admin-filter]"));
const studioDashboardPanel = document.getElementById("studio-dashboard-panel");
const studioSidebarName = document.getElementById("studio-sidebar-name");
const studioSidebarLogoLink = document.getElementById("studio-sidebar-logo-link");
const studioSidebarLogo = document.getElementById("studio-sidebar-logo");
const studioSidebarTabs = Array.from(document.querySelectorAll("[data-studio-section]"));
const studioPagesSection = document.getElementById("studio-pages-section");
const studioBrandingSection = document.getElementById("studio-branding-section");
const studioAccountSection = document.getElementById("studio-account-section");
const studioBrandingForm = document.getElementById("studio-branding-form");
const brandingBackgroundPicker = document.getElementById("branding-background-picker");
const brandingBackgroundHex = document.getElementById("branding-background-hex");
const brandingAccentPicker = document.getElementById("branding-accent-picker");
const brandingAccentHex = document.getElementById("branding-accent-hex");
const brandingLogoLink = document.getElementById("branding-logo-link");
const brandingFaviconLink = document.getElementById("branding-favicon-link");
const brandingHomepageLink = document.getElementById("branding-homepage-link");
const studioBrandingStatus = document.getElementById("studio-branding-status");
const studioAccountForm = document.getElementById("studio-account-form");
const accountStudioName = document.getElementById("account-studio-name");
const studioAccountStatus = document.getElementById("studio-account-status");
const savedPagesTable = document.getElementById("saved-pages-table");
const studioToast = document.getElementById("studio-toast");
const createPageButton = document.getElementById("create-page-button");
const linkApprovalNotice = document.getElementById("link-approval-notice");
const createPagePanel = document.getElementById("create-page-panel");
const closeCreatePageButton = document.getElementById("close-create-page");
const wizardStepLabel = document.getElementById("wizard-step-label");
const wizardDriveForm = document.getElementById("wizard-drive-form");
const wizardDriveLink = document.getElementById("wizard-drive-link");
const wizardDriveStatus = document.getElementById("wizard-drive-status");
const wizardMediaStep = document.getElementById("wizard-media-step");
const wizardMediaSearch = document.getElementById("wizard-media-search");
const wizardMediaList = document.getElementById("wizard-media-list");
const wizardMediaNext = document.getElementById("wizard-media-next");
const wizardMediaStatus = document.getElementById("wizard-media-status");
const wizardPageForm = document.getElementById("wizard-page-form");
const wizardPageName = document.getElementById("wizard-page-name");
const wizardPageStatus = document.getElementById("wizard-page-status");
const wizardDetailsForm = document.getElementById("wizard-details-form");
const wizardTagline = document.getElementById("wizard-tagline");
const wizardEventStart = document.getElementById("wizard-event-start");
const wizardEventEnd = document.getElementById("wizard-event-end");
const wizardDetailsStatus = document.getElementById("wizard-details-status");
const wizardTemplateStep = document.getElementById("wizard-template-step");
const wizardCreatePage = document.getElementById("wizard-create-page");
const wizardTemplateStatus = document.getElementById("wizard-template-status");

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let savedPages = [];
let allAccounts = [];
let pendingAccountStatuses = new Map();
let activeAdminFilter = "active";
let wizardState = createEmptyWizardState();
let authHasResolved = false;
let currentWizardStep = 1;
const ADMIN_EMAIL = "carnivalshowcase@gmail.com";

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function isAdminEmail(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
}

function getAccountStatus(profile) {
  if (isAdminEmail(profile?.email)) {
    return "active";
  }

  const status = String(profile?.accountStatus || "new").toLowerCase();
  return ["active", "inactive", "new"].includes(status) ? status : "new";
}

function canCreateLinks(profile = currentProfile) {
  return getAccountStatus(profile) === "active";
}

function createEmptyWizardState() {
  return {
    mode: "create",
    existingPage: null,
    driveLink: "",
    folderTree: null,
    folders: [],
    selectedMediaFolderId: "",
    flatMedia: [],
    selectedCover: null,
    pageName: "",
    pageSlug: "",
    tagline: "",
    eventStartDate: "",
    eventEndDate: "",
    pairingCode: "",
    template: "template-1",
  };
}

function normalizeHexColor(value, fallback) {
  const cleaned = String(value || "").trim().replace(/^#/, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(cleaned) ? `#${cleaned}` : fallback;
}

function getDefaultBranding() {
  return {
    backgroundColor: "#FFFFFF",
    accentColor: "#000000",
    logoLink: "",
    faviconLink: "",
    homepageLink: "",
  };
}

function getProfileBranding(profile = currentProfile) {
  const defaults = getDefaultBranding();
  const branding = profile?.branding || {};
  return {
    backgroundColor: normalizeHexColor(branding.backgroundColor, defaults.backgroundColor),
    accentColor: normalizeHexColor(branding.accentColor, defaults.accentColor),
    logoLink: String(branding.logoLink || ""),
    faviconLink: String(branding.faviconLink || ""),
    homepageLink: String(branding.homepageLink || ""),
  };
}

function getBrandingFromInputs() {
  return {
    backgroundColor: normalizeHexColor(brandingBackgroundHex.value, "#FFFFFF"),
    accentColor: normalizeHexColor(brandingAccentHex.value, "#000000"),
    logoLink: brandingLogoLink.value.trim(),
    faviconLink: brandingFaviconLink.value.trim(),
    homepageLink: brandingHomepageLink.value.trim(),
  };
}

function extractDriveFileId(input) {
  const value = String(input || "").trim();
  if (!value) {
    return "";
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) {
    return value;
  }

  try {
    const parsedUrl = new URL(value);
    const fileMatch = parsedUrl.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      return fileMatch[1];
    }

    return parsedUrl.searchParams.get("id") || "";
  } catch (error) {
    return "";
  }
}

function resolveStudioLogoSource(logoLink) {
  const fileId = extractDriveFileId(logoLink);
  if (fileId) {
    return `/api/image?id=${encodeURIComponent(fileId)}&mode=screen`;
  }

  return String(logoLink || "").trim();
}

function setColorInputs(hexInput, pickerInput, value) {
  const normalized = normalizeHexColor(value, pickerInput?.value || "#000000");
  if (hexInput) {
    hexInput.value = normalized.replace("#", "");
  }
  if (pickerInput) {
    pickerInput.value = normalized.toLowerCase();
  }
}

function hydrateStudioSettingsForms() {
  const branding = getProfileBranding();
  const logoSource = resolveStudioLogoSource(branding.logoLink);
  setColorInputs(brandingBackgroundHex, brandingBackgroundPicker, branding.backgroundColor);
  setColorInputs(brandingAccentHex, brandingAccentPicker, branding.accentColor);
  if (brandingLogoLink) {
    brandingLogoLink.value = branding.logoLink;
  }
  if (brandingFaviconLink) {
    brandingFaviconLink.value = branding.faviconLink;
  }
  if (brandingHomepageLink) {
    brandingHomepageLink.value = branding.homepageLink;
  }
  if (accountStudioName) {
    accountStudioName.value = currentProfile?.studioName || "";
  }
  if (studioSidebarName) {
    studioSidebarName.innerHTML = `
      <span>STUDIO NAME :</span>
      <strong>${escapeMarkup(currentProfile?.studioName || "Studio")}</strong>
    `;
  }
  if (studioSidebarLogo && studioSidebarLogoLink) {
    studioSidebarLogoLink.classList.toggle("is-empty", !logoSource);
    studioSidebarLogo.hidden = !logoSource;
    studioSidebarLogo.src = logoSource || "";
    studioSidebarLogo.alt = logoSource ? `${currentProfile?.studioName || "Studio"} logo` : "";
    studioSidebarLogoLink.href = branding.homepageLink || "/";
  }
}

function setStudioStatus(element, message, isError = false) {
  if (!element) {
    return;
  }
  element.textContent = message || "";
  element.classList.toggle("is-error", Boolean(isError));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeMarkup(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generatePairingCode() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
}

function getPageUrl(page) {
  const studioSlug = encodeURIComponent(page?.studioSlug || "");
  const pageSlug = encodeURIComponent(page?.pageSlug || "");
  return studioSlug && pageSlug ? `${window.location.origin}/${studioSlug}/${pageSlug}` : "";
}

function getPagePath(page) {
  const studioSlug = encodeURIComponent(page?.studioSlug || "");
  const pageSlug = encodeURIComponent(page?.pageSlug || "");
  return studioSlug && pageSlug ? `/${studioSlug}/${pageSlug}` : "";
}

async function openPairingCode(pairingCode) {
  const code = String(pairingCode || "").trim();
  if (!code || !db) {
    throw new Error("Either the pairing code does not exist or has been deleted.");
  }

  const pairingSnapshot = await getDoc(doc(db, collections.pairingCodes, code));
  if (!pairingSnapshot.exists()) {
    throw new Error("Either the pairing code does not exist or has been deleted.");
  }

  const pairing = pairingSnapshot.data() || {};
  if (pairing.publicPath) {
    window.location.href = pairing.publicPath;
    return;
  }

  if (pairing.studioSlug && pairing.pageSlug) {
    window.location.href = `/${encodeURIComponent(pairing.studioSlug)}/${encodeURIComponent(pairing.pageSlug)}`;
    return;
  }

  if (pairing.publicPageId) {
    const publicPageSnapshot = await getDoc(doc(db, collections.publicPages, pairing.publicPageId));
    if (publicPageSnapshot.exists()) {
      const publicPage = publicPageSnapshot.data();
      const publicPath = getPagePath(publicPage);
      if (publicPath) {
        window.location.href = publicPath;
        return;
      }
    }
  }

  if (pairing.ownerUid && pairing.pageId) {
    const pageSnapshot = await getDoc(doc(db, collections.users, pairing.ownerUid, "pages", pairing.pageId));
    if (pageSnapshot.exists()) {
      const publicPath = getPagePath(pageSnapshot.data());
      if (publicPath) {
        window.location.href = publicPath;
        return;
      }
    }
  }

  throw new Error("Either the pairing code does not exist or has been deleted.");
}

function formatEventDateRange(page) {
  const start = page?.eventStartDate || "";
  const end = page?.eventEndDate || "";
  const formatDate = (value) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return {
      dayMonth: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(date),
      full: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
      year,
    };
  };

  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);

  if (startFormatted && endFormatted && start !== end) {
    if (startFormatted.year === endFormatted.year) {
      return `${startFormatted.dayMonth} - ${endFormatted.full}`;
    }

    return `${startFormatted.full} - ${endFormatted.full}`;
  }

  return startFormatted?.full || endFormatted?.full || start || end || "";
}

function getGalleryOptionsForPage(page, extraOptions = {}) {
  return {
    coverFileId: page.coverFileId || "",
    coverImageUrl: page.coverImageUrl || "",
    coverThumbnailUrl: page.coverThumbnailUrl || "",
    tagline: page.tagline || "",
    eventDateRange: formatEventDateRange(page),
    branding: page.branding || getProfileBranding(),
    ...extraOptions,
  };
}

function getStudioRoute() {
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  if (pathSegments[0] !== "studio") {
    return { name: "home" };
  }

  if (pathSegments[1] === "create") {
    return { name: "create" };
  }

  if (pathSegments[1] === "edit" && pathSegments[2]) {
    return { name: "edit", pageId: decodeURIComponent(pathSegments[2]) };
  }

  return { name: "dashboard" };
}

function setStudioScreen(active) {
  screenStudio.classList.toggle("active", active);
  screenDirectLink.classList.toggle("active", !active);
  if (active) {
    screenGallery.classList.remove("active");
    if (!window.location.pathname.startsWith("/studio")) {
      window.history.pushState({ studio: true }, "", "/studio");
    }
  } else {
    window.history.pushState({ step: 1 }, "", "/");
  }
  window.scrollTo(0, 0);
}

function getPublicPageSlugFromPath() {
  const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (!match || match[1] === "studio") {
    return null;
  }

  return {
    studioSlug: decodeURIComponent(match[1]),
    pageSlug: decodeURIComponent(match[2]),
    publicPageId: `${decodeURIComponent(match[1])}__${decodeURIComponent(match[2])}`,
  };
}

function showPublicPageLoadingState() {
  screenStudio.classList.remove("active");
  screenDirectLink.classList.remove("active");
  screenGallery.classList.add("active");
  window.CarnivalGallery?.showLoading?.("Loading your albums.");
}

function showStudioDashboardSection(section) {
  const activeSection = ["pages", "branding", "account"].includes(section) ? section : "pages";
  studioSidebarTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.studioSection === activeSection);
  });
  studioPagesSection?.classList.toggle("active", activeSection === "pages");
  studioBrandingSection?.classList.toggle("active", activeSection === "branding");
  studioAccountSection?.classList.toggle("active", activeSection === "account");
}

function showStudioView(view) {
  studioAuthPanel.classList.toggle("hidden", view !== "auth");
  studioNamePanel.classList.toggle("hidden", view !== "name");
  studioAdminPanel?.classList.toggle("hidden", view !== "admin");
  studioDashboardPanel.classList.toggle("hidden", view !== "dashboard");
  createPagePanel.classList.add("hidden");
  studioSidebarName?.classList.toggle("hidden", view === "admin");
  if (view === "dashboard") {
    showStudioDashboardSection("pages");
  }
}

function showStudioBootState() {
  showStudioView("auth");
  googleLoginButton.disabled = true;
  setStudioStatus(studioAuthStatus, "Checking your studio...");
}

function showStudioToast(message) {
  if (!studioToast) {
    return;
  }

  studioToast.textContent = message;
  studioToast.classList.remove("hidden");
  window.clearTimeout(showStudioToast.timer);
  showStudioToast.timer = window.setTimeout(() => {
    studioToast.classList.add("hidden");
  }, 2400);
}
showStudioToast.timer = null;

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function getUserRef(uid = currentUser?.uid) {
  return doc(db, collections.users, uid);
}

function getPagesCollection(uid = currentUser?.uid) {
  return collection(db, collections.users, uid, "pages");
}

async function loadUserProfile(user) {
  const snapshot = await getDoc(getUserRef(user.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function ensureUserShell(user) {
  const userRef = getUserRef(user.uid);
  const snapshot = await getDoc(userRef);
  const payload = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
    payload.accountStatus = isAdminEmail(user.email) ? "active" : "new";
  } else if (!snapshot.data()?.accountStatus) {
    payload.accountStatus = isAdminEmail(user.email) ? "active" : "new";
  }

  await setDoc(userRef, payload, { merge: true });
}

function renderSavedPagesTable() {
  if (!savedPages.length) {
    savedPagesTable.innerHTML = '<p class="studio-empty">No pages yet.</p>';
    return;
  }

  savedPagesTable.innerHTML = "";
  savedPages.forEach((page) => {
    const card = document.createElement("article");
    card.className = "saved-page-card";
    const pageUrl = getPageUrl(page);
    const thumbnail = page.coverThumbnailUrl || page.coverImageUrl || "";
    card.innerHTML = `
      <a class="saved-page-thumb" href="/${encodeURIComponent(page.studioSlug || "")}/${encodeURIComponent(page.pageSlug || "")}" aria-label="Open ${escapeMarkup(page.pageName || "page")}">
        ${thumbnail ? `<img src="${escapeMarkup(thumbnail)}" alt="" loading="lazy" />` : ""}
      </a>
      <div class="saved-page-content">
        <h2>${escapeMarkup(page.tagline || page.pageName || "Untitled page")}</h2>
        <p class="saved-page-pairing">${escapeMarkup(page.pairingCode || "")}</p>
        <div class="saved-page-actions" aria-label="Page actions">
          <button type="button" class="saved-page-icon-button" data-action="copy" aria-label="Copy page link">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V7Zm2 1h3a3 3 0 0 1 3 3v3h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v1Zm-3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H7Z"/></svg>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="edit" aria-label="Edit page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25Zm15.71-11.04a1 1 0 0 0 0-1.42l-.5-.5a1 1 0 0 0-1.42 0l-1.32 1.32 2.75 2.75 1.49-1.49Z"/></svg>
          </button>
          <button type="button" class="saved-page-icon-button danger" data-action="delete" aria-label="Delete page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z"/></svg>
          </button>
        </div>
      </div>
    `;
    card.querySelector('[data-action="copy"]')?.addEventListener("click", async () => {
      try {
        await copyTextToClipboard(pageUrl);
        showStudioToast("Link copied to clipboard");
      } catch (error) {
        showStudioToast("Could not copy link");
      }
    });
    card.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
      openEditWizard(page);
    });
    card.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
      await deleteSavedPage(page);
    });
    savedPagesTable.appendChild(card);
  });
}

function formatRegistrationDate(value) {
  if (!value) {
    return "";
  }

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderAdminAccounts() {
  if (!adminAccountsList) {
    return;
  }

  const filteredAccounts = allAccounts.filter((account) => getAccountStatus(account) === activeAdminFilter);
  if (!filteredAccounts.length) {
    adminAccountsList.innerHTML = '<p class="studio-empty">No accounts here.</p>';
    return;
  }

  adminAccountsList.innerHTML = `
    <div class="admin-account-row admin-account-head">
      <span>StudioName</span>
      <span>DisplayName</span>
      <span>Email</span>
      <span>Registration date</span>
      <span>Active</span>
    </div>
  `;
  filteredAccounts.forEach((account) => {
    const row = document.createElement("label");
    row.className = "admin-account-row";
    row.innerHTML = `
      <span>${escapeMarkup(account.studioName || "No studio yet")}</span>
      <span>${escapeMarkup(account.displayName || "")}</span>
      <span>${escapeMarkup(account.email || "")}</span>
      <span>${escapeMarkup(formatRegistrationDate(account.createdAt))}</span>
      <input type="checkbox" ${getAccountStatus(account) === "active" ? "checked" : ""} ${isAdminEmail(account.email) ? "disabled" : ""} />
    `;
    row.querySelector("input")?.addEventListener("change", (event) => {
      pendingAccountStatuses.set(account.uid, event.target.checked ? "active" : "inactive");
    });
    adminAccountsList.appendChild(row);
  });
}

async function loadAdminAccounts() {
  const snapshot = await getDocs(collection(db, collections.users));
  allAccounts = snapshot.docs
    .map((accountDoc) => ({ id: accountDoc.id, ...accountDoc.data() }))
    .sort((a, b) => {
      const aDate = a.createdAt?.toMillis?.() || 0;
      const bDate = b.createdAt?.toMillis?.() || 0;
      return bDate - aDate;
    });
  renderAdminAccounts();
}

function updateLinkCreationGate() {
  if (!createPageButton || !linkApprovalNotice) {
    return;
  }

  const status = getAccountStatus(currentProfile);
  createPageButton.disabled = status !== "active";
  linkApprovalNotice.classList.toggle("hidden", status === "active");
  if (status === "new") {
    linkApprovalNotice.textContent = "Awaiting Admin approval for link creation";
  } else if (status === "inactive") {
    linkApprovalNotice.textContent =
      "Your account has been deactivated, however your existing links are working. Reach out to admin for activation";
  } else {
    linkApprovalNotice.textContent = "";
  }
}

async function loadSavedPages() {
  const pagesQuery = query(getPagesCollection(), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(pagesQuery);
  savedPages = snapshot.docs.map((pageDoc) => ({ id: pageDoc.id, ...pageDoc.data() }));
  renderSavedPagesTable();
}

function applyStudioRoute() {
  const route = getStudioRoute();
  if (route.name === "create") {
    openCreateWizard({ skipHistory: true });
    return;
  }

  if (route.name === "edit") {
    const page = savedPages.find((item) => item.id === route.pageId);
    if (page) {
      openEditWizard(page, { skipHistory: true });
      return;
    }
  }

  closeCreateWizard({ skipHistory: true });
}

async function refreshStudioState(user) {
  authHasResolved = true;
  currentUser = user;

  studioSignOutButton.classList.toggle("hidden", !user);
  studioUserLabel.textContent = user?.email || "";

  if (!user) {
    currentProfile = null;
    googleLoginButton.disabled = false;
    setStudioStatus(studioAuthStatus, "");
    showStudioView("auth");
    return;
  }

  googleLoginButton.disabled = false;
  showStudioView("name");
  setStudioStatus(studioNameStatus, "Preparing your studio...");
  await ensureUserShell(user);
  currentProfile = await loadUserProfile(user);
  setStudioStatus(studioNameStatus, "");

  if (isAdminEmail(user.email)) {
    showStudioView("admin");
    await loadAdminAccounts();
    return;
  }

  if (!currentProfile?.studioName) {
    showStudioView("name");
    return;
  }

  hydrateStudioSettingsForms();
  showStudioView("dashboard");
  updateLinkCreationGate();
  await loadSavedPages();
  applyStudioRoute();
}

async function saveStudioName(name) {
  const studioName = String(name || "").trim();
  const studioSlug = slugify(studioName);
  if (!studioSlug) {
    throw new Error("Please enter a valid studio name.");
  }

  const previousStudioSlug = currentProfile?.studioSlug || "";

  await runTransaction(db, async (transaction) => {
    const nameRef = doc(db, collections.studioNames, studioSlug);
    const nameSnapshot = await transaction.get(nameRef);
    if (nameSnapshot.exists() && nameSnapshot.data()?.uid !== currentUser.uid) {
      throw new Error("That studio name is already taken.");
    }

    if (previousStudioSlug && previousStudioSlug !== studioSlug) {
      transaction.delete(doc(db, collections.studioNames, previousStudioSlug));
    }

    transaction.set(nameRef, {
      uid: currentUser.uid,
      studioName,
      studioSlug,
      updatedAt: serverTimestamp(),
    });
    transaction.set(getUserRef(), {
      uid: currentUser.uid,
      email: currentUser.email || "",
      displayName: currentUser.displayName || "",
      photoURL: currentUser.photoURL || "",
      studioName,
      studioSlug,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    savedPages.forEach((page) => {
      if (!page?.id || !page?.pageSlug) {
        return;
      }

      const pageRef = doc(getPagesCollection(), page.id);
      const nextPublicRef = doc(db, collections.publicPages, `${studioSlug}__${page.pageSlug}`);
      transaction.set(pageRef, {
        studioName,
        studioSlug,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(nextPublicRef, {
        ...page,
        studioName,
        studioSlug,
        pageId: page.id,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      if (previousStudioSlug && previousStudioSlug !== studioSlug) {
        transaction.delete(doc(db, collections.publicPages, `${previousStudioSlug}__${page.pageSlug}`));
      }
    });
  });
}

async function saveBrandingSettings(branding) {
  const batch = writeBatch(db);
  batch.set(getUserRef(), {
    branding,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  savedPages.forEach((page) => {
    if (!page?.id || !page?.pageSlug) {
      return;
    }

    batch.set(doc(getPagesCollection(), page.id), {
      branding,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    batch.set(doc(db, collections.publicPages, `${page.studioSlug}__${page.pageSlug}`), {
      branding,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
}

function flattenDriveMedia(node, folderPath = "") {
  if (!node) {
    return [];
  }

  const path = folderPath ? `${folderPath}/${node.name}` : node.name;
  const ownImages = (node.images || []).map((item) => ({
    ...item,
    folderPath: item.path || path,
  }));
  const childImages = (node.folders || []).flatMap((folder) => flattenDriveMedia(folder, path));
  return [...ownImages, ...childImages];
}

function flattenDriveFolders(node, folderPath = "") {
  if (!node) {
    return [];
  }

  const path = folderPath ? `${folderPath}/${node.name}` : node.name;
  const ownImages = (node.images || []).map((item) => ({
    ...item,
    folderPath: item.path || path,
  }));
  const folders = [];

  if (ownImages.length) {
    folders.push({
      id: node.id,
      name: node.name,
      path,
      images: ownImages,
      photoCount: ownImages.filter((item) => !item.mimeType?.startsWith("video/")).length,
      mediaCount: ownImages.length,
    });
  }

  (node.folders || []).forEach((folder) => {
    folders.push(...flattenDriveFolders(folder, path));
  });

  return folders;
}

function renderMediaPicker() {
  if (!wizardState.selectedMediaFolderId) {
    renderMediaFolderList();
    return;
  }

  renderSelectedFolderMedia();
}

function renderMediaFolderList() {
  const queryText = wizardMediaSearch.value.trim().toLowerCase();
  const filteredFolders = wizardState.folders.filter((folder) => {
    const searchTarget = `${folder.name} ${folder.path}`.toLowerCase();
    return !queryText || searchTarget.includes(queryText);
  });

  if (!filteredFolders.length) {
    wizardMediaList.innerHTML = '<p class="studio-empty">No matching folders.</p>';
    return;
  }

  wizardMediaList.innerHTML = "";
  filteredFolders.forEach((folder) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "media-picker-row media-picker-folder-row";
    button.innerHTML = `
      <img src="${folder.images[0]?.thumbnailUrl || folder.images[0]?.url || ""}" alt="" loading="lazy" />
      <span>
        <strong>${folder.name}</strong>
        <small>${folder.photoCount} photo${folder.photoCount === 1 ? "" : "s"} · ${folder.path}</small>
      </span>
      <em>Open folder</em>
    `;
    button.addEventListener("click", () => {
      wizardState.selectedMediaFolderId = folder.id;
      wizardMediaSearch.value = "";
      wizardMediaSearch.placeholder = "SEARCH PHOTOS";
      renderMediaPicker();
      setStudioStatus(wizardMediaStatus, `Choose a cover photo from ${folder.name}.`);
    });
    wizardMediaList.appendChild(button);
  });
}

function renderSelectedFolderMedia() {
  const folder = wizardState.folders.find((item) => item.id === wizardState.selectedMediaFolderId);
  const queryText = wizardMediaSearch.value.trim().toLowerCase();
  const filteredItems = (folder?.images || []).filter((item) => {
    const searchTarget = `${item.name} ${item.folderPath}`.toLowerCase();
    return !queryText || searchTarget.includes(queryText);
  });

  wizardMediaList.innerHTML = "";
  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "media-picker-back";
  backButton.textContent = "Back to folders";
  backButton.addEventListener("click", () => {
    wizardState.selectedMediaFolderId = "";
    wizardMediaSearch.value = "";
    wizardMediaSearch.placeholder = "SEARCH FOLDERS";
    renderMediaPicker();
    setStudioStatus(wizardMediaStatus, "Select a folder first.");
  });
  wizardMediaList.appendChild(backButton);

  if (!filteredItems.length) {
    const empty = document.createElement("p");
    empty.className = "studio-empty";
    empty.textContent = "No matching photos in this folder.";
    wizardMediaList.appendChild(empty);
    return;
  }

  filteredItems.forEach((item) => {
    const isVideo = item.mimeType?.startsWith("video/");
    const isSelected = wizardState.selectedCover?.id === item.id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `media-picker-row${isSelected ? " selected" : ""}${isVideo ? " is-disabled" : ""}`;
    button.disabled = isVideo;
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.innerHTML = `
      <img src="${item.thumbnailUrl || item.url}" alt="" loading="lazy" />
      <span>
        <strong>${item.name}</strong>
        <small>${item.folderPath || "Root folder"}</small>
      </span>
      <em>${isVideo ? "Video" : isSelected ? "Cover selected" : "Use as cover"}</em>
    `;
    button.addEventListener("click", () => {
      if (isVideo) {
        return;
      }

      wizardState.selectedCover = item;
      renderMediaPicker();
      setStudioStatus(wizardMediaStatus, `${item.name} selected as cover.`);
    });
    wizardMediaList.appendChild(button);
  });
}

function showWizardStep(step) {
  currentWizardStep = step;
  wizardStepLabel.textContent = `Step ${step} of 5`;
  wizardDriveForm.classList.toggle("hidden", step !== 1);
  wizardMediaStep.classList.toggle("hidden", step !== 2);
  wizardPageForm.classList.toggle("hidden", step !== 3);
  wizardDetailsForm.classList.toggle("hidden", step !== 4);
  wizardTemplateStep.classList.toggle("hidden", step !== 5);
}

function openCreateWizard(options = {}) {
  const { skipHistory = false } = options;
  if (!canCreateLinks()) {
    updateLinkCreationGate();
    showStudioDashboardSection("pages");
    return;
  }

  wizardState = createEmptyWizardState();
  wizardState.mode = "create";
  wizardDriveForm.reset();
  wizardPageForm.reset();
  wizardDetailsForm.reset();
  wizardDriveLink.value = "";
  wizardPageName.value = "";
  wizardTagline.value = "";
  wizardEventStart.value = "";
  wizardEventEnd.value = "";
  wizardMediaSearch.value = "";
  wizardMediaList.innerHTML = "";
  wizardMediaSearch.placeholder = "SEARCH FOLDERS";
  wizardCreatePage.textContent = "Create page";
  setStudioStatus(wizardDriveStatus, "");
  setStudioStatus(wizardMediaStatus, "");
  setStudioStatus(wizardPageStatus, "");
  setStudioStatus(wizardDetailsStatus, "");
  setStudioStatus(wizardTemplateStatus, "");
  studioDashboardPanel.classList.add("hidden");
  createPagePanel.classList.remove("hidden");
  if (!skipHistory && window.location.pathname !== "/studio/create") {
    window.history.pushState({ studio: true, create: true }, "", "/studio/create");
  }
  showWizardStep(1);
}

function openEditWizard(page, options = {}) {
  const { skipHistory = false } = options;
  wizardState = {
    ...createEmptyWizardState(),
    mode: "edit",
    existingPage: page,
    driveLink: page.driveLink || "",
    pageName: page.pageName || "",
    pageSlug: page.pageSlug || "",
    tagline: page.tagline || "",
    eventStartDate: page.eventStartDate || "",
    eventEndDate: page.eventEndDate || "",
    pairingCode: page.pairingCode || "",
    template: page.template || "template-1",
    selectedCover: page.coverFileId
      ? {
          id: page.coverFileId,
          name: page.coverName || "Current cover",
          url: page.coverImageUrl || "",
          thumbnailUrl: page.coverThumbnailUrl || "",
        }
      : null,
  };
  wizardDriveForm.reset();
  wizardPageForm.reset();
  wizardDetailsForm.reset();
  wizardDriveLink.value = wizardState.driveLink;
  wizardPageName.value = wizardState.pageName;
  wizardTagline.value = wizardState.tagline;
  wizardEventStart.value = wizardState.eventStartDate;
  wizardEventEnd.value = wizardState.eventEndDate;
  wizardMediaSearch.value = "";
  wizardMediaList.innerHTML = "";
  wizardMediaSearch.placeholder = "SEARCH FOLDERS";
  wizardCreatePage.textContent = "Update page";
  setStudioStatus(wizardDriveStatus, "Load this Drive folder again to choose a new cover, or continue with the current link.");
  setStudioStatus(wizardMediaStatus, "");
  setStudioStatus(wizardPageStatus, "");
  setStudioStatus(wizardDetailsStatus, "");
  setStudioStatus(wizardTemplateStatus, `Pairing code stays ${wizardState.pairingCode}.`);
  studioDashboardPanel.classList.add("hidden");
  createPagePanel.classList.remove("hidden");
  if (!skipHistory && page?.id) {
    window.history.pushState({ studio: true, edit: page.id }, "", `/studio/edit/${encodeURIComponent(page.id)}`);
  }
  showWizardStep(1);
}

function closeCreateWizard(options = {}) {
  const { skipHistory = false } = options;
  createPagePanel.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  showStudioDashboardSection("pages");
  if (!skipHistory && window.location.pathname !== "/studio") {
    window.history.pushState({ studio: true }, "", "/studio");
  }
}

function goBackInWizard() {
  if (currentWizardStep <= 1) {
    closeCreateWizard();
    return;
  }

  showWizardStep(currentWizardStep - 1);
}

async function checkPageDuplicate(pageSlug, driveLink) {
  const publicPageId = `${currentProfile.studioSlug}__${pageSlug}`;
  const publicPageSnapshot = await getDoc(doc(db, collections.publicPages, publicPageId));
  if (
    publicPageSnapshot.exists() &&
    publicPageSnapshot.data()?.pageId !== wizardState.existingPage?.id
  ) {
    throw new Error("This page name is already taken.");
  }

  const duplicateLink = savedPages.find(
    (page) =>
      page.id !== wizardState.existingPage?.id &&
      page.normalizedDriveLink === driveLink
  );
  if (duplicateLink) {
    throw new Error("This Google Drive link is already saved.");
  }
}

async function reservePairingCode(pageRef, pagePayload) {
  let pairingCode = "";
  await runTransaction(db, async (transaction) => {
    const publicPageRef = doc(db, collections.publicPages, `${pagePayload.studioSlug}__${pagePayload.pageSlug}`);
    const publicPageSnapshot = await transaction.get(publicPageRef);
    if (publicPageSnapshot.exists()) {
      throw new Error("This page name is already taken.");
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = generatePairingCode();
      const pairingRef = doc(db, collections.pairingCodes, candidate);
      const pairingSnapshot = await transaction.get(pairingRef);
      if (pairingSnapshot.exists()) {
        continue;
      }

      pairingCode = candidate;
      transaction.set(pairingRef, {
        code: candidate,
        url: pagePayload.driveLink,
        normalizedUrl: pagePayload.normalizedDriveLink,
        ownerUid: currentUser.uid,
        pageId: pageRef.id,
        pageName: pagePayload.pageName,
        publicPageId: `${pagePayload.studioSlug}__${pagePayload.pageSlug}`,
        publicPath: getPagePath(pagePayload),
        studioSlug: pagePayload.studioSlug,
        pageSlug: pagePayload.pageSlug,
        template: pagePayload.template,
        permanent: true,
        createdAt: serverTimestamp(),
      });
      transaction.set(pageRef, {
        ...pagePayload,
        pairingCode: candidate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.set(publicPageRef, {
        ...pagePayload,
        pageId: pageRef.id,
        pairingCode: candidate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    throw new Error("Could not generate a unique pairing code. Please try again.");
  });

  return pairingCode;
}

async function createPageRecord() {
  const pageRef = doc(getPagesCollection());
  const payload = {
    ownerUid: currentUser.uid,
    studioName: currentProfile.studioName,
    studioSlug: currentProfile.studioSlug,
    driveLink: wizardState.driveLink,
    normalizedDriveLink: wizardState.driveLink,
    pageName: wizardState.pageName,
    pageSlug: wizardState.pageSlug,
    tagline: wizardState.tagline,
    eventStartDate: wizardState.eventStartDate,
    eventEndDate: wizardState.eventEndDate,
    branding: getProfileBranding(),
    template: wizardState.template,
    templateLabel: "Template 1",
    coverFileId: wizardState.selectedCover?.id || "",
    coverImageUrl: wizardState.selectedCover?.url || "",
    coverThumbnailUrl: wizardState.selectedCover?.thumbnailUrl || "",
    coverName: wizardState.selectedCover?.name || "",
  };

  await reservePairingCode(pageRef, payload);
}

async function updatePageRecord() {
  const existingPage = wizardState.existingPage;
  if (!existingPage?.id || !existingPage?.pairingCode) {
    throw new Error("This page cannot be edited because it is missing its original pairing code.");
  }

  const pageRef = doc(getPagesCollection(), existingPage.id);
  const oldPublicPageRef = doc(db, collections.publicPages, `${existingPage.studioSlug}__${existingPage.pageSlug}`);
  const newPublicPageRef = doc(db, collections.publicPages, `${currentProfile.studioSlug}__${wizardState.pageSlug}`);
  const pairingRef = doc(db, collections.pairingCodes, existingPage.pairingCode);
  const payload = {
    ownerUid: currentUser.uid,
    studioName: currentProfile.studioName,
    studioSlug: currentProfile.studioSlug,
    driveLink: wizardState.driveLink,
    normalizedDriveLink: wizardState.driveLink,
    pageName: wizardState.pageName,
    pageSlug: wizardState.pageSlug,
    tagline: wizardState.tagline,
    eventStartDate: wizardState.eventStartDate,
    eventEndDate: wizardState.eventEndDate,
    branding: getProfileBranding(),
    template: wizardState.template,
    templateLabel: "Template 1",
    coverFileId: wizardState.selectedCover?.id || "",
    coverImageUrl: wizardState.selectedCover?.url || "",
    coverThumbnailUrl: wizardState.selectedCover?.thumbnailUrl || "",
    coverName: wizardState.selectedCover?.name || "",
    pairingCode: existingPage.pairingCode,
    updatedAt: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    if (existingPage.pageSlug !== wizardState.pageSlug || existingPage.studioSlug !== currentProfile.studioSlug) {
      const newPublicSnapshot = await transaction.get(newPublicPageRef);
      if (newPublicSnapshot.exists()) {
        throw new Error("This page name is already taken.");
      }
      transaction.delete(oldPublicPageRef);
    }

    transaction.set(pageRef, payload, { merge: true });
    transaction.set(newPublicPageRef, {
      ...payload,
      pageId: existingPage.id,
      createdAt: existingPage.createdAt || serverTimestamp(),
    }, { merge: true });
    transaction.set(pairingRef, {
      code: existingPage.pairingCode,
      url: payload.driveLink,
      normalizedUrl: payload.normalizedDriveLink,
      ownerUid: currentUser.uid,
      pageId: existingPage.id,
      pageName: payload.pageName,
      publicPageId: `${payload.studioSlug}__${payload.pageSlug}`,
      publicPath: getPagePath(payload),
      studioSlug: payload.studioSlug,
      pageSlug: payload.pageSlug,
      template: payload.template,
      permanent: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

async function deleteSavedPage(page) {
  if (!page?.id) {
    return;
  }

  const confirmed = window.confirm(`Delete "${page.pageName || "this page"}"? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  const pageRef = doc(getPagesCollection(), page.id);
  const publicPageRef = doc(db, collections.publicPages, `${page.studioSlug}__${page.pageSlug}`);
  const pairingRef = page.pairingCode ? doc(db, collections.pairingCodes, page.pairingCode) : null;

  await runTransaction(db, async (transaction) => {
    transaction.delete(pageRef);
    transaction.delete(publicPageRef);
    if (pairingRef) {
      transaction.delete(pairingRef);
    }
  });

  await loadSavedPages();
}

function initializeFirebase() {
  if (!hasFirebaseConfig()) {
    setStudioStatus(
      studioAuthStatus,
      "Firebase web config is missing. Add your project values in /firebase-config.js.",
      true
    );
    googleLoginButton.disabled = true;
    return;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  window.CarnivalPairing = {
    openPairingCode: async (pairingCode) => {
      try {
        await openPairingCode(pairingCode);
      } catch (error) {
        window.CarnivalGallery?.showError?.("Either the pairing code does not exist or has been deleted.");
      }
    },
  };

  const publicPageRoute = getPublicPageSlugFromPath();
  if (publicPageRoute) {
    loadPublicStudioPage(publicPageRoute).catch((error) => {
      showPublicPageLoadingState();
      window.CarnivalGallery?.showError?.(error.message || "This page could not be opened.");
    });
    return;
  }

  showStudioBootState();

  onAuthStateChanged(auth, (user) => {
    refreshStudioState(user).catch((error) => {
      authHasResolved = true;
      googleLoginButton.disabled = false;
      setStudioStatus(studioAuthStatus, error.message, true);
      setStudioStatus(studioNameStatus, error.message, true);
      if (user) {
        showStudioView("name");
      }
    });
  });
}

async function loadPublicStudioPage(publicPageRoute) {
  showPublicPageLoadingState();
  let pageSnapshot = await getDoc(doc(db, collections.publicPages, publicPageRoute.publicPageId));
  if (!pageSnapshot.exists()) {
    pageSnapshot = await getDoc(doc(db, collections.publicPages, publicPageRoute.pageSlug));
  }

  if (!pageSnapshot.exists()) {
    throw new Error("This studio page does not exist.");
  }

  const page = pageSnapshot.data();
  if (page.studioSlug && page.studioSlug !== publicPageRoute.studioSlug) {
    throw new Error("This studio page does not exist.");
  }

  if (!page?.driveLink) {
    throw new Error("This studio page does not have a Google Drive link.");
  }

  const galleryOptions = getGalleryOptionsForPage(page, {
    preservePath: true,
    keepLoading: true,
  });
  const previewCoverSource = galleryOptions.coverImageUrl || galleryOptions.coverThumbnailUrl || "";
  if (previewCoverSource) {
    await new Promise((resolve) => {
      const previewCover = new Image();
      previewCover.onload = resolve;
      previewCover.onerror = resolve;
      previewCover.src = previewCoverSource;
    });
  }
  window.CarnivalGallery?.showLoadingPreview?.({
    ...galleryOptions,
    message: "Loading your albums.",
    progress: 8,
  });
  await window.CarnivalGallery?.loadFolder?.(page.driveLink, galleryOptions);
}

openStudioLoginButton?.addEventListener("click", () => {
  setStudioScreen(true);
  if (auth && !authHasResolved) {
    showStudioBootState();
  }
});

studioSidebarTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showStudioDashboardSection(tab.dataset.studioSection);
  });
});

adminTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeAdminFilter = tab.dataset.adminFilter || "active";
    adminTabs.forEach((item) => {
      item.classList.toggle("active", item === tab);
    });
    renderAdminAccounts();
  });
});

adminSaveAccountsButton?.addEventListener("click", async () => {
  if (!pendingAccountStatuses.size) {
    setStudioStatus(adminAccountsStatus, "No changes to save.");
    return;
  }

  try {
    setStudioStatus(adminAccountsStatus, "Saving changes...");
    const batch = writeBatch(db);
    pendingAccountStatuses.forEach((accountStatus, uid) => {
      batch.set(doc(db, collections.users, uid), {
        accountStatus,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
    pendingAccountStatuses.clear();
    setStudioStatus(adminAccountsStatus, "Changes saved.");
    await loadAdminAccounts();
  } catch (error) {
    setStudioStatus(adminAccountsStatus, error.message || "Could not save changes.", true);
  }
});

brandingBackgroundPicker?.addEventListener("input", () => {
  setColorInputs(brandingBackgroundHex, brandingBackgroundPicker, brandingBackgroundPicker.value);
});

brandingBackgroundHex?.addEventListener("input", () => {
  const cleaned = brandingBackgroundHex.value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    brandingBackgroundPicker.value = `#${cleaned}`.toLowerCase();
  }
});

brandingBackgroundHex?.addEventListener("blur", () => {
  setColorInputs(brandingBackgroundHex, brandingBackgroundPicker, brandingBackgroundHex.value);
});

brandingAccentPicker?.addEventListener("input", () => {
  setColorInputs(brandingAccentHex, brandingAccentPicker, brandingAccentPicker.value);
});

brandingAccentHex?.addEventListener("input", () => {
  const cleaned = brandingAccentHex.value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    brandingAccentPicker.value = `#${cleaned}`.toLowerCase();
  }
});

brandingAccentHex?.addEventListener("blur", () => {
  setColorInputs(brandingAccentHex, brandingAccentPicker, brandingAccentHex.value);
});

studioBrandingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const branding = getBrandingFromInputs();
    setStudioStatus(studioBrandingStatus, "Saving branding...");
    await saveBrandingSettings(branding);
    currentProfile = {
      ...currentProfile,
      branding,
    };
    savedPages = savedPages.map((page) => ({ ...page, branding }));
    hydrateStudioSettingsForms();
    renderSavedPagesTable();
    setStudioStatus(studioBrandingStatus, "Branding saved.");
  } catch (error) {
    setStudioStatus(studioBrandingStatus, error.message || "Could not save branding.", true);
  }
});

studioAccountForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStudioStatus(studioAccountStatus, "Checking studio name...");
    await saveStudioName(accountStudioName.value);
    currentProfile = await loadUserProfile(currentUser);
    await loadSavedPages();
    hydrateStudioSettingsForms();
    setStudioStatus(studioAccountStatus, "Studio name updated.");
  } catch (error) {
    setStudioStatus(studioAccountStatus, error.message || "Could not update studio name.", true);
  }
});

googleLoginButton?.addEventListener("click", async () => {
  try {
    setStudioStatus(studioAuthStatus, "Opening Google sign in...");
    await signInWithPopup(auth, new GoogleAuthProvider());
    showStudioView("name");
    setStudioStatus(studioNameStatus, "Preparing your studio...");
    setStudioStatus(studioAuthStatus, "");
  } catch (error) {
    setStudioStatus(studioAuthStatus, error.message || "Google sign in failed.", true);
  }
});

studioSignOutButton?.addEventListener("click", async () => {
  await signOut(auth);
  savedPages = [];
  renderSavedPagesTable();
});

studioNameForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStudioStatus(studioNameStatus, "Checking studio name...");
    await saveStudioName(studioNameInput.value);
    setStudioStatus(studioNameStatus, "");
    await refreshStudioState(currentUser);
  } catch (error) {
    setStudioStatus(studioNameStatus, error.message, true);
  }
});

createPageButton?.addEventListener("click", openCreateWizard);
closeCreatePageButton?.addEventListener("click", goBackInWizard);

window.addEventListener("popstate", () => {
  if (window.location.pathname.startsWith("/studio") && currentProfile?.studioName) {
    setStudioScreen(true);
    applyStudioRoute();
  }
});

wizardDriveForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    wizardState.driveLink = wizardDriveLink.value.trim();
    setStudioStatus(wizardDriveStatus, "Reading Google Drive folders...");
    const response = await fetch(`/api/folder?url=${encodeURIComponent(wizardState.driveLink)}&includeVideos=1`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not load this Google Drive folder.");
    }

    wizardState.folderTree = data.tree;
    wizardState.folders = flattenDriveFolders(data.tree);
    wizardState.flatMedia = flattenDriveMedia(data.tree);
    wizardState.selectedCover = wizardState.selectedCover?.id
      ? wizardState.flatMedia.find((item) => item.id === wizardState.selectedCover.id) || null
      : null;
    wizardState.selectedMediaFolderId = wizardState.selectedCover?.id
      ? wizardState.folders.find((folder) =>
          folder.images.some((item) => item.id === wizardState.selectedCover.id)
        )?.id || ""
      : "";

    if (!wizardState.flatMedia.length) {
      throw new Error("This Drive folder does not have any supported photos or videos.");
    }

    wizardMediaSearch.placeholder = wizardState.selectedMediaFolderId ? "SEARCH PHOTOS" : "SEARCH FOLDERS";
    renderMediaPicker();
    setStudioStatus(wizardMediaStatus, wizardState.selectedMediaFolderId ? "Click any photo to save it as the cover." : "Select a folder first.");
    setStudioStatus(wizardDriveStatus, "");
    showWizardStep(2);
  } catch (error) {
    setStudioStatus(wizardDriveStatus, error.message, true);
  }
});

wizardMediaSearch?.addEventListener("input", renderMediaPicker);

wizardMediaNext?.addEventListener("click", () => {
  if (!wizardState.selectedCover) {
    setStudioStatus(wizardMediaStatus, "Select one image to use as the cover.", true);
    return;
  }
  setStudioStatus(wizardMediaStatus, "");
  showWizardStep(3);
});

wizardPageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    wizardState.pageName = wizardPageName.value.trim();
    wizardState.pageSlug = slugify(wizardState.pageName);
    if (!wizardState.pageSlug) {
      throw new Error("Please enter a valid page name.");
    }

    setStudioStatus(wizardPageStatus, "Checking for duplicates...");
    await checkPageDuplicate(wizardState.pageSlug, wizardState.driveLink);
    setStudioStatus(wizardPageStatus, "");
    showWizardStep(4);
  } catch (error) {
    setStudioStatus(wizardPageStatus, error.message, true);
  }
});

wizardDetailsForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const startDate = wizardEventStart.value || "";
  const endDate = wizardEventEnd.value || "";

  if (startDate && endDate && endDate < startDate) {
    setStudioStatus(wizardDetailsStatus, "End date cannot be before start date.", true);
    return;
  }

  wizardState.tagline = wizardTagline.value.trim();
  wizardState.eventStartDate = startDate;
  wizardState.eventEndDate = endDate;
  setStudioStatus(wizardDetailsStatus, "");
  setStudioStatus(
    wizardTemplateStatus,
    wizardState.mode === "edit" ? `Pairing code stays ${wizardState.pairingCode}.` : ""
  );
  showWizardStep(5);
});

wizardCreatePage?.addEventListener("click", async () => {
  try {
    const isEditMode = wizardState.mode === "edit";
    setStudioStatus(wizardTemplateStatus, isEditMode ? "Updating page..." : "Creating page...");
    if (isEditMode) {
      await updatePageRecord();
    } else {
      await createPageRecord();
    }
    setStudioStatus(wizardTemplateStatus, "");
    closeCreateWizard();
    await loadSavedPages();
  } catch (error) {
    setStudioStatus(wizardTemplateStatus, error.message, true);
  }
});

if (window.location.pathname.startsWith("/studio")) {
  setStudioScreen(true);
}

initializeFirebase();
