const directLinkForm = document.getElementById("direct-link-form");
const directLinkInput = document.getElementById("direct-link-input");
const directStatusEl = document.getElementById("direct-status");
const directLoadingIndicatorEl = document.getElementById("direct-loading-indicator");
const directLoadingPercentEl = document.getElementById("direct-loading-percent");
const directLoadingMessageEl = document.getElementById("direct-loading-message");

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
const selectedGridFolderEl = document.getElementById("selected-grid-folder");
const folderTabsEl = document.getElementById("folder-tabs");
const folderTabsShellEl = document.querySelector(".folder-tabs-shell");
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
const shareSlideButton = document.getElementById("share-slide");
const downloadSlideButton = document.getElementById("download-slide");
const toggleSlideshowPlaybackButton = document.getElementById("toggle-slideshow-playback");
const slideshowPlaybackIconEl = document.getElementById("slideshow-playback-icon");
const prevSlideButton = document.getElementById("prev-slide");
const nextSlideButton = document.getElementById("next-slide");
const logoAssetPath = "/assets/carnivalstories-logo.svg?v=20260423";

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
let slideshowPaused = false;
let slideshowConfig = {
  duration: 4,
  loop: false,
  autoplay: false,
};
const INITIAL_GALLERY_BATCH_SIZE = 36;
const GALLERY_BATCH_SIZE = 48;
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

function getCurrentSlidePhoto() {
  return images[currentSlideIndex] || null;
}

function isVideoMedia(item) {
  return Boolean(item?.mimeType && item.mimeType.startsWith("video/"));
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

  const currentPath = window.location.pathname || "/";
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

  if (viewportWidth <= 720) {
    const minimumTileWidth = 150;
    const maxColumnsByWidth = Math.max(1, Math.floor((galleryWidth + gap) / (minimumTileWidth + gap)));
    return Math.min(2, maxColumnsByWidth);
  }

  if (viewportWidth <= 1100) {
    const minimumTileWidth = 180;
    const maxColumnsByWidth = Math.max(1, Math.floor((galleryWidth + gap) / (minimumTileWidth + gap)));
    return Math.min(3, maxColumnsByWidth);
  }

  const minimumTileWidth = 220;
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
}

function showGalleryError(message) {
  setActiveScreen(3, { skipHistory: true });
  setGalleryErrorState(message);
}

function showGalleryLoading(message = "Loading your albums.") {
  setActiveScreen(3, { skipHistory: true });
  resetGalleryLoadingShell();
  setLoadingState(true, message, { progress: 0 });
}

function showGalleryLoadingPreview(options = {}) {
  coverTagline = String(options.tagline || "").trim();
  coverDateRange = String(options.eventDateRange || "").trim();
  setActiveBranding(options.branding || {});
  setLoadingCoverBackground(options.coverImageUrl || options.coverThumbnailUrl || "");
  setActiveScreen(3, { skipHistory: true });
  resetGalleryLoadingShell();
  setLoadingState(true, options.message || "Loading your albums.", { progress: options.progress ?? 0 });
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

function setActiveBranding(branding = {}) {
  activeBranding = {
    backgroundColor: normalizeBrandColor(branding.backgroundColor, "#FFFFFF"),
    accentColor: normalizeBrandColor(branding.accentColor, "#000000"),
    logoLink: String(branding.logoLink || "").trim(),
    faviconLink: String(branding.faviconLink || "").trim(),
    homepageLink: String(branding.homepageLink || "").trim(),
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

  coverPhotoEl.innerHTML = `
    ${logoMarkup}
    <div class="empty-sequence">Your photos will show up here shortly.</div>
    ${coverCopy}
  `;
  toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
  window.requestAnimationFrame(() => {
    updateCoverStoryLayout();
  });
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      updateCoverStoryLayout();
    });
  }
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
  if (window.location.pathname === nextPath) {
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

  if (step === 1) {
    focusElement(directLinkInput);
  } else if (step === 3) {
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
  currentFolders = folders;
  selectedFolderId = currentFolders[0] ? currentFolders[0].id : null;
  const allMediaItems = currentFolders.flatMap((folder) => folder.images || []);
  coverPhoto = options.coverFileId
    ? allMediaItems.find((item) => item.id === options.coverFileId) || currentFolders[0]?.images?.[0] || null
    : currentFolders[0]?.images?.[0] || null;
  if (coverPhoto) {
    setLoadingCoverBackground(coverPhoto.url || coverPhoto.thumbnailUrl || "");
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

function updateFolderTabsVisibility(folders = currentFolders) {
  if (!folderTabsShellEl) {
    return;
  }

  folderTabsShellEl.classList.toggle("hidden", (folders?.length || 0) <= 1);
}

function updateFolderSidePanel() {
  const folder = getSelectedFolder();
  if (selectedGridFolderEl) {
    selectedGridFolderEl.textContent = folder ? folder.name : "Nothing selected yet";
  }
}

function renderFolderTabs(folders) {
  updateFolderTabsVisibility(folders);
  folderTabsEl.innerHTML = "";

  if (folders.length <= 1) {
    folderTabsEl.innerHTML = "";
    return;
  }

  folders.forEach((folder) => {
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
      button.scrollIntoView({ block: "nearest" });
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
    folderTabsEl.appendChild(button);
  });
}

function renderGallery(photoItems) {
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

  const visiblePhotos = photoItems.filter((photo) => photo !== coverPhoto);
  const slideshowIndexOffset = photoItems[0] === coverPhoto ? 1 : 0;
  pendingGalleryThumbnailLoads = visiblePhotos.length;

  if (coverPhoto) {
    coverPhotoEl.style.setProperty("--cover-image", `url("${coverPhoto.url}")`);
    coverPhotoEl.classList.add("has-cover-image");
    const card = document.createElement("div");
    card.className = "photo-card photo-card-cover";
    const image = document.createElement("img");
    image.src = coverPhoto.url;
    image.alt = coverPhoto.name;
    image.loading = "lazy";
    image.fetchPriority = "high";
    image.addEventListener("error", () => {
      imageLoadFailures += 1;
      image.style.opacity = "0.14";
      setStatus(
        `${imageLoadFailures} image${imageLoadFailures === 1 ? "" : "s"} failed to load. Direct Drive media access may be restricted for some files.`,
        true
      );
    });
    card.appendChild(image);
    coverPhotoEl.appendChild(card);
  }

  if (!photoItems.length) {
    pendingGalleryThumbnailLoads = 0;
    setGalleryErrorState("This folder doesn't have any photos yet.");
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
      });

      card.appendChild(image);
      card.addEventListener("click", () => openSlideshow(index + slideshowIndexOffset));
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
          openSlideshow(index + slideshowIndexOffset);
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
  const selectedFolder = getSelectedFolder();
  images = selectedFolder ? selectedFolder.images : [];
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
    selectedGridFolderEl.textContent = selectedFolder ? selectedFolder.name : "Nothing selected yet";
  }
  renderGallery(selectedFolder ? selectedFolder.images : []);
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

  slideshowAdvanceTimer = window.setTimeout(() => {
    showSlide(currentSlideIndex + 1);
  }, slideshowConfig.duration * 1000);
}

function showSlide(index) {
  if (!images.length) {
    return;
  }

  if (!slideshowConfig.loop && index < 0) {
    index = 0;
  } else if (!slideshowConfig.loop && index >= images.length) {
    index = images.length - 1;
  }

  currentSlideIndex = (index + images.length) % images.length;
  const photo = images[currentSlideIndex];
  const requestToken = ++slideshowImageLoadToken;
  const previewSource = photo.thumbnailUrl || photo.url;
  const isVideo = isVideoMedia(photo);

  cancelBackgroundFolderPreload();
  clearSlideshowAdvanceTimer();
  resetSlideshowVideoState();

  slideImageEl.onerror = () => {
    setStatus(`Could not load "${photo.name}" in slideshow view.`, true);
  };

  slideImageEl.classList.remove("hidden");
  slideImageEl.fetchPriority = "high";
  slideImageEl.src = previewSource;
  slideImageEl.alt = photo.name;
  if (slideImageFullEl) {
    slideImageFullEl.classList.remove("hidden");
    slideImageFullEl.classList.remove("loaded");
    slideImageFullEl.removeAttribute("src");
    slideImageFullEl.fetchPriority = "high";
    slideImageFullEl.alt = photo.name;
  }

  if (slideshowLoaderEl && !isVideo) {
    slideshowLoaderEl.classList.remove("hidden");
  }

  if (isVideo) {
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

  const fullImage = new Image();
  fullImage.decoding = "async";
  fullImage.onload = () => {
    if (requestToken !== slideshowImageLoadToken) {
      return;
    }

    if (slideImageFullEl) {
      slideImageFullEl.src = photo.url;
      slideImageFullEl.classList.add("loaded");
    }

    if (slideshowLoaderEl) {
      slideshowLoaderEl.classList.add("hidden");
    }

    scheduleSlideshowAdvance();
  };
  fullImage.onerror = () => {
    if (requestToken !== slideshowImageLoadToken) {
      return;
    }

    if (slideshowLoaderEl) {
      slideshowLoaderEl.classList.add("hidden");
    }

    scheduleSlideshowAdvance();
  };
  fullImage.src = photo.url;
  syncSlideshowPreloadWindow(currentSlideIndex);
}

function updateSlideshowActionVisibility() {
  if (!shareSlideButton) {
    return;
  }

  const showShare = window.matchMedia("(max-width: 1100px)").matches;
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

  const shareData = {
    title: photo.name || "CarnivalShowcase",
    text: photo.name || "CarnivalShowcase",
    url: photo.url,
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(photo.url);
    setStatus("Photo link copied to clipboard.");
    return;
  }

  window.open(photo.url, "_blank", "noreferrer");
}

function openSlideshow(index = 0) {
  if (!images.length) {
    setStatus("There aren’t any photos ready to play just yet.", true);
    return;
  }

  cancelBackgroundFolderPreload();
  slideshowPaused = false;
  updateSlideshowPlaybackVisual();
  updateSlideshowActionVisibility();
  slideshowEl.classList.remove("hidden");
  slideshowEl.setAttribute("aria-hidden", "false");
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
  focusElement(nextSlideButton);
}
openSlideshow.toastTimer = null;

function closeSlideshow() {
  clearSlideshowAdvanceTimer();
  slideshowImageLoadToken += 1;
  slideshowPaused = false;
  updateSlideshowPlaybackVisual();
  resetSlideshowVideoState();
  slideshowEl.classList.add("hidden");
  slideshowEl.setAttribute("aria-hidden", "true");
  if (slideshowToastEl) {
    slideshowToastEl.classList.add("hidden");
  }
  if (slideshowLoaderEl) {
    slideshowLoaderEl.classList.add("hidden");
  }
  if (slideImageFullEl) {
    slideImageFullEl.classList.remove("loaded");
    slideImageFullEl.removeAttribute("src");
  }
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
    showSlide(currentSlideIndex + 1);
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showSlide(currentSlideIndex - 1);
  }
}

async function loadFolder(folderUrl, options = {}) {
  setStatus("Getting everything ready...");
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
      const metaResponse = await fetch(`/api/folder-meta?url=${encodeURIComponent(folderUrl)}`);
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
    setLoadingState(true, "Loading your albums.", { progress: 0 });
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const response = await fetch(`/api/folder?url=${encodeURIComponent(folderUrl)}&includeVideos=1`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load Google Drive folder.");
    }

    const folders = collectFolders(data.tree);
    applyFolderState(folders, {
      coverFileId: options.coverFileId,
      rootName: data.tree?.name || "",
      preservePath: options.preservePath,
    });
    if (coverPhoto) {
      setLoadingState(true, "Loading your albums.", { progress: 62 });
      setLoadingCoverBackground(coverPhoto.url || coverPhoto.thumbnailUrl || "");
      const coverPreloader = new Image();
      coverPreloader.src = coverPhoto.url;
      await new Promise((resolve) => {
        coverPreloader.onload = resolve;
        coverPreloader.onerror = resolve;
      });
    }
    setLoadingState(true, "Loading your albums.", { progress: 100 });
    await new Promise((resolve) => window.setTimeout(resolve, 140));

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
  coverTagline = String(options.tagline || "").trim();
  coverDateRange = String(options.eventDateRange || "").trim();
  setActiveBranding(options.branding || {});
  setLoadingCoverBackground(options.coverImageUrl || options.coverThumbnailUrl || "");
  setActiveScreen(3, { skipHistory: Boolean(options.preservePath) });
  resetGalleryLoadingShell();
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
  });
  setLoadingState(true, "Opening your gallery preview.", { progress: 100 });
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
downloadSlideButton.addEventListener("click", downloadCurrentSlide);
toggleSlideshowPlaybackButton?.addEventListener("click", toggleSlideshowPlayback);
shareSlideButton?.addEventListener("click", () => {
  shareCurrentSlide().catch(() => {
    setStatus("Sharing isn’t available right now.", true);
  });
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
window.addEventListener("scroll", updateScrollTopButtonVisibility, { passive: true });
window.history.scrollRestoration = "manual";

window.CarnivalGallery = {
  loadFolder,
  loadSnapshot,
  revalidateFolder,
  showError: showGalleryError,
  showLoading: showGalleryLoading,
  showLoadingPreview: showGalleryLoadingPreview,
};

updateDurationControls();
if (!window.CarnivalStudioPublicRoute && window.location.pathname !== "/studio") {
  setActiveScreen(window.location.pathname === "/" ? 1 : 3, { replaceState: true });
}

window.addEventListener("popstate", () => {
  if (window.CarnivalStudioPublicRoute || window.location.pathname === "/studio") {
    return;
  }

  setActiveScreen(window.location.pathname === "/" ? 1 : 3, {
    skipHistory: true,
    replaceState: true,
  });
});
