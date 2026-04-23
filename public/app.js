const directLinkForm = document.getElementById("direct-link-form");
const directLinkInput = document.getElementById("direct-link-input");
const directStatusEl = document.getElementById("direct-status");
const directLoadingIndicatorEl = document.getElementById("direct-loading-indicator");
const directLoadingCopyEl = document.getElementById("direct-loading-copy");

const screenDirectLink = document.getElementById("screen-direct-link");
const screenFolders = document.getElementById("screen-folders");
const screenGallery = document.getElementById("screen-gallery");

const folderTreeEl = document.getElementById("folder-tree");
const folderCountEl = document.getElementById("folder-count");
const folderPathStatusEl = document.getElementById("folder-path-status");
const foldersTitleEl = document.getElementById("folders-title");
const foldersSubtitleEl = document.getElementById("folders-subtitle");
const toggleFolderPanelButton = document.getElementById("toggle-folder-panel");
const closeFolderPanelButton = document.getElementById("close-folder-panel");
const folderSidePanelEl = document.getElementById("folder-side-panel");
const selectedFolderNameEl = document.getElementById("selected-folder-name");
const selectedFolderPathEl = document.getElementById("selected-folder-path");
const selectedFolderCountEl = document.getElementById("selected-folder-count");

const galleryEl = document.getElementById("gallery");
const coverPhotoEl = document.getElementById("cover-photo");
const galleryFolderPathEl = document.getElementById("gallery-folder-path");
const photoCountEl = document.getElementById("photo-count");
const selectedGridFolderEl = document.getElementById("selected-grid-folder");
const folderTabsEl = document.getElementById("folder-tabs");
const toggleGallerySettingsButton = document.getElementById("toggle-gallery-settings");
const closeGallerySettingsButton = document.getElementById("close-gallery-settings");

const backToLinkButton = document.getElementById("back-to-link");
const continueToGalleryButton = document.getElementById("continue-to-gallery");
const startSlideshowButton = document.getElementById("start-slideshow");

const durationReadoutEl = document.getElementById("duration-readout");
const durationCountEl = document.getElementById("duration-count");
const durationDecreaseButton = document.getElementById("duration-decrease");
const durationIncreaseButton = document.getElementById("duration-increase");
const loopInput = document.getElementById("loop-input");

const slideshowEl = document.getElementById("slideshow");
const slideImageEl = document.getElementById("slide-image");
const slideshowToastEl = document.getElementById("slideshow-toast");
const shareSlideButton = document.getElementById("share-slide");
const downloadSlideButton = document.getElementById("download-slide");
const prevSlideButton = document.getElementById("prev-slide");
const nextSlideButton = document.getElementById("next-slide");

let currentFolders = [];
let selectedFolderId = null;
let coverPhoto = null;
let sharedFolderName = "";
let images = [];
let currentSlideIndex = -1;
let imageLoadFailures = 0;
let slideshowPreloadCache = new Map();
let loadTimer = null;
let loadStartedAt = 0;
let slideshowConfig = {
  duration: 8,
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
  return slug ? `/${slug}` : "/gallery";
}

function moveFolderFocus(direction) {
  const buttons = Array.from(folderTreeEl.querySelectorAll(".folder-choice"));
  if (!buttons.length) {
    return;
  }

  const currentIndex = buttons.findIndex((button) => button === document.activeElement);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = Math.max(0, Math.min(buttons.length - 1, safeIndex + direction));
  focusElement(buttons[nextIndex]);
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

function getFolderCards() {
  return Array.from(folderTreeEl.querySelectorAll(".folder-choice"));
}

function moveFolderGridFocus(direction) {
  moveFocusByGeometry(getFolderCards(), direction);
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

function formatElapsedCopy(baseMessage) {
  if (!loadStartedAt) {
    return baseMessage;
  }

  const elapsedSeconds = Math.max(1, Math.floor((Date.now() - loadStartedAt) / 1000));
  return `${baseMessage} Elapsed time: ${elapsedSeconds}s.`;
}

function setLoadingState(isLoading, message = "", options = {}) {
  const { preserveStartTime = false } = options;

  if (!directLoadingIndicatorEl || !directLoadingCopyEl) {
    return;
  }

  if (!isLoading) {
    directLoadingIndicatorEl.classList.add("hidden");
    directLoadingCopyEl.textContent = "";
    clearLoadingTimer();
    loadStartedAt = 0;
    return;
  }

  if (!preserveStartTime || !loadStartedAt) {
    loadStartedAt = Date.now();
  }

  const baseMessage =
    message || "We’re opening your folder now. Larger collections can take around 10 to 30 seconds.";
  directLoadingCopyEl.textContent = formatElapsedCopy(baseMessage);
  directLoadingIndicatorEl.classList.remove("hidden");
  clearLoadingTimer();
  loadTimer = window.setInterval(() => {
    directLoadingCopyEl.textContent = formatElapsedCopy(baseMessage);
  }, 1000);
}

function getStepForPath(pathname) {
  if (pathname === "/" || pathname === "") {
    return 1;
  }

  if (pathname === "/folders") {
    return 2;
  }

  return 3;
}

function syncHistoryForStep(step, replaceState = false) {
  const nextPath = step === 1 ? "/" : step === 2 ? "/folders" : getGalleryPath();
  if (window.location.pathname === nextPath) {
    return;
  }

  const method = replaceState ? "replaceState" : "pushState";
  window.history[method]({ step }, "", nextPath);
}

function setActiveScreen(step, options = {}) {
  const { replaceState = false, skipHistory = false } = options;
  screenDirectLink.classList.toggle("active", step === 1);
  screenFolders.classList.toggle("active", step === 2);
  screenGallery.classList.toggle("active", step === 3);

  if (step !== 2) {
    screenFolders.classList.remove("panel-open");
  }

  if (step !== 3) {
    screenGallery.classList.remove("panel-open");
  }

  if (!skipHistory) {
    syncHistoryForStep(step, replaceState);
  }

  window.scrollTo(0, 0);

  if (step === 1) {
    focusElement(directLinkInput);
  } else if (step === 2) {
    focusElement(folderTreeEl.querySelector(".folder-choice") || continueToGalleryButton);
  } else if (step === 3) {
    focusElement(getFirstGalleryCard());
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
  selectedFolderNameEl.textContent = folder ? folder.name : "Nothing selected yet";
  if (folder) {
    const shareLink = getFolderShareLink(folder);
    selectedFolderPathEl.textContent = shareLink;
    selectedFolderPathEl.href = shareLink;
  } else {
    selectedFolderPathEl.textContent = "/";
    selectedFolderPathEl.href = "/";
  }
  selectedFolderCountEl.textContent = folder
    ? `${folder.images.length} photo${folder.images.length === 1 ? "" : "s"}`
    : "0 photos";
  folderPathStatusEl.textContent = folder ? `PATH: ${getFolderShareLink(folder)}` : "PATH: //";
  foldersTitleEl.textContent = currentFolders.length > 1 ? "CHOOSE A FOLDER" : "FOLDER READY";
  foldersSubtitleEl.textContent = folder
    ? `You're all set to browse photos from ${folder.name}.`
    : "Pick the folder you'd like to show on screen.";
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
      setActiveScreen(3);
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
  coverPhotoEl.innerHTML = "";
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
    const overlay = document.createElement("div");
    overlay.className = "photo-card-overlay";
    const label = document.createElement("span");
    label.className = "photo-card-label";
    label.textContent = "CarnivalShowcase";
    overlay.appendChild(label);
    card.appendChild(overlay);
    coverPhotoEl.appendChild(card);
  }

  if (!visiblePhotos.length) {
    galleryEl.innerHTML = '<div class="empty-sequence">This folder doesn\'t have any photos yet.</div>';
    return;
  }

  visiblePhotos.forEach((photo, index) => {
    const card = document.createElement("button");
    card.className = "photo-card";
    card.type = "button";
    card.dataset.index = String(index);

    const span = getMasonryTileSpan(photo, index);
    card.style.aspectRatio = String(span.aspectRatio);

    const image = document.createElement("img");
    image.src = photo.thumbnailUrl || photo.url;
    image.alt = photo.name;
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
  selectedGridFolderEl.textContent = selectedFolder ? selectedFolder.name : "Nothing selected yet";
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

  slideImageEl.onerror = () => {
    setStatus(`Could not load "${photo.name}" in slideshow view.`, true);
  };

  slideImageEl.src = photo.url;
  slideImageEl.alt = photo.name;
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

  updateSlideshowActionVisibility();
  showSlide(index);
  slideshowEl.classList.remove("hidden");
  slideshowEl.setAttribute("aria-hidden", "false");
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
  slideshowEl.classList.add("hidden");
  slideshowEl.setAttribute("aria-hidden", "true");
  if (slideshowToastEl) {
    slideshowToastEl.classList.add("hidden");
  }
  window.clearTimeout(openSlideshow.toastTimer);
  openSlideshow.toastTimer = null;
  slideshowPreloadCache.clear();
  focusElement(getFirstGalleryCard());
}

function handleKeydown(event) {
  const isBackKey =
    event.key === "Escape" ||
    event.key === "Backspace" ||
    event.key === "BrowserBack" ||
    event.key === "GoBack";

  if (isBackKey) {
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
      } else {
        setActiveScreen(2);
      }
      return;
    }

    if (screenDirectLink.classList.contains("active")) {
      event.preventDefault();
      setActiveScreen(1);
      return;
    }

    if (screenFolders.classList.contains("active")) {
      event.preventDefault();
      setActiveScreen(1);
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
  setLoadingState(
    true,
    "We’re opening your folder now. Larger collections can take around 10 to 30 seconds.",
    {}
  );

  try {
    try {
      const metaResponse = await fetch(`/api/folder-meta?url=${encodeURIComponent(folderUrl)}`);
      const metaData = await metaResponse.json();
      if (metaResponse.ok && metaData.name) {
        setStatus(`Connecting to "${metaData.name}"...`);
        setLoadingState(
          true,
          `We’re connecting to "${metaData.name}" now. Larger collections can take around 10 to 30 seconds.`,
          { preserveStartTime: true }
        );
      }
    } catch (error) {
      // Keep the generic loading state if metadata lookup fails.
    }

    const response = await fetch(`/api/folder?url=${encodeURIComponent(folderUrl)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load Google Drive folder.");
    }

    currentFolders = collectFolders(data.tree);
    selectedFolderId = currentFolders[0] ? currentFolders[0].id : null;
    coverPhoto = currentFolders[0]?.images?.[0] || null;
    sharedFolderName = data.tree?.name || "";
    folderCountEl.textContent = String(currentFolders.length);

    renderFolderTabs(currentFolders);
    updateFolderSidePanel();
    updateGalleryForSelectedFolder();

    if (currentFolders.length > 1) {
      setActiveScreen(3);
      setStatus(`You're in. We found ${currentFolders.length} folders to choose from.`);
    } else {
      setActiveScreen(3);
      setStatus("Everything's ready. Your photos are waiting.");
    }
    setLoadingState(false);
  } catch (error) {
    currentFolders = [];
    selectedFolderId = null;
    coverPhoto = null;
    sharedFolderName = "";
    images = [];
    folderCountEl.textContent = "0";
    photoCountEl.textContent = "0";
    folderTreeEl.innerHTML = '<div class="empty-sequence">We couldn\'t load the folders this time.</div>';
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

toggleFolderPanelButton.addEventListener("click", () => {
  screenFolders.classList.add("panel-open");
  focusElement(closeFolderPanelButton || continueToGalleryButton);
});

closeFolderPanelButton.addEventListener("click", () => {
  screenFolders.classList.remove("panel-open");
  focusElement(folderTreeEl.querySelector(".folder-choice"));
});

backToLinkButton.addEventListener("click", () => setActiveScreen(1));

continueToGalleryButton.addEventListener("click", () => {
  updateGalleryForSelectedFolder();
  setActiveScreen(3);
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

toggleGallerySettingsButton.addEventListener("click", () => {
  screenGallery.classList.toggle("panel-open");
  focusElement(
    screenGallery.classList.contains("panel-open")
      ? durationDecreaseButton
      : toggleGallerySettingsButton
  );
});

closeGallerySettingsButton.addEventListener("click", () => {
  screenGallery.classList.remove("panel-open");
  focusElement(toggleGallerySettingsButton);
});

document.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", updateSlideshowActionVisibility);
window.history.scrollRestoration = "manual";

updateDurationControls();
setActiveScreen(getStepForPath(window.location.pathname), { replaceState: true });

window.addEventListener("popstate", () => {
  setActiveScreen(getStepForPath(window.location.pathname), {
    skipHistory: true,
    replaceState: true,
  });
});
