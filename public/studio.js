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
  customDomains: firebaseSettings.collections?.customDomains || "customDomains",
};
const ALBUM_SNAPSHOT_SUBCOLLECTION = "albumSnapshotChunks";
const ALBUM_SNAPSHOT_VERSION = 1;
const ALBUM_SNAPSHOT_TARGET_CHARS = 240000;
const PRODUCT_HOME_URL = "https://carnivalshowcase.kaustubhmokashi.com/";

const screenDirectLink = document.getElementById("screen-direct-link");
const screenGallery = document.getElementById("screen-gallery");
const screenStudio = document.getElementById("screen-studio");
const openStudioLoginButton = document.getElementById("open-studio-login");
const googleLoginButton = document.getElementById("google-login-button");
const studioSignOutButton = document.getElementById("studio-sign-out");
const studioUserLabel = document.getElementById("studio-user-label");
const studioSidebarToggleButton = document.getElementById("studio-sidebar-toggle");
const studioSidebarCloseButton = document.getElementById("studio-sidebar-close");
const studioSidebarScrim = document.getElementById("studio-sidebar-scrim");
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
const studioSidebar = document.getElementById("studio-sidebar");
const studioSidebarName = document.getElementById("studio-sidebar-name");
const studioSidebarLogoLink = document.getElementById("studio-sidebar-logo-link");
const studioSidebarLogo = document.getElementById("studio-sidebar-logo");
const studioSidebarTabs = Array.from(document.querySelectorAll("[data-studio-section]"));
const studioPagesSection = document.getElementById("studio-pages-section");
const studioEventsSection = document.getElementById("studio-events-section");
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
const brandingShareMessage = document.getElementById("branding-share-message");
const brandingCustomDomain = document.getElementById("branding-custom-domain");
const studioBrandingStatus = document.getElementById("studio-branding-status");
const studioAccountForm = document.getElementById("studio-account-form");
const accountStudioName = document.getElementById("account-studio-name");
const studioDriveCopy = document.getElementById("studio-drive-copy");
const accountRemoveDriveButton = document.getElementById("account-remove-drive");
const accountConnectDomainButton = document.getElementById("account-connect-domain");
const studioDomainCopy = document.getElementById("studio-domain-copy");
const studioAccountStatus = document.getElementById("studio-account-status");
const connectDomainPanel = document.getElementById("connect-domain-panel");
const connectDomainForm = document.getElementById("connect-domain-form");
const connectDomainHost = document.getElementById("connect-domain-host");
const connectDomainTarget = document.getElementById("connect-domain-target");
const connectDomainStatus = document.getElementById("connect-domain-status");
const closeConnectDomainButton = document.getElementById("close-connect-domain");
const savedPagesTable = document.getElementById("saved-pages-table");
const savedEventsTable = document.getElementById("saved-events-table");
const studioToast = document.getElementById("studio-toast");
const createPageButton = document.getElementById("create-page-button");
const createEventButton = document.getElementById("create-event-button");
const linkApprovalNotice = document.getElementById("link-approval-notice");
const createPagePanel = document.getElementById("create-page-panel");
const createEventPanel = document.getElementById("create-event-panel");
const createEventForm = document.getElementById("create-event-form");
const createEventLogoLink = document.getElementById("create-event-logo-link");
const createEventLogo = document.getElementById("create-event-logo");
const closeCreateEventButton = document.getElementById("close-create-event");
const eventNameInput = document.getElementById("event-name-input");
const eventDriveStep = document.getElementById("event-drive-step");
const eventDetailsStep = document.getElementById("event-details-step");
const connectEventDriveButton = document.getElementById("connect-event-drive");
const eventDriveConnectionStatus = document.getElementById("event-drive-connection-status");
const eventStartDateInput = document.getElementById("event-start-date");
const eventStartTimeInput = document.getElementById("event-start-time");
const eventEndDateInput = document.getElementById("event-end-date");
const eventEndTimeInput = document.getElementById("event-end-time");
const createEventStatus = document.getElementById("create-event-status");
const manageEventPanel = document.getElementById("manage-event-panel");
const closeManageEventButton = document.getElementById("close-manage-event");
const manageEventKicker = document.getElementById("manage-event-kicker");
const manageEventPhotoGrid = document.getElementById("manage-event-photo-grid");
const manageEventStatus = document.getElementById("manage-event-status");
const eventPhotoFilterTabs = Array.from(document.querySelectorAll("[data-event-photo-filter]"));
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
const screenEventPublic = document.getElementById("screen-event-public");
const eventPublicTitle = document.getElementById("event-public-title");
const eventUploadForm = document.getElementById("event-upload-form");
const eventUploadInput = document.getElementById("event-upload-input");
const eventUploadStatus = document.getElementById("event-upload-status");
const eventPublicGrid = document.getElementById("event-public-grid");
const screenEventPresent = document.getElementById("screen-event-present");
const eventPresentImage = document.getElementById("event-present-image");

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let savedPages = [];
let savedEvents = [];
let allAccounts = [];
let allAdminLinks = [];
let pendingAccountStatuses = new Map();
let activeAdminFilter = "active";
let wizardState = createEmptyWizardState();
let authHasResolved = false;
let currentWizardStep = 1;
let activeEventPhotoFilter = "live";
let currentManagedEvent = null;
let moderationAccessToken = "";
let driveConnectionStatus = {
  connected: false,
  email: "",
};
let currentEditingEventId = "";
let currentEventPresentationTimer = null;
let currentEventPresentationPhotos = [];
let currentEventPresentationIndex = 0;
const ADMIN_EMAIL = "carnivalshowcase@gmail.com";
const adminFolderNameCache = new Map();

function isMobileStudioViewport() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function closeStudioSidebarDrawer({ restoreFocus = false } = {}) {
  studioDashboardPanel?.classList.remove("sidebar-open");
  studioSidebarToggleButton?.setAttribute("aria-expanded", "false");
  studioSidebarScrim?.classList.add("hidden");
  if (restoreFocus) {
    studioSidebarToggleButton?.focus();
  }
}

function openStudioSidebarDrawer() {
  if (!isMobileStudioViewport() || !studioSidebar || studioDashboardPanel?.classList.contains("hidden")) {
    return;
  }
  studioDashboardPanel?.classList.add("sidebar-open");
  studioSidebarToggleButton?.setAttribute("aria-expanded", "true");
  studioSidebarScrim?.classList.remove("hidden");
  studioSidebarCloseButton?.focus();
}

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
    shareMessage: "",
    customDomain: "",
  };
}

function normalizeCustomDomain(value) {
  const rawValue = String(value || "").trim().toLowerCase();
  if (!rawValue) {
    return "";
  }

  const candidate = rawValue.replace(/^https?:\/\//, "");
  const hostCandidate = candidate.includes("/") ? candidate.split("/")[0] : candidate;
  const host = hostCandidate.replace(/:\d+$/, "").replace(/\.+$/, "");

  if (!/^[a-z0-9.-]+$/.test(host) || host.startsWith(".") || host.endsWith(".") || host.includes("..")) {
    throw new Error("Please enter a valid album domain.");
  }

  return host;
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
    shareMessage: String(branding.shareMessage || ""),
    customDomain: normalizeCustomDomain(branding.customDomain || ""),
  };
}

function getBrandingFromInputs() {
  return {
    backgroundColor: normalizeHexColor(brandingBackgroundHex.value, "#FFFFFF"),
    accentColor: normalizeHexColor(brandingAccentHex.value, "#000000"),
    logoLink: brandingLogoLink.value.trim(),
    faviconLink: brandingFaviconLink.value.trim(),
    homepageLink: brandingHomepageLink.value.trim(),
    shareMessage: brandingShareMessage?.value.trim() || "",
    customDomain: normalizeCustomDomain(brandingCustomDomain?.value),
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
  const eventLogoSource = logoSource || "/assets/carnivalstories-logo.svg?v=20260424b";
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
  if (brandingShareMessage) {
    brandingShareMessage.value = branding.shareMessage;
  }
  if (brandingCustomDomain) {
    brandingCustomDomain.value = branding.customDomain;
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
  if (createEventLogo && createEventLogoLink) {
    createEventLogoLink.classList.toggle("is-empty", !eventLogoSource);
    createEventLogo.hidden = !eventLogoSource;
    createEventLogo.src = eventLogoSource;
    createEventLogo.alt = logoSource ? `${currentProfile?.studioName || "Studio"} logo` : "Carnival Stories";
    createEventLogoLink.href = branding.homepageLink || "/";
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
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("");
}

function getPrimaryPublicPageId(page) {
  const studioSlug = String(page?.studioSlug || "").trim();
  const pageSlug = String(page?.pageSlug || "").trim();
  return studioSlug && pageSlug ? `${studioSlug}__${pageSlug}` : "";
}

function getPageCustomDomain(page) {
  return normalizeCustomDomain(page?.customDomain || page?.branding?.customDomain || "");
}

function getCustomDomainPublicPageId(customDomain, pageSlug) {
  const normalizedDomain = normalizeCustomDomain(customDomain);
  const normalizedPageSlug = String(pageSlug || "").trim();
  return normalizedDomain && normalizedPageSlug ? `${normalizedDomain}__${normalizedPageSlug}` : "";
}

function getPlatformPagePath(page) {
  const studioSlug = encodeURIComponent(page?.studioSlug || "");
  const pageSlug = encodeURIComponent(page?.pageSlug || "");
  return studioSlug && pageSlug ? `/${studioSlug}/${pageSlug}` : "";
}

function getPageUrl(page) {
  const pageSlug = encodeURIComponent(page?.pageSlug || "");
  const customDomain = getPageCustomDomain(page);
  if (customDomain && pageSlug) {
    return `https://${customDomain}/${pageSlug}`;
  }

  const platformPath = getPlatformPagePath(page);
  return platformPath ? `${window.location.origin}${platformPath}` : "";
}

function buildAlbumShareMessage({ shareMessage = "", tagline = "", pageUrl = "", pairingCode = "" } = {}) {
  const lines = [];
  const trimmedShareMessage = String(shareMessage || "").trim();
  const trimmedTagline = String(tagline || "").trim() || "CarnivalStories";
  const trimmedPageUrl = String(pageUrl || "").trim() || window.location.origin;
  const trimmedPairingCode = String(pairingCode || "").trim();

  if (trimmedShareMessage) {
    lines.push(trimmedShareMessage, "");
  }

  lines.push(`Here's the link to the album from ${trimmedTagline} - ${trimmedPageUrl}`);
  lines.push("");
  lines.push(`The pairing code for the album is : ${trimmedPairingCode}`);
  lines.push(`You can use it on CarnivalStories app on phone, TV, or goto ${PRODUCT_HOME_URL} 😄`);

  return lines.join("\n").trim();
}

async function openPairingCode(pairingCode) {
  const code = String(pairingCode || "").trim();
  if (!code) {
    throw new Error("Either the pairing code does not exist or has been deleted.");
  }

  if (db) {
    const pairingSnapshot = await getDoc(doc(db, collections.pairingCodes, code));
    if (pairingSnapshot.exists()) {
      const pairing = pairingSnapshot.data() || {};
      if (pairing.publicPath) {
        window.location.href = pairing.publicPath;
        return;
      }

      if (pairing.studioSlug && pairing.pageSlug) {
        window.location.href = getPageUrl(pairing) || `/${encodeURIComponent(pairing.studioSlug)}/${encodeURIComponent(pairing.pageSlug)}`;
        return;
      }

      if (pairing.publicPageId) {
        const publicPageSnapshot = await getDoc(doc(db, collections.publicPages, pairing.publicPageId));
        if (publicPageSnapshot.exists()) {
          const publicPage = publicPageSnapshot.data();
          const publicPath = getPageUrl(publicPage);
          if (publicPath) {
            window.location.href = publicPath;
            return;
          }
        }
      }

      if (pairing.ownerUid && pairing.pageId) {
        const pageSnapshot = await getDoc(doc(db, collections.users, pairing.ownerUid, "pages", pairing.pageId));
        if (pageSnapshot.exists()) {
          const publicPath = getPageUrl(pageSnapshot.data());
          if (publicPath) {
            window.location.href = publicPath;
            return;
          }
        }
      }
    }
  }

  const remoteResponse = await fetch(`/api/remote/resolve?code=${encodeURIComponent(code)}`);
  if (remoteResponse.ok) {
    const remotePayload = await remoteResponse.json();
    const folderUrl = String(remotePayload?.url || "").trim();
    if (folderUrl) {
      if (!window.CarnivalGallery?.loadFolder) {
        throw new Error("The hosted gallery loader is unavailable right now.");
      }

      window.CarnivalGallery?.showLoading?.("Opening your Drive folder.");
      await window.CarnivalGallery.loadFolder(folderUrl, {});
      return;
    }
  }

  if (!remoteResponse.ok && remoteResponse.status !== 404) {
    const remotePayload = await remoteResponse.json().catch(() => ({}));
    throw new Error(remotePayload?.error || "We couldn’t open that pairing code right now.");
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
    studioName: page.studioName || "",
    pageUrl: getPageUrl(page),
    pairingCode: page.pairingCode || "",
    eventDateRange: formatEventDateRange(page),
    branding: page.branding || getProfileBranding(),
    ...extraOptions,
  };
}

function getStudioRoute() {
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  if (pathSegments[0] === "event-moderate" && pathSegments[1]) {
    return { name: "event-moderate", token: decodeURIComponent(pathSegments[1]) };
  }

  if (window.location.pathname === "/login") {
    return { name: "login" };
  }

  if (pathSegments[0] !== "studio") {
    return { name: "home" };
  }

  const currentUrl = new URL(window.location.href);
  const eventId = String(currentUrl.searchParams.get("event") || "").trim();
  const eventEditId = String(currentUrl.searchParams.get("event-edit") || "").trim();
  if (eventId) {
    return { name: "event-manage", eventId };
  }
  if (eventEditId) {
    return { name: "event-edit", eventId: eventEditId };
  }

  if (pathSegments[1] === "connect-domain") {
    return { name: "connect-domain" };
  }

  if (pathSegments[1] === "create") {
    return { name: "create" };
  }

  if (pathSegments[1] === "events" && pathSegments[2] === "create") {
    return { name: "event-create" };
  }

  if (pathSegments[1] === "edit" && pathSegments[2]) {
    return { name: "edit", pageId: decodeURIComponent(pathSegments[2]) };
  }

  return { name: "dashboard" };
}

function setStudioScreen(active, targetPath = null) {
  document.body.classList.toggle("studio-scroll-lock", active);
  screenStudio.classList.toggle("active", active);
  screenDirectLink.classList.toggle("active", !active);
  screenEventPublic?.classList.remove("active");
  screenEventPresent?.classList.remove("active");
  if (active) {
    screenGallery.classList.remove("active");
    const currentPath = window.location.pathname;
    const studioPath = targetPath || "/login";
    if (!currentPath.startsWith("/studio") && currentPath !== "/login" && !currentPath.startsWith("/event-moderate/")) {
      window.history.pushState({ studio: true }, "", studioPath);
    } else if (targetPath && currentPath !== targetPath && !currentPath.startsWith("/event-moderate/")) {
      window.history.pushState({ studio: true }, "", targetPath);
    }
  } else {
    window.history.pushState({ step: 1 }, "", "/");
  }
  window.scrollTo(0, 0);
}

function getPublicPageSlugFromPath() {
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  if (!pathSegments.length) {
    return null;
  }

  if (pathSegments[0] === "studio") {
    return null;
  }

  if (pathSegments.length >= 2) {
    const studioSlug = decodeURIComponent(pathSegments[0]);
    const pageSlug = decodeURIComponent(pathSegments[1]);
    return {
      studioSlug,
      pageSlug,
      publicPageId: getPrimaryPublicPageId({ studioSlug, pageSlug }),
      isCustomDomain: false,
    };
  }

  const pageSlug = decodeURIComponent(pathSegments[0]);
  const customDomain = normalizeCustomDomain(window.location.hostname);
  if (!customDomain) {
    return null;
  }

  return {
    customDomain,
    pageSlug,
    publicPageId: getCustomDomainPublicPageId(customDomain, pageSlug),
    isCustomDomain: true,
  };
}

function showPublicPageLoadingState() {
  document.body.classList.remove("studio-scroll-lock");
  screenStudio.classList.remove("active");
  screenDirectLink.classList.remove("active");
  screenEventPublic?.classList.remove("active");
  screenGallery.classList.add("active");
  window.CarnivalGallery?.showLoading?.("Loading your albums.");
}

function showStudioDashboardSection(section) {
  const activeSection = ["pages", "events", "branding", "account"].includes(section) ? section : "pages";
  studioSidebarTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.studioSection === activeSection);
  });
  studioPagesSection?.classList.toggle("active", activeSection === "pages");
  studioEventsSection?.classList.toggle("active", activeSection === "events");
  studioBrandingSection?.classList.toggle("active", activeSection === "branding");
  studioAccountSection?.classList.toggle("active", activeSection === "account");
  if (isMobileStudioViewport()) {
    closeStudioSidebarDrawer();
  }
}

function getDomainPreviewPath() {
  const customDomain = normalizeCustomDomain(brandingCustomDomain?.value || currentProfile?.branding?.customDomain || "");
  if (customDomain) {
    return `<strong>${escapeMarkup(customDomain)}/<span>Page Name</span></strong>`;
  }

  const platformHost = escapeMarkup(window.location.host);
  const studioSlug = escapeMarkup(currentProfile?.studioSlug || "studioname");
  return `<strong>${platformHost}/${studioSlug}/<span>Page Name</span></strong>`;
}

function getDomainConnectTarget() {
  return connectDomainTarget?.dataset.expectedTarget || window.location.host;
}

function updateDomainSummary() {
  if (studioDomainCopy) {
    studioDomainCopy.innerHTML = `You are currently using<br>${getDomainPreviewPath()}`;
  }

  const customDomain = normalizeCustomDomain(brandingCustomDomain?.value || currentProfile?.branding?.customDomain || "");
  if (accountConnectDomainButton) {
    accountConnectDomainButton.textContent = customDomain ? "Remove domain" : "Connect your domain";
    accountConnectDomainButton.dataset.mode = customDomain ? "remove" : "connect";
  }
  if (connectDomainHost) {
    connectDomainHost.textContent = customDomain ? customDomain.split(".")[0] : "album";
  }
  if (connectDomainTarget) {
    connectDomainTarget.textContent = getDomainConnectTarget();
  }
}

async function refreshDomainVerificationPreview(domainValue = "") {
  if (!connectDomainTarget || !connectDomainHost) {
    return null;
  }

  const response = await fetch(`/api/domain/verify?domain=${encodeURIComponent(domainValue)}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Could not verify domain settings.");
  }

  connectDomainHost.textContent = data.host || "album";
  connectDomainTarget.dataset.expectedTarget = data.expectedTarget || "";
  connectDomainTarget.textContent = data.expectedTarget || "";
  return data;
}

function showStudioView(view) {
  studioAuthPanel.classList.toggle("hidden", view !== "auth");
  studioNamePanel.classList.toggle("hidden", view !== "name");
  studioAdminPanel?.classList.toggle("hidden", view !== "admin");
  studioDashboardPanel.classList.toggle("hidden", view !== "dashboard");
  createPagePanel.classList.add("hidden");
  createEventPanel?.classList.add("hidden");
  manageEventPanel?.classList.add("hidden");
  connectDomainPanel?.classList.add("hidden");
  studioSidebarName?.classList.toggle("hidden", view === "admin");
  closeStudioSidebarDrawer();
  if (view === "dashboard") {
    showStudioDashboardSection("pages");
  }
}

function openCreateEventPanel({ skipHistory = false, eventToEdit = null } = {}) {
  showStudioView("dashboard");
  studioDashboardPanel.classList.add("hidden");
  createEventPanel?.classList.remove("hidden");
  manageEventPanel?.classList.add("hidden");
  currentEditingEventId = eventToEdit?.id || "";
  if (eventNameInput) {
    eventNameInput.value = eventToEdit?.name || "";
  }
  if (eventStartDateInput) {
    eventStartDateInput.value = eventToEdit?.startAt ? String(eventToEdit.startAt).slice(0, 10) : "";
  }
  if (eventStartTimeInput) {
    eventStartTimeInput.value = eventToEdit?.startAt ? new Date(eventToEdit.startAt).toISOString().slice(11, 16) : "";
  }
  if (eventEndDateInput) {
    eventEndDateInput.value = eventToEdit?.endAt ? String(eventToEdit.endAt).slice(0, 10) : "";
  }
  if (eventEndTimeInput) {
    eventEndTimeInput.value = eventToEdit?.endAt ? new Date(eventToEdit.endAt).toISOString().slice(11, 16) : "";
  }
  const createEventSubmitButton = createEventForm?.querySelector('button[type="submit"]');
  if (createEventSubmitButton) {
    createEventSubmitButton.textContent = eventToEdit ? "Save event" : "Create event";
  }
  setStudioStatus(createEventStatus, "");
  void loadDriveConnectionStatus().catch((error) => {
    driveConnectionStatus = { connected: false, email: "", connectedAt: "", updatedAt: "" };
    updateDriveConnectionUi();
    setStudioStatus(createEventStatus, error.message || "Could not load Google Drive status.", true);
  });
  if (!skipHistory) {
    history.pushState({}, "", eventToEdit ? `/studio?event-edit=${encodeURIComponent(eventToEdit.id)}` : "/studio/events/create");
  }
}

function closeCreateEventPanel({ skipHistory = false } = {}) {
  createEventPanel?.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  currentEditingEventId = "";
  createEventForm?.reset();
  const createEventSubmitButton = createEventForm?.querySelector('button[type="submit"]');
  if (createEventSubmitButton) {
    createEventSubmitButton.textContent = "Create event";
  }
  if (!skipHistory) {
    history.pushState({}, "", "/studio");
  }
}

function closeManageEventPanel({ skipHistory = false } = {}) {
  manageEventPanel?.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  moderationAccessToken = "";
  if (!skipHistory) {
    history.pushState({}, "", "/studio");
  }
}

function openManageEventPanel(event, { skipHistory = false, token = "" } = {}) {
  currentManagedEvent = event;
  moderationAccessToken = token || "";
  studioDashboardPanel?.classList.add("hidden");
  createEventPanel?.classList.add("hidden");
  manageEventPanel?.classList.remove("hidden");
  if (manageEventKicker) {
    manageEventKicker.textContent = event?.name || "Manage event";
  }
  showEventPhotoFilter("live");
  if (!skipHistory) {
    history.pushState({}, "", token ? `/event-moderate/${encodeURIComponent(token)}` : `/studio?event=${encodeURIComponent(event.id)}`);
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

function consumeDriveReturnState() {
  const currentUrl = new URL(window.location.href);
  const driveState = String(currentUrl.searchParams.get("drive") || "").trim();
  const message = String(currentUrl.searchParams.get("message") || "").trim();
  if (!driveState) {
    return;
  }

  currentUrl.searchParams.delete("drive");
  currentUrl.searchParams.delete("message");
  window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);

  if (driveState === "connected") {
    showStudioToast("Google Drive connected");
  } else if (driveState === "error") {
    showStudioToast(message || "Google Drive permission was not completed");
  }
}

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
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", `Open ${page.pageName || "page"} in a new tab`);
    const pageUrl = getPageUrl(page);
    const thumbnail = page.coverThumbnailUrl || page.coverImageUrl || "";
    card.innerHTML = `
      <a class="saved-page-thumb" href="${escapeMarkup(pageUrl)}" target="_blank" rel="noreferrer noopener" aria-label="Open ${escapeMarkup(page.pageName || "page")} in a new tab">
        ${thumbnail ? `<img src="${escapeMarkup(thumbnail)}" alt="" loading="lazy" />` : ""}
      </a>
      <div class="saved-page-content">
        <h2>${escapeMarkup(page.tagline || page.pageName || "Untitled page")}</h2>
        <p class="saved-page-pairing">${escapeMarkup(page.pairingCode || "")}</p>
        <div class="saved-page-actions" aria-label="Page actions">
          <button type="button" class="saved-page-icon-button saved-page-share-button" data-action="share" aria-label="Share page link">
            <span class="saved-page-icon icon-mask icon-share" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="copy" aria-label="Copy page link">
            <span class="saved-page-icon icon-mask icon-copy" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="edit" aria-label="Edit page">
            <span class="saved-page-icon icon-mask icon-edit" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button danger" data-action="delete" aria-label="Delete page">
            <span class="saved-page-icon icon-mask icon-delete" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    `;
    const openPageInNewTab = () => {
      window.open(pageUrl, "_blank", "noopener,noreferrer");
    };
    card.addEventListener("click", (event) => {
      const interactiveTarget = event.target instanceof Element ? event.target.closest("button, a") : null;
      if (interactiveTarget) {
        return;
      }
      openPageInNewTab();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      const interactiveTarget = event.target instanceof Element ? event.target.closest("button, a") : null;
      if (interactiveTarget) {
        return;
      }
      event.preventDefault();
      openPageInNewTab();
    });
    card.querySelector('[data-action="copy"]')?.addEventListener("click", async () => {
      try {
        await copyTextToClipboard(pageUrl);
        showStudioToast("Link copied to clipboard");
      } catch (error) {
        showStudioToast("Could not copy link");
      }
    });
    card.querySelector('[data-action="share"]')?.addEventListener("click", async () => {
      const shareText = buildAlbumShareMessage({
        shareMessage: page.branding?.shareMessage || currentProfile?.branding?.shareMessage || "",
        tagline: page.tagline || page.pageName || "CarnivalStories album",
        pageUrl,
        pairingCode: page.pairingCode || "",
      });
      try {
        if (navigator.share) {
          await navigator.share({
            title: page.tagline || page.pageName || "CarnivalStories album",
            text: shareText,
          });
          return;
        }
        await copyTextToClipboard(shareText);
        showStudioToast("Share message copied to clipboard");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
        showStudioToast("Could not share album");
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

function formatEventPhaseLabel(phase) {
  if (phase === "live") {
    return "Live";
  }
  if (phase === "ended") {
    return "Ended";
  }
  return "Upcoming";
}

function formatEventSchedule(event) {
  const start = event?.startAt ? new Date(event.startAt) : null;
  const end = event?.endAt ? new Date(event.endAt) : null;
  if (!start || Number.isNaN(start.getTime())) {
    return "";
  }

  const startDate = start.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (!end || Number.isNaN(end.getTime())) {
    return `${startDate} • ${startTime}`;
  }

  const endDate = end.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${startDate} • ${startTime} — ${endDate} • ${endTime}`;
}

function getEventManageUrl(event) {
  return `${window.location.origin}/studio?event=${encodeURIComponent(event.id)}`;
}

function getEventPresentUrl(event) {
  return `${window.location.origin}/event/${encodeURIComponent(event.slug || "")}/present`;
}

function getEventUploadUrl(event) {
  return `${window.location.origin}/event/${encodeURIComponent(event.slug || "")}`;
}

function renderSavedEventsTable() {
  if (!savedEventsTable) {
    return;
  }

  if (!savedEvents.length) {
    savedEventsTable.innerHTML = '<p class="studio-empty">No events yet.</p>';
    return;
  }

  savedEventsTable.innerHTML = "";
  savedEvents.forEach((event) => {
    const card = document.createElement("article");
    card.className = "saved-page-card saved-event-card";
    const phaseLabel = formatEventPhaseLabel(event.phase);
    card.innerHTML = `
      <div class="saved-page-thumb saved-event-thumb">
        <p class="saved-event-thumb-title">${escapeMarkup(event.name || "Untitled event")}</p>
        <div class="saved-event-badge saved-event-badge-${escapeMarkup(String(event.phase || "upcoming"))}">${escapeMarkup(phaseLabel)}</div>
      </div>
      <div class="saved-page-content">
        <div class="saved-event-meta">
          <h2>${escapeMarkup(event.name || "Untitled event")}</h2>
          <p class="saved-page-pairing">${escapeMarkup(event.code || "")}</p>
          <p class="saved-event-schedule">${escapeMarkup(formatEventSchedule(event))}</p>
        </div>
        <div class="saved-page-actions saved-event-actions" aria-label="Event actions">
          <button type="button" class="saved-page-icon-button" data-action="present" aria-label="Open presentation mode">
            <span class="saved-page-icon icon-mask icon-present" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="manage" aria-label="Open moderation page">
            <span class="saved-page-icon icon-mask icon-manage" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="edit" aria-label="Edit event">
            <span class="saved-page-icon icon-mask icon-edit" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="camera" aria-label="Open upload page">
            <span class="saved-page-icon icon-mask icon-camera" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button" data-action="download-qr" aria-label="Download event QR">
            <span class="saved-page-icon icon-mask icon-download" aria-hidden="true"></span>
          </button>
          <button type="button" class="saved-page-icon-button danger" data-action="delete" aria-label="Delete event">
            <span class="saved-page-icon icon-mask icon-delete" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    `;
    card.querySelector('[data-action="present"]')?.addEventListener("click", () => {
      window.open(getEventPresentUrl(event), "_blank", "noopener,noreferrer");
    });
    card.querySelector('[data-action="manage"]')?.addEventListener("click", () => {
      window.location.href = event.moderationUrl || getEventManageUrl(event);
    });
    card.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
      openCreateEventPanel({ eventToEdit: event });
    });
    card.querySelector('[data-action="camera"]')?.addEventListener("click", () => {
      window.open(getEventUploadUrl(event), "_blank", "noopener,noreferrer");
    });
    card.querySelector('[data-action="download-qr"]')?.addEventListener("click", async () => {
      try {
        await downloadEventQr(event);
      } catch (error) {
        showStudioToast(error.message || "Could not download QR");
      }
    });
    card.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
      await deleteEvent(event);
    });
    savedEventsTable.appendChild(card);
  });
}

function renderEventPhotoGrid() {
  if (!manageEventPhotoGrid) {
    return;
  }

  const photos = activeEventPhotoFilter === "live"
    ? currentManagedEvent?.livePhotos || []
    : currentManagedEvent?.queuedPhotos || [];

  if (!photos.length) {
    manageEventPhotoGrid.innerHTML = `<p class="studio-empty">No ${activeEventPhotoFilter} photos yet.</p>`;
    return;
  }

  manageEventPhotoGrid.innerHTML = "";
  photos.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "photo-card event-photo-review-card";
    card.innerHTML = `
      <img src="${escapeMarkup(photo.thumbnailUrl || photo.fullUrl || "")}" alt="${escapeMarkup(photo.name || "Event photo")}" loading="lazy" />
      <div class="event-photo-review-overlay">
        ${
          activeEventPhotoFilter === "queue"
            ? `
              <div class="event-photo-review-actions">
              <button type="button" class="event-photo-review-button approve" data-action="approve" aria-label="Approve photo">
                <span class="saved-page-icon icon-mask icon-tick" aria-hidden="true"></span>
              </button>
              <button type="button" class="event-photo-review-button reject" data-action="reject" aria-label="Reject photo">
                <span class="saved-page-icon icon-mask icon-cross" aria-hidden="true"></span>
              </button>
              </div>
            `
            : ``
        }
      </div>
    `;
    card.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        await moderateEventPhoto(photo.id, button.dataset.action || "");
      });
    });
    manageEventPhotoGrid.appendChild(card);
  });
}

function showEventPhotoFilter(filter) {
  activeEventPhotoFilter = filter === "queue" ? "queue" : "live";
  eventPhotoFilterTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.eventPhotoFilter === activeEventPhotoFilter);
  });
  renderEventPhotoGrid();
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

function getDateValueMs(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

async function getAdminAuthHeaders() {
  if (!currentUser) {
    throw new Error("You need to be signed in.");
  }

  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

function updateDriveConnectionUi() {
  if (!eventDriveConnectionStatus || !connectEventDriveButton) {
    return;
  }

  if (driveConnectionStatus.connected) {
    eventDriveConnectionStatus.textContent = driveConnectionStatus.email
      ? `Connected as ${driveConnectionStatus.email}`
      : "Google Drive connected.";
    connectEventDriveButton.textContent = "Reconnect Google Drive";
  } else {
    eventDriveConnectionStatus.textContent = "Connect your Google Drive before creating an event folder.";
    connectEventDriveButton.textContent = "Connect Google Drive";
  }

  if (eventDriveStep) {
    eventDriveStep.classList.toggle("hidden", driveConnectionStatus.connected);
  }
  if (eventDetailsStep) {
    eventDetailsStep.classList.toggle("hidden", !currentEditingEventId && !driveConnectionStatus.connected);
  }
  if (studioDriveCopy) {
    studioDriveCopy.textContent = driveConnectionStatus.connected
      ? (driveConnectionStatus.email
        ? `Connected as ${driveConnectionStatus.email}`
        : "Google Drive connected.")
      : "No Google Drive account connected.";
  }
  if (accountRemoveDriveButton) {
    accountRemoveDriveButton.classList.toggle("hidden", !driveConnectionStatus.connected);
  }
}

async function loadDriveConnectionStatus() {
  if (!currentUser) {
    driveConnectionStatus = { connected: false, email: "", connectedAt: "", updatedAt: "" };
    updateDriveConnectionUi();
    return driveConnectionStatus;
  }

  const response = await fetch("/api/drive/connection", {
    headers: await getAdminAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not load Drive connection status.");
  }
  driveConnectionStatus = {
    connected: Boolean(payload.connected),
    email: String(payload.email || "").trim(),
    connectedAt: String(payload.connectedAt || "").trim(),
    updatedAt: String(payload.updatedAt || "").trim(),
  };
  updateDriveConnectionUi();
  return driveConnectionStatus;
}

async function startDriveOAuth() {
  const response = await fetch("/api/drive/oauth/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.authUrl) {
    throw new Error(payload.error || "Could not start Google Drive connection.");
  }
  window.location.href = payload.authUrl;
}

async function removeDriveConnection() {
  const response = await fetch("/api/drive/connection/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not remove Google Drive connection.");
  }
  driveConnectionStatus = {
    connected: false,
    email: "",
    connectedAt: "",
    updatedAt: "",
  };
  updateDriveConnectionUi();
}

async function getFolderNameForAdminLink(url, fallback = "Google Drive folder") {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    return fallback;
  }

  if (adminFolderNameCache.has(normalizedUrl)) {
    return adminFolderNameCache.get(normalizedUrl);
  }

  try {
    const response = await fetch(`/api/folder-meta?url=${encodeURIComponent(normalizedUrl)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not load folder name.");
    }

    const folderName = String(payload.name || "").trim() || fallback;
    adminFolderNameCache.set(normalizedUrl, folderName);
    return folderName;
  } catch (error) {
    adminFolderNameCache.set(normalizedUrl, fallback);
    return fallback;
  }
}

function updateAdminPanelMode() {
  const isLinksView = activeAdminFilter === "links";
  adminSaveAccountsButton?.classList.toggle("hidden", isLinksView);
  adminAccountsList?.classList.toggle("links-mode", isLinksView);
}

function renderAdminAccounts() {
  if (!adminAccountsList) {
    return;
  }

  updateAdminPanelMode();

  const filteredAccounts = allAccounts.filter((account) => {
    if (isAdminEmail(account.email)) {
      return false;
    }
    return getAccountStatus(account) === activeAdminFilter;
  });
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

function renderAdminLinks() {
  if (!adminAccountsList) {
    return;
  }

  updateAdminPanelMode();
  const isMobileView = isMobileStudioViewport();

  if (!allAdminLinks.length) {
    adminAccountsList.innerHTML = '<p class="studio-empty">No links here.</p>';
    return;
  }

  if (isMobileView) {
    adminAccountsList.innerHTML = "";
    allAdminLinks.forEach((link) => {
      const item = document.createElement("details");
      item.className = "admin-link-accordion";
      item.innerHTML = `
        <summary class="admin-link-accordion-summary">
          <span class="admin-link-accordion-title">${escapeMarkup(link.folderName || "Google Drive folder")}</span>
          <span class="admin-link-accordion-code">${escapeMarkup(link.code || "")}</span>
        </summary>
        <div class="admin-link-accordion-body">
          <div class="admin-link-accordion-grid">
            <div class="admin-link-accordion-field">
              <span class="admin-link-accordion-label">Type</span>
              <span>${escapeMarkup(link.kind === "temporary" ? "Temporary" : "Permanent")}</span>
            </div>
            <div class="admin-link-accordion-field">
              <span class="admin-link-accordion-label">Creation date</span>
              <span>${escapeMarkup(formatRegistrationDate(link.createdAt))}</span>
            </div>
            <div class="admin-link-accordion-field">
              <span class="admin-link-accordion-label">Drive link</span>
              <a class="text-link-button admin-link-anchor" href="${escapeMarkup(link.url || "#")}" target="_blank" rel="noreferrer noopener">
                Open link
              </a>
            </div>
          </div>
          <button type="button" class="saved-page-icon-button danger admin-link-delete" aria-label="Delete ${escapeMarkup(link.folderName || "link")}">
            <span class="saved-page-icon icon-mask icon-delete" aria-hidden="true"></span>
          </button>
        </div>
      `;
      item.querySelector(".admin-link-delete")?.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await deleteAdminLink(link);
      });
      adminAccountsList.appendChild(item);
    });
    return;
  }

  adminAccountsList.innerHTML = `
    <div class="admin-link-row admin-account-head">
      <span>Folder name</span>
      <span>Type</span>
      <span>Creation date</span>
      <span>Pairing code</span>
      <span>Drive link</span>
      <span>Delete</span>
    </div>
  `;

  allAdminLinks.forEach((link) => {
    const row = document.createElement("div");
    row.className = "admin-link-row";
    row.innerHTML = `
      <span>${escapeMarkup(link.folderName || "Google Drive folder")}</span>
      <span>${escapeMarkup(link.kind === "temporary" ? "Temporary" : "Permanent")}</span>
      <span>${escapeMarkup(formatRegistrationDate(link.createdAt))}</span>
      <span>${escapeMarkup(link.code || "")}</span>
      <span>
        <a class="text-link-button admin-link-anchor" href="${escapeMarkup(link.url || "#")}" target="_blank" rel="noreferrer noopener">
          Open link
        </a>
      </span>
      <span>
        <button type="button" class="saved-page-icon-button danger admin-link-delete" aria-label="Delete ${escapeMarkup(link.folderName || "link")}">
          <span class="saved-page-icon icon-mask icon-delete" aria-hidden="true"></span>
        </button>
      </span>
    `;
    row.querySelector(".admin-link-delete")?.addEventListener("click", async () => {
      await deleteAdminLink(link);
    });
    adminAccountsList.appendChild(row);
  });
}

async function loadAdminAccounts({ render = true } = {}) {
  const snapshot = await getDocs(collection(db, collections.users));
  allAccounts = snapshot.docs
    .map((accountDoc) => ({ id: accountDoc.id, ...accountDoc.data() }))
    .sort((a, b) => {
      return getDateValueMs(b.createdAt) - getDateValueMs(a.createdAt);
    });
  if (render && activeAdminFilter !== "links") {
    renderAdminAccounts();
  }
}

async function loadAdminLinks({ force = false } = {}) {
  if (!force && allAdminLinks.length) {
    renderAdminLinks();
    return;
  }

  setStudioStatus(adminAccountsStatus, "Loading links...");
  if (!allAccounts.length) {
    await loadAdminAccounts({ render: false });
  }

  const headers = await getAdminAuthHeaders();
  const temporaryResponse = await fetch("/api/admin/links", { headers });
  const temporaryPayload = await temporaryResponse.json().catch(() => ({}));
  if (!temporaryResponse.ok) {
    throw new Error(temporaryPayload.error || "Could not load temporary links.");
  }

  const permanentPages = (
    await Promise.all(
      allAccounts.map(async (account) => {
        const snapshot = await getDocs(collection(db, collections.users, account.uid, "pages"));
        return snapshot.docs.map((pageDoc) => ({
          id: pageDoc.id,
          ownerUid: account.uid,
          ownerEmail: account.email || "",
          ownerStudioName: account.studioName || "",
          ...pageDoc.data(),
        }));
      })
    )
  ).flat();

  const permanentLinks = await Promise.all(
    permanentPages.map(async (page) => {
      const customDomain = getPageCustomDomain(page);
      return {
        kind: "permanent",
        folderName: await getFolderNameForAdminLink(
          page.driveLink,
          page.pageName || page.tagline || "Google Drive folder"
        ),
        createdAt: page.createdAt || "",
        code: String(page.pairingCode || "").trim(),
        url: String(page.driveLink || "").trim(),
        ownerUid: page.ownerUid || "",
        pageId: page.id || "",
        publicPageId: getPrimaryPublicPageId(page),
        customDomainPublicPageId: customDomain ? getCustomDomainPublicPageId(customDomain, page.pageSlug) : "",
      };
    })
  );

  const temporaryLinks = (temporaryPayload.links || []).map((link) => ({
    kind: "temporary",
    folderName: link.folderName || "Google Drive folder",
    createdAt: link.createdAt || "",
    code: String(link.code || "").trim(),
    url: String(link.url || "").trim(),
  }));

  allAdminLinks = [...temporaryLinks, ...permanentLinks]
    .filter((link) => link.code && link.url)
    .sort((a, b) => getDateValueMs(b.createdAt) - getDateValueMs(a.createdAt));

  renderAdminLinks();
  setStudioStatus(adminAccountsStatus, "");
}

async function deleteAdminLink(link) {
  if (!link?.code || !link?.url) {
    return;
  }

  const confirmed = window.confirm(`Delete ${link.folderName || "this link"}?`);
  if (!confirmed) {
    return;
  }

  try {
    setStudioStatus(adminAccountsStatus, "Deleting link...");
    const response = await fetch("/api/admin/links/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAdminAuthHeaders()),
      },
      body: JSON.stringify(link.kind === "temporary" ? {
        kind: "temporary",
        code: link.code,
        url: link.url,
      } : {
        kind: "permanent",
        code: link.code,
        ownerUid: link.ownerUid,
        pageId: link.pageId,
        publicPageId: link.publicPageId,
        customDomainPublicPageId: link.customDomainPublicPageId,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not delete link.");
    }

    allAdminLinks = allAdminLinks.filter((entry) => !(entry.kind === link.kind && entry.code === link.code));
    renderAdminLinks();
    setStudioStatus(adminAccountsStatus, "Link deleted.");
  } catch (error) {
    setStudioStatus(adminAccountsStatus, error.message || "Could not delete link.", true);
  }
}

function updateLinkCreationGate() {
  if ((!createPageButton && !createEventButton) || !linkApprovalNotice) {
    return;
  }

  const status = getAccountStatus(currentProfile);
  if (createPageButton) {
    createPageButton.disabled = status !== "active";
  }
  if (createEventButton) {
    createEventButton.disabled = status !== "active";
  }
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

async function loadEvents() {
  const headers = await getAdminAuthHeaders();
  const response = await fetch("/api/events", { headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not load events.");
  }
  savedEvents = Array.isArray(payload.events) ? payload.events : [];
  renderSavedEventsTable();
}

async function refreshManagedEvent(eventId = currentManagedEvent?.id) {
  if (!eventId) {
    return;
  }

  const url = moderationAccessToken
    ? `/api/events/moderation?token=${encodeURIComponent(moderationAccessToken)}`
    : `/api/events/manage?id=${encodeURIComponent(eventId)}`;
  const headers = moderationAccessToken ? undefined : await getAdminAuthHeaders();
  const response = await fetch(url, headers ? { headers } : undefined);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not load the event.");
  }
  currentManagedEvent = payload.event || null;
  const eventIndex = savedEvents.findIndex((entry) => entry.id === currentManagedEvent?.id);
  if (eventIndex >= 0 && currentManagedEvent) {
    savedEvents.splice(eventIndex, 1, currentManagedEvent);
    renderSavedEventsTable();
  }
  if (manageEventKicker) {
    manageEventKicker.textContent = currentManagedEvent?.name || "Manage event";
  }
  renderEventPhotoGrid();
}

async function createEvent(payload) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Could not create event.");
  }
  return body.event;
}

async function updateEvent(payload) {
  const response = await fetch("/api/events/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Could not update event.");
  }
  return body.event;
}

async function moderateEventPhoto(photoId, action) {
  if (!currentManagedEvent?.id || !photoId || !action) {
    return;
  }

  setStudioStatus(manageEventStatus, "Updating photos...");
  const response = await fetch(moderationAccessToken ? "/api/events/moderation" : "/api/events/moderate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(moderationAccessToken ? {} : await getAdminAuthHeaders()),
    },
    body: JSON.stringify(moderationAccessToken ? {
      token: moderationAccessToken,
      photoId,
      action,
    } : {
      eventId: currentManagedEvent.id,
      photoId,
      action,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not update event photos.");
  }
  currentManagedEvent = payload.event || currentManagedEvent;
  renderEventPhotoGrid();
  setStudioStatus(manageEventStatus, "Updated.");
  if (!moderationAccessToken) {
    await loadEvents().catch(() => {});
  }
}

async function deleteEvent(event) {
  const confirmed = window.confirm(`Delete ${event?.name || "this event"}?`);
  if (!confirmed) {
    return;
  }

  const response = await fetch("/api/events/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify({ id: event.id }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not delete event.");
  }
  savedEvents = savedEvents.filter((entry) => entry.id !== event.id);
  renderSavedEventsTable();
  showStudioToast("Event deleted");
}

async function downloadEventQr(event) {
  const qrTarget = getEventUploadUrl(event);
  if (!qrTarget || typeof QRCode !== "function") {
    throw new Error("QR code generator is unavailable.");
  }

  const wrap = document.createElement("div");
  const qr = new QRCode(wrap, {
    text: qrTarget,
    width: 1200,
    height: 1200,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  const image = wrap.querySelector("img") || wrap.querySelector("canvas");
  const href = image?.src || image?.toDataURL?.("image/png");
  if (!href) {
    throw new Error("Could not generate QR.");
  }

  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${(event.name || "event").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function loadModerationEventFromToken(token) {
  moderationAccessToken = token;
  const response = await fetch(`/api/events/moderation?token=${encodeURIComponent(token)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "This moderation link could not be opened.");
  }
  setStudioScreen(true);
  showStudioView("dashboard");
  openManageEventPanel(payload.event, { skipHistory: true, token });
}

async function loadPublicEvent(slug) {
  const response = await fetch(`/api/events/public?slug=${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "This event could not be opened.");
  }

  const event = payload.event || {};
  screenDirectLink.classList.remove("active");
  screenGallery.classList.remove("active");
  screenStudio.classList.remove("active");
  screenEventPresent?.classList.remove("active");
  screenEventPublic?.classList.add("active");
  document.body.classList.add("studio-scroll-lock");
  document.title = [event.name || "Event", "CarnivalStories"].join(" | ");
  if (eventPublicTitle) {
    eventPublicTitle.textContent = event.name || "Event";
  }
  renderPublicEventGrid(event.livePhotos || []);
  eventUploadForm.dataset.slug = event.slug || slug;
  setStudioStatus(eventUploadStatus, "");
}

function renderPublicEventGrid(photos) {
  if (!eventPublicGrid) {
    return;
  }
  if (!Array.isArray(photos) || !photos.length) {
    eventPublicGrid.innerHTML = '<p class="studio-empty">No live photos yet.</p>';
    return;
  }
  eventPublicGrid.innerHTML = "";
  photos.forEach((photo) => {
    const item = document.createElement("div");
    item.className = "photo-card event-public-photo-card";
    item.innerHTML = `
      <img src="${escapeMarkup(photo.thumbnailUrl || photo.fullUrl || "")}" alt="${escapeMarkup(photo.name || "Event photo")}" loading="lazy" />
      <div class="event-public-photo-overlay" aria-hidden="true">
        <div class="photo-like-badge event-public-like-badge">
          <span class="photo-like-badge-icon icon-mask icon-heart-empty" aria-hidden="true"></span>
        </div>
      </div>
    `;
    eventPublicGrid.appendChild(item);
  });
}

function stopEventPresentation() {
  if (currentEventPresentationTimer) {
    window.clearTimeout(currentEventPresentationTimer);
    currentEventPresentationTimer = null;
  }
}

function queueNextEventPresentationSlide() {
  if (!currentEventPresentationPhotos.length) {
    return;
  }
  currentEventPresentationTimer = window.setTimeout(() => {
    currentEventPresentationIndex = (currentEventPresentationIndex + 1) % currentEventPresentationPhotos.length;
    void renderEventPresentationSlide();
  }, 4000);
}

async function renderEventPresentationSlide() {
  const photo = currentEventPresentationPhotos[currentEventPresentationIndex];
  if (!photo || !eventPresentImage) {
    return;
  }
  stopEventPresentation();
  const preload = new Image();
  preload.onload = () => {
    eventPresentImage.src = photo.fullUrl || photo.slideshowUrl || photo.thumbnailUrl || "";
    eventPresentImage.alt = photo.name || "Event photo";
    queueNextEventPresentationSlide();
  };
  preload.onerror = () => {
    queueNextEventPresentationSlide();
  };
  preload.src = photo.fullUrl || photo.slideshowUrl || photo.thumbnailUrl || "";
}

async function loadEventPresentation(slug) {
  const response = await fetch(`/api/events/public?slug=${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "This presentation could not be opened.");
  }

  const event = payload.event || {};
  currentEventPresentationPhotos = Array.isArray(event.livePhotos) ? event.livePhotos : [];
  currentEventPresentationIndex = 0;
  screenDirectLink.classList.remove("active");
  screenGallery.classList.remove("active");
  screenStudio.classList.remove("active");
  screenEventPublic?.classList.remove("active");
  screenEventPresent?.classList.add("active");
  document.body.classList.remove("studio-scroll-lock");
  document.title = [event.name || "Event", "CarnivalStories"].join(" | ");
  if (!currentEventPresentationPhotos.length) {
    if (eventPresentImage) {
      eventPresentImage.removeAttribute("src");
      eventPresentImage.alt = "";
    }
    return;
  }
  await renderEventPresentationSlide();
}

function applyStudioRoute() {
  const route = getStudioRoute();
  if (route.name === "event-moderate" && route.token) {
    loadModerationEventFromToken(route.token).catch((error) => {
      showPublicPageLoadingState();
      window.CarnivalGallery?.showError?.(error.message || "This moderation link could not be opened.");
    });
    return;
  }

  if (route.name === "connect-domain") {
    openConnectDomainPage({ skipHistory: true });
    return;
  }

  if (route.name === "create") {
    openCreateWizard({ skipHistory: true });
    return;
  }

  if (route.name === "event-create") {
    openCreateEventPanel({ skipHistory: true });
    return;
  }

  if (route.name === "event-edit") {
    const event = savedEvents.find((item) => item.id === route.eventId);
    if (event) {
      openCreateEventPanel({ skipHistory: true, eventToEdit: event });
      return;
    }
  }

  if (route.name === "edit") {
    const page = savedPages.find((item) => item.id === route.pageId);
    if (page) {
      openEditWizard(page, { skipHistory: true });
      return;
    }
  }

  if (route.name === "event-manage") {
    const event = savedEvents.find((item) => item.id === route.eventId);
    if (event) {
      openManageEventPanel(event, { skipHistory: true });
      void refreshManagedEvent(event.id);
      return;
    }
  }

  closeCreateWizard({ skipHistory: true });
  closeCreateEventPanel({ skipHistory: true });
  closeManageEventPanel({ skipHistory: true });
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
    if (window.location.pathname.startsWith("/studio")) {
      window.history.replaceState({ login: true }, "", "/login");
    }
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
    if (window.location.pathname === "/login") {
      window.history.replaceState({ studio: true }, "", "/studio");
    }
    showStudioView("admin");
    await loadAdminAccounts();
    return;
  }

  if (!currentProfile?.studioName) {
    if (window.location.pathname === "/login") {
      window.history.replaceState({ studio: true }, "", "/studio");
    }
    showStudioView("name");
    return;
  }

  hydrateStudioSettingsForms();
  updateDomainSummary();
  if (window.location.pathname === "/login") {
    window.history.replaceState({ studio: true }, "", "/studio");
  }
  showStudioView("dashboard");
  updateLinkCreationGate();
  await loadSavedPages();
  await loadEvents();
  await loadDriveConnectionStatus().catch(() => {});
  applyStudioRoute();
  consumeDriveReturnState();
}

async function saveStudioName(name) {
  const studioName = String(name || "").trim();
  const studioSlug = slugify(studioName);
  if (!studioSlug) {
    throw new Error("Please enter a valid studio name.");
  }

  const previousStudioSlug = currentProfile?.studioSlug || "";
  const currentCustomDomain = normalizeCustomDomain(currentProfile?.branding?.customDomain || "");

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

    if (currentCustomDomain) {
      transaction.set(doc(db, collections.customDomains, currentCustomDomain), {
        uid: currentUser.uid,
        studioName,
        studioSlug,
        domain: currentCustomDomain,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    savedPages.forEach((page) => {
      if (!page?.id || !page?.pageSlug) {
        return;
      }

      const pageRef = doc(getPagesCollection(), page.id);
      const nextPage = {
        ...page,
        studioName,
        studioSlug,
        pageId: page.id,
        updatedAt: serverTimestamp(),
      };
      const nextPublicRef = doc(db, collections.publicPages, getPrimaryPublicPageId(nextPage));
      const nextCustomDomain = getPageCustomDomain(nextPage);
      transaction.set(pageRef, {
        studioName,
        studioSlug,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(nextPublicRef, nextPage, { merge: true });

      if (nextCustomDomain) {
        transaction.set(
          doc(db, collections.publicPages, getCustomDomainPublicPageId(nextCustomDomain, page.pageSlug)),
          nextPage,
          { merge: true }
        );
      }

      if (previousStudioSlug && previousStudioSlug !== studioSlug) {
        transaction.delete(doc(db, collections.publicPages, `${previousStudioSlug}__${page.pageSlug}`));
      }
    });
  });
}

async function saveBrandingSettings(branding) {
  const previousDomain = normalizeCustomDomain(currentProfile?.branding?.customDomain || "");
  const nextDomain = normalizeCustomDomain(branding.customDomain || "");

  await runTransaction(db, async (transaction) => {
    if (nextDomain && nextDomain !== previousDomain) {
      const nextDomainRef = doc(db, collections.customDomains, nextDomain);
      const nextDomainSnapshot = await transaction.get(nextDomainRef);
      if (nextDomainSnapshot.exists() && nextDomainSnapshot.data()?.uid !== currentUser.uid) {
        throw new Error("That album domain is already connected to another studio.");
      }

      transaction.set(nextDomainRef, {
        uid: currentUser.uid,
        studioName: currentProfile?.studioName || "",
        studioSlug: currentProfile?.studioSlug || "",
        domain: nextDomain,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    if (previousDomain && previousDomain !== nextDomain) {
      transaction.delete(doc(db, collections.customDomains, previousDomain));
    }

    transaction.set(getUserRef(), {
      branding,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    savedPages.forEach((page) => {
      if (!page?.id || !page?.pageSlug) {
        return;
      }

      const nextPage = {
        ...page,
        branding,
        customDomain: nextDomain,
        updatedAt: serverTimestamp(),
      };

      transaction.set(doc(getPagesCollection(), page.id), {
        branding,
        customDomain: nextDomain,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(
        doc(db, collections.publicPages, getPrimaryPublicPageId(nextPage)),
        nextPage,
        { merge: true }
      );

      if (nextDomain) {
        transaction.set(
          doc(db, collections.publicPages, getCustomDomainPublicPageId(nextDomain, page.pageSlug)),
          nextPage,
          { merge: true }
        );
      }

      if (previousDomain && previousDomain !== nextDomain) {
        transaction.delete(doc(db, collections.publicPages, getCustomDomainPublicPageId(previousDomain, page.pageSlug)));
      }
    });
  });
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

function createSnapshotMediaItem(item) {
  return {
    id: item.id || "",
    name: item.name || "",
    mimeType: item.mimeType || "",
    path: item.path || "",
    folderPath: item.folderPath || item.path || "",
    width: Number(item.width) || null,
    height: Number(item.height) || null,
    url: item.url || "",
    slideshowUrl: item.slideshowUrl || "",
    thumbnailUrl: item.thumbnailUrl || "",
    webViewLink: item.webViewLink || "",
  };
}

function createSnapshotFolder(folder) {
  const images = (folder.images || []).map(createSnapshotMediaItem);
  return {
    id: folder.id || "",
    name: folder.name || "",
    path: folder.path || "",
    photoCount: Number(folder.photoCount) || images.filter((item) => !item.mimeType?.startsWith("video/")).length,
    mediaCount: Number(folder.mediaCount) || images.length,
    images,
  };
}

function buildAlbumSnapshot(tree) {
  const folders = flattenDriveFolders(tree).map(createSnapshotFolder).filter((folder) => folder.images.length > 0);
  const chunks = [];
  let currentFolders = [];
  let currentSize = 0;

  folders.forEach((folder) => {
    const folderSize = JSON.stringify(folder).length;
    if (currentFolders.length > 0 && currentSize + folderSize > ALBUM_SNAPSHOT_TARGET_CHARS) {
      chunks.push(currentFolders);
      currentFolders = [];
      currentSize = 0;
    }

    currentFolders.push(folder);
    currentSize += folderSize;
  });

  if (currentFolders.length > 0) {
    chunks.push(currentFolders);
  }

  return {
    meta: {
      version: ALBUM_SNAPSHOT_VERSION,
      rootName: tree?.name || "",
      folderCount: folders.length,
      mediaCount: folders.reduce((sum, folder) => sum + folder.images.length, 0),
      chunkCount: chunks.length,
      generatedAt: new Date().toISOString(),
    },
    chunks,
  };
}

async function replaceAlbumSnapshotChunks(pageRef, snapshot) {
  const existingChunks = await getDocs(collection(pageRef, ALBUM_SNAPSHOT_SUBCOLLECTION));
  const batch = writeBatch(db);

  existingChunks.forEach((chunkDoc) => {
    batch.delete(chunkDoc.ref);
  });

  snapshot.chunks.forEach((folders, index) => {
    batch.set(doc(pageRef, ALBUM_SNAPSHOT_SUBCOLLECTION, String(index).padStart(4, "0")), {
      index,
      folders,
    });
  });

  batch.set(
    pageRef,
    {
      albumSnapshotVersion: snapshot.meta.version,
      albumSnapshotRootName: snapshot.meta.rootName,
      albumSnapshotFolderCount: snapshot.meta.folderCount,
      albumSnapshotMediaCount: snapshot.meta.mediaCount,
      albumSnapshotChunkCount: snapshot.meta.chunkCount,
      albumSnapshotGeneratedAt: snapshot.meta.generatedAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

async function saveAlbumSnapshotForPublicPages(publicPageIds, tree) {
  if (!tree || !db) {
    return;
  }

  const uniquePageIds = Array.from(new Set((publicPageIds || []).filter(Boolean)));
  if (!uniquePageIds.length) {
    return;
  }

  const snapshot = buildAlbumSnapshot(tree);
  await Promise.all(
    uniquePageIds.map((pageId) =>
      replaceAlbumSnapshotChunks(doc(db, collections.publicPages, pageId), snapshot)
    )
  );
}

async function loadAlbumSnapshotFromPageRef(pageRef, pageData) {
  const chunkCount = Number(pageData?.albumSnapshotChunkCount) || 0;
  if (!chunkCount) {
    return null;
  }

  const snapshotQuery = query(
    collection(pageRef, ALBUM_SNAPSHOT_SUBCOLLECTION),
    orderBy("index", "asc")
  );
  const snapshotDocs = await getDocs(snapshotQuery);
  if (!snapshotDocs.size) {
    return null;
  }

  return {
    version: Number(pageData?.albumSnapshotVersion) || ALBUM_SNAPSHOT_VERSION,
    rootName: pageData?.albumSnapshotRootName || "",
    folderCount: Number(pageData?.albumSnapshotFolderCount) || 0,
    mediaCount: Number(pageData?.albumSnapshotMediaCount) || 0,
    generatedAt: pageData?.albumSnapshotGeneratedAt || "",
    folders: snapshotDocs.docs.flatMap((snapshotDoc) => snapshotDoc.data()?.folders || []),
  };
}

async function loadAvailableAlbumSnapshot(pageRef, pageData, publicPageRoute) {
  const directSnapshot = await loadAlbumSnapshotFromPageRef(pageRef, pageData);
  if (directSnapshot) {
    return directSnapshot;
  }

  if (!publicPageRoute?.isCustomDomain || !pageData?.studioSlug || !pageData?.pageSlug) {
    return null;
  }

  const primaryRef = doc(
    db,
    collections.publicPages,
    getPrimaryPublicPageId({
      studioSlug: pageData.studioSlug,
      pageSlug: pageData.pageSlug,
    })
  );

  if (primaryRef.id === pageRef.id) {
    return null;
  }

  const primarySnapshot = await getDoc(primaryRef);
  if (!primarySnapshot.exists()) {
    return null;
  }

  return loadAlbumSnapshotFromPageRef(primaryRef, primarySnapshot.data());
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
  connectDomainPanel?.classList.add("hidden");
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
  connectDomainPanel?.classList.add("hidden");
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

function openConnectDomainPage(options = {}) {
  const { skipHistory = false } = options;
  studioDashboardPanel.classList.add("hidden");
  createPagePanel.classList.add("hidden");
  connectDomainPanel?.classList.remove("hidden");
  updateDomainSummary();
  setStudioStatus(connectDomainStatus, "");
  refreshDomainVerificationPreview(brandingCustomDomain?.value || "").catch(() => {});
  if (!skipHistory && window.location.pathname !== "/studio/connect-domain") {
    window.history.pushState({ studio: true, connectDomain: true }, "", "/studio/connect-domain");
  }
}

function closeConnectDomainPage(options = {}) {
  const { skipHistory = false } = options;
  connectDomainPanel?.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  showStudioDashboardSection("account");
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
    const primaryPublicPageId = getPrimaryPublicPageId(pagePayload);
    const publicPageRef = doc(db, collections.publicPages, primaryPublicPageId);
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
        publicPageId: pagePayload.customDomain
          ? getCustomDomainPublicPageId(pagePayload.customDomain, pagePayload.pageSlug)
          : primaryPublicPageId,
        publicPath: getPageUrl(pagePayload),
        studioSlug: pagePayload.studioSlug,
        pageSlug: pagePayload.pageSlug,
        customDomain: pagePayload.customDomain || "",
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
      if (pagePayload.customDomain) {
        transaction.set(doc(db, collections.publicPages, getCustomDomainPublicPageId(pagePayload.customDomain, pagePayload.pageSlug)), {
          ...pagePayload,
          pageId: pageRef.id,
          pairingCode: candidate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }

    throw new Error("Could not generate a unique pairing code. Please try again.");
  });

  return pairingCode;
}

async function createPageRecord() {
  const branding = getProfileBranding();
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
    branding,
    customDomain: branding.customDomain || "",
    template: wizardState.template,
    templateLabel: "Template 1",
    coverFileId: wizardState.selectedCover?.id || "",
    coverImageUrl: wizardState.selectedCover?.url || "",
    coverThumbnailUrl: wizardState.selectedCover?.thumbnailUrl || "",
    coverName: wizardState.selectedCover?.name || "",
  };

  await reservePairingCode(pageRef, payload);
  return {
    pageId: pageRef.id,
    publicPageIds: [
      getPrimaryPublicPageId(payload),
      payload.customDomain ? getCustomDomainPublicPageId(payload.customDomain, payload.pageSlug) : "",
    ].filter(Boolean),
  };
}

async function updatePageRecord() {
  const existingPage = wizardState.existingPage;
  if (!existingPage?.id || !existingPage?.pairingCode) {
    throw new Error("This page cannot be edited because it is missing its original pairing code.");
  }

  const pageRef = doc(getPagesCollection(), existingPage.id);
  const existingCustomDomain = getPageCustomDomain(existingPage);
  const branding = getProfileBranding();
  const nextCustomDomain = branding.customDomain || "";
  const oldPublicPageRef = doc(db, collections.publicPages, getPrimaryPublicPageId(existingPage));
  const newPublicPageRef = doc(db, collections.publicPages, getPrimaryPublicPageId({
    studioSlug: currentProfile.studioSlug,
    pageSlug: wizardState.pageSlug,
  }));
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
    branding,
    customDomain: nextCustomDomain,
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

    if (existingCustomDomain && (existingCustomDomain !== nextCustomDomain || existingPage.pageSlug !== wizardState.pageSlug)) {
      transaction.delete(doc(db, collections.publicPages, getCustomDomainPublicPageId(existingCustomDomain, existingPage.pageSlug)));
    }

    transaction.set(pageRef, payload, { merge: true });
    transaction.set(newPublicPageRef, {
      ...payload,
      pageId: existingPage.id,
      createdAt: existingPage.createdAt || serverTimestamp(),
    }, { merge: true });
    if (nextCustomDomain) {
      transaction.set(doc(db, collections.publicPages, getCustomDomainPublicPageId(nextCustomDomain, payload.pageSlug)), {
        ...payload,
        pageId: existingPage.id,
        createdAt: existingPage.createdAt || serverTimestamp(),
      }, { merge: true });
    }
    transaction.set(pairingRef, {
      code: existingPage.pairingCode,
      url: payload.driveLink,
      normalizedUrl: payload.normalizedDriveLink,
      ownerUid: currentUser.uid,
      pageId: existingPage.id,
      pageName: payload.pageName,
      publicPageId: nextCustomDomain
        ? getCustomDomainPublicPageId(nextCustomDomain, payload.pageSlug)
        : getPrimaryPublicPageId(payload),
      publicPath: getPageUrl(payload),
      studioSlug: payload.studioSlug,
      pageSlug: payload.pageSlug,
      customDomain: nextCustomDomain,
      template: payload.template,
      permanent: true,
      updatedAt: serverTimestamp(),
      }, { merge: true });
  });

  return {
    pageId: existingPage.id,
    publicPageIds: [
      getPrimaryPublicPageId(payload),
      nextCustomDomain ? getCustomDomainPublicPageId(nextCustomDomain, payload.pageSlug) : "",
    ].filter(Boolean),
  };
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
  const publicPageRef = doc(db, collections.publicPages, getPrimaryPublicPageId(page));
  const aliasPublicPageRef = getPageCustomDomain(page)
    ? doc(db, collections.publicPages, getCustomDomainPublicPageId(getPageCustomDomain(page), page.pageSlug))
    : null;
  const pairingRef = page.pairingCode ? doc(db, collections.pairingCodes, page.pairingCode) : null;

  await runTransaction(db, async (transaction) => {
    transaction.delete(pageRef);
    transaction.delete(publicPageRef);
    if (aliasPublicPageRef) {
      transaction.delete(aliasPublicPageRef);
    }
    if (pairingRef) {
      transaction.delete(pairingRef);
    }
  });

  await loadSavedPages();
}

function initializeFirebase() {
  if (window.CarnivalEventPublicRoute) {
    const route = window.CarnivalEventPublicRoute;
    const loadRoute = route.mode === "present" ? loadEventPresentation(route.slug) : loadPublicEvent(route.slug);
    loadRoute.catch((error) => {
      screenDirectLink.classList.remove("active");
      screenGallery.classList.remove("active");
      screenStudio.classList.remove("active");
      screenEventPresent?.classList.remove("active");
      screenEventPublic?.classList.add("active");
      setStudioStatus(eventUploadStatus, error.message || "This event could not be opened.", true);
      renderPublicEventGrid([]);
    });
    return;
  }

  if (window.CarnivalEventModerationRoute) {
    loadModerationEventFromToken(window.CarnivalEventModerationRoute).catch((error) => {
      showPublicPageLoadingState();
      window.CarnivalGallery?.showError?.(error.message || "This moderation link could not be opened.");
    });
    return;
  }

  if (!hasFirebaseConfig()) {
    setStudioStatus(
      studioAuthStatus,
      "Firebase web config is missing. Copy /public/firebase-config.example.js to /public/firebase-config.js and add your project values.",
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
  if (!pageSnapshot.exists() && publicPageRoute.isCustomDomain && publicPageRoute.customDomain) {
    const customDomainSnapshot = await getDoc(doc(db, collections.customDomains, publicPageRoute.customDomain));
    if (customDomainSnapshot.exists()) {
      const studioSlug = customDomainSnapshot.data()?.studioSlug || "";
      if (studioSlug) {
        pageSnapshot = await getDoc(
          doc(db, collections.publicPages, getPrimaryPublicPageId({ studioSlug, pageSlug: publicPageRoute.pageSlug }))
        );
      }
    }
  }
  if (!pageSnapshot.exists() && !publicPageRoute.isCustomDomain) {
    pageSnapshot = await getDoc(doc(db, collections.publicPages, publicPageRoute.pageSlug));
  }

  if (!pageSnapshot.exists()) {
    throw new Error("This studio page does not exist.");
  }

  const page = pageSnapshot.data();
  const resolvedPublicPageId = pageSnapshot.id;
  if (!publicPageRoute.isCustomDomain && page.studioSlug && page.studioSlug !== publicPageRoute.studioSlug) {
    throw new Error("This studio page does not exist.");
  }

  if (!page?.driveLink) {
    throw new Error("This studio page does not have a Google Drive link.");
  }

  const resolvedPhotoLikes = await fetch(`/api/public-page/likes?publicPageId=${encodeURIComponent(resolvedPublicPageId)}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => (payload && typeof payload.photoLikes === "object" ? payload.photoLikes : null))
    .catch(() => null);

  const galleryOptions = getGalleryOptionsForPage(page, {
    preservePath: true,
    keepLoading: true,
    publicPageId: resolvedPublicPageId,
    photoLikes: resolvedPhotoLikes || page.photoLikes || {},
  });
  const albumSnapshot = await loadAvailableAlbumSnapshot(pageSnapshot.ref, page, publicPageRoute).catch(() => null);
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

  if (albumSnapshot?.folders?.length) {
    await window.CarnivalGallery?.loadSnapshot?.(albumSnapshot, galleryOptions);
    void window.CarnivalGallery?.revalidateFolder?.(page.driveLink, galleryOptions);
    return;
  }

  await window.CarnivalGallery?.loadFolder?.(page.driveLink, galleryOptions);
}

openStudioLoginButton?.addEventListener("click", () => {
  setStudioScreen(true, "/login");
  showStudioView("auth");
  if (auth && !authHasResolved) {
    showStudioBootState();
  }
});

studioSidebarTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showStudioDashboardSection(tab.dataset.studioSection);
  });
});

studioSidebarToggleButton?.addEventListener("click", () => {
  if (studioDashboardPanel?.classList.contains("sidebar-open")) {
    closeStudioSidebarDrawer({ restoreFocus: true });
    return;
  }
  openStudioSidebarDrawer();
});

studioSidebarCloseButton?.addEventListener("click", () => {
  closeStudioSidebarDrawer({ restoreFocus: true });
});

studioSidebarScrim?.addEventListener("click", () => {
  closeStudioSidebarDrawer({ restoreFocus: true });
});

adminTabs.forEach((tab) => {
  tab.addEventListener("click", async () => {
    activeAdminFilter = tab.dataset.adminFilter || "active";
    adminTabs.forEach((item) => {
      item.classList.toggle("active", item === tab);
    });
    updateAdminPanelMode();
    if (activeAdminFilter === "links") {
      try {
        await loadAdminLinks();
      } catch (error) {
        adminAccountsList.innerHTML = '<p class="studio-empty">No links here.</p>';
        setStudioStatus(adminAccountsStatus, error.message || "Could not load links.", true);
      }
      return;
    }

    setStudioStatus(adminAccountsStatus, "");
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
    savedPages = savedPages.map((page) => ({
      ...page,
      branding,
      customDomain: branding.customDomain || "",
    }));
    hydrateStudioSettingsForms();
    updateDomainSummary();
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

accountConnectDomainButton?.addEventListener("click", () => {
  const mode = accountConnectDomainButton.dataset.mode || "connect";
  if (mode === "remove") {
    const confirmed = window.confirm("Remove the connected domain from this studio?");
    if (!confirmed) {
      return;
    }

    const removeDomain = async () => {
      const branding = {
        ...getProfileBranding(),
        customDomain: "",
      };
      setStudioStatus(studioAccountStatus, "Removing domain...");
      await saveBrandingSettings(branding);
      currentProfile = {
        ...currentProfile,
        branding,
      };
      savedPages = savedPages.map((page) => ({
        ...page,
        branding,
        customDomain: "",
      }));
      hydrateStudioSettingsForms();
      updateDomainSummary();
      renderSavedPagesTable();
      setStudioStatus(studioAccountStatus, "Domain removed.");
    };

    removeDomain().catch((error) => {
      setStudioStatus(studioAccountStatus, error.message || "Could not remove domain.", true);
    });
    return;
  }

  openConnectDomainPage();
});
accountRemoveDriveButton?.addEventListener("click", async () => {
  try {
    setStudioStatus(studioAccountStatus, "Removing Google Drive connection...");
    await removeDriveConnection();
    setStudioStatus(studioAccountStatus, "Google Drive connection removed.");
    if (!createEventPanel?.classList.contains("hidden")) {
      setStudioStatus(createEventStatus, "Reconnect Google Drive to create a new event.");
    }
  } catch (error) {
    setStudioStatus(studioAccountStatus, error.message || "Could not remove Google Drive connection.", true);
  }
});

closeConnectDomainButton?.addEventListener("click", () => {
  closeConnectDomainPage();
});

brandingCustomDomain?.addEventListener("input", () => {
  updateDomainSummary();
  refreshDomainVerificationPreview(brandingCustomDomain.value).catch(() => {});
});

connectDomainForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const normalizedDomain = normalizeCustomDomain(brandingCustomDomain?.value);
    setStudioStatus(connectDomainStatus, "Checking DNS settings...");
    const verification = await refreshDomainVerificationPreview(normalizedDomain);
    if (normalizedDomain && !verification?.ok) {
      throw new Error(verification?.message || "Your DNS settings are not connected yet.");
    }

    const branding = {
      ...getProfileBranding(),
      customDomain: normalizedDomain,
    };
    setStudioStatus(connectDomainStatus, "Saving domain...");
    await saveBrandingSettings(branding);
    currentProfile = {
      ...currentProfile,
      branding,
    };
    savedPages = savedPages.map((page) => ({
      ...page,
      branding,
      customDomain: branding.customDomain || "",
    }));
    hydrateStudioSettingsForms();
    updateDomainSummary();
    renderSavedPagesTable();
    closeConnectDomainPage();
    setStudioStatus(
      studioAccountStatus,
      "Custom domains take a few minutes to get activated"
    );
  } catch (error) {
    setStudioStatus(connectDomainStatus, error.message || "Could not save domain.", true);
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
  currentProfile = null;
  savedPages = [];
  studioUserLabel.textContent = "";
  setStudioStatus(studioAuthStatus, "");
  showStudioView("auth");
  renderSavedPagesTable();
  setStudioScreen(false);
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
createEventButton?.addEventListener("click", () => {
  openCreateEventPanel();
});
closeCreatePageButton?.addEventListener("click", goBackInWizard);
closeCreateEventButton?.addEventListener("click", () => {
  closeCreateEventPanel();
});
closeManageEventButton?.addEventListener("click", () => {
  closeManageEventPanel();
});

eventPhotoFilterTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    showEventPhotoFilter(tab.dataset.eventPhotoFilter || "live");
  });
});

connectEventDriveButton?.addEventListener("click", async () => {
  try {
    setStudioStatus(createEventStatus, "Opening Google Drive permission...");
    await startDriveOAuth();
  } catch (error) {
    setStudioStatus(createEventStatus, error.message || "Could not connect Google Drive.", true);
  }
});

createEventForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (!currentEditingEventId && !driveConnectionStatus.connected) {
      throw new Error("Connect Google Drive first so we can create the event folder in your Drive.");
    }
    const startAt = new Date(`${eventStartDateInput?.value || ""}T${eventStartTimeInput?.value || "00:00"}`);
    const endAt = new Date(`${eventEndDateInput?.value || ""}T${eventEndTimeInput?.value || "00:00"}`);
    if (!Number.isNaN(startAt.getTime()) && !Number.isNaN(endAt.getTime()) && endAt < startAt) {
      throw new Error("End date and time cannot be before the start.");
    }
    setStudioStatus(createEventStatus, currentEditingEventId ? "Saving event..." : "Creating event folders...");
    const eventPayload = {
      id: currentEditingEventId,
      name: eventNameInput?.value || "",
      startDate: eventStartDateInput?.value || "",
      startTime: eventStartTimeInput?.value || "",
      endDate: eventEndDateInput?.value || "",
      endTime: eventEndTimeInput?.value || "",
      studioName: currentProfile?.studioName || "",
      studioSlug: currentProfile?.studioSlug || "",
      tagline: "",
    };
    const savedEvent = currentEditingEventId
      ? await updateEvent(eventPayload)
      : await createEvent(eventPayload);
    setStudioStatus(createEventStatus, currentEditingEventId ? "Event saved." : "Event created.");
    createEventForm.reset();
    await loadEvents();
    closeCreateEventPanel();
    showStudioDashboardSection("events");
    openManageEventPanel(savedEvent);
    await refreshManagedEvent(savedEvent.id);
  } catch (error) {
    setStudioStatus(createEventStatus, error.message || "Could not save event.", true);
  }
});

window.addEventListener("popstate", () => {
  closeStudioSidebarDrawer();
  if (
    (window.location.pathname.startsWith("/studio") ||
      window.location.pathname === "/login" ||
      window.location.pathname.startsWith("/event-moderate/")) &&
    currentProfile?.studioName
  ) {
    setStudioScreen(true);
    applyStudioRoute();
  }
});

window.addEventListener("resize", () => {
  if (!isMobileStudioViewport()) {
    closeStudioSidebarDrawer();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && studioDashboardPanel?.classList.contains("sidebar-open")) {
    closeStudioSidebarDrawer({ restoreFocus: true });
  }
});

eventUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const slug = String(eventUploadForm.dataset.slug || "").trim();
    const file = eventUploadInput?.files?.[0];
    if (!slug) {
      throw new Error("This event is not ready yet.");
    }
    if (!file) {
      throw new Error("Please choose a photo first.");
    }

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("photo", file);
    setStudioStatus(eventUploadStatus, "Uploading your photo...");
    const response = await fetch("/api/events/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not upload the photo.");
    }
    setStudioStatus(eventUploadStatus, payload.message || "Photo uploaded.");
    eventUploadForm.reset();
    await loadPublicEvent(slug);
  } catch (error) {
    setStudioStatus(eventUploadStatus, error.message || "Could not upload the photo.", true);
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
    const result = isEditMode
      ? await updatePageRecord()
      : await createPageRecord();

    if (wizardState.folderTree) {
      setStudioStatus(wizardTemplateStatus, "Caching album metadata...");
      await saveAlbumSnapshotForPublicPages(result.publicPageIds, wizardState.folderTree);
    }
    setStudioStatus(wizardTemplateStatus, "");
    closeCreateWizard();
    await loadSavedPages();
    showStudioToast(isEditMode ? "Page updated." : "Page created.");
  } catch (error) {
    setStudioStatus(wizardTemplateStatus, error.message, true);
  }
});

if (window.location.pathname.startsWith("/studio") || window.location.pathname === "/login") {
  setStudioScreen(true);
}

initializeFirebase();
