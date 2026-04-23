const directLinkForm = document.getElementById("direct-link-form");
const directLinkInput = document.getElementById("direct-link-input");
const directStatusEl = document.getElementById("direct-status");
const directLoadingIndicatorEl = document.getElementById("direct-loading-indicator");
const directLoadingPercentEl = document.getElementById("direct-loading-percent");
const directLoadingMessageEl = document.getElementById("direct-loading-message");

const screenDirectLink = document.getElementById("screen-direct-link");
const screenGallery = document.getElementById("screen-gallery");

const galleryEl = document.getElementById("gallery");
const coverPhotoEl = document.getElementById("cover-photo");
const galleryFolderPathEl = document.getElementById("gallery-folder-path");
const photoCountEl = document.getElementById("photo-count");
const selectedGridFolderEl = document.getElementById("selected-grid-folder");
const folderTabsEl = document.getElementById("folder-tabs");
let toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
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
const slideshowLoaderEl = document.getElementById("slideshow-loader");
const slideshowToastEl = document.getElementById("slideshow-toast");
const shareSlideButton = document.getElementById("share-slide");
const downloadSlideButton = document.getElementById("download-slide");
const prevSlideButton = document.getElementById("prev-slide");
const nextSlideButton = document.getElementById("next-slide");
const logoAssetPath = "/assets/carnivalstories-logo.svg?v=20260423";

let currentFolders = [];
let selectedFolderId = null;
let coverPhoto = null;
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
let loadingProgress = 0;
let loadingProgressTarget = 0;
let loadingProgressMessageBase = "";
let loadingMessageDots = 0;
let slideshowConfig = {
  duration: 4,
  loop: false,
  autoplay: false,
};
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

function renderCoverChrome() {
  coverPhotoEl.innerHTML = `
    <img class="cover-logo" src="${logoAssetPath}" alt="Carnival Stories" />
    <div class="empty-sequence">Your photos will show up here shortly.</div>
    <button id="toggle-gallery-settings" type="button" class="icon-action gallery-settings-button cover-settings-button" aria-label="Open slideshow settings">
      <span class="gallery-settings-text">Slideshow settings</span>
    </button>
  `;
  toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
  bindCoverSettingsButton();
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
    directLoadingIndicatorEl.classList.add("hidden");
    screenGallery.classList.remove("loading");
    screenGallery.classList.add("revealed");
    loadingProgress = 0;
    loadingProgressTarget = 0;
    loadingProgressMessageBase = "";
    loadingMessageDots = 0;
    renderLoadingState();
    clearLoadingTimer();
    return;
  }

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
  screenGallery.classList.add("loading");
  directLoadingIndicatorEl.classList.remove("hidden");
  renderLoadingState();
}

function resetGalleryLoadingShell() {
  screenGallery.classList.add("loading");
  screenGallery.classList.remove("revealed");
  renderCoverChrome();
  galleryEl.innerHTML = "";
  folderTabsEl.innerHTML = "";
  photoCountEl.textContent = "0";
  galleryFolderPathEl.textContent = "PATH: //";
  galleryFolderPathEl.href = "/";
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

  if (step === 1) {
    focusElement(directLinkInput);
  } else if (step === 3) {
    const firstGalleryCard = galleryEl.querySelector(".photo-card:not(.photo-card-cover)");
    if (firstGalleryCard) {
      focusElement(firstGalleryCard);
    }
  }
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

function getSelectedFolder() {
  return currentFolders.find((folder) => folder.id === selectedFolderId) || null;
}

function updateFolderSidePanel() {
  const folder = getSelectedFolder();
  if (selectedGridFolderEl) {
    selectedGridFolderEl.textContent = folder ? folder.name : "Nothing selected yet";
  }
}

function renderFolderTabs(folders) {
  folderTabsEl.innerHTML = "";

  if (!folders.length) {
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
  galleryEl.innerHTML = "";
  renderCoverChrome();
  coverPhotoEl.style.backgroundImage = "none";
  imageLoadFailures = 0;

  const visiblePhotos = photoItems.filter((photo) => photo !== coverPhoto);
  const slideshowIndexOffset = photoItems[0] === coverPhoto ? 1 : 0;

  if (coverPhoto) {
    const card = document.createElement("div");
    card.className = "photo-card photo-card-cover";
    const image = document.createElement("img");
    image.src = coverPhoto.url;
    image.alt = coverPhoto.name;
    image.loading = "lazy";
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

  if (!visiblePhotos.length) {
    galleryEl.innerHTML = '<div class="empty-sequence">This folder doesn\'t have any photos yet.</div>';
    return;
  }

  visiblePhotos.forEach((photo, index) => {
    const card = document.createElement("button");
    card.className = "photo-card is-loading";
    card.type = "button";
    card.dataset.index = String(index);

    const span = getMasonryTileSpan(photo, index);
    card.style.aspectRatio = String(span.aspectRatio);

    const image = document.createElement("img");
    image.src = photo.thumbnailUrl || photo.url;
    image.alt = photo.name;
    image.loading = "lazy";
    image.addEventListener("load", () => {
      card.classList.remove("is-loading");
    });
    image.addEventListener("error", () => {
      card.classList.remove("is-loading");
      imageLoadFailures += 1;
      image.style.opacity = "0.14";
      setStatus(
        `${imageLoadFailures} image${imageLoadFailures === 1 ? "" : "s"} failed to load. Direct Drive media access may be restricted for some files.`,
        true
      );
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
    galleryEl.appendChild(card);
  });
}

function updateGalleryForSelectedFolder() {
  const selectedFolder = getSelectedFolder();
  images = selectedFolder ? selectedFolder.images : [];
  photoCountEl.textContent = `${images.length}`;
  if (selectedFolder) {
    const shareLink = getFolderShareLink(selectedFolder);
    galleryFolderPathEl.textContent = `PATH: ${shareLink}`;
    galleryFolderPathEl.href = shareLink;
  } else {
    galleryFolderPathEl.textContent = "PATH: //";
    galleryFolderPathEl.href = "/";
  }
  if (selectedGridFolderEl) {
    selectedGridFolderEl.textContent = selectedFolder ? selectedFolder.name : "Nothing selected yet";
  }
  renderGallery(selectedFolder ? selectedFolder.images : []);
  if (selectedFolder) {
    startBackgroundFolderPreload(currentFolders, selectedFolder.id);
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

    const preloader = new Image();
    preloader.decoding = "async";
    preloader.src = images[index].url;
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
    preloader.onload = () => resolve();
    preloader.onerror = () => resolve();
    preloader.src = source;
  });

  folderThumbnailPreloadCache.set(source, preloadPromise);
  return preloadPromise;
}

function startBackgroundFolderPreload(folders, activeFolderId) {
  const preloadToken = ++folderPreloadRunToken;
  const sources = folders
    .filter((folder) => folder.id !== activeFolderId)
    .flatMap((folder) => folder.images.map((photo) => photo.thumbnailUrl || photo.url))
    .filter(Boolean);

  if (!sources.length) {
    return;
  }

  const runPreload = () => {
    let nextIndex = 0;
    const workerCount = Math.min(3, sources.length);

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
    window.requestIdleCallback(runPreload, { timeout: 500 });
    return;
  }

  window.setTimeout(runPreload, 120);
}

function scheduleSlideshowAdvance() {
  clearSlideshowAdvanceTimer();

  if (slideshowEl.classList.contains("hidden") || images.length <= 1) {
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

  slideImageEl.onerror = () => {
    setStatus(`Could not load "${photo.name}" in slideshow view.`, true);
  };

  slideImageEl.src = previewSource;
  slideImageEl.alt = photo.name;
  if (slideImageFullEl) {
    slideImageFullEl.classList.remove("loaded");
    slideImageFullEl.removeAttribute("src");
    slideImageFullEl.alt = photo.name;
  }

  if (slideshowLoaderEl) {
    slideshowLoaderEl.classList.remove("hidden");
  }

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
  };
  fullImage.onerror = () => {
    if (requestToken !== slideshowImageLoadToken) {
      return;
    }

    if (slideshowLoaderEl) {
      slideshowLoaderEl.classList.add("hidden");
    }
  };
  fullImage.src = photo.url;
  syncSlideshowPreloadWindow(currentSlideIndex);
  scheduleSlideshowAdvance();
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

  updateSlideshowActionVisibility();
  slideshowEl.classList.remove("hidden");
  slideshowEl.setAttribute("aria-hidden", "false");
  showSlide(index);
  if (slideshowToastEl) {
    slideshowToastEl.classList.remove("hidden");
    window.clearTimeout(openSlideshow.toastTimer);
    openSlideshow.toastTimer = window.setTimeout(() => {
      slideshowToastEl.classList.add("hidden");
    }, 3000);
  }
  focusElement(nextSlideButton);
}
openSlideshow.toastTimer = null;

function closeSlideshow() {
  clearSlideshowAdvanceTimer();
  slideshowImageLoadToken += 1;
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
        screenGallery.classList.remove("panel-open");
        focusElement(toggleGallerySettingsButton);
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

async function loadFolder(folderUrl) {
  setStatus("Getting everything ready...");
  setLoadingState(false);

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

    setActiveScreen(3);
    resetGalleryLoadingShell();
    setLoadingState(true, "Loading your photos.", { progress: 0 });
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const response = await fetch(`/api/folder?url=${encodeURIComponent(folderUrl)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load Google Drive folder.");
    }

    currentFolders = collectFolders(data.tree);
    selectedFolderId = currentFolders[0] ? currentFolders[0].id : null;
    coverPhoto = currentFolders[0]?.images?.[0] || null;
    sharedFolderName = data.tree?.name || "";
    syncHistoryForStep(3, true);
    renderFolderTabs(currentFolders);
    updateFolderSidePanel();
    updateGalleryForSelectedFolder();
    setLoadingState(true, "Loading your photos.", { progress: 100 });
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
    sharedFolderName = "";
    images = [];
    photoCountEl.textContent = "0";
    galleryEl.innerHTML = '<div class="empty-sequence">We couldn\'t load the photos this time.</div>';
    setStatus(error.message, true);
    setLoadingState(false);
  }
}

directLinkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const folderUrl = directLinkInput.value.trim();
  if (!folderUrl) {
    setDirectStatus("Paste a Google Drive folder link and we’ll open it for you.", true);
    return;
  }

  setDirectStatus("");
  await loadFolder(folderUrl);
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
downloadSlideButton.addEventListener("click", downloadCurrentSlide);
shareSlideButton?.addEventListener("click", () => {
  shareCurrentSlide().catch(() => {
    setStatus("Sharing isn’t available right now.", true);
  });
});

bindCoverSettingsButton();

closeGallerySettingsButton.addEventListener("click", () => {
  screenGallery.classList.remove("panel-open");
  focusElement(toggleGallerySettingsButton);
});

document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", updateSlideshowActionVisibility);
window.history.scrollRestoration = "manual";

updateDurationControls();
setActiveScreen(window.location.pathname === "/" ? 1 : 3, { replaceState: true });

window.addEventListener("popstate", () => {
  setActiveScreen(window.location.pathname === "/" ? 1 : 3, {
    skipHistory: true,
    replaceState: true,
  });
});
