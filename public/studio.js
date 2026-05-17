import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  getFirestore,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
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
  faceDetectionQueue: firebaseSettings.collections?.faceDetectionQueue || "faceDetectionQueue",
};
const ALBUM_SNAPSHOT_SUBCOLLECTION = "albumSnapshotChunks";
const ALBUM_SNAPSHOT_VERSION = 1;
const ALBUM_SNAPSHOT_TARGET_CHARS = 240000;
const PRODUCT_HOME_URL = "https://carnivalshowcase.kaustubhmokashi.com/";
const PRODUCT_LOGO_PATH = "/assets/carnivalstories-logo.svg?v=20260424b";

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
const studioSidebarNameCard = document.getElementById("studio-sidebar-name-card");
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
const accountDeleteConfirmationInput = document.getElementById("account-delete-confirmation");
const accountDeleteButton = document.getElementById("account-delete-button");
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
const createPageButtonHead = document.getElementById("create-page-button-head");
const createEventButtonHead = document.getElementById("create-event-button-head");
const linkApprovalNotice = document.getElementById("link-approval-notice");
const createPagePanel = document.getElementById("create-page-panel");
const createEventPanel = document.getElementById("create-event-panel");
const createEventForm = document.getElementById("create-event-form");
const createEventLogoLink = document.getElementById("create-event-logo-link");
const createEventLogo = document.getElementById("create-event-logo");
const manageEventLogoLink = document.getElementById("manage-event-logo-link");
const manageEventLogo = document.getElementById("manage-event-logo");
const manageEventCover = document.getElementById("manage-event-cover");
const manageEventCoverTitle = document.getElementById("manage-event-cover-title");
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
const eventBackgroundInput = document.getElementById("event-background-input");
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
const wizardDetailsForm = document.getElementById("wizard-details-form");
const wizardAlbumName = document.getElementById("wizard-album-name");
const wizardAlbumUrlPreview = document.getElementById("wizard-album-url-preview");
const wizardAlbumTagline = document.getElementById("wizard-album-tagline");
const wizardAlbumStartDate = document.getElementById("wizard-album-start-date");
const wizardAlbumEndDate = document.getElementById("wizard-album-end-date");
const wizardDetailsStatus = document.getElementById("wizard-details-status");
const wizardRemapForm = document.getElementById("wizard-remap-form");
const wizardRemapList = document.getElementById("wizard-remap-list");
const wizardCreateVideosFolder = document.getElementById("wizard-create-videos-folder");
const wizardRemapStatus = document.getElementById("wizard-remap-status");
const wizardYoutubeStep = document.getElementById("wizard-youtube-step");
const wizardYoutubeLinks = document.getElementById("wizard-youtube-links");
const wizardYoutubeAdd = document.getElementById("wizard-youtube-add");
const wizardYoutubeNext = document.getElementById("wizard-youtube-next");
const wizardYoutubeStatus = document.getElementById("wizard-youtube-status");
const wizardMediaStep = document.getElementById("wizard-media-step");
const wizardMediaSearch = document.getElementById("wizard-media-search");
const wizardMediaList = document.getElementById("wizard-media-list");
const wizardMediaNext = document.getElementById("wizard-media-next");
const wizardMediaStatus = document.getElementById("wizard-media-status");
const wizardTemplateStep = document.getElementById("wizard-template-step");
const wizardTemplateCards = Array.from(document.querySelectorAll(".template-card[data-template-id]"));
const wizardCreatePage = document.getElementById("wizard-create-page");
const wizardTemplateStatus = document.getElementById("wizard-template-status");
const screenEventPublic = document.getElementById("screen-event-public");
const eventPublicLogoLink = document.getElementById("event-public-logo-link");
const eventPublicLogo = document.getElementById("event-public-logo");
const craftedFooterEventFaviconEl = document.getElementById("crafted-footer-event-favicon");
const eventUploadForm = document.getElementById("event-upload-form");
const eventUploadInput = document.getElementById("event-upload-input");
const eventUploadStatus = document.getElementById("event-upload-status");
const eventPublicGrid = document.getElementById("event-public-grid");
const eventUploadPreview = document.getElementById("event-upload-preview");
const eventUploadQueue = document.getElementById("event-upload-queue");
const screenEventPresent = document.getElementById("screen-event-present");
const eventPresentCardA = document.getElementById("event-present-card-a");
const eventPresentCardB = document.getElementById("event-present-card-b");
const eventPresentImageA = document.getElementById("event-present-image-a");
const eventPresentImageB = document.getElementById("event-present-image-b");
const eventPresentLoader = document.getElementById("event-present-loader");
const eventPresentLoaderAnimationEl = document.getElementById("event-present-loader-animation");
const eventPresentExitButton = document.getElementById("event-present-exit");
const STUDIO_PROFILE_CACHE_KEY = "carnival_studio_profile_cache";
const ALBUM_TEMPLATE_OPTIONS = Object.freeze({
  "template-1": "Template 1",
  "template-2": "Template 2",
});

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let savedPages = [];
let savedEvents = [];
let allAccounts = [];
let allAdminLinks = [];
let allAdminEvents = [];
let pendingAccountStatuses = new Map();
let activeAdminFilter = "active";
let wizardState = createEmptyWizardState();
let authHasResolved = false;
let currentWizardStep = 1;
let activeEventPhotoFilter = "queue";
let currentManagedEvent = null;
let moderationAccessToken = "";
let likedEventPhotoSessionIds = new Set();
let driveConnectionStatus = {
  connected: false,
  email: "",
};
let currentEditingEventId = "";
let currentEventPresentationTimer = null;
let currentEventPresentationPhotos = [];
let currentEventPresentationIndex = 0;
let currentEventUploadPreviewUrl = "";
let currentEventUploadQueue = [];
let currentPublicEvent = null;
let currentEventPresentationSlug = "";
let currentEventPresentationRefreshTimer = null;
let currentEventPresentationCardIndex = 0;
let currentEventPresentationHasFirstPaint = false;
let eventPresentLoaderAnimation = null;
let currentEventPresentationLeaveStartTimer = null;
let currentEventPresentationLeaveCleanupTimer = null;
let studioCardRefreshTimer = null;
let studioCardRefreshInFlight = false;
const EVENT_PRESENT_ENTER_MS = 900;
const EVENT_PRESENT_PUSH_DELAY_MS = 0;
const EVENT_PRESENT_EXIT_MS = 900;
let manageEventRefreshTimer = null;
const ADMIN_EMAIL = "carnivalshowcase@gmail.com";
const adminFolderNameCache = new Map();
const PRESENTATION_DEBUG_ENABLED = new URLSearchParams(window.location.search).has("debugPresentation");

function ensurePresentationDebugPanel() {
  if (!PRESENTATION_DEBUG_ENABLED) {
    return null;
  }
  let panel = document.getElementById("presentation-debug-panel");
  if (panel) {
    return panel;
  }
  panel = document.createElement("textarea");
  panel.id = "presentation-debug-panel";
  panel.readOnly = true;
  panel.setAttribute("aria-label", "Presentation debug log");
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.right = "12px";
  panel.style.bottom = "12px";
  panel.style.height = "160px";
  panel.style.zIndex = "10000";
  panel.style.background = "rgba(0,0,0,0.82)";
  panel.style.color = "#fff";
  panel.style.border = "1px solid rgba(255,255,255,0.28)";
  panel.style.borderRadius = "8px";
  panel.style.padding = "8px";
  panel.style.font = "11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace";
  panel.style.whiteSpace = "pre";
  document.body.appendChild(panel);
  return panel;
}

function logPresentationDebug(source, message) {
  if (!PRESENTATION_DEBUG_ENABLED) {
    return;
  }
  const panel = ensurePresentationDebugPanel();
  if (!panel) {
    return;
  }
  const timestamp = new Date().toISOString().slice(11, 23);
  const line = `[${timestamp}] [${source}] ${message}`;
  panel.value = `${line}\n${panel.value}`.slice(0, 10000);
}

function isMobileStudioViewport() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function getNextEventExitPreset() {
  const presets = [
    { toX: "-110vw", toY: "-110vh" },
    { toX: "110vw", toY: "-110vh" },
    { toX: "-110vw", toY: "110vh" },
    { toX: "110vw", toY: "110vh" },
  ];
  return presets[Math.floor(Math.random() * presets.length)];
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

function ensureCarnivalAndroidAuthBridge() {
  const bridgeState = window.__carnivalAndroidAuthBridgeState || {
    installed: false,
    processing: false,
  };
  window.__carnivalAndroidAuthBridgeState = bridgeState;

  const androidTokenQueue = Array.isArray(window.__carnivalAndroidTokenQueue)
    ? window.__carnivalAndroidTokenQueue
    : [];
  window.__carnivalAndroidTokenQueue = androidTokenQueue;

  const processAndroidGoogleToken = async (idToken) => {
    const token = String(idToken || "").trim();
    if (!token) {
      throw new Error("Google sign-in did not return an ID token.");
    }
    if (!auth) {
      if (!androidTokenQueue.includes(token)) {
        androidTokenQueue.push(token);
      }
      setStudioStatus(studioAuthStatus, "Preparing sign-in...");
      return "queued";
    }
    setStudioStatus(studioAuthStatus, "Completing Google sign in...");
    const credential = GoogleAuthProvider.credential(token);
    await signInWithCredential(auth, credential);
    setStudioStatus(studioNameStatus, "Preparing your studio...");
    setStudioStatus(studioAuthStatus, "");
    return true;
  };

  bridgeState.flushAndroidGoogleTokenQueue = async () => {
    if (bridgeState.processing || !auth || !androidTokenQueue.length) return;
    bridgeState.processing = true;
    try {
      while (androidTokenQueue.length && auth) {
        const queued = androidTokenQueue.shift();
        if (!queued) continue;
        try {
          await processAndroidGoogleToken(queued);
          if (String(window.__pendingAndroidGoogleIdToken || "").trim() === queued) {
            window.__pendingAndroidGoogleIdToken = "";
          }
        } catch (_) {
          androidTokenQueue.unshift(queued);
          break;
        }
      }
    } finally {
      bridgeState.processing = false;
    }
  };

  bridgeState.consumePendingAndroidGoogleToken = () => {
    const pendingToken = String(window.__pendingAndroidGoogleIdToken || "").trim();
    if (!pendingToken) return;
    window.CarnivalAndroidAuth
      .signInWithGoogleIdToken(pendingToken)
      .then((result) => {
        if (result !== "queued") {
          window.__pendingAndroidGoogleIdToken = "";
        }
      })
      .catch(() => {});
  };

  window.CarnivalAndroidAuth = window.CarnivalAndroidAuth || {};
  window.CarnivalAndroidAuth.signInWithGoogleIdToken = async (idToken) => {
    const result = await processAndroidGoogleToken(idToken);
    if (result === "queued") {
      window.setTimeout(() => {
        bridgeState.flushAndroidGoogleTokenQueue().catch(() => {});
      }, 0);
    }
    return result;
  };

  if (!bridgeState.installed) {
    bridgeState.installed = true;
    window.addEventListener("carnival-android-google-token", () => {
      bridgeState.consumePendingAndroidGoogleToken();
      bridgeState.flushAndroidGoogleTokenQueue().catch(() => {});
    });
  }

  bridgeState.consumePendingAndroidGoogleToken();
  bridgeState.flushAndroidGoogleTokenQueue().catch(() => {});
}

ensureCarnivalAndroidAuthBridge();

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
    folderRemapById: {},
    includeYoutubeVideosFolder: false,
    youtubeLinks: [],
  };
}

function normalizeAlbumTemplateId(value) {
  const templateId = String(value || "").trim();
  return ALBUM_TEMPLATE_OPTIONS[templateId] ? templateId : "template-1";
}

function getAlbumTemplateLabel(templateId) {
  return ALBUM_TEMPLATE_OPTIONS[normalizeAlbumTemplateId(templateId)] || "Template 1";
}

function syncTemplateCardsUI() {
  const selectedTemplate = normalizeAlbumTemplateId(wizardState.template);
  wizardTemplateCards.forEach((card) => {
    const cardTemplateId = String(card.dataset.templateId || "").trim();
    const isSelected = cardTemplateId === selectedTemplate;
    card.classList.toggle("selected", isSelected);
    card.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

function selectAlbumTemplate(templateId) {
  wizardState.template = normalizeAlbumTemplateId(templateId);
  syncTemplateCardsUI();
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

function resolveStudioFaviconSource(faviconLink) {
  const fileId = extractDriveFileId(faviconLink);
  if (fileId) {
    return `/api/image?id=${encodeURIComponent(fileId)}&mode=screen`;
  }
  return String(faviconLink || "").trim();
}

function setDocumentFavicon(faviconLink) {
  const faviconSource =
    resolveStudioFaviconSource(faviconLink) ||
    window.CarnivalDefaultFavicon ||
    "/favicon.svg?v=20260423";
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((link) => {
    link.href = faviconSource;
  });
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
  const eventLogoSource = logoSource || PRODUCT_LOGO_PATH;
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
  if (studioSidebarNameCard) {
    studioSidebarNameCard.textContent = currentProfile?.studioName || "Studio";
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
  if (manageEventLogo && manageEventLogoLink) {
    manageEventLogoLink.classList.toggle("is-empty", !eventLogoSource);
    manageEventLogo.hidden = !eventLogoSource;
    manageEventLogo.src = eventLogoSource;
    manageEventLogo.alt = logoSource ? `${currentProfile?.studioName || "Studio"} logo` : "Carnival Stories";
    manageEventLogoLink.href = branding.homepageLink || "/";
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

function updateWizardAlbumUrlPreview() {
  if (!wizardAlbumUrlPreview) {
    return;
  }
  const pageName = String(wizardAlbumName?.value || wizardState.pageName || "").trim();
  const pageSlug = slugify(pageName);
  if (!pageSlug) {
    wizardAlbumUrlPreview.textContent = "";
    return;
  }

  const customDomain = normalizeCustomDomain(
    currentProfile?.branding?.customDomain || currentProfile?.customDomain || ""
  );
  if (customDomain) {
    wizardAlbumUrlPreview.textContent = `URL: https://${customDomain}/${pageSlug}`;
    return;
  }

  const studioSlug = String(currentProfile?.studioSlug || "").trim();
  wizardAlbumUrlPreview.textContent = studioSlug
    ? `URL: ${window.location.origin}/${studioSlug}/${pageSlug}`
    : `URL: ${window.location.origin}/${pageSlug}`;
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

  const pairingResponse = await fetch(`/api/pairing/resolve?code=${encodeURIComponent(code)}`);
  const pairingPayload = await pairingResponse.json().catch(() => ({}));
  if (!pairingResponse.ok) {
    throw new Error(pairingPayload?.error || "We couldn’t open that pairing code right now.");
  }

  if (pairingPayload?.mode === "event-presentation") {
    const presentUrl = String(pairingPayload?.url || "").trim();
    if (presentUrl) {
      window.location.href = presentUrl;
      return;
    }
    if (pairingPayload?.eventSlug) {
      window.location.href = `/event/${encodeURIComponent(pairingPayload.eventSlug)}/present`;
      return;
    }
  }

  const publicPageUrl = String(pairingPayload?.publicPageUrl || "").trim();
  if (publicPageUrl) {
    window.location.href = publicPageUrl;
    return;
  }

  const folderUrl = String(pairingPayload?.url || pairingPayload?.folderUrl || "").trim();
  if (folderUrl) {
    const normalizedFolderUrl = folderUrl.toLowerCase();
    const isGoogleDriveUrl =
      normalizedFolderUrl.includes("drive.google.com/") ||
      normalizedFolderUrl.includes("docs.google.com/");

    if (!isGoogleDriveUrl) {
      window.location.href = folderUrl;
      return;
    }

    if (!window.CarnivalGallery?.loadFolder) {
      throw new Error("The hosted gallery loader is unavailable right now.");
    }

    window.CarnivalGallery?.showLoading?.("Opening your Drive folder.");
    await window.CarnivalGallery.loadFolder(folderUrl, {});
    return;
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
    template: normalizeAlbumTemplateId(page.template),
    branding: page.branding || getProfileBranding(),
    folderRemapById:
      page && typeof page.folderRemapById === "object" && page.folderRemapById
        ? page.folderRemapById
        : {},
    includeYoutubeVideosFolder: Boolean(page?.includeYoutubeVideosFolder),
    youtubeLinks: Array.isArray(page?.youtubeLinks) ? page.youtubeLinks : [],
    ...extraOptions,
  };
}

function getStageBasePath() {
  const pathname = window.location.pathname || "/";
  return pathname === "/stage" || pathname.startsWith("/stage/") ? "/stage" : "";
}

function getEffectivePathname() {
  const pathname = window.location.pathname || "/";
  const stageBase = getStageBasePath();
  if (stageBase && pathname.startsWith(stageBase)) {
    const nextPath = pathname.slice(stageBase.length) || "/";
    return nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  }
  return pathname;
}

function resolveAppPath(path) {
  const raw = String(path || "").trim();
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const stageBase = getStageBasePath();
  if (!stageBase) {
    return normalized;
  }
  return normalized === "/" ? stageBase : `${stageBase}${normalized}`;
}

function getStudioRoute() {
  const effectivePath = getEffectivePathname();
  const pathSegments = effectivePath.split("/").filter(Boolean);
  if (pathSegments[0] === "event-moderate" && pathSegments[1]) {
    return { name: "event-moderate", token: decodeURIComponent(pathSegments[1]) };
  }

  if (effectivePath === "/login") {
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
    const currentPath = getEffectivePathname();
    const studioPath = targetPath || "/login";
    if (!currentPath.startsWith("/studio") && currentPath !== "/login" && !currentPath.startsWith("/event-moderate/")) {
      window.history.pushState({ studio: true }, "", resolveAppPath(studioPath));
    } else if (targetPath && currentPath !== targetPath && !currentPath.startsWith("/event-moderate/")) {
      window.history.pushState({ studio: true }, "", resolveAppPath(targetPath));
    }
  } else {
    window.history.pushState({ step: 1 }, "", resolveAppPath("/"));
  }
  window.scrollTo(0, 0);
}

function getPublicPageSlugFromPath() {
  const pathSegments = getEffectivePathname().split("/").filter(Boolean);
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

  if (activeSection === "events") {
    void loadEvents().catch((error) => {
      setStudioStatus(studioAccountStatus, error.message || "Could not load events.", true);
      savedEvents = [];
      renderSavedEventsTable();
    });
  }

  if (activeSection === "pages") {
    void loadSavedPages().catch((error) => {
      setStudioStatus(studioAccountStatus, error.message || "Could not load albums.", true);
      savedPages = [];
      renderSavedPagesTable();
    });
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
  const isAuth = view === "auth";
  const isName = view === "name";
  const isAdmin = view === "admin";
  const isDashboard = view === "dashboard";

  studioAuthPanel.classList.toggle("hidden", !isAuth);
  studioNamePanel.classList.toggle("hidden", !isName);
  studioAdminPanel?.classList.toggle("hidden", !isAdmin);
  studioDashboardPanel.classList.toggle("hidden", !isDashboard);
  stopManageEventRefreshLoop();
  stopStudioCardRefreshLoop();
  createPagePanel.classList.add("hidden");
  createEventPanel?.classList.add("hidden");
  manageEventPanel?.classList.add("hidden");
  connectDomainPanel?.classList.add("hidden");
  studioSidebarName?.classList.toggle("hidden", isAdmin || isAuth || isName);
  closeStudioSidebarDrawer();
  if (isDashboard) {
    showStudioDashboardSection("pages");
    startStudioCardRefreshLoop();
  }
}

function stopStudioCardRefreshLoop() {
  if (studioCardRefreshTimer) {
    window.clearTimeout(studioCardRefreshTimer);
    studioCardRefreshTimer = null;
  }
}

function startStudioCardRefreshLoop() {
  stopStudioCardRefreshLoop();
  if (!studioDashboardPanel || studioDashboardPanel.classList.contains("hidden")) {
    return;
  }
  studioCardRefreshTimer = window.setTimeout(async () => {
    if (!currentUser || studioCardRefreshInFlight) {
      startStudioCardRefreshLoop();
      return;
    }
    studioCardRefreshInFlight = true;
    try {
      await loadSavedPages({ includeQueueRecovery: false });
    } catch (error) {
      console.warn("Studio card auto-refresh failed:", error);
    } finally {
      studioCardRefreshInFlight = false;
      if (studioDashboardPanel && !studioDashboardPanel.classList.contains("hidden")) {
        startStudioCardRefreshLoop();
      }
    }
  }, 3000);
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
    history.pushState({}, "", resolveAppPath(eventToEdit ? `/studio?event-edit=${encodeURIComponent(eventToEdit.id)}` : "/studio/events/create"));
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
    history.pushState({}, "", resolveAppPath("/studio"));
  }
}

function closeManageEventPanel({ skipHistory = false } = {}) {
  stopManageEventRefreshLoop();
  manageEventPanel?.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  moderationAccessToken = "";
  if (!skipHistory) {
    history.pushState({}, "", resolveAppPath("/studio"));
  }
}

function openManageEventPanel(event, { skipHistory = false, token = "" } = {}) {
  currentManagedEvent = event;
  moderationAccessToken = token || "";
  stopManageEventRefreshLoop();
  studioDashboardPanel?.classList.add("hidden");
  createEventPanel?.classList.add("hidden");
  manageEventPanel?.classList.remove("hidden");
  document.body.classList.remove("studio-scroll-lock");
  if (manageEventKicker) {
    manageEventKicker.textContent = event?.name || "Manage event";
  }
  const palette = getEventCardPalette(event);
  if (manageEventCover) {
    const backgroundUrl = String(event?.backgroundUrl || "").trim();
    manageEventCover.style.backgroundImage = backgroundUrl ? `url("${backgroundUrl}")` : "";
    manageEventCover.style.backgroundSize = backgroundUrl ? "cover" : "";
    manageEventCover.style.backgroundPosition = backgroundUrl ? "center center" : "";
    manageEventCover.style.backgroundRepeat = backgroundUrl ? "no-repeat" : "";
    manageEventCover.style.backgroundColor = backgroundUrl ? "transparent" : palette.background;
  }
  if (manageEventCoverTitle) {
    manageEventCoverTitle.textContent = event?.name || "Event";
    manageEventCoverTitle.style.color = String(event?.backgroundUrl || "").trim() ? "#ffffff" : palette.text;
  }
  updateEventPhotoFilterTabLabels();
  showEventPhotoFilter("queue");
  startManageEventRefreshLoop();
  if (!skipHistory) {
    history.pushState({}, "", resolveAppPath(token ? `/event-moderate/${encodeURIComponent(token)}` : `/studio?event=${encodeURIComponent(event.id)}`));
  }
}

function stopManageEventRefreshLoop() {
  if (manageEventRefreshTimer) {
    window.clearTimeout(manageEventRefreshTimer);
    manageEventRefreshTimer = null;
  }
}

function startManageEventRefreshLoop() {
  stopManageEventRefreshLoop();

  if (!manageEventPanel || manageEventPanel.classList.contains("hidden")) {
    return;
  }

  manageEventRefreshTimer = window.setTimeout(async () => {
    try {
      await refreshManagedEvent();
    } catch (error) {
      console.warn(error);
    } finally {
      if (manageEventPanel && !manageEventPanel.classList.contains("hidden")) {
        startManageEventRefreshLoop();
      }
    }
  }, 3500);
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

function cacheStudioProfile(profile) {
  if (!currentUser?.uid || !profile) {
    return;
  }

  try {
    window.localStorage.setItem(
      `${STUDIO_PROFILE_CACHE_KEY}:${currentUser.uid}`,
      JSON.stringify({
        studioName: String(profile.studioName || "").trim(),
        studioSlug: String(profile.studioSlug || "").trim(),
        accountStatus: String(profile.accountStatus || "").trim(),
      })
    );
  } catch (error) {
    console.warn(error);
  }
}

function getCachedStudioProfile(uid) {
  if (!uid) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(`${STUDIO_PROFILE_CACHE_KEY}:${uid}`);
    if (!rawValue) {
      return null;
    }
    const parsed = JSON.parse(rawValue);
    return {
      studioName: String(parsed?.studioName || "").trim(),
      studioSlug: String(parsed?.studioSlug || "").trim(),
      accountStatus: String(parsed?.accountStatus || "").trim(),
    };
  } catch (error) {
    return null;
  }
}

async function resolveExistingStudioIdentity(user, profile) {
  const normalizedProfile = profile ? { ...profile } : {};
  if (normalizedProfile?.studioName) {
    return normalizedProfile;
  }

  const studioNameSnapshot = await getDocs(
    query(collection(db, collections.studioNames), where("uid", "==", user.uid), limit(1))
  );
  const studioNameRecord = studioNameSnapshot.docs[0]?.data?.();
  if (studioNameRecord?.studioName) {
    const recoveredProfile = {
      ...normalizedProfile,
      studioName: String(studioNameRecord.studioName || "").trim(),
      studioSlug: String(studioNameRecord.studioSlug || studioNameSnapshot.docs[0]?.id || "").trim(),
    };

    if (recoveredProfile.studioName && recoveredProfile.studioSlug) {
      try {
        await setDoc(getUserRef(user.uid), {
          studioName: recoveredProfile.studioName,
          studioSlug: recoveredProfile.studioSlug,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.warn("Studio profile recovery write skipped:", error);
      }
    }

    return recoveredProfile;
  }

  const cachedProfile = getCachedStudioProfile(user.uid);
  if (cachedProfile?.studioName) {
    return {
      ...normalizedProfile,
      ...cachedProfile,
    };
  }

  const pagesSnapshot = await getDocs(getPagesCollection(user.uid));
  const firstPage = pagesSnapshot.docs.map((pageDoc) => pageDoc.data()).find((page) => page?.studioName || page?.studioSlug);
  if (!firstPage) {
    return normalizedProfile;
  }

  const recoveredProfile = {
    ...normalizedProfile,
    studioName: String(firstPage.studioName || "").trim(),
    studioSlug: String(firstPage.studioSlug || "").trim(),
  };

  if (recoveredProfile.studioName && recoveredProfile.studioSlug) {
    try {
      await setDoc(getUserRef(user.uid), {
        studioName: recoveredProfile.studioName,
        studioSlug: recoveredProfile.studioSlug,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.warn("Studio page-based recovery write skipped:", error);
    }
  }

  return recoveredProfile;
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

  try {
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.warn("User shell write skipped:", error);
  }
}

function getSavedPagePhotoCount(page) {
  const directCount = Number(page?.albumSnapshotMediaCount || page?.photoCount || page?.mediaCount || 0);
  if (Number.isFinite(directCount) && directCount > 0) {
    return Math.floor(directCount);
  }
  const folders = Array.isArray(page?.snapshot?.folders) ? page.snapshot.folders : [];
  const folderCount = folders.reduce((sum, folder) => {
    const count = Number(folder?.photoCount || folder?.mediaCount || folder?.images?.length || 0);
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
  return Math.max(0, Math.floor(folderCount));
}

function formatDateLabel(value) {
  const time = getDateValueMs(value);
  if (!time) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(time));
}

function renderSavedPagesTable() {
  if (!savedPages.length) {
    savedPagesTable.innerHTML = '<p class="studio-empty">No albums yet.</p>';
    return;
  }

  savedPagesTable.innerHTML = "";
  savedPages.forEach((page) => {
    const faceDetection = normalizeFaceDetectionState(page?.faceDetection);
    const canUseFacePicker = faceDetection.status === "completed";
    const isFaceDetectionRunning = faceDetection.status === "queued" || faceDetection.status === "processing";
    const faceStatusBadge = getFaceStatusBadge(faceDetection);
    const card = document.createElement("article");
    card.className = "saved-page-card";
    const pageUrl = getPageUrl(page);
    const thumbnail = page.coverThumbnailUrl || page.coverImageUrl || "";
    const photoCount = getSavedPagePhotoCount(page);
    const createdLabel = formatDateLabel(page.createdAt);
    card.innerHTML = `
      <a class="saved-page-thumb" href="${escapeMarkup(pageUrl)}" target="_blank" rel="noreferrer noopener" aria-label="Open ${escapeMarkup(page.pageName || "page")} in a new tab">
        ${photoCount ? `<span class="saved-page-count-badge">${photoCount} photo${photoCount === 1 ? "" : "s"}</span>` : ""}
        ${faceStatusBadge ? `
          <span class="saved-page-face-status-badge" title="${escapeMarkup(faceStatusBadge.tooltip)}">
            ${faceStatusBadge.iconClass ? `<span class="saved-page-icon icon-mask ${escapeMarkup(faceStatusBadge.iconClass)}" aria-hidden="true"></span>` : ""}
            <span>${escapeMarkup(faceStatusBadge.label)}</span>
          </span>
        ` : ""}
        ${thumbnail ? `<img src="${escapeMarkup(thumbnail)}" alt="" loading="lazy" />` : ""}
      </a>
      <div class="saved-page-content">
        <h2>${escapeMarkup(page.tagline || page.pageName || "Untitled page")}</h2>
        <p class="saved-page-pairing">${escapeMarkup(createdLabel || page.pairingCode || "")}</p>
        ${createdLabel && page.pairingCode ? `<p class="saved-page-code">Code ${escapeMarkup(page.pairingCode)}</p>` : ""}
        <div class="saved-page-actions" aria-label="Page actions">
          <button type="button" class="saved-page-icon-button saved-page-open-button" data-action="open" aria-label="Open album">
            <span>Open</span>
          </button>
          <button
            type="button"
            class="saved-page-icon-button ${isFaceDetectionRunning ? "is-disabled" : ""}"
            data-action="face-detection"
            aria-label="Face detection"
            ${isFaceDetectionRunning ? "disabled" : ""}
            title="${canUseFacePicker ? "Open face picker" : (isFaceDetectionRunning ? "Face detection in progress" : "Start face detection")}"
          >
            <span class="saved-page-icon icon-mask icon-face-detection" aria-hidden="true"></span>
          </button>
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
    card.querySelector('[data-action="open"]')?.addEventListener("click", () => {
      window.open(pageUrl, "_blank", "noopener,noreferrer");
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
    card.querySelector('[data-action="face-detection"]')?.addEventListener("click", async () => {
      if (canUseFacePicker) {
        await openStudioFaceMergePopup(page);
        return;
      }
      try {
        await enqueueFaceDetection(page, { manual: true });
        showStudioToast("Face detection queued for this album.");
        await loadSavedPages();
      } catch (error) {
        showStudioToast(error?.message || "Could not queue face detection.");
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

function normalizeFaceDetectionState(faceDetection = null) {
  const rawStatus = String(faceDetection?.status || "").trim().toLowerCase();
  const status = ["queued", "processing", "completed", "failed"].includes(rawStatus) ? rawStatus : "idle";
  return {
    status,
    requestedAt: faceDetection?.requestedAt || null,
    completedAt: faceDetection?.completedAt || null,
    updatedAt: faceDetection?.updatedAt || null,
    source: String(faceDetection?.source || "").trim(),
    error: String(faceDetection?.error || faceDetection?.runtimeError || "").trim(),
    faceGroupCount: Math.max(0, Number(faceDetection?.faceGroupCount) || 0),
    detectedPhotoCount: Math.max(0, Number(faceDetection?.detectedPhotoCount) || 0),
    scannedPhotoCount: Math.max(0, Number(faceDetection?.scannedPhotoCount) || 0),
    progressPercent: Math.max(0, Math.min(100, Number(faceDetection?.progressPercent) || 0)),
    processedPhotoCount: Math.max(0, Number(faceDetection?.processedPhotoCount) || 0),
    totalPhotoCount: Math.max(0, Number(faceDetection?.totalPhotoCount) || 0),
    queuePosition: Math.max(0, Number(faceDetection?.queuePosition) || 0),
  };
}

function formatFaceStatusTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFaceStatusBadge(faceDetection) {
  const status = String(faceDetection?.status || "idle").trim();
  if (status === "idle") {
    return null;
  }

  if (status === "queued") {
    const queuedAt = formatFaceStatusTime(faceDetection?.requestedAt);
    const queuePosition = Math.max(0, Number(faceDetection?.queuePosition) || 0);
    return {
      label: queuePosition > 0 ? `Queued at ${queuePosition}` : "Queued",
      tooltip: queuedAt ? `Queued at ${queuedAt}. Processing will begin shortly.` : "Queued. Processing will begin shortly.",
    };
  }

  if (status === "processing") {
    const progressPercent = Math.max(0, Math.min(100, Number(faceDetection?.progressPercent) || 0));
    const processedPhotoCount = Math.max(0, Number(faceDetection?.processedPhotoCount) || 0);
    const totalPhotoCount = Math.max(0, Number(faceDetection?.totalPhotoCount) || 0);
    const updatedAt = formatFaceStatusTime(faceDetection?.updatedAt);
    return {
      label: `Processing ${progressPercent}%`,
      tooltip: `${totalPhotoCount > 0 ? `${processedPhotoCount}/${totalPhotoCount} photos processed.` : "Processing photos..."}${updatedAt ? ` Last update: ${updatedAt}.` : ""}`,
    };
  }

  if (status === "completed") {
    const groups = Math.max(0, Number(faceDetection?.faceGroupCount) || 0);
    const photos = Math.max(0, Number(faceDetection?.detectedPhotoCount) || 0);
    const scanned = Math.max(0, Number(faceDetection?.scannedPhotoCount) || 0);
    const completedAt = formatFaceStatusTime(faceDetection?.completedAt || faceDetection?.updatedAt);
    if (groups > 0) {
      return {
        label: "Faces ready",
        iconClass: "icon-face-detection",
        tooltip: `Completed${completedAt ? ` at ${completedAt}` : ""}. ${groups} face group${groups === 1 ? "" : "s"} detected across ${photos} photo${photos === 1 ? "" : "s"}.`,
      };
    }
    return {
      label: "No faces",
      tooltip: `Completed${completedAt ? ` at ${completedAt}` : ""}. No detectable faces found${scanned > 0 ? ` in ${scanned} scanned photo${scanned === 1 ? "" : "s"}` : ""}.`,
    };
  }

  const errorMessage = String(faceDetection?.error || "").trim();
  return {
    label: "Face failed",
    tooltip: errorMessage || "Face detection failed. Retry from the face icon.",
  };
}

async function enqueueFaceDetection(page, { manual = false } = {}) {
  if (!page?.id || !currentUser?.uid) {
    throw new Error("Album details are missing.");
  }
  const currentStatus = normalizeFaceDetectionState(page?.faceDetection).status;
  if (currentStatus === "queued" || currentStatus === "processing") {
    throw new Error("Face detection is already in progress for this album.");
  }
  if (currentStatus === "completed" && !manual) {
    return;
  }

  const headers = await getAuthHeaders();
  const response = await fetch("/api/face-detection/enqueue", {
    method: "POST",
    headers,
    body: JSON.stringify({
      pageId: page.id,
      source: manual ? "manual" : "auto",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not queue face detection.");
  }
}

function closeFaceMergePopup() {
  const popup = document.getElementById("studio-face-merge-popup");
  if (popup) {
    popup.remove();
  }
}

function buildFaceMergePopup() {
  const popup = document.createElement("div");
  popup.id = "studio-face-merge-popup";
  popup.className = "face-picker-popup-backdrop";
  popup.innerHTML = `
    <div class="face-picker-popup" role="dialog" aria-modal="true" aria-label="Merge detected faces">
      <div class="face-picker-header">
        <h3>Merge Faces</h3>
        <button type="button" class="face-picker-close" aria-label="Close">Close</button>
      </div>
      <p class="face-picker-subtitle">Select two or more face groups to merge (deduplicate).</p>
      <div class="face-picker-status">Loading faces…</div>
      <div class="face-picker-grid hidden"></div>
      <div class="face-picker-footer">
        <button type="button" class="face-picker-clear" data-action="redo">Redo Face Detection</button>
        <button type="button" class="face-picker-clear" data-action="merge" disabled>Merge Selected</button>
      </div>
    </div>
  `;
  popup.querySelector(".face-picker-close")?.addEventListener("click", closeFaceMergePopup);
  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closeFaceMergePopup();
    }
  });
  return popup;
}

async function fetchStudioFaceGroups(publicPageId) {
  const response = await fetch(`/api/public-page/faces?publicPageId=${encodeURIComponent(publicPageId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not load detected faces.");
  }
  return payload;
}

async function mergeStudioFaceGroups(page, selectedFaceIds = []) {
  const uniqueFaceIds = Array.from(new Set((selectedFaceIds || []).map((id) => String(id || "").trim()).filter(Boolean)));
  if (uniqueFaceIds.length < 2) {
    throw new Error("Select at least two face groups to merge.");
  }
  const publicPageIds = [
    getPrimaryPublicPageId(page),
    getCustomDomainPublicPageId(getPageCustomDomain(page), page.pageSlug),
  ].filter(Boolean);
  const response = await fetch("/api/public-page/merge-faces", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify({
      pageId: String(page?.id || "").trim(),
      publicPageIds,
      faceIds: uniqueFaceIds,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not merge selected faces.");
  }
  return payload;
}

async function openStudioFaceMergePopup(page) {
  const primaryPublicPageId = getPrimaryPublicPageId(page);
  if (!primaryPublicPageId) {
    showStudioToast("This album does not have a public page reference.");
    return;
  }
  closeFaceMergePopup();
  const popup = buildFaceMergePopup();
  document.body.appendChild(popup);

  const statusEl = popup.querySelector(".face-picker-status");
  const gridEl = popup.querySelector(".face-picker-grid");
  const mergeButton = popup.querySelector('[data-action="merge"]');
  const redoButton = popup.querySelector('[data-action="redo"]');
  const selected = new Set();
  const updateMergeState = () => {
    if (mergeButton) {
      mergeButton.disabled = selected.size < 2;
    }
  };

  try {
    const payload = await fetchStudioFaceGroups(primaryPublicPageId);
    const status = String(payload?.status || "").trim().toLowerCase();
    const groups = Array.isArray(payload?.groups) ? payload.groups : [];
    const sortedGroups = groups
      .slice()
      .sort((left, right) => {
        const leftCount = Math.max(0, Number(left?.photoCount || left?.count) || 0);
        const rightCount = Math.max(0, Number(right?.photoCount || right?.count) || 0);
        if (rightCount !== leftCount) {
          return rightCount - leftCount;
        }
        return String(left?.id || "").localeCompare(String(right?.id || ""));
      });
    if (status !== "completed" || !sortedGroups.length) {
      statusEl.textContent = "No detected faces available yet for this album.";
      updateMergeState();
      return;
    }

    statusEl.classList.add("hidden");
    gridEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    sortedGroups.forEach((group) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "face-picker-item face-picker-item-multi";
      item.dataset.faceId = String(group.id || "").trim();
      item.innerHTML = `
        <img src="${escapeMarkup(String(group.previewDataUrl || "").trim())}" alt="" />
        <span>${Math.max(0, Number(group.photoCount || group.count) || 0)} photos</span>
      `;
      item.addEventListener("click", () => {
        const faceId = String(item.dataset.faceId || "").trim();
        if (!faceId) {
          return;
        }
        if (selected.has(faceId)) {
          selected.delete(faceId);
          item.classList.remove("is-selected");
        } else {
          selected.add(faceId);
          item.classList.add("is-selected");
        }
        updateMergeState();
      });
      gridEl.appendChild(item);
    });

    mergeButton?.addEventListener("click", async () => {
      if (selected.size < 2) {
        return;
      }
      try {
        mergeButton.disabled = true;
        statusEl.classList.remove("hidden");
        statusEl.textContent = "Merging selected face groups…";
        await mergeStudioFaceGroups(page, Array.from(selected));
        statusEl.textContent = "Faces merged successfully.";
        await loadSavedPages();
        closeFaceMergePopup();
        showStudioToast("Face groups merged.");
      } catch (error) {
        statusEl.classList.remove("hidden");
        statusEl.textContent = error?.message || "Could not merge face groups.";
        mergeButton.disabled = false;
      }
    });

    redoButton?.addEventListener("click", async () => {
      try {
        if (redoButton) {
          redoButton.disabled = true;
        }
        if (mergeButton) {
          mergeButton.disabled = true;
        }
        statusEl.classList.remove("hidden");
        statusEl.textContent = "Re-queuing face detection…";
        await enqueueFaceDetection(page, { manual: true });
        await loadSavedPages();
        closeFaceMergePopup();
        showStudioToast("Face detection queued again.");
      } catch (error) {
        statusEl.classList.remove("hidden");
        statusEl.textContent = error?.message || "Could not queue face detection.";
        if (redoButton) {
          redoButton.disabled = false;
        }
        updateMergeState();
      }
    });
    updateMergeState();
  } catch (error) {
    statusEl.textContent = error?.message || "Could not load detected faces.";
    updateMergeState();
  }
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

function getEventCardPalette(event) {
  const seed = String(event?.id || event?.slug || event?.name || "event");
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  const saturation = 48 + (hash % 18);
  const lightness = 36 + (hash % 24);
  const background = `hsl(${hue}deg ${saturation}% ${lightness}%)`;
  const useDarkText = lightness > 58;

  return {
    background,
    text: useDarkText ? "#000000" : "#FFFFFF",
  };
}

function getEventManageUrl(event) {
  return `${window.location.origin}/studio?event=${encodeURIComponent(event.id)}`;
}

function getEventPresentUrl(event) {
  const explicitDisplayUrl = String(event?.displayUrl || "").trim();
  if (explicitDisplayUrl) {
    return explicitDisplayUrl;
  }
  return `${window.location.origin}/event/${encodeURIComponent(event.slug || "")}/present`;
}

function getEventUploadUrl(event) {
  const explicitUploadUrl = String(event?.uploadUrl || "").trim();
  if (explicitUploadUrl) {
    return explicitUploadUrl;
  }
  return `${window.location.origin}/e/${encodeURIComponent(event.slug || "")}`;
}

function buildEventShareMessage(event) {
  const shareMessage = String(currentProfile?.branding?.shareMessage || "").trim();
  const tagline = String(currentProfile?.branding?.tagline || currentProfile?.studioName || "CarnivalStories").trim();
  const cameraUrl = getEventUploadUrl(event);
  const pairingCode = String(event?.code || "").trim();
  const lines = [];

  if (shareMessage) {
    lines.push(shareMessage, "");
  }

  lines.push(`Here's the link to the event upload from ${tagline} - ${cameraUrl}`);
  lines.push("");
  lines.push(`The pairing code for the event is : ${pairingCode}`);
  lines.push(`You can use it on CarnivalStories app on phone, TV, or goto ${PRODUCT_HOME_URL} 😄`);
  return lines.join("\n").trim();
}

async function shareEventCard(event) {
  const qrDataUrl = await ensureEventQrPngDataUrl(event);
  const shareText = buildEventShareMessage(event);
  const fileName = buildEventQrFilename(event);
  const shareUrl = getEventUploadUrl(event);

  try {
    if (navigator.share && navigator.canShare) {
      const qrBlob = await fetch(qrDataUrl).then((response) => response.blob());
      const qrFile = new File([qrBlob], fileName, { type: "image/png" });
      const sharePayload = {
        title: event?.name || "CarnivalStories event",
        text: shareText,
        url: shareUrl,
        files: [qrFile],
      };

      if (navigator.canShare({ files: [qrFile] })) {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.share({
        title: event?.name || "CarnivalStories event",
        text: shareText,
        url: shareUrl,
      });
      return;
    }

    await copyTextToClipboard(shareText);
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    showStudioToast("Event share message copied and QR downloaded");
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    throw error;
  }
}

function buildEventQrFilename(event) {
  return `${(event?.name || "event").replace(/\s+/g, "-").toLowerCase()}-qr.png`;
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read QR code."));
    reader.readAsDataURL(blob);
  });
}

async function generateEventQrDataUrl(event) {
  const qrTarget = String(event?.uploadUrl || "").trim() || getEventUploadUrl(event);
  if (!qrTarget) {
    throw new Error("QR code generator is unavailable.");
  }
  const response = await fetch(`/api/qr?text=${encodeURIComponent(qrTarget)}`);
  if (!response.ok) {
    throw new Error("QR code generator is unavailable.");
  }
  const qrBlob = await response.blob();
  return blobToDataUrl(qrBlob);
}

async function rasterizeQrDataUrlToPng(dataUrl) {
  if (!dataUrl) {
    throw new Error("QR code generator is unavailable.");
  }
  if (dataUrl.startsWith("data:image/png")) {
    return dataUrl;
  }

  const image = new Image();
  image.decoding = "async";
  const loadPromise = new Promise((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not render QR code."));
  });
  image.src = dataUrl;
  await loadPromise;

  const size = Math.max(image.naturalWidth || image.width || 0, image.naturalHeight || image.height || 0, 512);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("QR code generator is unavailable.");
  }
  context.clearRect(0, 0, size, size);
  context.drawImage(image, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

async function ensureEventQrPngDataUrl(event) {
  const existingDataUrl = String(event?.qrPngDataUrl || "").trim();
  if (existingDataUrl.startsWith("data:image/png")) {
    return existingDataUrl;
  }

  const pngDataUrl = existingDataUrl
    ? await rasterizeQrDataUrlToPng(existingDataUrl)
    : await generateEventQrDataUrl(event);
  if (event && typeof event === "object") {
    event.qrPngDataUrl = pngDataUrl;
  }
  return pngDataUrl;
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
    const palette = getEventCardPalette(event);
    const eventBackgroundUrl = String(event?.backgroundUrl || "").trim();
    card.innerHTML = `
      <div class="saved-page-thumb saved-event-thumb" style="--event-card-bg:${escapeMarkup(palette.background)};--event-card-text:${escapeMarkup(palette.text)};">
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
          <button type="button" class="saved-page-icon-button saved-page-share-button" data-action="share" aria-label="Share event">
            <span class="saved-page-icon icon-mask icon-share" aria-hidden="true"></span>
          </button>
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
    card.querySelector('[data-action="share"]')?.addEventListener("click", async () => {
      try {
        await shareEventCard(event);
      } catch (error) {
        showStudioToast(error.message || "Could not share event");
      }
    });
    card.querySelector('[data-action="manage"]')?.addEventListener("click", () => {
      window.open(event.moderationUrl || getEventManageUrl(event), "_blank", "noopener,noreferrer");
    });
    card.querySelector('[data-action="edit"]')?.addEventListener("click", () => {
      openCreateEventPanel({ eventToEdit: event });
    });
    card.querySelector('[data-action="camera"]')?.addEventListener("click", () => {
      if (event.phase !== "live") {
        showStudioToast("Upload view is available only while the event is live.");
        return;
      }
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
    const eventThumb = card.querySelector(".saved-event-thumb");
    if (eventThumb) {
      eventThumb.style.setProperty("--event-card-image", eventBackgroundUrl ? `url("${eventBackgroundUrl}")` : "none");
    }
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
    const approveAction = activeEventPhotoFilter === "queue" ? "approve" : "approve-live";
    const rejectAction = activeEventPhotoFilter === "queue" ? "reject" : "remove-live";
    card.innerHTML = `
      <img src="${escapeMarkup(getEventPhotoPreviewUrl(photo))}" alt="${escapeMarkup(photo.name || "Event photo")}" loading="lazy" />
      <div class="event-photo-review-overlay">
        <div class="event-photo-review-actions">
          <button type="button" class="event-photo-review-button approve" data-action="${approveAction}" aria-label="Approve photo">
            <span class="saved-page-icon icon-mask icon-tick" aria-hidden="true"></span>
          </button>
          <button type="button" class="event-photo-review-button reject" data-action="${rejectAction}" aria-label="Reject photo">
            <span class="saved-page-icon icon-mask icon-cross" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    `;
    card.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        await moderateEventPhoto(photo.id, button.dataset.action || "");
      });
    });
    card.querySelector("img")?.addEventListener("click", () => {
      const slideshowIndex = photos.findIndex((entry) => entry.id === photo.id);
      openEventPhotosSlideshow(photos, slideshowIndex >= 0 ? slideshowIndex : 0);
    });
    manageEventPhotoGrid.appendChild(card);
  });
  applyEventGridColumnSizing();
}

function updateEventPhotoFilterTabLabels() {
  const queueCount = Array.isArray(currentManagedEvent?.queuedPhotos) ? currentManagedEvent.queuedPhotos.length : 0;
  eventPhotoFilterTabs.forEach((tab) => {
    const filter = tab.dataset.eventPhotoFilter || "live";
    if (filter === "queue") {
      tab.textContent = `Queue(${queueCount})`;
      return;
    }
    if (filter === "live") {
      tab.textContent = "Live";
    }
  });
}

function showEventPhotoFilter(filter) {
  activeEventPhotoFilter = filter === "queue" ? "queue" : "live";
  updateEventPhotoFilterTabLabels();
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

async function getAuthHeaders() {
  return getAdminAuthHeaders();
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
  const isEventsView = activeAdminFilter === "events";
  adminSaveAccountsButton?.classList.toggle("hidden", isLinksView || isEventsView);
  adminAccountsList?.classList.toggle("links-mode", isLinksView || isEventsView);
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

function formatEventWindow(startAt, endAt) {
  const start = Date.parse(String(startAt || ""));
  const end = Date.parse(String(endAt || ""));
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "—";
  }
  const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
}

function computeEventDurationLabel(startAt, endAt) {
  const start = Date.parse(String(startAt || ""));
  const end = Date.parse(String(endAt || ""));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return "—";
  }
  const totalMinutes = Math.round((end - start) / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || !parts.length) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function getEventAdminPhaseRank(phase) {
  const normalized = String(phase || "").trim().toLowerCase();
  if (normalized === "live") return 0;
  if (normalized === "upcoming") return 1;
  return 2;
}

function getEventAdminPhaseLabel(phase) {
  const normalized = String(phase || "").trim().toLowerCase();
  if (normalized === "live") return "Live";
  if (normalized === "upcoming") return "Upcoming";
  return "Closed";
}

async function deleteAdminEvent(event) {
  if (!event?.id) {
    throw new Error("Missing event id.");
  }
  const confirmed = window.confirm(`Delete ${event.name || "this event"}?`);
  if (!confirmed) {
    return;
  }

  try {
    setStudioStatus(adminAccountsStatus, "Deleting event...");
    const response = await fetch("/api/admin/events/delete", {
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
    allAdminEvents = allAdminEvents.filter((item) => item.id !== event.id);
    renderAdminEvents();
    setStudioStatus(adminAccountsStatus, "Event deleted.");
  } catch (error) {
    setStudioStatus(adminAccountsStatus, error.message || "Could not delete event.", true);
  }
}

function renderAdminEvents() {
  if (!adminAccountsList) {
    return;
  }

  updateAdminPanelMode();
  if (!allAdminEvents.length) {
    adminAccountsList.innerHTML = '<p class="studio-empty">No events here.</p>';
    return;
  }

  adminAccountsList.innerHTML = `
    <div class="admin-link-row admin-account-head">
      <span>Event name</span>
      <span>Photos uploaded</span>
      <span>Duration</span>
      <span>Status</span>
      <span>Event window</span>
      <span>Delete</span>
    </div>
  `;

  allAdminEvents.forEach((event) => {
    const row = document.createElement("div");
    row.className = "admin-link-row";
    row.innerHTML = `
      <span>${escapeMarkup(event.name || "Untitled event")}</span>
      <span>${Math.max(0, Number(event.uploadedPhotoCount) || 0)}</span>
      <span>${escapeMarkup(computeEventDurationLabel(event.startAt, event.endAt))}</span>
      <span>${escapeMarkup(getEventAdminPhaseLabel(event.phase))}</span>
      <span>${escapeMarkup(formatEventWindow(event.startAt, event.endAt))}</span>
      <span>
        <button type="button" class="saved-page-icon-button danger admin-event-delete" aria-label="Delete ${escapeMarkup(event.name || "event")}">
          <span class="saved-page-icon icon-mask icon-delete" aria-hidden="true"></span>
        </button>
      </span>
    `;
    row.querySelector(".admin-event-delete")?.addEventListener("click", async () => {
      await deleteAdminEvent(event);
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
  if (render && activeAdminFilter !== "links" && activeAdminFilter !== "events") {
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

async function loadAdminEvents({ force = false } = {}) {
  if (!force && allAdminEvents.length) {
    renderAdminEvents();
    return;
  }

  setStudioStatus(adminAccountsStatus, "Loading events...");
  const response = await fetch("/api/admin/events", { headers: await getAdminAuthHeaders() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not load events.");
  }

  allAdminEvents = (Array.isArray(payload.events) ? payload.events : [])
    .slice()
    .sort((left, right) => {
      const phaseRank = getEventAdminPhaseRank(left.phase) - getEventAdminPhaseRank(right.phase);
      if (phaseRank !== 0) {
        return phaseRank;
      }
      return getDateValueMs(right.createdAt) - getDateValueMs(left.createdAt);
    });

  renderAdminEvents();
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
  if ((!createPageButton && !createEventButton && !createPageButtonHead && !createEventButtonHead) || !linkApprovalNotice) {
    return;
  }

  const status = getAccountStatus(currentProfile);
  [createPageButton, createEventButton, createPageButtonHead, createEventButtonHead].forEach((button) => {
    if (button) {
      button.disabled = status !== "active";
    }
  });
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

async function loadSavedPages({ includeQueueRecovery = true } = {}) {
  let snapshot = null;
  try {
    const pagesQuery = query(getPagesCollection(), orderBy("createdAt", "desc"));
    snapshot = await getDocs(pagesQuery);
  } catch (error) {
    console.warn("Primary pages query failed, using fallback:", error);
    snapshot = await getDocs(getPagesCollection());
  }
  savedPages = snapshot.docs
    .map((pageDoc) => ({ id: pageDoc.id, ...pageDoc.data() }))
    .sort((left, right) => getDateValueMs(right.createdAt) - getDateValueMs(left.createdAt));
  try {
    await attachFaceQueuePositions();
  } catch (error) {
    console.warn("Face status attach skipped:", error);
  }
  renderSavedPagesTable();
}

async function attachFaceQueuePositions() {
  if (!savedPages.length) {
    return;
  }
  const headers = await getAuthHeaders();
  const pageIds = savedPages.map((page) => page.id).filter(Boolean);
  const response = await fetch(`/api/face-detection/statuses?pageIds=${encodeURIComponent(pageIds.join(","))}`, {
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not fetch face detection status.");
  }
  const statuses = payload?.statuses && typeof payload.statuses === "object" ? payload.statuses : {};
  savedPages = savedPages.map((page) => {
    const status = statuses[page.id];
    if (!status || typeof status !== "object") {
      return page;
    }
    return {
      ...page,
      faceDetection: {
        status: String(status.status || "idle"),
        source: String(status.source || ""),
        requestedAt: status.requestedAt || null,
        completedAt: status.completedAt || null,
        updatedAt: status.updatedAt || null,
        runtimeError: status.runtimeError || "",
        error: status.error || "",
        faceGroupCount: Number(status.faceGroupCount) || 0,
        detectedPhotoCount: Number(status.detectedPhotoCount) || 0,
        scannedPhotoCount: Number(status.scannedPhotoCount) || 0,
        progressPercent: Number(status.progressPercent) || 0,
        processedPhotoCount: Number(status.processedPhotoCount) || 0,
        totalPhotoCount: Number(status.totalPhotoCount) || 0,
        queuePosition: Number(status.queuePosition) || 0,
      },
    };
  });
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
  const refreshedPalette = getEventCardPalette(currentManagedEvent || {});
  if (manageEventCover) {
    const refreshedBackgroundUrl = String(currentManagedEvent?.backgroundUrl || "").trim();
    manageEventCover.style.backgroundImage = refreshedBackgroundUrl ? `url("${refreshedBackgroundUrl}")` : "";
    manageEventCover.style.backgroundSize = refreshedBackgroundUrl ? "cover" : "";
    manageEventCover.style.backgroundPosition = refreshedBackgroundUrl ? "center center" : "";
    manageEventCover.style.backgroundRepeat = refreshedBackgroundUrl ? "no-repeat" : "";
    manageEventCover.style.backgroundColor = refreshedBackgroundUrl ? "transparent" : refreshedPalette.background;
  }
  if (manageEventCoverTitle) {
    manageEventCoverTitle.style.color = String(currentManagedEvent?.backgroundUrl || "").trim()
      ? "#ffffff"
      : refreshedPalette.text;
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
  const createdEvent = body.event;
  if (createdEvent?.id && !createdEvent.qrPngDataUrl) {
    const qrPngDataUrl = await ensureEventQrPngDataUrl(createdEvent);
    return updateEvent({
      id: createdEvent.id,
      name: createdEvent.name || "",
      tagline: createdEvent.tagline || "",
      startDate: createdEvent.startAt ? String(createdEvent.startAt).slice(0, 10) : "",
      startTime: createdEvent.startAt ? new Date(createdEvent.startAt).toISOString().slice(11, 16) : "",
      endDate: createdEvent.endAt ? String(createdEvent.endAt).slice(0, 10) : "",
      endTime: createdEvent.endAt ? new Date(createdEvent.endAt).toISOString().slice(11, 16) : "",
      template: createdEvent.template || "template-1",
      logoLink: createdEvent.logoLink || "",
      faviconLink: createdEvent.faviconLink || "",
      homepageLink: createdEvent.homepageLink || "",
      customDomain: createdEvent.customDomain || "",
      qrPngDataUrl,
    });
  }
  return createdEvent;
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

async function uploadEventBackground(eventId, file) {
  const form = new FormData();
  form.append("eventId", eventId);
  form.append("background", file);
  const response = await fetch("/api/events/background", {
    method: "POST",
    headers: await getAdminAuthHeaders(),
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Could not upload event background.");
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
  let hydratedEvent = event;
  if (event?.id && !event.qrPngDataUrl) {
    const qrPngDataUrl = await ensureEventQrPngDataUrl(event);
    hydratedEvent = await updateEvent({
      id: event.id,
      name: event.name || "",
      tagline: event.tagline || "",
      startDate: event.startAt ? String(event.startAt).slice(0, 10) : "",
      startTime: event.startAt ? new Date(event.startAt).toISOString().slice(11, 16) : "",
      endDate: event.endAt ? String(event.endAt).slice(0, 10) : "",
      endTime: event.endAt ? new Date(event.endAt).toISOString().slice(11, 16) : "",
      template: event.template || "template-1",
      logoLink: event.logoLink || "",
      faviconLink: event.faviconLink || "",
      homepageLink: event.homepageLink || "",
      qrPngDataUrl,
    });
  }
  const href = await ensureEventQrPngDataUrl(hydratedEvent);

  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = buildEventQrFilename(hydratedEvent);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function resetEventUploadPreview() {
  if (currentEventUploadPreviewUrl) {
    URL.revokeObjectURL(currentEventUploadPreviewUrl);
    currentEventUploadPreviewUrl = "";
  }

  currentEventUploadQueue.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    if (item.loaderAnimation?.destroy) {
      item.loaderAnimation.destroy();
    }
  });
  currentEventUploadQueue = [];

  eventUploadForm?.classList.remove("is-uploading", "has-preview");
  eventUploadQueue?.classList.add("hidden");
  if (eventUploadQueue) {
    eventUploadQueue.classList.remove("is-single");
    eventUploadQueue.style.removeProperty("--upload-grid-cols");
    eventUploadQueue.innerHTML = "";
  }
  if (eventUploadPreview) {
    eventUploadPreview.classList.add("hidden");
    eventUploadPreview.removeAttribute("src");
    eventUploadPreview.alt = "";
  }
}

function updateEventUploadQueueLayout() {
  if (!eventUploadQueue) {
    return;
  }
  const count = currentEventUploadQueue.length;
  if (!count) {
    eventUploadQueue.classList.add("hidden");
    eventUploadQueue.classList.remove("is-single");
    eventUploadQueue.style.removeProperty("--upload-grid-cols");
    return;
  }
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  eventUploadQueue.classList.remove("hidden");
  eventUploadQueue.classList.toggle("is-single", count === 1);
  eventUploadQueue.style.setProperty("--upload-grid-cols", String(columns));
}

function createEventUploadQueueItem(file) {
  if (!eventUploadQueue) {
    return null;
  }

  const card = document.createElement("div");
  card.className = "event-upload-queue-item is-uploading";
  card.innerHTML = `
    <img class="event-upload-queue-image" alt="${escapeMarkup(file.name || "Uploading photo")}" />
    <div class="event-upload-queue-loader" aria-hidden="true"></div>
    <div class="event-upload-queue-success hidden" aria-hidden="true">
      <span class="icon-mask icon-tick"></span>
    </div>
  `;

  const imageEl = card.querySelector(".event-upload-queue-image");
  const loaderEl = card.querySelector(".event-upload-queue-loader");
  const successEl = card.querySelector(".event-upload-queue-success");
  const previewUrl = URL.createObjectURL(file);
  imageEl.src = previewUrl;
  eventUploadQueue.appendChild(card);
  eventUploadQueue.classList.remove("hidden");

  let loaderAnimation = null;
  if (window.lottie && loaderEl) {
    loaderAnimation = window.lottie.loadAnimation({
      container: loaderEl,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "/assets/boot-loader.json?v=20260428a",
    });
  }

  const item = {
    file,
    card,
    previewUrl,
    loaderAnimation,
    markDone() {
      loaderAnimation?.destroy?.();
      if (loaderEl) {
        loaderEl.innerHTML = "";
      }
      card.classList.remove("is-uploading");
      card.classList.add("is-uploaded", "is-removing");
      successEl?.classList.remove("hidden");
      window.setTimeout(() => {
        card.remove();
        currentEventUploadQueue = currentEventUploadQueue.filter((queuedItem) => queuedItem !== item);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        updateEventUploadQueueLayout();
      }, 180);
    },
    markFailed() {
      card.classList.remove("is-uploading");
      card.classList.add("is-failed");
      loaderAnimation?.destroy?.();
      if (loaderEl) {
        loaderEl.innerHTML = "";
      }
    },
  };
  currentEventUploadQueue.push(item);
  updateEventUploadQueueLayout();
  return item;
}

async function uploadSingleEventPhoto(slug, item) {
  const formData = new FormData();
  formData.append("slug", slug);
  formData.append("photo", item.file);
  const response = await fetch("/api/events/upload", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Could not upload ${item.file.name || "photo"}.`);
  }
}

async function uploadEventPhotos(files) {
  const slug = String(eventUploadForm?.dataset.slug || "").trim();
  if (!slug) {
    throw new Error("This event is not ready yet.");
  }
  if (!files.length) {
    throw new Error("Please choose at least one photo.");
  }
  if (eventUploadInput?.disabled) {
    throw new Error("Photo uploads open only when the event is live.");
  }

  resetEventUploadPreview();
  eventUploadForm?.classList.add("has-preview", "is-uploading");
  const items = files.map((file) => createEventUploadQueueItem(file)).filter(Boolean);

  const results = await Promise.allSettled(
    items.map(async (item) => {
      await uploadSingleEventPhoto(slug, item);
      item.markDone();
    })
  );

  const failedCount = results.filter((result) => result.status === "rejected").length;
  const successCount = results.length - failedCount;
  eventUploadForm?.classList.remove("is-uploading");
  eventUploadForm?.reset();

  if (failedCount > 0 && successCount === 0) {
    setStudioStatus(eventUploadStatus, "Could not upload selected photos. Please try again.", true);
    items.forEach((item) => item.markFailed());
    return;
  }

  if (failedCount > 0) {
    setStudioStatus(
      eventUploadStatus,
      `${successCount} photo(s) uploaded. ${failedCount} failed, please retry.`,
      true
    );
    items.forEach((item, index) => {
      if (results[index].status === "rejected") {
        item.markFailed();
      }
    });
  } else {
    setStudioStatus(eventUploadStatus, "Your uploaded photo has been pushed to queue, will become live soon!");
  }

  await loadPublicEvent(slug);
}

function getEventPhotoLikeCount(photo) {
  return Math.max(0, Number(photo?.likeCount) || 0);
}

function getEventPhotoPreviewUrl(photo) {
  return String(photo?.thumbnailUrl || photo?.slideshowUrl || photo?.fullUrl || "").trim();
}

function getEventPhotoPresentationUrl(photo) {
  return String(photo?.slideshowUrl || photo?.thumbnailUrl || photo?.fullUrl || "").trim();
}

function renderEventPhotoLikeBadge(photo) {
  const count = getEventPhotoLikeCount(photo);
  const likedInSession = likedEventPhotoSessionIds.has(String(photo?.id || "").trim());
  return `
    <button type="button" class="photo-like-badge event-public-like-badge" data-event-photo-id="${escapeMarkup(photo.id || "")}" aria-label="${likedInSession ? "Unlike photo" : "Like photo"}">
      <span class="photo-like-badge-icon icon-mask ${likedInSession ? "icon-heart-selected" : count > 0 ? "icon-heart-selected" : "icon-heart-empty"}"></span>
      ${count > 0 ? `<span class="photo-like-badge-count">${count}</span>` : ""}
    </button>
  `;
}

function syncEventPublicLikeBadge(photoId, count) {
  if (!eventPublicGrid) {
    return;
  }

  eventPublicGrid.querySelectorAll(`[data-event-photo-id="${CSS.escape(String(photoId || ""))}"]`).forEach((badge) => {
    const icon = badge.querySelector(".photo-like-badge-icon");
    const likedInSession = likedEventPhotoSessionIds.has(String(photoId || "").trim());
    if (icon) {
      icon.classList.toggle("icon-heart-empty", !likedInSession && count <= 0);
      icon.classList.toggle("icon-heart-selected", likedInSession || count > 0);
    }
    badge.setAttribute("aria-label", likedInSession ? "Unlike photo" : "Like photo");

    let countEl = badge.querySelector(".photo-like-badge-count");
    if (count > 0) {
      if (!countEl) {
        countEl = document.createElement("span");
        countEl.className = "photo-like-badge-count";
        badge.appendChild(countEl);
      }
      countEl.textContent = String(count);
    } else if (countEl) {
      countEl.remove();
    }
  });
}

async function updateEventPhotoLikeCount(endpoint, photo) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug: currentPublicEvent?.slug || "",
      photoId: photo.id,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not save the photo like.");
  }

  const nextCount = Math.max(0, Number(payload?.count) || 0);
  const targetPhoto = (currentPublicEvent?.livePhotos || []).find((entry) => entry.id === photo.id);
  if (targetPhoto) {
    targetPhoto.likeCount = nextCount;
  }
  syncEventPublicLikeBadge(photo.id, nextCount);
}

async function toggleEventPhotoLike(photo) {
  const photoId = String(photo?.id || "").trim();
  if (!photoId) {
    return;
  }

  if (likedEventPhotoSessionIds.has(photoId)) {
    await updateEventPhotoLikeCount("/api/events/photo-unlike", photo);
    likedEventPhotoSessionIds.delete(photoId);
    syncEventPublicLikeBadge(photoId, getEventPhotoLikeCount(photo));
    return;
  }

  await updateEventPhotoLikeCount("/api/events/photo-like", photo);
  likedEventPhotoSessionIds.add(photoId);
  syncEventPublicLikeBadge(photoId, getEventPhotoLikeCount(photo));
}

function downloadEventPhoto(photo) {
  const source = String(photo?.fullUrl || photo?.slideshowUrl || photo?.thumbnailUrl || "").trim();
  if (!source) {
    throw new Error("This photo could not be downloaded.");
  }

  const anchor = document.createElement("a");
  anchor.href = source;
  anchor.download = String(photo?.name || "event-photo").trim() || "event-photo";
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
  setDocumentFavicon(payload.event?.faviconLink || "");
  openManageEventPanel(payload.event, { skipHistory: true, token });
}

async function loadPublicEvent(slug) {
  const response = await fetch(`/api/events/public?slug=${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "This event could not be opened.");
  }

  const event = payload.event || {};
  currentPublicEvent = event;
  setDocumentFavicon(event.faviconLink || "");
  screenDirectLink.classList.remove("active");
  screenGallery.classList.remove("active");
  screenStudio.classList.remove("active");
  screenEventPresent?.classList.remove("active");
  screenEventPublic?.classList.add("active");
  document.body.classList.remove("studio-scroll-lock");
  document.title = [event.name || "Event", "CarnivalStories"].join(" | ");
  const eventLogoSource = resolveStudioLogoSource(event.logoLink) || PRODUCT_LOGO_PATH;
  if (eventPublicLogo && eventPublicLogoLink) {
    eventPublicLogoLink.classList.toggle("is-empty", !eventLogoSource);
    eventPublicLogo.hidden = !eventLogoSource;
    eventPublicLogo.src = eventLogoSource;
    eventPublicLogo.alt = event.logoLink ? `${event.name || "Event"} logo` : "Carnival Stories";
    eventPublicLogoLink.href = event.homepageLink || "/";
  }
  const uploadIsLive = event.phase === "live";
  if (eventUploadInput) {
    eventUploadInput.disabled = !uploadIsLive;
  }
  const uploadTrigger = eventUploadForm?.querySelector(".event-upload-trigger");
  if (uploadTrigger) {
    uploadTrigger.classList.toggle("is-disabled", !uploadIsLive);
  }
  if (!uploadIsLive) {
    resetEventUploadPreview();
  }
  renderPublicEventGrid(event.livePhotos || []);
  eventUploadForm.dataset.slug = event.slug || slug;
  setStudioStatus(eventUploadStatus, uploadIsLive ? "" : "Photo uploads open only when the event is live.");
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
  photos.forEach((photo, index) => {
    const item = document.createElement("article");
    item.className = "photo-card event-public-photo-card";
    item.innerHTML = `
      <button type="button" class="event-public-photo-open" aria-label="Open photo slideshow">
        <img src="${escapeMarkup(getEventPhotoPreviewUrl(photo))}" alt="${escapeMarkup(photo.name || "Event photo")}" loading="lazy" />
      </button>
      <div class="event-public-photo-overlay">
        ${renderEventPhotoLikeBadge(photo)}
        <button type="button" class="event-public-download-button" data-download-photo aria-label="Download photo">
          <span class="saved-page-icon icon-mask icon-download" aria-hidden="true"></span>
        </button>
      </div>
    `;
    item.querySelector(".event-public-photo-open")?.addEventListener("click", () => {
      openEventPhotosSlideshow(photos, index);
    });
    item.querySelector(".event-public-like-badge")?.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        await toggleEventPhotoLike(photo);
      } catch (error) {
        showStudioToast(error.message || "Could not update like");
      }
    });
    item.querySelector("[data-download-photo]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      try {
        downloadEventPhoto(photo);
      } catch (error) {
        showStudioToast(error.message || "Could not download photo");
      }
    });
    eventPublicGrid.appendChild(item);
  });
  applyEventGridColumnSizing();
}

function getEventGridColumnCount(gridEl) {
  const gridWidth = gridEl?.clientWidth || window.innerWidth;
  const viewportWidth = window.innerWidth;
  const gap = 1;
  let minimumTileWidth = 220;
  if (viewportWidth <= 1100) {
    minimumTileWidth = 180;
  }
  if (viewportWidth <= 720) {
    minimumTileWidth = 150;
  }

  const maxColumnsByWidth = Math.max(1, Math.floor((gridWidth + gap) / (minimumTileWidth + gap)));
  return Math.min(4, maxColumnsByWidth);
}

function applyEventGridColumnSizing() {
  [manageEventPhotoGrid, eventPublicGrid].forEach((gridEl) => {
    if (!gridEl) {
      return;
    }
    const hasCards = gridEl.querySelector(".event-photo-review-card, .event-public-photo-card");
    if (!hasCards) {
      gridEl.style.removeProperty("column-count");
      return;
    }
    const columns = getEventGridColumnCount(gridEl);
    gridEl.style.columnCount = String(columns);
  });
}

function openEventPhotosSlideshow(photos, index = 0) {
  if (!window.CarnivalGallery?.openExternalSlideshow) {
    return;
  }
  const safePhotos = Array.isArray(photos) ? photos : [];
  if (!safePhotos.length) {
    return;
  }
  window.CarnivalGallery.openExternalSlideshow(safePhotos, {
    index: Math.max(0, Number(index) || 0),
    photoLikes: Object.fromEntries(
      safePhotos.map((entry) => [entry.id, getEventPhotoLikeCount(entry)])
    ),
    likeEndpoint: "/api/events/photo-like",
    unlikeEndpoint: "/api/events/photo-unlike",
    likePayload: { slug: currentPublicEvent?.slug || currentManagedEvent?.slug || "" },
    tagline: currentPublicEvent?.name || currentManagedEvent?.name || "Event",
    studioName: "",
    pageUrl: window.location.href,
    pairingCode: "",
    shareEnabled: false,
  });
}

function stopEventPresentation() {
  clearEventPresentationSlideTimer();
  clearEventPresentationRefreshTimer();
  clearEventPresentationTransitionTimers();
  currentEventPresentationSlug = "";
  currentEventPresentationCardIndex = 0;
  currentEventPresentationHasFirstPaint = false;
  hideEventPresentationLoader();
  if (screenEventPresent) {
    screenEventPresent.style.backgroundImage = "";
    screenEventPresent.style.backgroundSize = "";
    screenEventPresent.style.backgroundPosition = "";
    screenEventPresent.style.backgroundRepeat = "";
  }
  [eventPresentCardA, eventPresentCardB].forEach((card) => {
    if (!card) {
      return;
    }
    card.classList.remove("is-active", "is-leaving");
    card.style.setProperty("--motion-delay", "0ms");
    card.style.setProperty("--motion-duration", `${EVENT_PRESENT_ENTER_MS}ms`);
    card.style.setProperty("--event-z", "2");
  });
  [eventPresentImageA, eventPresentImageB].forEach((image) => {
    if (!image) {
      return;
    }
    image.removeAttribute("src");
    image.alt = "";
  });
}

function clearEventPresentationSlideTimer() {
  if (currentEventPresentationTimer) {
    window.clearTimeout(currentEventPresentationTimer);
    currentEventPresentationTimer = null;
  }
}

function clearEventPresentationRefreshTimer() {
  if (currentEventPresentationRefreshTimer) {
    window.clearTimeout(currentEventPresentationRefreshTimer);
    currentEventPresentationRefreshTimer = null;
  }
}

function clearEventPresentationTransitionTimers() {
  if (currentEventPresentationLeaveStartTimer) {
    window.clearTimeout(currentEventPresentationLeaveStartTimer);
    currentEventPresentationLeaveStartTimer = null;
  }
  if (currentEventPresentationLeaveCleanupTimer) {
    window.clearTimeout(currentEventPresentationLeaveCleanupTimer);
    currentEventPresentationLeaveCleanupTimer = null;
  }
}

async function ensureEventPresentationLoaderAnimation() {
  if (!eventPresentLoaderAnimationEl || eventPresentLoaderAnimation || typeof window.lottie?.loadAnimation !== "function") {
    return;
  }

  try {
    const response = await fetch("/assets/boot-loader.json?v=20260428a", { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Presentation loader animation could not be loaded (${response.status}).`);
    }
    const animationData = await response.json();
    eventPresentLoaderAnimation = window.lottie.loadAnimation({
      container: eventPresentLoaderAnimationEl,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });
  } catch (error) {
    console.warn(error);
  }
}

function showEventPresentationLoader() {
  if (!eventPresentLoader) {
    return;
  }
  eventPresentLoader.classList.remove("hidden");
  void ensureEventPresentationLoaderAnimation();
}

function hideEventPresentationLoader() {
  eventPresentLoader?.classList.add("hidden");
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
  if (!photo || !eventPresentCardA || !eventPresentCardB || !eventPresentImageA || !eventPresentImageB) {
    return;
  }
  clearEventPresentationSlideTimer();
  const presentationUrl = getEventPhotoPresentationUrl(photo);
  const preload = new Image();
  preload.onload = () => {
    const cards = [eventPresentCardA, eventPresentCardB];
    const images = [eventPresentImageA, eventPresentImageB];
    const nextIndex = currentEventPresentationCardIndex === 0 ? 1 : 0;
    const activeCard = cards[currentEventPresentationCardIndex];
    const nextCard = cards[nextIndex];
    const nextImage = images[nextIndex];
    const offsetX = Math.max(260, Math.round(window.innerWidth * 0.5));
    const offsetY = Math.max(220, Math.round(window.innerHeight * 0.42));
    const corners = [
      { fromX: -offsetX, fromY: -offsetY, toX: offsetX, toY: offsetY },
      { fromX: offsetX, fromY: -offsetY, toX: -offsetX, toY: offsetY },
      { fromX: -offsetX, fromY: offsetY, toX: offsetX, toY: -offsetY },
      { fromX: offsetX, fromY: offsetY, toX: -offsetX, toY: -offsetY },
    ];
    const motion = corners[Math.floor(Math.random() * corners.length)];
    const exitMotion = getNextEventExitPreset();
    const tilt = ((Math.random() * 20) - 10).toFixed(2);
    const enterAt = performance.now();
    logPresentationDebug(
      "event",
      `enter photo="${photo?.name || ""}" id="${photo?.id || ""}" from=(${motion.fromX},${motion.fromY}) to=(${motion.toX},${motion.toY}) tilt=${tilt} enterMs=${EVENT_PRESENT_ENTER_MS} pushDelayMs=${EVENT_PRESENT_PUSH_DELAY_MS} exitMs=${EVENT_PRESENT_EXIT_MS}`
    );

    nextImage.src = presentationUrl;
    nextImage.alt = photo.name || "Event photo";
    nextCard.style.setProperty("--event-from-x", `${motion.fromX}px`);
    nextCard.style.setProperty("--event-from-y", `${motion.fromY}px`);
    nextCard.style.setProperty("--event-to-x", `${motion.toX}px`);
    nextCard.style.setProperty("--event-to-y", `${motion.toY}px`);
    nextCard.style.setProperty("--event-tilt", `${tilt}deg`);
    nextCard.style.setProperty("--motion-duration", `${EVENT_PRESENT_ENTER_MS}ms`);
    nextCard.style.setProperty("--motion-delay", "0ms");
    nextCard.style.setProperty("--event-z", "2");
    nextCard.classList.remove("is-leaving", "is-active");
    // Paint start pose first, then animate into center.
    window.requestAnimationFrame(() => {
      nextCard.classList.add("is-active");
    });

    if (activeCard.classList.contains("is-active")) {
      activeCard.style.setProperty("--event-from-x", "0px");
      activeCard.style.setProperty("--event-from-y", "0px");
      activeCard.style.setProperty("--event-to-x", exitMotion.toX);
      activeCard.style.setProperty("--event-to-y", exitMotion.toY);
      activeCard.style.setProperty("--event-tilt", `${tilt}deg`);
      activeCard.style.setProperty("--motion-duration", `${EVENT_PRESENT_EXIT_MS}ms`);
      activeCard.style.setProperty("--motion-delay", `${EVENT_PRESENT_PUSH_DELAY_MS}ms`);
      activeCard.style.setProperty("--event-z", "3");
      const prevName = activeCard.querySelector("img")?.alt || "";
      clearEventPresentationTransitionTimers();
      const onPushStart = (event) => {
        if (event.propertyName !== "transform") {
          return;
        }
        activeCard.removeEventListener("transitionstart", onPushStart);
        logPresentationDebug("event", `push-start prev="${prevName}" at=${Math.round(performance.now() - enterAt)}ms`);
      };
      const onExitDone = (event) => {
        if (event.propertyName !== "transform") {
          return;
        }
        activeCard.removeEventListener("transitionend", onExitDone);
        logPresentationDebug("event", `exit-done prev="${prevName}" total=${Math.round(performance.now() - enterAt)}ms`);
        activeCard.classList.remove("is-leaving");
      };
      activeCard.addEventListener("transitionstart", onPushStart);
      activeCard.addEventListener("transitionend", onExitDone);
      activeCard.classList.remove("is-active");
      window.requestAnimationFrame(() => {
        activeCard.classList.add("is-leaving");
      });
      currentEventPresentationLeaveCleanupTimer = window.setTimeout(() => {
        if (activeCard.classList.contains("is-leaving")) {
          activeCard.removeEventListener("transitionstart", onPushStart);
          activeCard.removeEventListener("transitionend", onExitDone);
          logPresentationDebug("event", `exit-fallback prev="${prevName}" total=${Math.round(performance.now() - enterAt)}ms`);
          activeCard.classList.remove("is-leaving");
        }
      }, EVENT_PRESENT_PUSH_DELAY_MS + EVENT_PRESENT_EXIT_MS + 120);
    }
    currentEventPresentationCardIndex = nextIndex;
    if (!currentEventPresentationHasFirstPaint) {
      currentEventPresentationHasFirstPaint = true;
      hideEventPresentationLoader();
    }
    queueNextEventPresentationSlide();
  };
  preload.onerror = () => {
    queueNextEventPresentationSlide();
  };
  preload.src = presentationUrl;
}

async function refreshEventPresentationFeed() {
  if (!currentEventPresentationSlug) {
    return;
  }

  try {
    const response = await fetch(`/api/events/public?slug=${encodeURIComponent(currentEventPresentationSlug)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "This presentation could not be refreshed.");
    }

    const nextPhotos = Array.isArray(payload.event?.livePhotos) ? payload.event.livePhotos : [];
    const currentPhoto = currentEventPresentationPhotos[currentEventPresentationIndex];
    const previousIds = currentEventPresentationPhotos.map((photo) => photo.id).join("|");
    const nextIds = nextPhotos.map((photo) => photo.id).join("|");
    currentEventPresentationPhotos = nextPhotos;
    if (!nextPhotos.length) {
      currentEventPresentationIndex = 0;
      clearEventPresentationSlideTimer();
      [eventPresentCardA, eventPresentCardB].forEach((card) => card?.classList.remove("is-active", "is-leaving"));
      [eventPresentImageA, eventPresentImageB].forEach((image) => {
        image?.removeAttribute("src");
        if (image) {
          image.alt = "";
        }
      });
    } else if (currentPhoto?.id) {
      const nextIndex = nextPhotos.findIndex((photo) => photo.id === currentPhoto.id);
      currentEventPresentationIndex = nextIndex >= 0 ? nextIndex : 0;
      if (previousIds !== nextIds && screenEventPresent?.classList.contains("active")) {
        await renderEventPresentationSlide();
      }
    } else {
      currentEventPresentationIndex = 0;
      if (previousIds !== nextIds && screenEventPresent?.classList.contains("active")) {
        await renderEventPresentationSlide();
      }
    }
  } catch (error) {
    console.warn(error);
  } finally {
    if (currentEventPresentationSlug) {
      currentEventPresentationRefreshTimer = window.setTimeout(() => {
        void refreshEventPresentationFeed();
      }, 5000);
    }
  }
}

async function loadEventPresentation(slug) {
  stopEventPresentation();
  const response = await fetch(`/api/events/public?slug=${encodeURIComponent(slug)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "This presentation could not be opened.");
  }

  const event = payload.event || {};
  setDocumentFavicon(event.faviconLink || "");
  currentEventPresentationSlug = event.slug || slug;
  currentEventPresentationPhotos = Array.isArray(event.livePhotos) ? event.livePhotos : [];
  currentEventPresentationIndex = 0;
  screenDirectLink.classList.remove("active");
  screenGallery.classList.remove("active");
  screenStudio.classList.remove("active");
  screenEventPublic?.classList.remove("active");
  screenEventPresent?.classList.add("active");
  currentEventPresentationHasFirstPaint = false;
  showEventPresentationLoader();
  document.body.classList.remove("studio-scroll-lock");
  if (screenEventPresent) {
    const backgroundUrl = String(event.backgroundUrl || "").trim();
    screenEventPresent.style.backgroundImage = backgroundUrl ? `url("${backgroundUrl}")` : "";
    screenEventPresent.style.backgroundSize = backgroundUrl ? "cover" : "";
    screenEventPresent.style.backgroundPosition = backgroundUrl ? "center center" : "";
    screenEventPresent.style.backgroundRepeat = backgroundUrl ? "no-repeat" : "";
  }
  document.title = [event.name || "Event", "CarnivalStories"].join(" | ");
  if (eventPresentExitButton) {
    eventPresentExitButton.onclick = () => {
      stopEventPresentation();
      window.location.href = "/";
    };
  }
  if (!currentEventPresentationPhotos.length) {
    [eventPresentCardA, eventPresentCardB].forEach((card) => card?.classList.remove("is-active", "is-leaving"));
    [eventPresentImageA, eventPresentImageB].forEach((image) => {
      image?.removeAttribute("src");
      if (image) {
        image.alt = "";
      }
    });
    currentEventPresentationRefreshTimer = window.setTimeout(() => {
      void refreshEventPresentationFeed();
    }, 5000);
    return;
  }
  await renderEventPresentationSlide();
  currentEventPresentationRefreshTimer = window.setTimeout(() => {
    void refreshEventPresentationFeed();
  }, 5000);
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
    if (getEffectivePathname().startsWith("/studio")) {
      window.history.replaceState({ login: true }, "", resolveAppPath("/login"));
    }
    showStudioView("auth");
    return;
  }

  googleLoginButton.disabled = false;
  const cachedProfile = getCachedStudioProfile(user.uid);
  const hasCachedStudioIdentity = Boolean(cachedProfile?.studioName && cachedProfile?.studioSlug);
  if (cachedProfile?.studioName && cachedProfile?.studioSlug) {
    currentProfile = {
      ...(currentProfile || {}),
      ...cachedProfile,
      email: user.email || currentProfile?.email || "",
      displayName: user.displayName || currentProfile?.displayName || "",
      photoURL: user.photoURL || currentProfile?.photoURL || "",
    };
    hydrateStudioSettingsForms();
    updateDomainSummary();
    if (getEffectivePathname() === "/login") {
      window.history.replaceState({ studio: true }, "", resolveAppPath("/studio"));
    }
    showStudioView("dashboard");
    updateLinkCreationGate();
    void loadSavedPages().catch(() => {});
    void loadEvents().catch(() => {});
    void loadDriveConnectionStatus().catch(() => {});
  } else {
    showStudioView("auth");
  }

  setStudioStatus(studioAuthStatus, "Checking your studio...");
  setStudioStatus(studioNameStatus, "Preparing your studio...");
  try {
    const loadedProfile = await loadUserProfile(user).catch((error) => {
      console.warn("Profile read failed, continuing with fallbacks:", error);
      return null;
    });
    await ensureUserShell(user);
    const resolvedProfile = await resolveExistingStudioIdentity(user, loadedProfile);
    currentProfile = resolvedProfile;
  } catch (error) {
    console.warn("Studio profile bootstrap fallback:", error);
    if (hasCachedStudioIdentity) {
      currentProfile = {
        ...(currentProfile || {}),
        ...cachedProfile,
        email: user.email || currentProfile?.email || "",
        displayName: user.displayName || currentProfile?.displayName || "",
        photoURL: user.photoURL || currentProfile?.photoURL || "",
      };
    } else {
      currentProfile = {
        ...(currentProfile || {}),
        email: user.email || currentProfile?.email || "",
        displayName: user.displayName || currentProfile?.displayName || "",
        photoURL: user.photoURL || currentProfile?.photoURL || "",
      };
    }
  }
  if ((!currentProfile?.studioName || !currentProfile?.studioSlug) && hasCachedStudioIdentity) {
    currentProfile = {
      ...(currentProfile || {}),
      ...cachedProfile,
      email: user.email || currentProfile?.email || "",
      displayName: user.displayName || currentProfile?.displayName || "",
      photoURL: user.photoURL || currentProfile?.photoURL || "",
    };
  }
  setStudioStatus(studioAuthStatus, "");
  setStudioStatus(studioNameStatus, "");

  if (isAdminEmail(user.email)) {
    if (getEffectivePathname() === "/login") {
      window.history.replaceState({ studio: true }, "", resolveAppPath("/studio"));
    }
    showStudioView("admin");
    await loadAdminAccounts();
    return;
  }

  if (!currentProfile?.studioName) {
    if (getEffectivePathname() === "/login") {
      window.history.replaceState({ studio: true }, "", resolveAppPath("/studio"));
    }
    showStudioView("name");
    return;
  }

  cacheStudioProfile(currentProfile);
  hydrateStudioSettingsForms();
  updateDomainSummary();
  if (getEffectivePathname() === "/login") {
    window.history.replaceState({ studio: true }, "", resolveAppPath("/studio"));
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

  currentProfile = {
    ...currentProfile,
    studioName,
    studioSlug,
  };
  cacheStudioProfile(currentProfile);
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

async function deleteStudioAccount() {
  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAdminAuthHeaders()),
    },
    body: JSON.stringify({}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not delete account.");
  }
  return payload;
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

function buildDefaultFolderRemap() {
  const remap = {};
  (wizardState.folders || []).forEach((folder) => {
    if (folder?.id) {
      remap[folder.id] = folder.name || "";
    }
  });
  return remap;
}

function renderFolderRemapStep() {
  if (!wizardRemapList) {
    return;
  }
  wizardRemapList.innerHTML = "";
  (wizardState.folders || []).forEach((folder) => {
    const row = document.createElement("div");
    row.className = "wizard-remap-row";
    const source = document.createElement("strong");
    source.textContent = folder.name || "Folder";
    const arrow = document.createElement("em");
    arrow.textContent = "→";
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(wizardState.folderRemapById?.[folder.id] || folder.name || "");
    input.dataset.folderId = String(folder.id || "");
    input.placeholder = "Tab name";
    input.addEventListener("input", () => {
      const folderId = String(input.dataset.folderId || "");
      if (!folderId) {
        return;
      }
      wizardState.folderRemapById = {
        ...(wizardState.folderRemapById || {}),
        [folderId]: input.value.trim() || folder.name || "",
      };
    });
    row.append(source, arrow, input);
    wizardRemapList.appendChild(row);
  });
}

function addYoutubeLinkRow(link = {}) {
  wizardState.youtubeLinks.push({
    url: String(link.url || "").trim(),
    title: String(link.title || "").trim(),
    thumbnailUrl: String(link.thumbnailUrl || "").trim(),
    validated: Boolean(link.validated && link.url && link.title),
    validating: false,
    error: "",
  });
  renderYoutubeLinksStep();
}

function isYoutubeStepComplete() {
  return (wizardState.youtubeLinks || []).every(
    (item) => !String(item.url || "").trim() || (item.validated && !item.validating)
  );
}

function renderYoutubeLinksStep() {
  if (!wizardYoutubeLinks) {
    return;
  }
  wizardYoutubeLinks.innerHTML = "";
  (wizardState.youtubeLinks || []).forEach((link, index) => {
    const row = document.createElement("div");
    row.className = "wizard-youtube-row";

    const main = document.createElement("div");
    main.className = "wizard-youtube-row-main";

    const input = document.createElement("input");
    input.type = "url";
    input.placeholder = "https://www.youtube.com/watch?v=...";
    input.value = link.url || "";
    input.addEventListener("input", () => {
      const nextUrl = input.value.trim();
      wizardState.youtubeLinks[index] = {
        ...wizardState.youtubeLinks[index],
        url: nextUrl,
        validated: false,
        validating: false,
        title: "",
        thumbnailUrl: "",
        error: "",
      };
      renderYoutubeLinksStep();
    });

    const validateButton = document.createElement("button");
    validateButton.type = "button";
    validateButton.className = "studio-primary-button";
    validateButton.textContent = link.validated ? "Validated" : link.validating ? "Validating..." : "Validate";
    validateButton.disabled = link.validated || link.validating || !String(link.url || "").trim();
    validateButton.addEventListener("click", async () => {
      const current = wizardState.youtubeLinks[index];
      if (!current || !String(current.url || "").trim()) {
        return;
      }
      wizardState.youtubeLinks[index] = {
        ...current,
        validating: true,
        error: "",
      };
      renderYoutubeLinksStep();
      try {
        const response = await fetch(`/api/youtube/validate?url=${encodeURIComponent(current.url)}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Could not validate this YouTube link.");
        }
        wizardState.youtubeLinks[index] = {
          ...wizardState.youtubeLinks[index],
          validating: false,
          validated: true,
          title: String(payload.title || "").trim(),
          thumbnailUrl: String(payload.thumbnailUrl || "").trim(),
          error: "",
        };
      } catch (error) {
        wizardState.youtubeLinks[index] = {
          ...wizardState.youtubeLinks[index],
          validating: false,
          validated: false,
          title: "",
          thumbnailUrl: "",
          error: error.message || "Could not validate this link.",
        };
      }
      renderYoutubeLinksStep();
    });
    main.append(input, validateButton);
    row.appendChild(main);

    if (link.error) {
      const error = document.createElement("p");
      error.className = "studio-status is-error";
      error.textContent = link.error;
      row.appendChild(error);
    }

    if (link.validated && link.title) {
      const preview = document.createElement("div");
      preview.className = "wizard-youtube-preview";
      const thumb = document.createElement("img");
      thumb.alt = link.title;
      thumb.loading = "lazy";
      thumb.src = link.thumbnailUrl || "";
      const title = document.createElement("strong");
      title.textContent = link.title;
      preview.append(thumb, title);
      row.appendChild(preview);
    }

    wizardYoutubeLinks.appendChild(row);
  });

  const continueEnabled = isYoutubeStepComplete();
  if (wizardYoutubeNext) {
    wizardYoutubeNext.disabled = !continueEnabled;
  }
  setStudioStatus(
    wizardYoutubeStatus,
    continueEnabled
      ? "All links are validated."
      : "Validate all entered YouTube links to continue."
  );
}

function showWizardStep(step) {
  currentWizardStep = step;
  wizardStepLabel.textContent = `Step ${step} of 6`;
  wizardDriveForm.classList.toggle("hidden", step !== 1);
  wizardDetailsForm.classList.toggle("hidden", step !== 2);
  wizardRemapForm.classList.toggle("hidden", step !== 3);
  wizardYoutubeStep.classList.toggle("hidden", step !== 4);
  wizardMediaStep.classList.toggle("hidden", step !== 5);
  wizardTemplateStep.classList.toggle("hidden", step !== 6);
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
  wizardDetailsForm?.reset();
  if (wizardAlbumUrlPreview) {
    wizardAlbumUrlPreview.textContent = "";
  }
  wizardDriveLink.value = "";
  wizardState.folderRemapById = {};
  wizardState.includeYoutubeVideosFolder = false;
  wizardState.youtubeLinks = [];
  wizardMediaSearch.value = "";
  wizardMediaList.innerHTML = "";
  if (wizardRemapList) {
    wizardRemapList.innerHTML = "";
  }
  if (wizardCreateVideosFolder) {
    wizardCreateVideosFolder.checked = false;
  }
  if (wizardYoutubeLinks) {
    wizardYoutubeLinks.innerHTML = "";
  }
  wizardMediaSearch.placeholder = "SEARCH FOLDERS";
  wizardCreatePage.textContent = "Create album";
  setStudioStatus(wizardDriveStatus, "");
  setStudioStatus(wizardDetailsStatus, "");
  setStudioStatus(wizardRemapStatus, "");
  setStudioStatus(wizardYoutubeStatus, "");
  setStudioStatus(wizardMediaStatus, "");
  setStudioStatus(wizardTemplateStatus, "");
  syncTemplateCardsUI();
  studioDashboardPanel.classList.add("hidden");
  connectDomainPanel?.classList.add("hidden");
  createPagePanel.classList.remove("hidden");
  if (!skipHistory && getEffectivePathname() !== "/studio/create") {
    window.history.pushState({ studio: true, create: true }, "", resolveAppPath("/studio/create"));
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
    template: normalizeAlbumTemplateId(page.template),
    selectedCover: page.coverFileId
      ? {
          id: page.coverFileId,
          name: page.coverName || "Current cover",
          url: page.coverImageUrl || "",
          thumbnailUrl: page.coverThumbnailUrl || "",
        }
      : null,
    folderRemapById:
      page && typeof page.folderRemapById === "object" && page.folderRemapById
        ? page.folderRemapById
        : {},
    includeYoutubeVideosFolder: Boolean(page?.includeYoutubeVideosFolder),
    youtubeLinks: Array.isArray(page?.youtubeLinks)
      ? page.youtubeLinks.map((item) => ({
          url: String(item?.url || "").trim(),
          title: String(item?.title || "").trim(),
          thumbnailUrl: String(item?.thumbnailUrl || "").trim(),
          validated: Boolean(item?.url && item?.title),
          validating: false,
          error: "",
        }))
      : [],
  };
  wizardDriveForm.reset();
  wizardDetailsForm?.reset();
  wizardDriveLink.value = wizardState.driveLink;
  if (wizardAlbumName) wizardAlbumName.value = wizardState.pageName || "";
  if (wizardAlbumTagline) wizardAlbumTagline.value = wizardState.tagline || "";
  if (wizardAlbumStartDate) wizardAlbumStartDate.value = wizardState.eventStartDate || "";
  if (wizardAlbumEndDate) wizardAlbumEndDate.value = wizardState.eventEndDate || "";
  updateWizardAlbumUrlPreview();
  wizardMediaSearch.value = "";
  wizardMediaList.innerHTML = "";
  if (wizardCreateVideosFolder) {
    wizardCreateVideosFolder.checked = wizardState.includeYoutubeVideosFolder;
  }
  renderFolderRemapStep();
  if (!wizardState.youtubeLinks.length) {
    addYoutubeLinkRow();
    addYoutubeLinkRow();
  } else {
    renderYoutubeLinksStep();
  }
  wizardMediaSearch.placeholder = "SEARCH FOLDERS";
  wizardCreatePage.textContent = "Update album";
  setStudioStatus(wizardDriveStatus, "Load this Drive folder again to choose a new cover, or continue with the current link.");
  setStudioStatus(wizardDetailsStatus, "");
  setStudioStatus(wizardRemapStatus, "");
  setStudioStatus(wizardYoutubeStatus, "");
  setStudioStatus(wizardMediaStatus, "");
  setStudioStatus(wizardTemplateStatus, `Pairing code stays ${wizardState.pairingCode}.`);
  syncTemplateCardsUI();
  studioDashboardPanel.classList.add("hidden");
  connectDomainPanel?.classList.add("hidden");
  createPagePanel.classList.remove("hidden");
  if (!skipHistory && page?.id) {
    window.history.pushState({ studio: true, edit: page.id }, "", resolveAppPath(`/studio/edit/${encodeURIComponent(page.id)}`));
  }
  showWizardStep(1);
}

function closeCreateWizard(options = {}) {
  const { skipHistory = false } = options;
  createPagePanel.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  showStudioDashboardSection("pages");
  if (!skipHistory && getEffectivePathname() !== "/studio") {
    window.history.pushState({ studio: true }, "", resolveAppPath("/studio"));
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
  if (!skipHistory && getEffectivePathname() !== "/studio/connect-domain") {
    window.history.pushState({ studio: true, connectDomain: true }, "", resolveAppPath("/studio/connect-domain"));
  }
}

function closeConnectDomainPage(options = {}) {
  const { skipHistory = false } = options;
  connectDomainPanel?.classList.add("hidden");
  studioDashboardPanel.classList.remove("hidden");
  showStudioDashboardSection("account");
  if (!skipHistory && getEffectivePathname() !== "/studio") {
    window.history.pushState({ studio: true }, "", resolveAppPath("/studio"));
  }
}

function goBackInWizard() {
  if (currentWizardStep <= 1) {
    closeCreateWizard();
    return;
  }
  if (currentWizardStep === 5 && !wizardState.includeYoutubeVideosFolder) {
    showWizardStep(3);
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
    templateLabel: getAlbumTemplateLabel(wizardState.template),
    coverFileId: wizardState.selectedCover?.id || "",
    coverImageUrl: wizardState.selectedCover?.url || "",
    coverThumbnailUrl: wizardState.selectedCover?.thumbnailUrl || "",
    coverName: wizardState.selectedCover?.name || "",
    folderRemapById: wizardState.folderRemapById || {},
    includeYoutubeVideosFolder: Boolean(wizardState.includeYoutubeVideosFolder),
    youtubeLinks: (wizardState.youtubeLinks || [])
      .map((item) => ({
        url: String(item?.url || "").trim(),
        title: String(item?.title || "").trim(),
        thumbnailUrl: String(item?.thumbnailUrl || "").trim(),
      }))
      .filter((item) => item.url && item.title),
    faceDetection: {
      status: "idle",
      source: "",
      requestedAt: null,
      updatedAt: serverTimestamp(),
      completedAt: null,
    },
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
    templateLabel: getAlbumTemplateLabel(wizardState.template),
    coverFileId: wizardState.selectedCover?.id || "",
    coverImageUrl: wizardState.selectedCover?.url || "",
    coverThumbnailUrl: wizardState.selectedCover?.thumbnailUrl || "",
    coverName: wizardState.selectedCover?.name || "",
    folderRemapById: wizardState.folderRemapById || {},
    includeYoutubeVideosFolder: Boolean(wizardState.includeYoutubeVideosFolder),
    youtubeLinks: (wizardState.youtubeLinks || [])
      .map((item) => ({
        url: String(item?.url || "").trim(),
        title: String(item?.title || "").trim(),
        thumbnailUrl: String(item?.thumbnailUrl || "").trim(),
      }))
      .filter((item) => item.url && item.title),
    faceDetection: existingPage.faceDetection || {
      status: "idle",
      source: "",
      requestedAt: null,
      updatedAt: serverTimestamp(),
      completedAt: null,
    },
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
      if (route.mode === "present") {
        screenEventPublic?.classList.remove("active");
        screenEventPresent?.classList.add("active");
        [eventPresentCardA, eventPresentCardB].forEach((card) => card?.classList.remove("is-active", "is-leaving"));
        [eventPresentImageA, eventPresentImageB].forEach((image) => {
          image?.removeAttribute("src");
          if (image) {
            image.alt = "";
          }
        });
        setStudioStatus(eventUploadStatus, "");
        window.CarnivalGallery?.showError?.(error.message || "This presentation could not be opened.");
      } else {
        screenEventPresent?.classList.remove("active");
        screenEventPublic?.classList.add("active");
        setStudioStatus(eventUploadStatus, error.message || "This event could not be opened.", true);
        renderPublicEventGrid([]);
      }
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
  ensureCarnivalAndroidAuthBridge();

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
        const cachedProfile = getCachedStudioProfile(user.uid);
        if (cachedProfile?.studioName && cachedProfile?.studioSlug) {
          currentUser = user;
          currentProfile = {
            ...(currentProfile || {}),
            ...cachedProfile,
            email: user.email || currentProfile?.email || "",
            displayName: user.displayName || currentProfile?.displayName || "",
            photoURL: user.photoURL || currentProfile?.photoURL || "",
          };
          hydrateStudioSettingsForms();
          updateDomainSummary();
          if (getEffectivePathname() === "/login") {
            window.history.replaceState({ studio: true }, "", resolveAppPath("/studio"));
          }
          showStudioView("dashboard");
          updateLinkCreationGate();
          void loadSavedPages().catch(() => {});
          void loadEvents().catch(() => {});
          void loadDriveConnectionStatus().catch(() => {});
          return;
        }
        showStudioView("auth");
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
    if (activeAdminFilter === "events") {
      try {
        await loadAdminEvents({ force: true });
      } catch (error) {
        adminAccountsList.innerHTML = '<p class="studio-empty">No events here.</p>';
        setStudioStatus(adminAccountsStatus, error.message || "Could not load events.", true);
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

accountDeleteButton?.addEventListener("click", async () => {
  try {
    const confirmationValue = String(accountDeleteConfirmationInput?.value || "").trim();
    const expectedStudioName = String(currentProfile?.studioName || accountStudioName?.value || "").trim();
    if (!expectedStudioName) {
      setStudioStatus(studioAccountStatus, "Studio name is unavailable. Refresh and try again.", true);
      return;
    }
    const normalizedConfirmationValue = confirmationValue.toLocaleLowerCase();
    const normalizedExpectedStudioName = expectedStudioName.toLocaleLowerCase();
    if (normalizedConfirmationValue !== normalizedExpectedStudioName) {
      setStudioStatus(studioAccountStatus, `Type your exact studio name (${expectedStudioName}) to confirm.`, true);
      accountDeleteConfirmationInput?.focus();
      return;
    }

    const confirmed = window.confirm(
      "This will permanently delete your studio account data and sign you out. This cannot be undone. Continue?"
    );
    if (!confirmed) {
      return;
    }

    accountDeleteButton.disabled = true;
    setStudioStatus(studioAccountStatus, "Deleting your account...");
    await deleteStudioAccount();
    await signOut(auth);
    currentProfile = null;
    savedPages = [];
    savedEvents = [];
    studioUserLabel.textContent = "";
    if (accountDeleteConfirmationInput) {
      accountDeleteConfirmationInput.value = "";
    }
    setStudioStatus(studioAccountStatus, "Account deleted.");
    showStudioView("auth");
    setStudioScreen(true, "/login");
  } catch (error) {
    setStudioStatus(studioAccountStatus, error.message || "Could not delete account.", true);
  } finally {
    if (accountDeleteButton) {
      accountDeleteButton.disabled = false;
    }
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
    if (window.AndroidStudioAuth?.startGoogleSignIn) {
      window.AndroidStudioAuth.startGoogleSignIn();
      return;
    }
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
createPageButtonHead?.addEventListener("click", openCreateWizard);
createEventButton?.addEventListener("click", () => {
  openCreateEventPanel();
});
createEventButtonHead?.addEventListener("click", () => {
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
      logoLink: currentProfile?.branding?.logoLink || "",
      faviconLink: currentProfile?.branding?.faviconLink || "",
      homepageLink: currentProfile?.branding?.homepageLink || "",
      customDomain: currentProfile?.branding?.customDomain || "",
      tagline: "",
    };
    const savedEvent = currentEditingEventId
      ? await updateEvent(eventPayload)
      : await createEvent(eventPayload);
    const selectedBackground = eventBackgroundInput?.files?.[0] || null;
    if (!currentEditingEventId && !selectedBackground) {
      throw new Error("Please upload a presentation background image.");
    }
    if (selectedBackground && savedEvent?.id) {
      setStudioStatus(createEventStatus, "Uploading background...");
      await uploadEventBackground(savedEvent.id, selectedBackground);
    }
    setStudioStatus(createEventStatus, currentEditingEventId ? "Event saved." : "Event created.");
    createEventForm.reset();
    if (eventBackgroundInput) {
      eventBackgroundInput.value = "";
    }
    await loadEvents();
    closeCreateEventPanel();
    showStudioDashboardSection("events");
  } catch (error) {
    setStudioStatus(createEventStatus, error.message || "Could not save event.", true);
  }
});

window.addEventListener("popstate", () => {
  closeStudioSidebarDrawer();
  if (
    (getEffectivePathname().startsWith("/studio") ||
      getEffectivePathname() === "/login" ||
      getEffectivePathname().startsWith("/event-moderate/")) &&
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
  applyEventGridColumnSizing();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && studioDashboardPanel?.classList.contains("sidebar-open")) {
    closeStudioSidebarDrawer({ restoreFocus: true });
  }
});

window.addEventListener("carnival-photo-like-updated", (event) => {
  const photoId = String(event.detail?.photoId || "").trim();
  const count = Math.max(0, Number(event.detail?.count) || 0);
  if (!photoId || !currentPublicEvent) {
    return;
  }

  const targetPhoto = (currentPublicEvent.livePhotos || []).find((photo) => photo.id === photoId);
  if (targetPhoto) {
    targetPhoto.likeCount = count;
  }
  syncEventPublicLikeBadge(photoId, count);
});

eventUploadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const selectedFiles = Array.from(eventUploadInput?.files || []);
    if (!selectedFiles.length) {
      throw new Error("Please choose a photo first.");
    }
    await uploadEventPhotos(selectedFiles);
  } catch (error) {
    eventUploadForm?.classList.remove("is-uploading");
    setStudioStatus(eventUploadStatus, error.message || "Could not upload the photo.", true);
  }
});

eventUploadInput?.addEventListener("change", () => {
  const files = Array.from(eventUploadInput.files || []);
  if (!files.length) {
    resetEventUploadPreview();
    return;
  }
  void uploadEventPhotos(files).catch((error) => {
    eventUploadForm?.classList.remove("is-uploading");
    setStudioStatus(eventUploadStatus, error.message || "Could not upload selected photos.", true);
  });
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
    if (!wizardState.pageName) {
      wizardState.pageName = String(data?.tree?.name || "").trim() || "Untitled Album";
    }
    if (wizardAlbumName && !wizardAlbumName.value.trim()) {
      wizardAlbumName.value = wizardState.pageName;
    }
    if (wizardAlbumTagline && !wizardAlbumTagline.value.trim() && wizardState.tagline) {
      wizardAlbumTagline.value = wizardState.tagline;
    }
    if (wizardAlbumStartDate && !wizardAlbumStartDate.value && wizardState.eventStartDate) {
      wizardAlbumStartDate.value = wizardState.eventStartDate;
    }
    if (wizardAlbumEndDate && !wizardAlbumEndDate.value && wizardState.eventEndDate) {
      wizardAlbumEndDate.value = wizardState.eventEndDate;
    }
    updateWizardAlbumUrlPreview();
    wizardState.folderRemapById = buildDefaultFolderRemap();
    if (!wizardState.youtubeLinks.length) {
      wizardState.youtubeLinks = [];
      addYoutubeLinkRow();
      addYoutubeLinkRow();
    } else {
      renderYoutubeLinksStep();
    }
    if (wizardCreateVideosFolder) {
      wizardCreateVideosFolder.checked = Boolean(wizardState.includeYoutubeVideosFolder);
    }
    renderFolderRemapStep();
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
    setStudioStatus(wizardDetailsStatus, "");
    setStudioStatus(wizardRemapStatus, "Rename tabs if needed, then continue.");
    showWizardStep(2);
  } catch (error) {
    setStudioStatus(wizardDriveStatus, error.message, true);
  }
});

wizardDetailsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const pageName = String(wizardAlbumName?.value || "").trim();
    const pageSlug = slugify(pageName);
    if (!pageName || !pageSlug) {
      throw new Error("Please enter a valid album name.");
    }
    wizardState.pageName = pageName;
    wizardState.pageSlug = pageSlug;
    wizardState.tagline = String(wizardAlbumTagline?.value || "").trim();
    wizardState.eventStartDate = String(wizardAlbumStartDate?.value || "").trim();
    wizardState.eventEndDate = String(wizardAlbumEndDate?.value || "").trim();
    setStudioStatus(wizardDetailsStatus, "");
    showWizardStep(3);
  } catch (error) {
    setStudioStatus(wizardDetailsStatus, error.message || "Could not save album details.", true);
  }
});

wizardAlbumName?.addEventListener("input", () => {
  updateWizardAlbumUrlPreview();
});

wizardMediaSearch?.addEventListener("input", renderMediaPicker);

wizardMediaNext?.addEventListener("click", () => {
  if (!wizardState.selectedCover) {
    setStudioStatus(wizardMediaStatus, "Select one image to use as the cover.", true);
    return;
  }
  setStudioStatus(wizardMediaStatus, "");
  showWizardStep(6);
});

wizardRemapForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    wizardState.includeYoutubeVideosFolder = Boolean(wizardCreateVideosFolder?.checked);
    setStudioStatus(wizardRemapStatus, "Checking for duplicates...");
    await checkPageDuplicate(wizardState.pageSlug, wizardState.driveLink);
    setStudioStatus(wizardRemapStatus, "");
    if (wizardState.includeYoutubeVideosFolder) {
      showWizardStep(4);
      return;
    }
    showWizardStep(5);
  } catch (error) {
    setStudioStatus(wizardRemapStatus, error.message, true);
  }
});

wizardCreateVideosFolder?.addEventListener("change", () => {
  wizardState.includeYoutubeVideosFolder = Boolean(wizardCreateVideosFolder.checked);
});

wizardYoutubeAdd?.addEventListener("click", () => {
  addYoutubeLinkRow();
});

wizardYoutubeNext?.addEventListener("click", () => {
  if (!isYoutubeStepComplete()) {
    setStudioStatus(wizardYoutubeStatus, "Validate all entered YouTube links to continue.", true);
    return;
  }
  showWizardStep(5);
});

wizardCreatePage?.addEventListener("click", async () => {
  try {
    const isEditMode = wizardState.mode === "edit";
    setStudioStatus(wizardTemplateStatus, isEditMode ? "Updating album..." : "Creating album...");
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
    showStudioToast(isEditMode ? "Album updated." : "Album created.");
  } catch (error) {
    setStudioStatus(wizardTemplateStatus, error.message, true);
  }
});

wizardTemplateCards.forEach((card) => {
  if (card.dataset.bound === "true") {
    return;
  }
  card.addEventListener("click", () => {
    selectAlbumTemplate(card.dataset.templateId || "template-1");
  });
  card.dataset.bound = "true";
});

if (getEffectivePathname().startsWith("/studio") || getEffectivePathname() === "/login") {
  setStudioScreen(true);
}

initializeFirebase();
