const directLinkForm = document.getElementById("direct-link-form");
const directLinkInput = document.getElementById("direct-link-input");
const directStatusEl = document.getElementById("direct-status");
const directLoadingIndicatorEl = document.getElementById("direct-loading-indicator");
const directLoadingPercentEl = document.getElementById("direct-loading-percent");
const directLoadingMessageEl = document.getElementById("direct-loading-message");
const bootLoaderEl = document.getElementById("boot-loader");
const bootLoaderAnimationEl = document.getElementById("boot-loader-animation");

const screenDirectLink = document.getElementById("screen-direct-link");
const screenGallery = document.getElementById("screen-gallery");
const workspaceMain = screenGallery?.querySelector(".workspace-main");

const galleryEl = document.getElementById("gallery");
const coverPhotoEl = document.getElementById("cover-photo");
const galleryFolderPathEl = document.getElementById("gallery-folder-path");
const photoCountEl = document.getElementById("photo-count");
const galleryErrorStateEl = document.getElementById("gallery-error-state");
const galleryErrorMessageEl = document.getElementById("gallery-error-message");
const panelFaviconEl = document.querySelector(".panel-favicon");
const craftedFooterAlbumFaviconEl = document.getElementById("crafted-footer-album-favicon");
const selectedGridFolderEl = document.getElementById("selected-grid-folder");
const folderTabsEl = document.getElementById("folder-tabs");
const folderTabsShellEl = document.querySelector(".folder-tabs-shell");
const folderTabsStickyEl = document.getElementById("folder-tabs-sticky");
const folderTabsStickyShellEl = document.getElementById("folder-tabs-sticky-shell");
const scrollToTopButton = document.getElementById("scroll-to-top-button");
let toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
const toggleSlideshowSettingsButton = document.getElementById("toggle-slideshow-settings");
const closeGallerySettingsButton = document.getElementById("close-gallery-settings");

const startSlideshowButton = document.getElementById("start-slideshow");

const durationReadoutEl = document.getElementById("duration-readout");
const durationCountEl = document.getElementById("duration-count");
const durationDecreaseButton = document.getElementById("duration-decrease");
const durationIncreaseButton = document.getElementById("duration-increase");
const loopInput = document.getElementById("loop-input");

const slideshowEl = document.getElementById("slideshow");
const slideCardEl = document.getElementById("slide-card-a");
const slideCardFullEl = document.getElementById("slide-card-b");
const slideImageEl = document.getElementById("slide-image");
const slideImageFullEl = document.getElementById("slide-image-full");
const slideVideoEl = document.getElementById("slide-video");
const slideVideoOverlayEl = document.getElementById("slide-video-overlay");
const slideVideoControlsEl = document.getElementById("slide-video-controls");
const slideVideoToggleButton = document.getElementById("slide-video-toggle");
const slideVideoToggleIconEl = document.getElementById("slide-video-toggle-icon");
const slideVideoTimelineEl = document.getElementById("slide-video-timeline");
const slideVideoProgressEl = document.getElementById("slide-video-progress");
const slideVideoTooltipEl = document.getElementById("slide-video-tooltip");
const slideshowLoaderEl = document.getElementById("slideshow-loader");
const slideshowToastEl = document.getElementById("slideshow-toast");
const closeSlideshowMobileButton = document.getElementById("close-slideshow-mobile");
const likeSlideButton = document.getElementById("like-slide");
const slideshowLikeIconEl = document.getElementById("slideshow-like-icon");
const slideshowLikeCountEl = document.getElementById("slideshow-like-count");
const shareSlideButton = document.getElementById("share-slide");
const downloadSlideButton = document.getElementById("download-slide");
const toggleSlideshowPlaybackButton = document.getElementById("toggle-slideshow-playback");
const enterSlideshowFullscreenButton = document.getElementById("enter-slideshow-fullscreen");
const slideshowPlaybackIconEl = document.getElementById("slideshow-playback-icon");
const prevSlideButton = document.getElementById("prev-slide");
const nextSlideButton = document.getElementById("next-slide");
const logoAssetPath = "/assets/carnivalstories-logo.svg?v=20260423";
const PRODUCT_HOME_URL = "https://carnivalshowcase.kaustubhmokashi.com/";
const BOOT_LOADER_DATA_PATH = "/assets/boot-loader.json?v=20260428a";
const BOOT_LOADER_MIN_VISIBLE_MS = 1200;

let currentFolders = [];
let selectedFolderId = null;
let coverPhoto = null;
let coverTagline = "";
let coverDateRange = "";
let activeBranding = {
  backgroundColor: "#FFFFFF",
  accentColor: "#000000",
  logoLink: "",
  faviconLink: "",
  homepageLink: "",
  shareMessage: "",
};
let sharedFolderName = "";
let images = [];
let currentSlideIndex = -1;
let imageLoadFailures = 0;
let slideshowPreloadCache = new Map();
let folderThumbnailPreloadCache = new Map();
let slideshowImageLoadToken = 0;
let loadTimer = null;
let slideshowAdvanceTimer = null;
let folderPreloadRunToken = 0;
let activeVideoSlideLocked = false;
let galleryLayoutFrame = null;
let activeGalleryRenderToken = 0;
let pendingGalleryThumbnailLoads = 0;
let galleryRowObserver = null;
let loadingProgress = 0;
let loadingProgressTarget = 0;
let loadingProgressMessageBase = "";
let loadingMessageDots = 0;
let loadingFadeTimer = null;
let loadingSafetyTimer = null;
let lastGalleryActivationAt = 0;
let lastGalleryActivationKey = "";
let slideshowPaused = false;
let slideshowUiHideTimer = null;
let currentPublicPageId = "";
let currentPhotoLikes = {};
let likedPhotoSessionIds = new Set();
let currentLikeContext = {
  enabled: false,
  likeEndpoint: "/api/public-page/like",
  unlikeEndpoint: "/api/public-page/unlike",
  payload: {},
};
let currentSlideshowOptions = {
  shareEnabled: true,
};
let slideshowConfig = {
  duration: 4,
  loop: false,
  autoplay: false,
};
let bootLoaderAnimation = null;
let activeSlideCardIndex = -1;
let activeSlideMotionPresetIndex = -1;
const slideshowMotionPresets = [
  { fromX: "-110vw", fromY: "-110vh", toX: "110vw", toY: "110vh" },
  { fromX: "110vw", fromY: "-110vh", toX: "-110vw", toY: "110vh" },
  { fromX: "-110vw", fromY: "110vh", toX: "110vw", toY: "-110vh" },
  { fromX: "110vw", fromY: "110vh", toX: "-110vw", toY: "-110vh" },
];
const ALBUM_PRESENT_ENTER_MS = 500;
const ALBUM_PRESENT_PUSH_DELAY_MS = 180;
const ALBUM_PRESENT_EXIT_MS = 500;
const ALBUM_PRESENT_HOLD_MS = 3000;
const ALBUM_PRESENT_CYCLE_MS = ALBUM_PRESENT_ENTER_MS + ALBUM_PRESENT_HOLD_MS;
let bootLoaderHidden = !window.CarnivalBootLoaderRoute;
let bootLoaderAnimationInitialized = false;
let bootLoaderHideRequested = false;
let bootLoaderInitializationScheduled = false;
let bootLoaderHideTimer = null;
const bootLoaderShownAt = window.CarnivalBootLoaderRoute ? Date.now() : 0;
let currentShareContext = {
  tagline: "",
  studioName: "",
  pageUrl: "",
  pairingCode: "",
};
let pendingSharedFolderId = "";
let pendingSharedPhotoId = "";
let pendingAlbumPresentationFromUrl = false;
let albumPresentationActive = false;
let albumPresentationSourceImages = null;
let allMediaItems = [];
let currentFaceFilter = {
  active: false,
  faceId: "",
  photoIds: new Set(),
  groupCount: 0,
  previewDataUrl: "",
};
let galleryVisualReadyPromise = null;
let resolveGalleryVisualReady = null;
const INITIAL_GALLERY_BATCH_SIZE = 36;
const GALLERY_BATCH_SIZE = 48;
const PRESENTATION_DEBUG_ENABLED = new URLSearchParams(window.location.search).has("debugPresentation");

function pushMobileSlideshowDebug(message) {
  try {
    const state = window.__mobileSlideshowDebug || (window.__mobileSlideshowDebug = { logs: [] });
    const stamp = new Date().toISOString().slice(11, 23);
    state.logs.unshift(`${stamp} ${message}`);
    state.logs = state.logs.slice(0, 20);
  } catch (_) {}
}

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

function beginGalleryVisualWait() {
  galleryVisualReadyPromise = new Promise((resolve) => {
    resolveGalleryVisualReady = resolve;
  });
}

function markGalleryVisualReady() {
  if (!resolveGalleryVisualReady) {
    return;
  }
  resolveGalleryVisualReady();
  resolveGalleryVisualReady = null;
}

async function waitForGalleryVisualReady(timeoutMs = 3500) {
  if (!galleryVisualReadyPromise) {
    return;
  }

  await Promise.race([
    galleryVisualReadyPromise,
    new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

function focusElement(element) {
  if (!element) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (typeof element.focus === "function") {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }
  });
}

function scheduleBootLoaderInitialization() {
  if (bootLoaderAnimationInitialized || bootLoaderInitializationScheduled || !window.CarnivalBootLoaderRoute) {
    return;
  }

  bootLoaderInitializationScheduled = true;
  window.setTimeout(() => {
    bootLoaderInitializationScheduled = false;
    void initializeBootLoader();
  }, 0);
}

async function initializeBootLoader() {
  if (
    !window.CarnivalBootLoaderRoute ||
    !bootLoaderEl ||
    !bootLoaderAnimationEl
  ) {
    return;
  }

  document.body.classList.add("boot-loader-lock");

  if (bootLoaderAnimationInitialized) {
    return;
  }

  if (typeof window.lottie?.loadAnimation !== "function") {
    scheduleBootLoaderInitialization();
    return;
  }

  bootLoaderAnimationInitialized = true;

  try {
    const response = await fetch(BOOT_LOADER_DATA_PATH, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Boot loader animation could not be loaded (${response.status}).`);
    }
    const animationData = await response.json();
    bootLoaderAnimation = window.lottie.loadAnimation({
      container: bootLoaderAnimationEl,
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

function performBootLoaderHide() {
  if (!bootLoaderEl || bootLoaderHidden) {
    return;
  }

  bootLoaderHidden = true;
  document.documentElement.classList.remove("boot-loader-visible");
  bootLoaderEl.classList.add("is-hiding");
  window.setTimeout(() => {
    bootLoaderEl.style.display = "none";
    bootLoaderAnimation?.destroy?.();
    bootLoaderAnimation = null;
    document.body.classList.remove("boot-loader-lock");
  }, 320);
}

function requestBootLoaderHide() {
  if (!bootLoaderEl || bootLoaderHidden) {
    return;
  }

  bootLoaderHideRequested = true;
  const remainingVisibleMs = Math.max(0, BOOT_LOADER_MIN_VISIBLE_MS - (Date.now() - bootLoaderShownAt));
  if (remainingVisibleMs > 0) {
    window.clearTimeout(bootLoaderHideTimer);
    bootLoaderHideTimer = window.setTimeout(() => {
      bootLoaderHideTimer = null;
      if (bootLoaderHideRequested) {
        performBootLoaderHide();
      }
    }, remainingVisibleMs);
    return;
  }

  performBootLoaderHide();
}

function isEditableTarget(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function slugifyFolderName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFolderShareLink(folder) {
  const slug = slugifyFolderName(folder?.name);
  const base = window.location.origin.replace(/\/$/, "");
  return slug ? `${base}/${slug}` : `${base}/`;
}

function getCurrentPageShareUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function getResolvedPathname() {
  const normalized = String(window.CarnivalResolvedPathname || "").trim();
  if (normalized.startsWith("/")) {
    return normalized || "/";
  }
  return window.location.pathname || "/";
}

function buildSlideShareUrl(photo = getCurrentSlidePhoto()) {
  const currentFolder = getSelectedFolder();
  if (!photo?.id) {
    return getCurrentPageShareUrl();
  }

  const url = new URL(getCurrentPageShareUrl());
  if (currentFolder?.id) {
    url.searchParams.set("folder", currentFolder.id);
  }
  url.searchParams.set("photo", photo.id);
  return url.toString();
}

function buildAlbumShareMessage({ shareMessage = "", tagline = "", pageUrl = "", pairingCode = "" } = {}) {
  const lines = [];
  const trimmedShareMessage = String(shareMessage || "").trim();
  const trimmedTagline = String(tagline || "").trim() || "CarnivalStories";
  const trimmedPageUrl = String(pageUrl || "").trim() || getCurrentPageShareUrl();
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

function syncPendingSharedSelectionFromLocation() {
  const params = new URLSearchParams(window.location.search);
  pendingSharedFolderId = String(params.get("folder") || "").trim();
  pendingSharedPhotoId = String(params.get("photo") || "").trim();
  pendingAlbumPresentationFromUrl = isAlbumPresentationRoute();
}

function getCurrentSlidePhoto() {
  return images[currentSlideIndex] || null;
}

function isVideoMedia(item) {
  return Boolean(item?.mimeType && item.mimeType.startsWith("video/"));
}

function isVideosFolder(folder) {
  if (!folder) {
    return false;
  }

  const normalizedName = String(folder.name || "").trim().toLowerCase();
  if (normalizedName === "videos") {
    return true;
  }

  const folderImages = Array.isArray(folder.images) ? folder.images : [];
  return folderImages.length > 0 && folderImages.every((item) => isVideoMedia(item));
}

function orderFoldersForTabs(folders) {
  const list = Array.isArray(folders) ? [...folders] : [];
  const nonVideoFolders = list.filter((folder) => !isVideosFolder(folder));
  const videoFolders = list.filter((folder) => isVideosFolder(folder));
  return [...nonVideoFolders, ...videoFolders];
}

function normalizeYoutubeUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    return parsed.toString();
  } catch (_) {
    return "";
  }
}

function extractYoutubeVideoId(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    const host = String(parsed.hostname || "").toLowerCase();
    if (host === "youtu.be") {
      return String(parsed.pathname || "").replace(/^\/+/, "").split("/")[0] || "";
    }
    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return String(parsed.searchParams.get("v") || "").trim();
      }
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?#]+)/i);
      if (shortsMatch?.[1]) {
        return String(shortsMatch[1]).trim();
      }
      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?#]+)/i);
      if (embedMatch?.[1]) {
        return String(embedMatch[1]).trim();
      }
    }
  } catch (_) {
    return "";
  }

  return "";
}

function getYoutubePlaybackUrl(rawUrl) {
  const normalized = normalizeYoutubeUrl(rawUrl);
  if (!normalized) {
    return "";
  }
  const videoId = extractYoutubeVideoId(normalized);
  if (!videoId) {
    return normalized;
  }
  // Use watch URL for reliable playback across domains (embed can fail with Error 153).
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function getYoutubeEmbedUrl(rawUrl) {
  const normalized = normalizeYoutubeUrl(rawUrl);
  if (!normalized) {
    return "";
  }
  const videoId = extractYoutubeVideoId(normalized);
  if (!videoId) {
    return "";
  }
  const origin = encodeURIComponent(window.location.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0&origin=${origin}`;
}

let youtubeDialogState = null;

function ensureYoutubeDialog() {
  if (youtubeDialogState) {
    return youtubeDialogState;
  }

  const overlay = document.createElement("div");
  overlay.className = "youtube-dialog-overlay hidden";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="youtube-dialog-shell">
      <button type="button" class="youtube-dialog-close" aria-label="Close video">
        <img src="/assets/icons/Close.svg" alt="" aria-hidden="true" />
      </button>
      <iframe class="youtube-dialog-frame" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    .youtube-dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:1200;display:flex;align-items:center;justify-content:center;padding:10px}
    .youtube-dialog-overlay.hidden{display:none}
    .youtube-dialog-shell{width:min(1100px,100%);background:#111;padding:0;position:relative}
    .youtube-dialog-close{position:absolute;top:10px;right:10px;border:0;background:transparent;color:#fff;padding:0;cursor:pointer;z-index:2;line-height:0}
    .youtube-dialog-close img{width:24px;height:24px;display:block;filter:brightness(0) invert(1)}
    .youtube-dialog-frame{width:100%;aspect-ratio:16/9;border:0;background:#000}
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  const frame = overlay.querySelector(".youtube-dialog-frame");
  const closeButton = overlay.querySelector(".youtube-dialog-close");

  const close = () => {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    frame.src = "";
  };

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  youtubeDialogState = { overlay, frame, close };
  return youtubeDialogState;
}

function openYoutubeDialog(rawUrl) {
  const embedUrl = getYoutubeEmbedUrl(rawUrl);
  const playbackUrl = getYoutubePlaybackUrl(rawUrl);
  const dialog = ensureYoutubeDialog();
  if (!embedUrl) {
    if (playbackUrl) {
      window.open(playbackUrl, "_blank", "noopener,noreferrer");
      return true;
    }
    return false;
  }
  dialog.frame.src = embedUrl;
  dialog.overlay.classList.remove("hidden");
  dialog.overlay.setAttribute("aria-hidden", "false");
  return true;
}

function buildYoutubeVideosFolderFromLinks(youtubeLinks = []) {
  const links = Array.isArray(youtubeLinks) ? youtubeLinks : [];
  const media = links
    .map((item, index) => {
      const url = normalizeYoutubeUrl(item?.url);
      if (!url) {
        return null;
      }

      return {
        id: `youtube-${index}-${btoa(url).replace(/=+$/g, "")}`,
        name: String(item?.title || item?.url || `Video ${index + 1}`),
        mimeType: "video/youtube",
        path: "Videos",
        folderPath: "Videos",
        width: null,
        height: null,
        url,
        slideshowUrl: url,
        thumbnailUrl: String(item?.thumbnailUrl || ""),
        webViewLink: url,
      };
    })
    .filter(Boolean);

  if (!media.length) {
    return null;
  }

  return {
    id: "__youtube_videos__",
    name: "Videos",
    path: "Videos",
    photoCount: 0,
    mediaCount: media.length,
    images: media,
  };
}

function mergeYoutubeVideosFolder(folders, options = {}) {
  const youtubeLinks = Array.isArray(options?.youtubeLinks) ? options.youtubeLinks : [];
  if (!youtubeLinks.length) {
    return orderFoldersForTabs(folders);
  }

  const merged = Array.isArray(folders) ? [...folders] : [];
  const youtubeFolder = buildYoutubeVideosFolderFromLinks(youtubeLinks);
  if (!youtubeFolder) {
    return orderFoldersForTabs(merged);
  }

  const existingVideosFolderIndex = merged.findIndex((folder) => String(folder?.name || "").trim().toLowerCase() === "videos");
  if (existingVideosFolderIndex >= 0) {
    const existing = merged[existingVideosFolderIndex];
    const existingImages = Array.isArray(existing?.images) ? existing.images : [];
    const bySource = new Map();
    [...existingImages, ...youtubeFolder.images].forEach((item) => {
      const key = String(item?.webViewLink || item?.slideshowUrl || item?.url || item?.id || "").trim();
      if (!key) {
        return;
      }
      bySource.set(key, item);
    });
    merged[existingVideosFolderIndex] = {
      ...existing,
      images: Array.from(bySource.values()),
      mediaCount: Array.from(bySource.values()).length,
      photoCount: 0,
    };
  } else {
    merged.push(youtubeFolder);
  }

  return orderFoldersForTabs(merged);
}

function normalizePhotoLikesMap(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([photoId, count]) => [String(photoId || "").trim(), Math.max(0, Number(count) || 0)])
      .filter(([photoId]) => photoId)
  );
}

function setPublicPageContext(options = {}) {
  currentPublicPageId = String(options.publicPageId || "").trim();
  currentPhotoLikes = normalizePhotoLikesMap(options.photoLikes);
  likedPhotoSessionIds = new Set();
  currentLikeContext = {
    enabled: Boolean(currentPublicPageId),
    likeEndpoint: "/api/public-page/like",
    unlikeEndpoint: "/api/public-page/unlike",
    payload: currentPublicPageId ? { publicPageId: currentPublicPageId } : {},
  };
  currentSlideshowOptions = {
    shareEnabled: true,
  };
  currentShareContext = {
    tagline: String(options.tagline || "").trim(),
    studioName: String(options.studioName || "").trim(),
    pageUrl: String(options.pageUrl || getCurrentPageShareUrl()).trim(),
    pairingCode: String(options.pairingCode || "").trim(),
  };
  syncDocumentTitle();
}

function syncDocumentTitle() {
  const tagline = String(currentShareContext.tagline || "").trim();
  const studioName = String(currentShareContext.studioName || "").trim();
  const title = [tagline, studioName].filter(Boolean).join(" | ");
  document.title = title || "CarnivalShowcase";
}

function hasPublicPageLikes() {
  return Boolean(currentLikeContext.enabled);
}

function getPhotoLikeCount(photoId) {
  return Math.max(0, Number(currentPhotoLikes[String(photoId || "").trim()]) || 0);
}

function renderPhotoLikeBadge(photo) {
  const badge = document.createElement("div");
  badge.className = "photo-like-badge";
  badge.dataset.photoId = String(photo?.id || "");
  badge.setAttribute("aria-hidden", "true");

  const icon = document.createElement("span");
  const count = getPhotoLikeCount(photo?.id);
  icon.className = `photo-like-badge-icon icon-mask ${count > 0 ? "icon-heart-selected" : "icon-heart-empty"}`;
  icon.setAttribute("aria-hidden", "true");
  badge.appendChild(icon);

  if (count > 0) {
    const countEl = document.createElement("span");
    countEl.className = "photo-like-badge-count";
    countEl.textContent = String(count);
    badge.appendChild(countEl);
  }

  return badge;
}

function syncGridLikeBadges(photoId) {
  galleryEl.querySelectorAll(`.photo-like-badge[data-photo-id="${CSS.escape(String(photoId || ""))}"]`).forEach((badge) => {
    const icon = badge.querySelector(".photo-like-badge-icon");
    const count = getPhotoLikeCount(photoId);
    if (icon) {
      icon.classList.toggle("icon-heart-empty", count <= 0);
      icon.classList.toggle("icon-heart-selected", count > 0);
    }

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

function updateSlideshowLikeVisual(photo = getCurrentSlidePhoto()) {
  if (!likeSlideButton || !slideshowLikeIconEl || !slideshowLikeCountEl) {
    return;
  }

  const shouldShow = hasPublicPageLikes() && !isVideoMedia(photo);
  likeSlideButton.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    return;
  }

  const count = getPhotoLikeCount(photo.id);
  const likedInSession = likedPhotoSessionIds.has(photo.id);
  slideshowLikeIconEl.classList.toggle("icon-heart-empty", !likedInSession);
  slideshowLikeIconEl.classList.toggle("icon-heart-selected", likedInSession);
  slideshowLikeCountEl.textContent = count > 0 ? String(count) : "";
  slideshowLikeCountEl.classList.toggle("hidden", count <= 0);
}

async function updatePhotoLikeCount(endpoint, photo) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...currentLikeContext.payload,
      photoId: photo.id,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not save the photo like.");
  }

  currentPhotoLikes[photo.id] = Math.max(0, Number(payload?.count) || 0);
  syncGridLikeBadges(photo.id);
  updateSlideshowLikeVisual(photo);
  window.dispatchEvent(
    new CustomEvent("carnival-photo-like-updated", {
      detail: {
        photoId: photo.id,
        count: currentPhotoLikes[photo.id],
      },
    })
  );
}

async function togglePhotoLike(photo = getCurrentSlidePhoto()) {
  if (!hasPublicPageLikes() || !photo?.id) {
    return;
  }

  if (likedPhotoSessionIds.has(photo.id)) {
    const previousCount = getPhotoLikeCount(photo.id);
    await updatePhotoLikeCount(currentLikeContext.unlikeEndpoint, photo);
    likedPhotoSessionIds.delete(photo.id);
    currentPhotoLikes[photo.id] = Math.max(0, Number(currentPhotoLikes[photo.id]) || previousCount - 1);
    syncGridLikeBadges(photo.id);
    updateSlideshowLikeVisual(photo);
    return;
  }

  await updatePhotoLikeCount(currentLikeContext.likeEndpoint, photo);
  likedPhotoSessionIds.add(photo.id);
  updateSlideshowLikeVisual(photo);
}

function createImageUrl(fileId, mode = "full") {
  const url = new URL("/api/image", window.location.origin);
  url.searchParams.set("id", fileId);
  if (mode === "thumb" || mode === "screen") {
    url.searchParams.set("mode", mode === "screen" ? "screen" : "thumb");
  }
  return `${url.pathname}${url.search}`;
}

function updateVideoToggleVisual(isPlaying) {
  if (!slideVideoToggleIconEl || !slideVideoToggleButton) {
    return;
  }

  slideVideoToggleIconEl.classList.toggle("is-play", !isPlaying);
  slideVideoToggleIconEl.classList.toggle("is-pause", isPlaying);
  slideVideoToggleButton.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");
}

function updateSlideshowPlaybackVisual() {
  if (!slideshowPlaybackIconEl || !toggleSlideshowPlaybackButton) {
    return;
  }

  slideshowPlaybackIconEl.classList.toggle("is-play", slideshowPaused);
  slideshowPlaybackIconEl.classList.toggle("is-pause", !slideshowPaused);
  toggleSlideshowPlaybackButton.setAttribute("aria-label", slideshowPaused ? "Resume slideshow" : "Pause slideshow");
}

function setSlideshowPaused(nextPaused) {
  slideshowPaused = Boolean(nextPaused);
  updateSlideshowPlaybackVisual();

  if (slideshowPaused) {
    clearSlideshowAdvanceTimer();
    return;
  }

  scheduleSlideshowAdvance();
}

function toggleSlideshowPlayback() {
  setSlideshowPaused(!slideshowPaused);
}

function clearSlideshowUiHideTimer() {
  if (slideshowUiHideTimer) {
    window.clearTimeout(slideshowUiHideTimer);
    slideshowUiHideTimer = null;
  }
}

function isSlideshowOpen() {
  return Boolean(slideshowEl && !slideshowEl.classList.contains("hidden"));
}

function setSlideshowFullscreenVisualState() {
  if (!slideshowEl) {
    return;
  }

  slideshowEl.classList.toggle("slideshow-fullscreen", isSlideshowFullscreen());
}

function hideSlideshowUi() {
  if (!slideshowEl || !isSlideshowOpen() || isSlideshowFullscreen()) {
    return;
  }

  slideshowEl.classList.add("slideshow-ui-hidden");
}

function scheduleSlideshowUiHide() {
  clearSlideshowUiHideTimer();

  if (!slideshowEl || !isSlideshowOpen() || isSlideshowFullscreen()) {
    return;
  }

  slideshowUiHideTimer = window.setTimeout(() => {
    hideSlideshowUi();
  }, 2000);
}

function showSlideshowUi({ autoHide = true } = {}) {
  if (!slideshowEl || !isSlideshowOpen() || isSlideshowFullscreen()) {
    return;
  }

  slideshowEl.classList.remove("slideshow-ui-hidden");

  if (autoHide) {
    scheduleSlideshowUiHide();
    return;
  }

  clearSlideshowUiHideTimer();
}

function handleSlideshowInteraction() {
  if (!isSlideshowOpen() || isSlideshowFullscreen()) {
    return;
  }

  showSlideshowUi();
}

function updateVideoProgress() {
  if (!slideVideoEl || !slideVideoProgressEl) {
    return;
  }

  const duration = Number(slideVideoEl.duration) || 0;
  const currentTime = Number(slideVideoEl.currentTime) || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  slideVideoProgressEl.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function formatMediaTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateTimelineTooltip(clientX) {
  if (!slideVideoEl || !slideVideoTimelineEl || !slideVideoTooltipEl) {
    return;
  }

  const rect = slideVideoTimelineEl.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const duration = Number(slideVideoEl.duration) || 0;
  slideVideoTooltipEl.textContent = formatMediaTime(duration * ratio);
  slideVideoTooltipEl.style.left = `${ratio * rect.width}px`;
}

function seekCurrentVideo(clientX) {
  if (!slideVideoEl || !slideVideoTimelineEl) {
    return;
  }

  const rect = slideVideoTimelineEl.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const duration = Number(slideVideoEl.duration) || 0;
  slideVideoEl.currentTime = duration * ratio;
  updateVideoProgress();
}

async function toggleCurrentVideoPlayback() {
  const media = getCurrentSlidePhoto();
  if (!slideVideoEl || !media || !isVideoMedia(media)) {
    return;
  }

  if (slideVideoEl.paused || slideVideoEl.ended) {
    activeVideoSlideLocked = true;
    clearSlideshowAdvanceTimer();
    slideVideoOverlayEl?.classList.add("hidden");

    try {
      await slideVideoEl.play();
    } catch (error) {
      activeVideoSlideLocked = false;
      slideVideoOverlayEl?.classList.remove("hidden");
      updateVideoToggleVisual(false);
      scheduleSlideshowAdvance();
    }
    return;
  }

  slideVideoEl.pause();
}

function getGalleryPath() {
  const slug = slugifyFolderName(sharedFolderName);
  if (slug) {
    return `/${slug}`;
  }

  const currentPath = getResolvedPathname();
  return currentPath !== "/" ? currentPath : "/";
}

function moveFocusByGeometry(elements, direction) {
  if (!elements.length) {
    return;
  }

  const currentIndex = elements.findIndex((element) => element === document.activeElement);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  if (direction === "left" || direction === "right") {
    const delta = direction === "left" ? -1 : 1;
    const nextIndex = Math.max(0, Math.min(elements.length - 1, safeIndex + delta));
    focusElement(elements[nextIndex]);
    return;
  }

  const currentRect = elements[safeIndex].getBoundingClientRect();
  const currentCenterX = currentRect.left + currentRect.width / 2;
  const movingDown = direction === "down";
  let bestElement = null;
  let bestScore = Number.POSITIVE_INFINITY;

  elements.forEach((element, index) => {
    if (index === safeIndex) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const isCandidate = movingDown ? rect.top > currentRect.top + 12 : rect.top < currentRect.top - 12;
    if (!isCandidate) {
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const verticalDistance = Math.abs(rect.top - currentRect.top);
    const horizontalDistance = Math.abs(centerX - currentCenterX);
    const score = verticalDistance * 10 + horizontalDistance;

    if (score < bestScore) {
      bestScore = score;
      bestElement = element;
    }
  });

  if (bestElement) {
    focusElement(bestElement);
  }
}

function getFolderTabCards() {
  return Array.from(folderTabsEl.querySelectorAll(".folder-tab"));
}

function moveFolderTabFocus(direction) {
  moveFocusByGeometry(getFolderTabCards(), direction);
}

function getMasonryTileSpan(photo, index) {
  const width = Number(photo.width) || 0;
  const height = Number(photo.height) || 0;
  const ratio = width > 0 && height > 0 ? width / height : 1;
  return {
    aspectRatio: ratio > 0 ? ratio : 1,
  };
}

function getGalleryColumnCount() {
  const galleryWidth = galleryEl?.clientWidth || window.innerWidth;
  const viewportWidth = window.innerWidth;
  const gap = 1;
  let minimumTileWidth = 220;
  if (viewportWidth <= 1100) {
    minimumTileWidth = 180;
  }
  if (viewportWidth <= 720) {
    minimumTileWidth = 150;
  }

  const maxColumnsByWidth = Math.max(1, Math.floor((galleryWidth + gap) / (minimumTileWidth + gap)));
  return Math.min(4, maxColumnsByWidth);
}

function getCardAspectRatio(card) {
  const cardRatio = Number(card.dataset.aspectRatio);
  return Number.isFinite(cardRatio) && cardRatio > 0 ? cardRatio : 1;
}

function layoutGalleryMasonry() {
  if (!galleryEl || !galleryEl.children.length) {
    clearGalleryRowObserver();
    return;
  }

  const cards = Array.from(galleryEl.querySelectorAll(".photo-card"));
  if (!cards.length) {
    galleryEl.style.height = "0px";
    clearGalleryRowObserver();
    return;
  }

  const columnCount = getGalleryColumnCount();
  const gap = 1;
  const galleryWidth = galleryEl.clientWidth;
  if (!galleryWidth) {
    return;
  }

  const columnWidth = (galleryWidth - gap * (columnCount - 1)) / columnCount;
  const columnHeights = Array(columnCount).fill(0);

  cards.forEach((card, index) => {
    const ratio = getCardAspectRatio(card);
    const height = columnWidth / ratio;
    const columnIndex = index < columnCount ? index : columnHeights.indexOf(Math.min(...columnHeights));
    const x = columnIndex * (columnWidth + gap);
    const y = columnHeights[columnIndex];

    card.style.position = "absolute";
    card.style.width = `${columnWidth}px`;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    card.style.height = `${height}px`;

    columnHeights[columnIndex] = y + height + gap;
  });

  galleryEl.style.height = `${Math.max(...columnHeights) - gap}px`;
  setupGalleryRowReveal();
}

function queueGalleryLayout() {
  if (galleryLayoutFrame) {
    window.cancelAnimationFrame(galleryLayoutFrame);
  }

  galleryLayoutFrame = window.requestAnimationFrame(() => {
    galleryLayoutFrame = null;
    layoutGalleryMasonry();
  });
}

function clearGalleryRowObserver() {
  if (!galleryRowObserver) {
    return;
  }

  galleryRowObserver.disconnect();
  galleryRowObserver = null;
}

function revealGalleryRow(cards) {
  cards.forEach((card) => {
    card.classList.remove("row-pending");
    card.classList.add("row-visible");
  });
}

function setupGalleryRowReveal() {
  clearGalleryRowObserver();

  if (!screenGallery.classList.contains("revealed")) {
    return;
  }

  const cards = Array.from(galleryEl.querySelectorAll(".photo-card:not(.photo-card-cover)"));
  if (!cards.length) {
    return;
  }

  const rowGroups = [];
  const rowTolerance = 3;

  cards.forEach((card) => {
    const top = Number.parseFloat(card.style.top || "0");
    let row = rowGroups.find((group) => Math.abs(group.top - top) <= rowTolerance);
    if (!row) {
      row = { top, cards: [] };
      rowGroups.push(row);
      rowGroups.sort((a, b) => a.top - b.top);
    }
    row.cards.push(card);
  });

  rowGroups.forEach((row, rowIndex) => {
    const alreadyVisible = row.cards.some((card) => card.classList.contains("row-visible"));
    row.cards.forEach((card) => {
      card.dataset.rowIndex = String(rowIndex);
      if (alreadyVisible) {
        card.classList.remove("row-pending");
        card.classList.add("row-visible");
      } else {
        card.classList.add("row-pending");
        card.classList.remove("row-visible");
      }
    });
  });

  galleryRowObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const rowIndex = Number(entry.target.dataset.rowIndex);
      const row = rowGroups[rowIndex];
      if (!row) {
        return;
      }

      revealGalleryRow(row.cards);
      galleryRowObserver?.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.08,
  });

  rowGroups.forEach((row) => {
    if (!row.cards.some((card) => card.classList.contains("row-visible"))) {
      galleryRowObserver.observe(row.cards[0]);
    }
  });
}

function getGalleryCards() {
  return Array.from(galleryEl.querySelectorAll(".photo-card:not(.photo-card-cover)"));
}

function getFirstGalleryCard() {
  return galleryEl.querySelector(".photo-card:not(.photo-card-cover)") || startSlideshowButton;
}

function moveGalleryFocus(direction) {
  moveFocusByGeometry(getGalleryCards(), direction);
}

function setStatus(message, isError = false) {
  directStatusEl.textContent = message;
  directStatusEl.style.color = "#000000";
}

function setDirectStatus(message, isError = false) {
  directStatusEl.textContent = message;
  directStatusEl.style.color = "#000000";
}

function clearLoadingTimer() {
  if (loadTimer) {
    window.clearInterval(loadTimer);
    loadTimer = null;
  }
}

function clearLoadingSafetyTimer() {
  if (loadingSafetyTimer) {
    window.clearTimeout(loadingSafetyTimer);
    loadingSafetyTimer = null;
  }
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 12000));
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function clearSlideshowAdvanceTimer() {
  if (slideshowAdvanceTimer) {
    window.clearTimeout(slideshowAdvanceTimer);
    slideshowAdvanceTimer = null;
  }
}

function resetSlideshowVideoState() {
  activeVideoSlideLocked = false;

  if (!slideVideoEl || !slideVideoOverlayEl) {
    return;
  }

  slideVideoEl.pause();
  slideVideoEl.classList.add("hidden");
  slideVideoEl.removeAttribute("src");
  slideVideoEl.removeAttribute("poster");
  slideVideoEl.load();
  slideVideoOverlayEl.classList.add("hidden");
  slideVideoControlsEl?.classList.add("hidden");
  if (slideVideoProgressEl) {
    slideVideoProgressEl.style.width = "0%";
  }
  updateVideoToggleVisual(false);
}

function clampLoadingProgress(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, number));
}

function renderLoadingState() {
  if (directLoadingPercentEl) {
    directLoadingPercentEl.textContent = `${Math.round(loadingProgress)}%`;
  }

  if (directLoadingMessageEl) {
    const dots = loadingMessageDots > 0 ? ".".repeat(loadingMessageDots) : "";
    directLoadingMessageEl.textContent = `${loadingProgressMessageBase}${dots}`;
  }
}

function clearGalleryErrorState() {
  screenGallery.classList.remove("error-state");
  galleryErrorStateEl?.classList.add("hidden");
}

function setGalleryErrorState(message) {
  if (galleryErrorMessageEl) {
    galleryErrorMessageEl.textContent = String(message || "We couldn't load the photos this time.").toUpperCase();
  }
  screenGallery.classList.remove("loading");
  screenGallery.classList.remove("revealed");
  screenGallery.classList.add("error-state");
  galleryErrorStateEl?.classList.remove("hidden");
  markGalleryVisualReady();
}

function showGalleryError(message) {
  setActiveScreen(3, { skipHistory: true });
  setGalleryErrorState(message);
  window.requestAnimationFrame(requestBootLoaderHide);
}

function showGalleryLoading(message = "Loading your albums.") {
  setActiveScreen(3, { skipHistory: true });
  resetGalleryLoadingShell();
  setLoadingState(true, message, { progress: 0 });
  window.requestAnimationFrame(requestBootLoaderHide);
}

function showGalleryLoadingPreview(options = {}) {
  coverTagline = String(options.tagline || "").trim();
  coverDateRange = String(options.eventDateRange || "").trim();
  setActiveBranding(options.branding || {});
  setLoadingCoverBackground(options.coverImageUrl || options.coverThumbnailUrl || "");
  setActiveScreen(3, { skipHistory: true });
  resetGalleryLoadingShell();
  setLoadingState(true, options.message || "Loading your albums.", { progress: options.progress ?? 0 });
  window.requestAnimationFrame(requestBootLoaderHide);
}

function normalizeSnapshotMediaItem(item, folderPath = "") {
  const mediaId = String(item?.id || "").trim();
  const mimeType = String(item?.mimeType || "").trim();
  const path = String(item?.path || item?.folderPath || folderPath || "").trim();
  const fallbackFullUrl = mediaId ? createImageUrl(mediaId, "full") : "";
  return {
    id: mediaId,
    name: String(item?.name || ""),
    mimeType,
    path,
    folderPath: String(item?.folderPath || path || folderPath || "").trim(),
    width: Number(item?.width) || null,
    height: Number(item?.height) || null,
    url: String(item?.url || fallbackFullUrl),
    slideshowUrl: String(
      item?.slideshowUrl ||
        (mediaId
          ? mimeType.startsWith("video/")
            ? createImageUrl(mediaId, "full")
            : createImageUrl(mediaId, "screen")
          : fallbackFullUrl)
    ),
    thumbnailUrl: String(item?.thumbnailUrl || (mediaId ? createImageUrl(mediaId, "thumb") : fallbackFullUrl)),
    webViewLink: String(item?.webViewLink || ""),
  };
}

function normalizeSnapshotFolders(snapshot) {
  const folders = Array.isArray(snapshot?.folders) ? snapshot.folders : [];
  return folders
    .map((folder) => {
      const path = String(folder?.path || folder?.name || "").trim();
      const images = Array.isArray(folder?.images)
        ? folder.images.map((image) => normalizeSnapshotMediaItem(image, path)).filter((image) => image.id)
        : [];
      return {
        id: String(folder?.id || ""),
        name: String(folder?.name || ""),
        path,
        photoCount: Number(folder?.photoCount) || images.filter((image) => !isVideoMedia(image)).length,
        mediaCount: Number(folder?.mediaCount) || images.length,
        images,
      };
    })
    .filter((folder) => folder.id && folder.images.length > 0);
}

function escapeMarkup(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeBrandColor(value, fallback) {
  const cleaned = String(value || "").trim().replace(/^#/, "").toUpperCase();
  return /^[0-9A-F]{6}$/.test(cleaned) ? `#${cleaned}` : fallback;
}

function hexToRgb(value) {
  const normalized = normalizeBrandColor(value, "#000000").replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function getReadableColor(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#000000" : "#ffffff";
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

function resolveBrandLogoSource(logoLink) {
  const fileId = extractDriveFileId(logoLink);
  if (fileId) {
    return `/api/image?id=${encodeURIComponent(fileId)}&mode=screen`;
  }

  const explicitLogo = String(logoLink || "").trim();
  if (explicitLogo) {
    return explicitLogo;
  }

  return window.CarnivalStudioPublicRoute ? "" : logoAssetPath;
}

function resolveBrandImageSource(imageLink) {
  const fileId = extractDriveFileId(imageLink);
  if (fileId) {
    return `/api/image?id=${encodeURIComponent(fileId)}&mode=screen`;
  }

  return String(imageLink || "").trim();
}

function setDocumentFavicon(faviconLink) {
  const faviconSource = resolveBrandImageSource(faviconLink) || window.CarnivalDefaultFavicon || "/favicon.svg?v=20260423";
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((link) => {
    link.href = faviconSource;
  });

  if (panelFaviconEl) {
    panelFaviconEl.src = faviconSource;
  }
}

function setLoadingCoverBackground(imageLink = "") {
  const resolvedSource = resolveBrandImageSource(imageLink);
  if (resolvedSource) {
    workspaceMain?.style.setProperty("--loading-cover-image", `url("${resolvedSource}")`);
    coverPhotoEl?.style.setProperty("--loading-cover-image", `url("${resolvedSource}")`);
    coverPhotoEl?.classList.add("has-loading-background");
    screenGallery?.classList.add("has-loading-cover");
    return;
  }

  workspaceMain?.style.removeProperty("--loading-cover-image");
  coverPhotoEl?.style.removeProperty("--loading-cover-image");
  coverPhotoEl?.classList.remove("has-loading-background");
  screenGallery?.classList.remove("has-loading-cover");
}

function shouldSkipDuplicateGalleryActivation(key) {
  const now = Date.now();
  if (lastGalleryActivationKey === key && now - lastGalleryActivationAt < 450) {
    return true;
  }
  lastGalleryActivationKey = key;
  lastGalleryActivationAt = now;
  return false;
}

function activatePhotoCard(index, photo, source = "click") {
  const mediaType = String(photo?.mimeType || "").toLowerCase();
  const key = `${source}:${index}:${photo?.id || "na"}`;
  if (shouldSkipDuplicateGalleryActivation(key)) {
    return;
  }
  pushMobileSlideshowDebug(`activatePhotoCard source=${source} idx=${index} mediaType=${mediaType || "na"}`);
  if (mediaType === "video/youtube") {
    const opened = openYoutubeDialog(photo?.webViewLink || photo?.slideshowUrl || photo?.url || "");
    if (!opened) {
      setStatus("Could not open this YouTube video.", true);
    }
    return;
  }
  openSlideshow(index);
}

function setActiveBranding(branding = {}) {
  activeBranding = {
    backgroundColor: normalizeBrandColor(branding.backgroundColor, "#FFFFFF"),
    accentColor: normalizeBrandColor(branding.accentColor, "#000000"),
    logoLink: String(branding.logoLink || "").trim(),
    faviconLink: String(branding.faviconLink || "").trim(),
    homepageLink: String(branding.homepageLink || "").trim(),
    shareMessage: String(branding.shareMessage || "").trim(),
  };
  const backgroundRgb = hexToRgb(activeBranding.backgroundColor);
  const accentRgb = hexToRgb(activeBranding.accentColor);
  const backgroundRgbValue = `${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}`;
  const accentRgbValue = `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`;
  document.documentElement.style.setProperty("--bg", activeBranding.backgroundColor);
  document.documentElement.style.setProperty("--surface", activeBranding.backgroundColor);
  document.documentElement.style.setProperty("--accent", activeBranding.accentColor);
  document.documentElement.style.setProperty("--template-bg", activeBranding.backgroundColor);
  document.documentElement.style.setProperty("--template-bg-rgb", backgroundRgbValue);
  document.documentElement.style.setProperty("--template-bg-strong", `rgba(${backgroundRgbValue}, 0.92)`);
  document.documentElement.style.setProperty("--template-bg-soft", `rgba(${backgroundRgbValue}, 0.62)`);
  document.documentElement.style.setProperty("--template-accent", activeBranding.accentColor);
  document.documentElement.style.setProperty("--template-accent-rgb", accentRgbValue);
  document.documentElement.style.setProperty("--template-on-accent", getReadableColor(activeBranding.accentColor));
  document.documentElement.style.setProperty("--template-accent-muted", `rgba(${accentRgbValue}, 0.72)`);
  document.documentElement.style.setProperty("--template-accent-soft", `rgba(${accentRgbValue}, 0.1)`);
  document.documentElement.style.setProperty("--template-accent-line", `rgba(${accentRgbValue}, 0.18)`);
  setDocumentFavicon(activeBranding.faviconLink);
  if (window.CarnivalStudioPublicRoute) {
    document.documentElement.classList.add("public-page-brand-ready");
  }
}

function renderCoverChrome() {
  const brandLogoSource = resolveBrandLogoSource(activeBranding.logoLink);
  const brandHomeLink = activeBranding.homepageLink || "/";
  const logoMarkup = brandLogoSource
    ? `
      <a href="${escapeMarkup(brandHomeLink)}" class="cover-logo-link" aria-label="Go to home page">
        <img class="cover-logo" src="${escapeMarkup(brandLogoSource)}" alt="Carnival Stories" />
      </a>
    `
    : "";
  const coverCopy = coverTagline || coverDateRange
    ? `
      <div class="cover-story-copy" aria-label="Event details">
        ${coverDateRange ? `<p class="cover-date-range">${escapeMarkup(coverDateRange)}</p>` : ""}
        ${coverTagline ? `<p class="cover-tagline">${escapeMarkup(coverTagline)}</p>` : ""}
      </div>
    `
    : "";
  const coverActions = `
    <div class="cover-actions" aria-label="Album actions">
      <button id="cover-face-button" type="button" class="cover-action-button" aria-label="Find photos by face">
        <img class="cover-action-image" src="/assets/icons/Face-detection.svg?v=20260501a" alt="" aria-hidden="true" />
      </button>
      <button id="cover-presentation-button" type="button" class="cover-action-button" aria-label="Open album presentation">
        <img class="cover-action-image" src="/assets/icons/Present.svg?v=20260424b" alt="" aria-hidden="true" />
      </button>
      <button id="cover-share-button" type="button" class="cover-action-button" aria-label="Share album">
        <img class="cover-action-image" src="/assets/icons/Share.svg?v=20260424b" alt="" aria-hidden="true" />
      </button>
    </div>
  `;

  coverPhotoEl.innerHTML = `
    ${logoMarkup}
    <div class="empty-sequence">Your photos will show up here shortly.</div>
    ${coverCopy}
    ${coverActions}
  `;
  toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
  const coverFaceButton = document.getElementById("cover-face-button");
  const coverPresentationButton = document.getElementById("cover-presentation-button");
  const coverShareButton = document.getElementById("cover-share-button");
  if (coverFaceButton && coverFaceButton.dataset.bound !== "true") {
    coverFaceButton.addEventListener("click", () => {
      void openFacePickerPopup();
    });
    coverFaceButton.dataset.bound = "true";
  }
  if (coverPresentationButton && coverPresentationButton.dataset.bound !== "true") {
    coverPresentationButton.addEventListener("click", openAlbumPresentationFromCover);
    coverPresentationButton.dataset.bound = "true";
  }
  if (coverShareButton && coverShareButton.dataset.bound !== "true") {
    coverShareButton.addEventListener("click", () => {
      void shareAlbumFromCover();
    });
    coverShareButton.dataset.bound = "true";
  }
  window.requestAnimationFrame(() => {
    updateCoverStoryLayout();
  });
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      updateCoverStoryLayout();
    });
  }
  syncCoverPhotoHeightForViewport();
}

function syncCoverPhotoHeightForViewport() {
  if (!coverPhotoEl || !screenGallery?.classList.contains("active")) {
    return;
  }
  const mobileLikeViewport = window.matchMedia("(max-width: 1100px)").matches;
  if (!mobileLikeViewport) {
    coverPhotoEl.style.removeProperty("height");
    coverPhotoEl.style.removeProperty("min-height");
    return;
  }
  const viewportHeight = Math.max(window.innerHeight || 0, 520);
  coverPhotoEl.style.height = `${viewportHeight}px`;
  coverPhotoEl.style.minHeight = `${viewportHeight}px`;
}

function clearFaceFilter({ silent = false } = {}) {
  currentFaceFilter = {
    active: false,
    faceId: "",
    photoIds: new Set(),
    groupCount: 0,
    previewDataUrl: "",
  };
  updateGalleryForSelectedFolder();
  if (!silent) {
    setStatus("Face filter cleared.");
  }
}

function applyFaceFilter(faceId, photoIds = [], groupCount = 0, previewDataUrl = "") {
  currentFaceFilter = {
    active: true,
    faceId: String(faceId || "").trim(),
    photoIds: new Set(photoIds.map((id) => String(id || "").trim()).filter(Boolean)),
    groupCount: Math.max(0, Number(groupCount) || 0),
    previewDataUrl: String(previewDataUrl || "").trim(),
  };
  updateGalleryForSelectedFolder();
}

function renderFaceFilterChip() {
  const existing = document.getElementById("face-filter-chip");
  if (existing) {
    existing.remove();
  }
  if (!galleryEl || !currentFaceFilter.active) {
    return;
  }
  const chip = document.createElement("div");
  chip.id = "face-filter-chip";
  chip.className = "face-filter-chip";
  chip.innerHTML = `
    ${currentFaceFilter.previewDataUrl ? `<img class="face-filter-chip-thumb" src="${escapeMarkup(currentFaceFilter.previewDataUrl)}" alt="" />` : ""}
    <span class="face-filter-chip-label">Face filter · ${currentFaceFilter.photoIds.size} photo${currentFaceFilter.photoIds.size === 1 ? "" : "s"}</span>
    <button type="button" class="face-filter-chip-clear" aria-label="Clear face filter">
      <span class="icon-mask icon-close" aria-hidden="true"></span>
    </button>
  `;
  chip.querySelector(".face-filter-chip-clear")?.addEventListener("click", () => {
    clearFaceFilter();
  });
  galleryEl.parentElement?.insertBefore(chip, galleryEl);
}

function closeFacePickerPopup() {
  const popup = document.getElementById("face-picker-popup");
  if (popup) {
    popup.remove();
  }
}

function buildFacePickerPopup() {
  const popup = document.createElement("div");
  popup.className = "face-picker-popup-backdrop";
  popup.id = "face-picker-popup";
  popup.innerHTML = `
    <div class="face-picker-popup" role="dialog" aria-modal="true" aria-label="Face search">
      <div class="face-picker-header">
        <h3>Find By Face</h3>
        <button type="button" class="face-picker-close" aria-label="Close">Close</button>
      </div>
      <p class="face-picker-subtitle">Select a face to filter matching photos.</p>
      <div class="face-picker-status">Loading faces…</div>
      <div class="face-picker-grid hidden"></div>
      <div class="face-picker-footer">
        <button type="button" class="face-picker-clear">Clear Filter</button>
      </div>
    </div>
  `;
  popup.querySelector(".face-picker-close")?.addEventListener("click", closeFacePickerPopup);
  popup.querySelector(".face-picker-clear")?.addEventListener("click", () => {
    clearFaceFilter();
    closeFacePickerPopup();
  });
  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closeFacePickerPopup();
    }
  });
  return popup;
}

async function fetchFaceGroups() {
  const response = await fetch(`/api/public-page/faces?publicPageId=${encodeURIComponent(currentPublicPageId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not load detected faces.");
  }
  return payload;
}

async function fetchFaceMatches(faceId) {
  const response = await fetch(
    `/api/public-page/face-photos?publicPageId=${encodeURIComponent(currentPublicPageId)}&faceId=${encodeURIComponent(faceId)}`
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || "Could not load face matches.");
  }
  return payload;
}

async function openFacePickerPopup() {
  if (!currentPublicPageId) {
    setStatus("Face search is unavailable for this album.", true);
    return;
  }
  closeFacePickerPopup();
  const popup = buildFacePickerPopup();
  document.body.appendChild(popup);

  const statusEl = popup.querySelector(".face-picker-status");
  const gridEl = popup.querySelector(".face-picker-grid");
  try {
    const payload = await fetchFaceGroups();
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
    if (status === "queued" || status === "processing") {
      statusEl.textContent = "Face detection is in progress. Please try again in a few minutes.";
      return;
    }
    if (status !== "completed" || !sortedGroups.length) {
      statusEl.textContent = "No detected faces available yet for this album.";
      return;
    }

    statusEl.classList.add("hidden");
    gridEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    sortedGroups.forEach((group) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "face-picker-item";
      const image = document.createElement("img");
      image.src = String(group.previewDataUrl || "").trim();
      image.alt = "";
      const label = document.createElement("span");
      label.textContent = `${Math.max(0, Number(group.photoCount || group.count) || 0)} photos`;
      button.appendChild(image);
      button.appendChild(label);
      button.addEventListener("click", async () => {
        try {
          const matches = await fetchFaceMatches(group.id);
          const photoIds = Array.isArray(matches?.photoIds) ? matches.photoIds : [];
          applyFaceFilter(group.id, photoIds, photoIds.length, group.previewDataUrl || "");
          closeFacePickerPopup();
          setStatus(`Showing ${photoIds.length} photos for selected face.`);
        } catch (error) {
          setStatus(error?.message || "Could not filter by face.", true);
        }
      });
      gridEl.appendChild(button);
    });
  } catch (error) {
    statusEl.textContent = error?.message || "Could not load detected faces.";
  }
}

function getAlbumPresentationUrl() {
  const url = new URL(getCurrentPageShareUrl(), window.location.origin);
  url.searchParams.delete("folder");
  url.searchParams.delete("photo");
  url.searchParams.set("view", "presentation");
  return url.toString();
}

function isAlbumPresentationRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "presentation";
}

function getAlbumPresentationPool() {
  return allMediaItems.filter((item) => !isVideoMedia(item));
}

function getShuffledPhotos(list) {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function openAlbumPresentationFromCover() {
  window.open(getAlbumPresentationUrl(), "_blank", "noreferrer");
}

async function shareAlbumFromCover() {
  const pageUrl = getCurrentPageShareUrl();
  const shareText = buildAlbumShareMessage({
    shareMessage: activeBranding.shareMessage || "",
    tagline: currentShareContext.tagline || "CarnivalStories",
    pageUrl,
    pairingCode: currentShareContext.pairingCode || "",
  });
  const shareData = {
    title: currentShareContext.tagline || "CarnivalStories",
    text: shareText,
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText);
    setStatus("Album share message copied to clipboard.");
    return;
  }

  window.open(pageUrl, "_blank", "noreferrer");
}

function updateCoverStoryLayout() {
  const coverCopyEl = coverPhotoEl?.querySelector(".cover-story-copy");
  const coverTaglineEl = coverCopyEl?.querySelector(".cover-tagline");
  if (!coverCopyEl || !coverTaglineEl) {
    return;
  }

  coverTaglineEl.style.removeProperty("--cover-tagline-size");
  coverCopyEl.style.removeProperty("--cover-copy-width");
  coverTaglineEl.style.removeProperty("width");
}

function bindCoverSettingsButton() {
  if (!toggleGallerySettingsButton || toggleGallerySettingsButton.dataset.bound === "true") {
    return;
  }

  toggleGallerySettingsButton.addEventListener("click", () => {
    screenGallery.classList.toggle("panel-open");
    focusElement(
      screenGallery.classList.contains("panel-open")
        ? durationDecreaseButton
        : toggleGallerySettingsButton
    );
  });
  toggleGallerySettingsButton.dataset.bound = "true";
}

function openGallerySettingsPanel() {
  screenGallery.classList.add("panel-open");
  focusElement(durationDecreaseButton);
}

function closeGallerySettingsPanel() {
  screenGallery.classList.remove("panel-open");
  focusElement(toggleSlideshowSettingsButton || getFirstGalleryCard());
}

function tickLoadingProgress() {
  if (loadingProgressTarget >= 100) {
    loadingProgress = clampLoadingProgress(loadingProgressTarget);
    renderLoadingState();
    return;
  }

  loadingProgress = clampLoadingProgress(Math.min(98, loadingProgress + 1));
  loadingProgressTarget = 98;
  loadingMessageDots = (loadingMessageDots % 3) + 1;
  renderLoadingState();
}

function startLoadingTimer() {
  if (loadTimer) {
    return;
  }

  loadTimer = window.setInterval(() => {
    tickLoadingProgress();
  }, 240);
}

function setLoadingState(isLoading, message = "", options = {}) {
  const { progress } = options;

  if (!directLoadingIndicatorEl || !directLoadingPercentEl || !directLoadingMessageEl) {
    return;
  }

  if (!isLoading) {
    clearLoadingSafetyTimer();
    screenGallery.classList.remove("loading");
    screenGallery.classList.add("loading-fading");
    screenGallery.classList.add("revealed");
    clearLoadingTimer();
    window.clearTimeout(loadingFadeTimer);
    loadingFadeTimer = window.setTimeout(() => {
      directLoadingIndicatorEl.classList.add("hidden");
      screenGallery.classList.remove("loading-fading");
      loadingProgress = 0;
      loadingProgressTarget = 0;
      loadingProgressMessageBase = "";
      loadingMessageDots = 0;
      renderLoadingState();
      loadingFadeTimer = null;
    }, 1000);
    window.requestAnimationFrame(() => {
      setupGalleryRowReveal();
    });
    return;
  }

  window.clearTimeout(loadingFadeTimer);
  loadingFadeTimer = null;
  if (!loadTimer) {
    startLoadingTimer();
  }

  if (typeof progress === "number") {
    loadingProgressTarget = clampLoadingProgress(progress);
    loadingProgress = loadingProgressTarget === 100 ? 100 : clampLoadingProgress(loadingProgressTarget);
  }

  loadingProgressMessageBase = String(message || loadingProgressMessageBase || "Opening your gallery vault.")
    .replace(/\.+$/, "")
    .trim();
  loadingMessageDots = 0;
  screenGallery.classList.remove("revealed");
  screenGallery.classList.remove("loading-fading");
  screenGallery.classList.add("loading");
  directLoadingIndicatorEl.classList.remove("hidden");
  renderLoadingState();

  clearLoadingSafetyTimer();
  loadingSafetyTimer = window.setTimeout(() => {
    if (!screenGallery.classList.contains("loading")) {
      return;
    }
    const hasCoverImage = !!coverPhotoEl?.querySelector(".photo-card-cover img");
    const hasGridImage = !!galleryEl?.querySelector(".photo-card img");
    const hasLoadingBackground = coverPhotoEl?.classList.contains("has-loading-background");
    if (hasCoverImage || hasGridImage || hasLoadingBackground) {
      setStatus("Gallery loaded with delayed network response.");
      setLoadingState(false);
      return;
    }
    setGalleryErrorState("Gallery is taking too long to load. Please go back and open it again.");
    setStatus("Gallery load timed out. Please retry.", true);
  }, 12000);
}

function resetGalleryLoadingShell() {
  clearGalleryErrorState();
  screenGallery.classList.add("loading");
  screenGallery.classList.remove("revealed");
  renderCoverChrome();
  galleryEl.innerHTML = "";
  folderTabsEl.innerHTML = "";
  if (photoCountEl) {
    photoCountEl.textContent = "0";
  }
  if (galleryFolderPathEl) {
    galleryFolderPathEl.textContent = "PATH: //";
    galleryFolderPathEl.href = "/";
  }
  if (selectedGridFolderEl) {
    selectedGridFolderEl.textContent = "";
  }
}

function syncHistoryForStep(step, replaceState = false) {
  const nextPath = step === 1 ? "/" : getGalleryPath();
  if (getResolvedPathname() === nextPath) {
    return;
  }

  const method = replaceState ? "replaceState" : "pushState";
  window.history[method]({ step }, "", nextPath);
}

function setActiveScreen(step, options = {}) {
  const { replaceState = false, skipHistory = false } = options;
  screenDirectLink.classList.toggle("active", step === 1);
  screenGallery.classList.toggle("active", step === 3);

  if (step !== 3) {
    screenGallery.classList.remove("panel-open");
  }

  if (!skipHistory) {
    syncHistoryForStep(step, replaceState);
  }

  window.scrollTo(0, 0);
  updateScrollTopButtonVisibility();
  updateStickyFolderTabsVisibility();

  if (step === 1) {
    focusElement(directLinkInput);
  } else if (step === 3) {
    syncCoverPhotoHeightForViewport();
    const firstGalleryCard = galleryEl.querySelector(".photo-card:not(.photo-card-cover)");
    if (firstGalleryCard) {
      focusElement(firstGalleryCard);
    }
  }
}

function updateScrollTopButtonVisibility() {
  if (!scrollToTopButton) {
    return;
  }

  const galleryIsActive = screenGallery.classList.contains("active");
  const slideshowIsOpen = !slideshowEl.classList.contains("hidden");
  const galleryIsLoading = screenGallery.classList.contains("loading");
  const galleryHasError = screenGallery.classList.contains("error-state");
  const coverRect = coverPhotoEl?.getBoundingClientRect();
  const passedCoverPhoto = Boolean(coverRect && coverRect.bottom <= 0);

  const shouldShow = galleryIsActive && !slideshowIsOpen && !galleryIsLoading && !galleryHasError && passedCoverPhoto;
  scrollToTopButton.classList.toggle("hidden", !shouldShow);
}

function isCompactGalleryViewport() {
  return window.matchMedia("(max-width: 720px)").matches;
}

function updateStickyFolderTabsVisibility() {
  if (!folderTabsStickyShellEl || !folderTabsShellEl) {
    return;
  }

  const hasMultipleFolders = (currentFolders?.length || 0) > 1;
  const galleryIsActive = screenGallery.classList.contains("active");
  const slideshowIsOpen = !slideshowEl.classList.contains("hidden");
  const galleryIsLoading = screenGallery.classList.contains("loading");
  const galleryHasError = screenGallery.classList.contains("error-state");
  const tabsRect = folderTabsShellEl.getBoundingClientRect();
  const showStickyTabs =
    isCompactGalleryViewport() &&
    hasMultipleFolders &&
    galleryIsActive &&
    !slideshowIsOpen &&
    !galleryIsLoading &&
    !galleryHasError &&
    tabsRect.bottom <= 0;

  folderTabsStickyShellEl.classList.toggle("hidden", !showStickyTabs);
  folderTabsStickyShellEl.setAttribute("aria-hidden", showStickyTabs ? "false" : "true");
}

function collectFolders(node, parentPath = "") {
  if (!node) {
    return [];
  }

  const path = parentPath ? `${parentPath}/${node.name}` : node.name;
  const folders = [];
  const ownImages = node.images || [];

  if (ownImages.length > 0) {
    folders.push({
      id: node.id,
      name: node.name,
      path,
      images: ownImages,
    });
  }

  node.folders.forEach((child) => {
    folders.push(...collectFolders(child, path));
  });

  return folders;
}

function applyFolderState(folders, options = {}) {
  currentFolders = mergeYoutubeVideosFolder(folders, options);
  selectedFolderId = currentFolders[0] ? currentFolders[0].id : null;
  if (pendingSharedFolderId && currentFolders.some((folder) => folder.id === pendingSharedFolderId)) {
    selectedFolderId = pendingSharedFolderId;
  }
  allMediaItems = currentFolders.flatMap((folder) => folder.images || []);
  coverPhoto = options.coverFileId
    ? allMediaItems.find((item) => item.id === options.coverFileId) || currentFolders[0]?.images?.[0] || null
    : currentFolders[0]?.images?.[0] || null;
  if (coverPhoto) {
    setLoadingCoverBackground(getPhotoSourceCandidates(coverPhoto)[0] || "");
  }
  sharedFolderName = options.rootName || "";
  if (!options.preservePath) {
    syncHistoryForStep(3, true);
  }
  renderFolderTabs(currentFolders);
  updateFolderSidePanel();
  updateGalleryForSelectedFolder();
}

function getSelectedFolder() {
  return currentFolders.find((folder) => folder.id === selectedFolderId) || null;
}

function getPhotoSourceCandidates(photo) {
  if (!photo || typeof photo !== "object") {
    return [];
  }
  return [photo.slideshowUrl, photo.url, photo.thumbnailUrl]
    .filter(Boolean)
    .map((source) => String(source || "").trim())
    .filter(Boolean)
    .filter((source, index, list) => list.indexOf(source) === index);
}

function getSlideshowSourceCandidates(photo) {
  if (!photo || typeof photo !== "object") {
    return [];
  }
  return [photo.slideshowUrl, photo.url, photo.thumbnailUrl]
    .filter(Boolean)
    .map((source) => String(source || "").trim())
    .filter(Boolean)
    .filter((source, index, list) => list.indexOf(source) === index);
}

function updateFolderTabsVisibility(folders = currentFolders) {
  if (!folderTabsShellEl) {
    return;
  }

  const shouldHide = currentFaceFilter.active || (folders?.length || 0) <= 1;
  folderTabsShellEl.classList.toggle("hidden", shouldHide);
  folderTabsStickyShellEl?.classList.toggle("hidden", true);
  folderTabsStickyShellEl?.setAttribute("aria-hidden", "true");
}

function updateFolderSidePanel() {
  const folder = getSelectedFolder();
  if (selectedGridFolderEl) {
    selectedGridFolderEl.textContent = folder ? folder.name : "Nothing selected yet";
  }
}

function buildFolderTabButton(folder) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `folder-tab${folder.id === selectedFolderId ? " selected" : ""}`;
  button.textContent = folder.name;
  button.addEventListener("click", () => {
    selectedFolderId = folder.id;
    renderFolderTabs(currentFolders);
    updateFolderSidePanel();
    updateGalleryForSelectedFolder();
  });
  button.addEventListener("focus", () => {
    button.scrollIntoView({ block: "nearest", inline: "center" });
  });
  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFolderTabFocus("down");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFolderTabFocus("up");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFolderTabFocus("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFolderTabFocus("right");
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectedFolderId = folder.id;
      renderFolderTabs(currentFolders);
      updateFolderSidePanel();
      updateGalleryForSelectedFolder();
      setActiveScreen(3);
    }
  });
  return button;
}

function renderFolderTabs(folders) {
  updateFolderTabsVisibility(folders);
  folderTabsEl.innerHTML = "";
  if (folderTabsStickyEl) {
    folderTabsStickyEl.innerHTML = "";
  }

  if (folders.length <= 1) {
    folderTabsEl.innerHTML = "";
    if (folderTabsStickyEl) {
      folderTabsStickyEl.innerHTML = "";
    }
    return;
  }

  folders.forEach((folder) => {
    folderTabsEl.appendChild(buildFolderTabButton(folder));
    folderTabsStickyEl?.appendChild(buildFolderTabButton(folder));
  });

  updateStickyFolderTabsVisibility();
}

function renderGallery(photoItems, options = {}) {
  const { suppressGlobalError = false, emptyMessage = "This folder doesn't have any photos yet." } = options;
  const renderToken = ++activeGalleryRenderToken;
  cancelBackgroundFolderPreload();
  clearGalleryRowObserver();
  clearGalleryErrorState();
  galleryEl.innerHTML = "";
  galleryEl.style.height = "0px";
  renderCoverChrome();
  coverPhotoEl.style.removeProperty("--cover-image");
  coverPhotoEl.classList.remove("has-cover-image");
  imageLoadFailures = 0;

  const visiblePhotos = photoItems.slice();
  pendingGalleryThumbnailLoads = visiblePhotos.length;

  if (coverPhoto) {
    const coverSources = getPhotoSourceCandidates(coverPhoto);
    const thumbSource = String(coverPhoto.thumbnailUrl || "").trim();
    const initialCoverSource = thumbSource || coverSources[0] || "";
    const fallbackCoverSources = [initialCoverSource, ...coverSources]
      .filter(Boolean)
      .filter((source, index, list) => list.indexOf(source) === index);
    const preferredHighResSource = coverSources[0] || initialCoverSource;
    coverPhotoEl.style.setProperty("--cover-image", `url("${initialCoverSource}")`);
    coverPhotoEl.classList.add("has-cover-image");
    const card = document.createElement("div");
    card.className = "photo-card photo-card-cover";
    const image = document.createElement("img");
    let coverSourceIndex = 0;
    image.src = initialCoverSource;
    image.alt = coverPhoto.name;
    image.loading = "lazy";
    image.fetchPriority = "high";
    image.addEventListener("error", () => {
      if (coverSourceIndex < fallbackCoverSources.length - 1) {
        coverSourceIndex += 1;
        const nextSource = fallbackCoverSources[coverSourceIndex];
        coverPhotoEl.style.setProperty("--cover-image", `url("${nextSource}")`);
        image.src = nextSource;
        return;
      }
      imageLoadFailures += 1;
      image.style.opacity = "0.14";
      setStatus(
        `${imageLoadFailures} image${imageLoadFailures === 1 ? "" : "s"} failed to load. Direct Drive media access may be restricted for some files.`,
        true
      );
      markGalleryVisualReady();
    });
    image.addEventListener("load", () => {
      markGalleryVisualReady();
      if (
        preferredHighResSource &&
        preferredHighResSource !== image.currentSrc &&
        preferredHighResSource !== image.src
      ) {
        const highResImage = new Image();
        highResImage.onload = () => {
          coverPhotoEl.style.setProperty("--cover-image", `url("${preferredHighResSource}")`);
          image.src = preferredHighResSource;
        };
        highResImage.src = preferredHighResSource;
      }
    });
    card.appendChild(image);
    coverPhotoEl.appendChild(card);
  }

  if (!photoItems.length) {
    pendingGalleryThumbnailLoads = 0;
    if (suppressGlobalError) {
      clearGalleryErrorState();
      galleryEl.style.height = "auto";
      galleryEl.innerHTML = `<p class="gallery-inline-empty">${escapeMarkup(emptyMessage)}</p>`;
      markGalleryVisualReady();
    } else {
      setGalleryErrorState("This folder doesn't have any photos yet.");
    }
    return;
  }

  if (!visiblePhotos.length) {
    pendingGalleryThumbnailLoads = 0;
    maybeStartBackgroundPreload(renderToken);
    return;
  }

  const appendPhotoBatch = (startIndex) => {
    if (renderToken !== activeGalleryRenderToken) {
      return;
    }

    const batchSize = startIndex === 0 ? INITIAL_GALLERY_BATCH_SIZE : GALLERY_BATCH_SIZE;
    const slice = visiblePhotos.slice(startIndex, startIndex + batchSize);
    const fragment = document.createDocumentFragment();

    slice.forEach((photo, offset) => {
      const index = startIndex + offset;
      const card = document.createElement("button");
      card.className = "photo-card is-loading row-pending";
      card.type = "button";
      card.dataset.index = String(index);

      const span = getMasonryTileSpan(photo, index);
      card.dataset.aspectRatio = String(span.aspectRatio);

      const image = document.createElement("img");
      image.src = photo.thumbnailUrl || photo.url;
      image.alt = photo.name;
      image.loading = "lazy";
      image.fetchPriority = index < INITIAL_GALLERY_BATCH_SIZE ? "high" : "low";
      const fallbackSources = [photo.thumbnailUrl, photo.slideshowUrl, photo.url]
        .filter(Boolean)
        .filter((source, sourceIndex, sources) => sources.indexOf(source) === sourceIndex);
      let fallbackSourceIndex = 0;
      image.addEventListener("load", () => {
        if (renderToken !== activeGalleryRenderToken) {
          return;
        }

        const naturalRatio = image.naturalWidth > 0 && image.naturalHeight > 0
          ? image.naturalWidth / image.naturalHeight
          : span.aspectRatio;
        card.dataset.aspectRatio = String(naturalRatio > 0 ? naturalRatio : span.aspectRatio);
        card.classList.remove("is-loading");
        pendingGalleryThumbnailLoads = Math.max(0, pendingGalleryThumbnailLoads - 1);
        queueGalleryLayout();
        maybeStartBackgroundPreload(renderToken);
        markGalleryVisualReady();
      });
      image.addEventListener("error", () => {
        if (renderToken !== activeGalleryRenderToken) {
          return;
        }

        if (fallbackSourceIndex < fallbackSources.length - 1) {
          fallbackSourceIndex += 1;
          image.src = fallbackSources[fallbackSourceIndex];
          return;
        }

        card.classList.remove("is-loading");
        pendingGalleryThumbnailLoads = Math.max(0, pendingGalleryThumbnailLoads - 1);
        imageLoadFailures += 1;
        image.style.opacity = "0.14";
        setStatus(
          `${imageLoadFailures} image${imageLoadFailures === 1 ? "" : "s"} failed to load. Direct Drive media access may be restricted for some files.`,
          true
        );
        maybeStartBackgroundPreload(renderToken);
        markGalleryVisualReady();
      });

      card.appendChild(image);
      if (hasPublicPageLikes() && !isVideoMedia(photo)) {
        card.appendChild(renderPhotoLikeBadge(photo));
      }
      card.addEventListener("click", () => {
        activatePhotoCard(index, photo, "click");
      });
      card.addEventListener("pointerup", (event) => {
        const pointerType = String(event?.pointerType || "").toLowerCase();
        if (pointerType === "touch" || pointerType === "pen") {
          event.preventDefault();
          activatePhotoCard(index, photo, `pointerup:${pointerType}`);
        }
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveGalleryFocus("left");
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          moveGalleryFocus("right");
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          moveGalleryFocus("up");
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          moveGalleryFocus("down");
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activatePhotoCard(index, photo, `key:${event.key}`);
        }
      });
      fragment.appendChild(card);
    });

    galleryEl.appendChild(fragment);
    queueGalleryLayout();

    const nextIndex = startIndex + slice.length;
    if (nextIndex >= visiblePhotos.length) {
      return;
    }

    const queueNextBatch = () => appendPhotoBatch(nextIndex);
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(queueNextBatch, { timeout: 250 });
    } else {
      window.setTimeout(queueNextBatch, 32);
    }
  };

  appendPhotoBatch(0);
}

function updateGalleryForSelectedFolder() {
  updateFolderTabsVisibility(currentFolders);
  const selectedFolder = getSelectedFolder();
  const baseImages = currentFaceFilter.active
    ? allMediaItems.filter((photo) => !isVideoMedia(photo))
    : (selectedFolder ? selectedFolder.images : []);
  const filteredImages = currentFaceFilter.active
    ? baseImages.filter((photo) => currentFaceFilter.photoIds.has(String(photo?.id || "").trim()))
    : baseImages;
  images = filteredImages;
  if (photoCountEl) {
    photoCountEl.textContent = `${images.length}`;
  }
  if (selectedFolder) {
    const shareLink = getFolderShareLink(selectedFolder);
    if (galleryFolderPathEl) {
      galleryFolderPathEl.textContent = `PATH: ${shareLink}`;
      galleryFolderPathEl.href = shareLink;
    }
  } else {
    if (galleryFolderPathEl) {
      galleryFolderPathEl.textContent = "PATH: //";
      galleryFolderPathEl.href = "/";
    }
  }
  if (selectedGridFolderEl) {
    if (currentFaceFilter.active) {
      selectedGridFolderEl.textContent = `Face results · ${images.length} photo${images.length === 1 ? "" : "s"}`;
    } else {
      selectedGridFolderEl.textContent = selectedFolder ? selectedFolder.name : "Nothing selected yet";
    }
  }
  renderFaceFilterChip();
  renderGallery(filteredImages, currentFaceFilter.active
    ? {
        suppressGlobalError: true,
        emptyMessage: "No photos were found for this face in this album.",
      }
    : undefined);
  if (selectedFolder && pendingSharedPhotoId && (!pendingSharedFolderId || pendingSharedFolderId === selectedFolder.id)) {
    const sharedPhotoIndex = images.findIndex((photo) => photo.id === pendingSharedPhotoId);
    if (sharedPhotoIndex >= 0) {
      pendingSharedFolderId = "";
      pendingSharedPhotoId = "";
      window.setTimeout(() => openSlideshow(sharedPhotoIndex), 0);
    }
  }

  if (pendingAlbumPresentationFromUrl) {
    pendingAlbumPresentationFromUrl = false;
    const pool = getAlbumPresentationPool();
    if (!pool.length) {
      setStatus("There aren’t any photos ready for presentation yet.", true);
      return;
    }
    albumPresentationSourceImages = images;
    images = getShuffledPhotos(pool);
    albumPresentationActive = true;
    const coverBackground = coverPhoto?.url || coverPhoto?.thumbnailUrl || "";
    if (coverBackground) {
      slideshowEl?.style.setProperty("--album-presentation-bg", `url("${coverBackground}")`);
    }
    slideshowEl?.classList.add("slideshow-album-presentation");
    window.setTimeout(() => openSlideshow(0), 0);
  }
}

function updateDurationControls() {
  const value = `${Number(slideshowConfig.duration).toFixed(1)}s`;
  durationReadoutEl.textContent = value;
  durationCountEl.textContent = `${Math.round(slideshowConfig.duration)}s`;
  loopInput.checked = slideshowConfig.loop;
}

function syncConfigFromInputs(source) {
  slideshowConfig.loop = source.loop.checked;
  updateDurationControls();
}

function changeDuration(delta) {
  const nextValue = Math.max(2, Math.min(15, slideshowConfig.duration + delta));
  slideshowConfig.duration = nextValue;
  updateDurationControls();

  if (!slideshowEl.classList.contains("hidden")) {
    scheduleSlideshowAdvance();
  }
}

function getWindowedSlideIndexes(centerIndex) {
  if (!images.length) {
    return [];
  }

  const indexes = new Set([centerIndex]);

  for (let offset = 1; offset <= 2; offset += 1) {
    if (slideshowConfig.loop) {
      indexes.add((centerIndex - offset + images.length) % images.length);
      indexes.add((centerIndex + offset) % images.length);
      continue;
    }

    if (centerIndex - offset >= 0) {
      indexes.add(centerIndex - offset);
    }

    if (centerIndex + offset < images.length) {
      indexes.add(centerIndex + offset);
    }
  }

  return Array.from(indexes);
}

function syncSlideshowPreloadWindow(centerIndex) {
  const desiredIndexes = new Set(getWindowedSlideIndexes(centerIndex));

  for (const [index] of slideshowPreloadCache.entries()) {
    if (!desiredIndexes.has(index)) {
      slideshowPreloadCache.delete(index);
    }
  }

  desiredIndexes.forEach((index) => {
    if (slideshowPreloadCache.has(index)) {
      return;
    }

    if (isVideoMedia(images[index])) {
      return;
    }

    const preloader = new Image();
    preloader.decoding = "async";
    preloader.src = images[index].slideshowUrl || images[index].url;
    slideshowPreloadCache.set(index, preloader);
  });
}

function preloadImageSource(source) {
  if (!source) {
    return Promise.resolve();
  }

  const cachedPromise = folderThumbnailPreloadCache.get(source);
  if (cachedPromise) {
    return cachedPromise;
  }

  const preloadPromise = new Promise((resolve) => {
    const preloader = new Image();
    preloader.decoding = "async";
    preloader.fetchPriority = "low";
    preloader.onload = () => resolve();
    preloader.onerror = () => resolve();
    preloader.src = source;
  });

  folderThumbnailPreloadCache.set(source, preloadPromise);
  return preloadPromise;
}

function cancelBackgroundFolderPreload() {
  folderPreloadRunToken += 1;
}

function maybeStartBackgroundPreload(renderToken = activeGalleryRenderToken) {
  if (renderToken !== activeGalleryRenderToken) {
    return;
  }

  if (pendingGalleryThumbnailLoads > 0 || !slideshowEl.classList.contains("hidden")) {
    return;
  }

  const selectedFolder = getSelectedFolder();
  if (!selectedFolder) {
    return;
  }

  startBackgroundFolderPreload(currentFolders, selectedFolder.id);
}

function startBackgroundFolderPreload(folders, activeFolderId) {
  const preloadToken = ++folderPreloadRunToken;
  const sources = folders
    .filter((folder) => folder.id !== activeFolderId)
    .flatMap((folder) =>
      folder.images
        .filter((photo) => !isVideoMedia(photo))
        .slice(0, 4)
        .map((photo) => photo.thumbnailUrl || photo.url)
    )
    .slice(0, 16)
    .filter(Boolean);

  if (!sources.length) {
    return;
  }

  const runPreload = () => {
    let nextIndex = 0;
    const workerCount = Math.min(1, sources.length);

    const pump = () => {
      if (preloadToken !== folderPreloadRunToken || nextIndex >= sources.length) {
        return Promise.resolve();
      }

      const source = sources[nextIndex];
      nextIndex += 1;
      return preloadImageSource(source).then(pump);
    };

    for (let workerIndex = 0; workerIndex < workerCount; workerIndex += 1) {
      void pump();
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(runPreload, { timeout: 2000 });
    return;
  }

  window.setTimeout(runPreload, 1800);
}

function scheduleSlideshowAdvance() {
  clearSlideshowAdvanceTimer();

  if (slideshowEl.classList.contains("hidden") || images.length <= 1) {
    return;
  }

  if (slideshowPaused) {
    return;
  }

  if (isVideoMedia(getCurrentSlidePhoto()) && activeVideoSlideLocked) {
    return;
  }

  const isLastSlide = currentSlideIndex >= images.length - 1;
  if (isLastSlide && !slideshowConfig.loop) {
    return;
  }

  const nextDelayMs = albumPresentationActive
    ? ALBUM_PRESENT_CYCLE_MS
    : slideshowConfig.duration * 1000;

  slideshowAdvanceTimer = window.setTimeout(() => {
    showSlide(currentSlideIndex + 1);
  }, nextDelayMs);
}

function getSlideCardEntries() {
  return [
    { card: slideCardEl, image: slideImageEl },
    { card: slideCardFullEl, image: slideImageFullEl },
  ].filter((entry) => entry.card && entry.image);
}

function getRandomSlideTilt() {
  return `${(Math.random() * 20 - 10).toFixed(2)}deg`;
}

function getNextSlideshowMotionPreset() {
  const availablePresets = slideshowMotionPresets.filter((_, index) => index !== activeSlideMotionPresetIndex);
  const preset = availablePresets[Math.floor(Math.random() * availablePresets.length)] || slideshowMotionPresets[0];
  activeSlideMotionPresetIndex = slideshowMotionPresets.indexOf(preset);
  return preset;
}

function getNextSlideshowExitPreset() {
  const presets = [
    { toX: "-110vw", toY: "-110vh" },
    { toX: "110vw", toY: "-110vh" },
    { toX: "-110vw", toY: "110vh" },
    { toX: "110vw", toY: "110vh" },
  ];
  return presets[Math.floor(Math.random() * presets.length)];
}

function applySlideCardMotion(card, motion, tilt) {
  card.style.setProperty("--slide-from-x", motion.fromX);
  card.style.setProperty("--slide-from-y", motion.fromY);
  card.style.setProperty("--slide-to-x", motion.toX);
  card.style.setProperty("--slide-to-y", motion.toY);
  card.style.setProperty("--slide-tilt", tilt);
}

function createExitCloneFromEntry(cardEntry) {
  if (!cardEntry?.card || !cardEntry?.image || !cardEntry.card.parentElement) {
    return null;
  }
  const source = cardEntry.image.currentSrc || cardEntry.image.src;
  if (!source) {
    return null;
  }

  const exitCard = cardEntry.card.cloneNode(true);
  const exitImage = exitCard.querySelector(".slide-image");
  if (exitImage) {
    exitImage.src = source;
    exitImage.alt = cardEntry.image.alt || "";
    exitImage.classList.remove("hidden");
  }

  exitCard.classList.remove("hidden", "is-leaving");
  exitCard.classList.add("is-active");
  exitCard.setAttribute("aria-hidden", "true");
  cardEntry.card.parentElement.appendChild(exitCard);
  return exitCard;
}

function resetSlideCard(cardEntry) {
  if (!cardEntry?.card || !cardEntry?.image) {
    return;
  }
  cardEntry.card.classList.add("hidden");
  cardEntry.card.classList.remove("is-active", "is-leaving");
  cardEntry.card.style.setProperty("--motion-delay", "0ms");
  cardEntry.card.style.setProperty("--motion-duration", `${ALBUM_PRESENT_ENTER_MS}ms`);
  cardEntry.card.style.setProperty("--slide-z", "2");
  cardEntry.card.setAttribute("aria-hidden", "true");
  cardEntry.image.classList.add("hidden");
  cardEntry.image.removeAttribute("src");
  cardEntry.image.alt = "";
}

function hideSlidePhotoCards() {
  getSlideCardEntries().forEach((entry) => resetSlideCard(entry));
  activeSlideCardIndex = -1;
}

function showSlide(index) {
  if (!images.length) {
    pushMobileSlideshowDebug("showSlide aborted: no images");
    return;
  }

  if (!slideshowConfig.loop && index < 0) {
    index = 0;
  } else if (!slideshowConfig.loop && index >= images.length) {
    index = images.length - 1;
  }

  currentSlideIndex = (index + images.length) % images.length;
  const photo = images[currentSlideIndex];
  pushMobileSlideshowDebug(`showSlide index=${currentSlideIndex} photoId=${photo?.id || "na"}`);
  updateSlideshowLikeVisual(photo);
  const requestToken = ++slideshowImageLoadToken;
  const slideshowSources = getSlideshowSourceCandidates(photo);
  const previewSource = slideshowSources[slideshowSources.length - 1] || photo.thumbnailUrl || photo.slideshowUrl || photo.url;
  const fullSource = slideshowSources[0] || previewSource;
  const isVideo = isVideoMedia(photo);
  cancelBackgroundFolderPreload();
  clearSlideshowAdvanceTimer();
  resetSlideshowVideoState();

  if (slideshowLoaderEl && !isVideo) {
    slideshowLoaderEl.classList.remove("hidden");
  }

  if (isVideo) {
    hideSlidePhotoCards();
    slideImageEl.classList.add("hidden");
    slideImageFullEl?.classList.add("hidden");
    if (slideVideoEl && slideVideoOverlayEl) {
      slideVideoEl.preload = "auto";
      slideVideoEl.src = photo.slideshowUrl || photo.url;
      slideVideoEl.poster = previewSource;
      slideVideoEl.classList.remove("hidden");
      slideVideoOverlayEl.classList.remove("hidden");
      updateVideoProgress();
      updateVideoToggleVisual(false);
    }

    if (slideshowLoaderEl) {
      slideshowLoaderEl.classList.add("hidden");
    }

    scheduleSlideshowAdvance();
    return;
  }

  slideVideoEl?.classList.add("hidden");
  const entries = getSlideCardEntries();
  const usePresentationMotion = albumPresentationActive;
  let activeEntry = entries[0] || null;

  const applyPresentationMotion = (resolvedSource) => {
    if (!usePresentationMotion || !entries.length) {
      return false;
    }

    const nextEntryIndex = activeSlideCardIndex < 0 ? 0 : (activeSlideCardIndex + 1) % entries.length;
    const previousEntry = activeSlideCardIndex >= 0 ? entries[activeSlideCardIndex] : null;
    activeEntry = entries[nextEntryIndex];
    const motion = getNextSlideshowMotionPreset();
    const exitMotion = getNextSlideshowExitPreset();
    const tilt = getRandomSlideTilt();
    const enterAt = performance.now();

    if (activeEntry?.image) {
      activeEntry.image.classList.remove("hidden");
      activeEntry.image.fetchPriority = "high";
      activeEntry.image.src = resolvedSource;
      activeEntry.image.alt = photo.name;
    }

    logPresentationDebug(
      "album",
      `enter photo="${photo?.name || ""}" id="${photo?.id || ""}" from=(${motion.fromX},${motion.fromY}) to=(0,0) tilt=${tilt} enterMs=${ALBUM_PRESENT_ENTER_MS} pushDelayMs=${ALBUM_PRESENT_PUSH_DELAY_MS} exitMs=${ALBUM_PRESENT_EXIT_MS}`
    );
    applySlideCardMotion(activeEntry.card, motion, tilt);
    activeEntry.card.style.setProperty("--motion-duration", `${ALBUM_PRESENT_ENTER_MS}ms`);
    activeEntry.card.style.setProperty("--motion-delay", "0ms");
    activeEntry.card.style.setProperty("--slide-z", "3");
    activeEntry.card.classList.remove("hidden", "is-leaving", "is-active");
    activeEntry.card.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      activeEntry?.card?.classList.add("is-active");
    });

    if (previousEntry?.card && previousEntry !== activeEntry) {
      const prevName = images[(currentSlideIndex - 1 + images.length) % images.length]?.name || "";
      const exitingCard = createExitCloneFromEntry(previousEntry);
      if (exitingCard) {
        exitingCard.style.setProperty("--slide-to-x", exitMotion.toX);
        exitingCard.style.setProperty("--slide-to-y", exitMotion.toY);
        exitingCard.style.setProperty("--motion-duration", `${ALBUM_PRESENT_EXIT_MS}ms`);
        exitingCard.style.setProperty("--motion-delay", `${ALBUM_PRESENT_PUSH_DELAY_MS}ms`);
        exitingCard.style.setProperty("--slide-z", "2");
        exitingCard.classList.remove("is-leaving");
      }
      logPresentationDebug("album", `push-start prev="${prevName}" at=${Math.round(performance.now() - enterAt)}ms`);
      // Reset reusable buffer card immediately; the detached clone handles visual exit.
      resetSlideCard(previousEntry);
      if (exitingCard) {
        exitingCard.getBoundingClientRect();
      }
      window.requestAnimationFrame(() => {
        if (exitingCard) {
          exitingCard.classList.add("is-leaving");
        }
      });
      window.setTimeout(() => {
        if (exitingCard && exitingCard.isConnected) {
          exitingCard.remove();
          logPresentationDebug("album", `exit-done prev="${prevName}" total=${Math.round(performance.now() - enterAt)}ms`);
        }
      }, ALBUM_PRESENT_PUSH_DELAY_MS + ALBUM_PRESENT_EXIT_MS + 240);
    }

    activeSlideCardIndex = nextEntryIndex;
    return true;
  };

  if (!usePresentationMotion || !entries.length) {
    hideSlidePhotoCards();
    if (slideCardEl) {
      slideCardEl.classList.remove("hidden", "is-leaving");
      slideCardEl.classList.add("is-active");
      slideCardEl.setAttribute("aria-hidden", "false");
    }
    activeSlideCardIndex = 0;
    activeEntry = entries[0] || null;
  }

  slideImageFullEl?.classList.add("hidden");
  if (activeEntry?.image && !usePresentationMotion) {
    activeEntry.image.classList.remove("hidden");
    activeEntry.image.fetchPriority = "high";
    activeEntry.image.src = previewSource;
    activeEntry.image.alt = photo.name;
  }

  let settled = false;
  const settleSlide = (resolvedSource) => {
    if (settled || requestToken !== slideshowImageLoadToken) {
      return;
    }
    settled = true;

    if (usePresentationMotion) {
      applyPresentationMotion(resolvedSource);
    } else if (activeEntry?.image) {
      activeEntry.image.src = resolvedSource;
    }
    pushMobileSlideshowDebug(`showSlide settled src=${resolvedSource || "na"}`);

    if (slideshowLoaderEl) {
      slideshowLoaderEl.classList.add("hidden");
    }

    scheduleSlideshowAdvance();
  };

  const tryLoadSourceAt = (sourceIndex) => {
    if (requestToken !== slideshowImageLoadToken) {
      return;
    }
    const source = slideshowSources[sourceIndex] || previewSource;
    pushMobileSlideshowDebug(`showSlide try source[${sourceIndex}]=${source || "na"}`);
    if (!source) {
      settleSlide("");
      return;
    }

    const fullImage = new Image();
    fullImage.decoding = "async";
    const timeout = window.setTimeout(() => {
      if (requestToken !== slideshowImageLoadToken || settled) {
        return;
      }
      if (sourceIndex < slideshowSources.length - 1) {
        pushMobileSlideshowDebug(`showSlide timeout source[${sourceIndex}] -> fallback`);
        tryLoadSourceAt(sourceIndex + 1);
        return;
      }
      pushMobileSlideshowDebug("showSlide timeout final -> preview fallback");
      settleSlide(previewSource);
    }, 3500);

    fullImage.onload = () => {
      window.clearTimeout(timeout);
      pushMobileSlideshowDebug(`showSlide load ok source[${sourceIndex}]`);
      settleSlide(source);
    };
    fullImage.onerror = () => {
      window.clearTimeout(timeout);
      if (requestToken !== slideshowImageLoadToken || settled) {
        return;
      }
      if (sourceIndex < slideshowSources.length - 1) {
        pushMobileSlideshowDebug(`showSlide load err source[${sourceIndex}] -> fallback`);
        tryLoadSourceAt(sourceIndex + 1);
        return;
      }
      pushMobileSlideshowDebug("showSlide load err final -> preview fallback");
      settleSlide(previewSource);
    };
    fullImage.src = source;
  };

  tryLoadSourceAt(0);
  syncSlideshowPreloadWindow(currentSlideIndex);
}

function updateSlideshowActionVisibility() {
  if (!shareSlideButton) {
    return;
  }

  const showShare = currentSlideshowOptions.shareEnabled && window.matchMedia("(max-width: 1100px)").matches;
  shareSlideButton.classList.toggle("hidden", !showShare);
}

function downloadCurrentSlide() {
  const photo = getCurrentSlidePhoto();
  if (!photo) {
    return;
  }

  const link = document.createElement("a");
  link.href = photo.url;
  link.download = photo.name || "photo";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function shareCurrentSlide() {
  const photo = getCurrentSlidePhoto();
  if (!photo) {
    return;
  }

  const shareUrl = buildSlideShareUrl(photo);
  const shareText = buildAlbumShareMessage({
    shareMessage: activeBranding.shareMessage || "",
    tagline: currentShareContext.tagline || photo.name || "CarnivalStories",
    pageUrl: shareUrl,
    pairingCode: currentShareContext.pairingCode || "",
  });

  const shareData = {
    title: currentShareContext.tagline || photo.name || "CarnivalStories",
    text: shareText,
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText);
    setStatus("Photo share message copied to clipboard.");
    return;
  }

  window.open(shareUrl, "_blank", "noreferrer");
}

function openSlideshow(index = 0) {
  if (!images.length) {
    pushMobileSlideshowDebug("openSlideshow blocked: no images");
    setStatus("There aren’t any photos ready to play just yet.", true);
    return;
  }
  pushMobileSlideshowDebug(`openSlideshow index=${index} images=${images.length}`);

  cancelBackgroundFolderPreload();
  slideshowPaused = false;
  updateSlideshowPlaybackVisual();
  updateSlideshowActionVisibility();
  slideshowEl.classList.remove("hidden");
  slideshowEl.setAttribute("aria-hidden", "false");
  slideshowEl.classList.remove("slideshow-ui-hidden");
  setSlideshowFullscreenVisualState();
  updateStickyFolderTabsVisibility();
  showSlide(index);
  if (slideshowToastEl && !window.matchMedia("(max-width: 900px)").matches) {
    slideshowToastEl.classList.remove("hidden");
    window.clearTimeout(openSlideshow.toastTimer);
    openSlideshow.toastTimer = window.setTimeout(() => {
      slideshowToastEl.classList.add("hidden");
    }, 3000);
  } else if (slideshowToastEl) {
    slideshowToastEl.classList.add("hidden");
  }
  scheduleSlideshowUiHide();
  focusElement(nextSlideButton);
}
openSlideshow.toastTimer = null;

function isSlideshowFullscreen() {
  return document.fullscreenElement === slideshowEl;
}

async function enterSlideshowFullscreen() {
  if (!slideshowEl || isSlideshowFullscreen() || typeof slideshowEl.requestFullscreen !== "function") {
    return;
  }

  try {
    await slideshowEl.requestFullscreen();
  } catch (error) {
    setStatus("Fullscreen isn’t available right now.", true);
  }
}

function closeSlideshow() {
  pushMobileSlideshowDebug("closeSlideshow");
  clearSlideshowAdvanceTimer();
  clearSlideshowUiHideTimer();
  slideshowImageLoadToken += 1;
  slideshowPaused = false;
  updateSlideshowPlaybackVisual();
  resetSlideshowVideoState();
  slideshowEl.classList.add("hidden");
  slideshowEl.classList.remove("slideshow-ui-hidden");
  slideshowEl.classList.remove("slideshow-fullscreen");
  slideshowEl.setAttribute("aria-hidden", "true");
  updateStickyFolderTabsVisibility();
  if (slideshowToastEl) {
    slideshowToastEl.classList.add("hidden");
  }
  if (slideshowLoaderEl) {
    slideshowLoaderEl.classList.add("hidden");
  }
  hideSlidePhotoCards();
  if (albumPresentationActive && Array.isArray(albumPresentationSourceImages)) {
    images = albumPresentationSourceImages;
  }
  albumPresentationActive = false;
  albumPresentationSourceImages = null;
  slideshowEl?.classList.remove("slideshow-album-presentation");
  slideshowEl?.style.removeProperty("--album-presentation-bg");
  slideImageEl?.removeAttribute("src");
  slideImageFullEl?.removeAttribute("src");
  window.clearTimeout(openSlideshow.toastTimer);
  openSlideshow.toastTimer = null;
  slideshowPreloadCache.clear();
  maybeStartBackgroundPreload();
  focusElement(getFirstGalleryCard());
}

function handleKeydown(event) {
  if (isEditableTarget(event.target)) {
    return;
  }

  if (event.key === "Escape") {
    if (youtubeDialogState && !youtubeDialogState.overlay.classList.contains("hidden")) {
      event.preventDefault();
      youtubeDialogState.close();
      return;
    }

    if (isSlideshowFullscreen()) {
      return;
    }

    if (!slideshowEl.classList.contains("hidden")) {
      event.preventDefault();
      closeSlideshow();
      return;
    }

    if (screenGallery.classList.contains("active")) {
      event.preventDefault();
      if (screenGallery.classList.contains("panel-open")) {
        closeGallerySettingsPanel();
      }
      return;
    }
  }

  if (slideshowEl.classList.contains("hidden")) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (!isSlideshowFullscreen()) {
      showSlideshowUi();
    }
    showSlide(currentSlideIndex + 1);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (!isSlideshowFullscreen()) {
      showSlideshowUi();
    }
    showSlide(currentSlideIndex - 1);
  }
}

async function loadFolder(folderUrl, options = {}) {
  setStatus("Getting everything ready...");
  setPublicPageContext(options);
  coverTagline = String(options.tagline || "").trim();
  coverDateRange = String(options.eventDateRange || "").trim();
  setActiveBranding(options.branding || {});
  setLoadingCoverBackground(options.coverImageUrl || options.coverThumbnailUrl || "");
  if (!options.keepLoading) {
    setLoadingState(false);
  }

  try {
    let folderName = "";

    try {
      const metaResponse = await fetchWithTimeout(`/api/folder-meta?url=${encodeURIComponent(folderUrl)}`, {}, 9000);
      const metaData = await metaResponse.json();
      if (metaResponse.ok && metaData.name) {
        folderName = metaData.name;
        setStatus(`Connecting to "${metaData.name}"...`);
      }
    } catch (error) {
      // Keep the generic loading state if metadata lookup fails.
    }

    setActiveScreen(3, { skipHistory: Boolean(options.preservePath) });
    resetGalleryLoadingShell();
    beginGalleryVisualWait();
    setLoadingState(true, "Loading your albums.", { progress: 0 });
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const response = await fetchWithTimeout(`/api/folder?url=${encodeURIComponent(folderUrl)}&includeVideos=1`, {}, 15000);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load Google Drive folder.");
    }

    const folders = collectFolders(data.tree);
    applyFolderState(folders, {
      coverFileId: options.coverFileId,
      rootName: data.tree?.name || "",
      preservePath: options.preservePath,
      youtubeLinks: options.youtubeLinks,
    });
    if (coverPhoto) {
      setLoadingState(true, "Loading your albums.", { progress: 62 });
      setLoadingCoverBackground(getPhotoSourceCandidates(coverPhoto)[0] || "");
      const coverPreloader = new Image();
    const preloadSources = getPhotoSourceCandidates(coverPhoto);
    let preloadSourceIndex = 0;
    coverPreloader.src = preloadSources[0] || "";
    await Promise.race([
      new Promise((resolve) => {
      coverPreloader.onload = resolve;
      coverPreloader.onerror = () => {
        if (preloadSourceIndex < preloadSources.length - 1) {
          preloadSourceIndex += 1;
          coverPreloader.src = preloadSources[preloadSourceIndex];
          return;
        }
        resolve();
      };
      }),
      new Promise((resolve) => window.setTimeout(resolve, 3500)),
    ]);
  }
    setLoadingState(true, "Loading your albums.", { progress: 100 });
    await waitForGalleryVisualReady(3800);
    await new Promise((resolve) => window.setTimeout(resolve, 120));

    if (currentFolders.length > 1) {
      setStatus(`You're in. We found ${currentFolders.length} folders to choose from.`);
    } else {
      setStatus("Everything's ready. Your photos are waiting.");
    }
    setLoadingState(false);
  } catch (error) {
    currentFolders = [];
    selectedFolderId = null;
    coverPhoto = null;
    coverTagline = "";
    coverDateRange = "";
    setActiveBranding();
    setLoadingCoverBackground("");
    sharedFolderName = "";
    images = [];
    if (photoCountEl) {
      photoCountEl.textContent = "0";
    }
    setGalleryErrorState(error.message || "We couldn't load the photos this time.");
    setStatus(error.message, true);
    setLoadingState(false);
  }
}

async function loadSnapshot(snapshot, options = {}) {
  setStatus("Opening the saved album preview...");
  setPublicPageContext(options);
  coverTagline = String(options.tagline || "").trim();
  coverDateRange = String(options.eventDateRange || "").trim();
  setActiveBranding(options.branding || {});
  setLoadingCoverBackground(options.coverImageUrl || options.coverThumbnailUrl || "");
  setActiveScreen(3, { skipHistory: Boolean(options.preservePath) });
  resetGalleryLoadingShell();
  beginGalleryVisualWait();
  setLoadingState(true, "Opening your gallery preview.", { progress: 24 });
  await new Promise((resolve) => window.requestAnimationFrame(resolve));

  const folders = normalizeSnapshotFolders(snapshot);
  if (!folders.length) {
    throw new Error("This gallery preview is still being prepared.");
  }

  applyFolderState(folders, {
    coverFileId: options.coverFileId,
    rootName: snapshot?.rootName || "",
    preservePath: options.preservePath,
    youtubeLinks: options.youtubeLinks,
  });
  setLoadingState(true, "Opening your gallery preview.", { progress: 100 });
  await waitForGalleryVisualReady(3800);
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  setStatus("Loaded saved album preview.");
  setLoadingState(false);
}

async function revalidateFolder(folderUrl, options = {}) {
  try {
    const response = await fetch(`/api/folder?url=${encodeURIComponent(folderUrl)}&includeVideos=1`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to refresh Google Drive folder.");
    }

    if (!screenGallery.classList.contains("active") || !slideshowEl.classList.contains("hidden")) {
      return;
    }

    const previousSelectedFolderId = selectedFolderId;
    const folders = collectFolders(data.tree);
    applyFolderState(folders, {
      coverFileId: options.coverFileId,
      rootName: data.tree?.name || "",
      preservePath: true,
      youtubeLinks: options.youtubeLinks,
    });

    if (previousSelectedFolderId && currentFolders.some((folder) => folder.id === previousSelectedFolderId)) {
      selectedFolderId = previousSelectedFolderId;
      renderFolderTabs(currentFolders);
      updateFolderSidePanel();
      updateGalleryForSelectedFolder();
    }
  } catch (error) {
    console.warn(error);
  }
}

directLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pairingCode = directLinkInput.value.trim();
  if (!pairingCode) {
    setDirectStatus("Enter a pairing code and we’ll open it for you.", true);
    return;
  }

  setDirectStatus("");
  if (window.CarnivalPairing?.openPairingCode) {
    await window.CarnivalPairing.openPairingCode(pairingCode);
    return;
  }

  showGalleryError("Either the pairing code does not exist or has been deleted.");
});

startSlideshowButton.addEventListener("click", () => openSlideshow(0));

durationDecreaseButton.addEventListener("click", () => changeDuration(-1));
durationIncreaseButton.addEventListener("click", () => changeDuration(1));

loopInput.addEventListener("change", () =>
  syncConfigFromInputs({
    loop: loopInput,
  })
);

prevSlideButton.addEventListener("click", () => showSlide(currentSlideIndex - 1));
nextSlideButton.addEventListener("click", () => showSlide(currentSlideIndex + 1));
closeSlideshowMobileButton?.addEventListener("click", closeSlideshow);
likeSlideButton?.addEventListener("click", async () => {
  try {
    await togglePhotoLike();
  } catch (error) {
    setStatus(error.message || "Could not save the photo like.", true);
  }
});
downloadSlideButton.addEventListener("click", downloadCurrentSlide);
toggleSlideshowPlaybackButton?.addEventListener("click", toggleSlideshowPlayback);
enterSlideshowFullscreenButton?.addEventListener("click", () => {
  enterSlideshowFullscreen().catch(() => {
    setStatus("Fullscreen isn’t available right now.", true);
  });
});
shareSlideButton?.addEventListener("click", () => {
  shareCurrentSlide().catch(() => {
    setStatus("Sharing isn’t available right now.", true);
  });
});
slideshowEl?.addEventListener("pointermove", handleSlideshowInteraction, { passive: true });
slideshowEl?.addEventListener("pointerdown", handleSlideshowInteraction, { passive: true });
slideshowEl?.addEventListener("touchstart", handleSlideshowInteraction, { passive: true });
document.addEventListener("fullscreenchange", () => {
  setSlideshowFullscreenVisualState();
  if (isSlideshowFullscreen()) {
    clearSlideshowUiHideTimer();
    slideshowEl?.classList.add("slideshow-ui-hidden");
    return;
  }

  if (isSlideshowOpen()) {
    showSlideshowUi();
  }
});
slideVideoOverlayEl?.addEventListener("click", async () => {
  await toggleCurrentVideoPlayback();
});
slideVideoToggleButton?.addEventListener("click", async () => {
  await toggleCurrentVideoPlayback();
});
slideVideoEl?.addEventListener("timeupdate", updateVideoProgress);
slideVideoEl?.addEventListener("loadedmetadata", updateVideoProgress);
slideVideoEl?.addEventListener("play", () => {
  slideVideoControlsEl?.classList.remove("hidden");
  updateVideoToggleVisual(true);
  slideVideoOverlayEl?.classList.add("hidden");
  updateVideoProgress();
});
slideVideoEl?.addEventListener("pause", () => {
  updateVideoToggleVisual(false);
  updateVideoProgress();
});
slideVideoEl?.addEventListener("ended", () => {
  updateVideoToggleVisual(false);
  updateVideoProgress();
});
slideVideoTimelineEl?.addEventListener("pointermove", (event) => {
  slideVideoTooltipEl?.classList.remove("hidden");
  updateTimelineTooltip(event.clientX);
});
slideVideoTimelineEl?.addEventListener("pointerenter", (event) => {
  slideVideoTooltipEl?.classList.remove("hidden");
  updateTimelineTooltip(event.clientX);
});
slideVideoTimelineEl?.addEventListener("pointerleave", () => {
  slideVideoTooltipEl?.classList.add("hidden");
});
slideVideoTimelineEl?.addEventListener("click", (event) => {
  seekCurrentVideo(event.clientX);
});

bindCoverSettingsButton();
toggleSlideshowSettingsButton?.addEventListener("click", openGallerySettingsPanel);

closeGallerySettingsButton.addEventListener("click", () => {
  closeGallerySettingsPanel();
});

scrollToTopButton?.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", updateSlideshowActionVisibility);
window.addEventListener("resize", queueGalleryLayout);
window.addEventListener("resize", updateScrollTopButtonVisibility);
window.addEventListener("resize", updateCoverStoryLayout);
window.addEventListener("resize", syncCoverPhotoHeightForViewport);
window.addEventListener("scroll", updateScrollTopButtonVisibility, { passive: true });
window.addEventListener("scroll", updateStickyFolderTabsVisibility, { passive: true });
window.addEventListener("resize", updateStickyFolderTabsVisibility);
window.history.scrollRestoration = "manual";

window.CarnivalGallery = {
  loadFolder,
  loadSnapshot,
  revalidateFolder,
  showError: showGalleryError,
  showLoading: showGalleryLoading,
  showLoadingPreview: showGalleryLoadingPreview,
  openExternalSlideshow(photos, options = {}) {
    images = Array.isArray(photos) ? photos.slice() : [];
    currentPhotoLikes = normalizePhotoLikesMap(options.photoLikes);
    likedPhotoSessionIds = new Set();
    currentLikeContext = {
      enabled: Boolean(options.likeEndpoint && options.unlikeEndpoint),
      likeEndpoint: String(options.likeEndpoint || ""),
      unlikeEndpoint: String(options.unlikeEndpoint || ""),
      payload: options.likePayload && typeof options.likePayload === "object" ? options.likePayload : {},
    };
    currentSlideshowOptions = {
      shareEnabled: Boolean(options.shareEnabled),
    };
    currentShareContext = {
      tagline: String(options.tagline || "").trim(),
      studioName: String(options.studioName || "").trim(),
      pageUrl: String(options.pageUrl || window.location.href).trim(),
      pairingCode: String(options.pairingCode || "").trim(),
    };
    updateSlideshowActionVisibility();
    openSlideshow(Number(options.index) || 0);
  },
};

updateDurationControls();
syncPendingSharedSelectionFromLocation();
void initializeBootLoader();
if (
  !window.CarnivalStudioPublicRoute &&
  !window.CarnivalEventPublicRoute &&
  !window.CarnivalEventModerationRoute &&
  getResolvedPathname() !== "/studio" &&
  getResolvedPathname() !== "/login"
) {
  setActiveScreen(getResolvedPathname() === "/" ? 1 : 3, { replaceState: true });
}

window.addEventListener("popstate", () => {
  syncPendingSharedSelectionFromLocation();
  if (
    window.CarnivalStudioPublicRoute ||
    window.CarnivalEventPublicRoute ||
    window.CarnivalEventModerationRoute ||
    getResolvedPathname() === "/studio" ||
    getResolvedPathname() === "/login"
  ) {
    return;
  }

  setActiveScreen(getResolvedPathname() === "/" ? 1 : 3, {
    skipHistory: true,
    replaceState: true,
  });
});
