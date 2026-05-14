const http = require("http");
const dns = require("dns").promises;
const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const QRCode = require("qrcode");
let faceapi = null;
let tfjsNode = null;
let canvasLib = null;
let faceModelsReady = false;
let faceDetectionRuntimeError = "";
let faceDetectionProcessingLoopActive = false;
const FACE_DETECTION_WORKER_ID = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;

loadEnvFile(path.join(__dirname, ".env"));

let initializeFirebaseApp = null;
let getFirebaseApps = null;
let firebaseCert = null;
let getFirebaseFirestore = null;

try {
  ({ initializeApp: initializeFirebaseApp, getApps: getFirebaseApps, cert: firebaseCert } =
    require("firebase-admin/app"));
  ({ getFirestore: getFirebaseFirestore } = require("firebase-admin/firestore"));
} catch (error) {
  // Firebase is optional during local setup until dependencies and credentials are provided.
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const FIREBASE_CONFIG_FILE = path.join(PUBLIC_DIR, "firebase-config.js");
const REMOTE_CODES_FILE = path.join(DATA_DIR, "remote-links.txt");
const PUBLIC_PAGE_LIKES_FILE = path.join(DATA_DIR, "public-page-likes.json");
const FACE_MERGE_OVERRIDES_FILE = path.join(DATA_DIR, "face-merge-overrides.json");
const FACE_DETECTION_QUEUE_FILE = path.join(DATA_DIR, "face-detection-queue.json");
const FACE_DETECTION_RESULTS_FILE = path.join(DATA_DIR, "face-detection-results.json");
const EVENTS_STORE_FILE = path.join(DATA_DIR, "events.json");
const DRIVE_CONNECTIONS_FILE = path.join(DATA_DIR, "drive-connections.json");
const CODE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const FIREBASE_COLLECTION = process.env.FIREBASE_PAIRING_COLLECTION || "pairingCodes";
const FIREBASE_WEB_CONFIG = {
  apiKey: process.env.FIREBASE_WEB_API_KEY || "",
  authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_WEB_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_WEB_APP_ID || "",
  measurementId: process.env.FIREBASE_WEB_MEASUREMENT_ID || "",
};
const FIREBASE_COLLECTIONS = {
  users: process.env.FIREBASE_USERS_COLLECTION || "users",
  studioNames: process.env.FIREBASE_STUDIONAMES_COLLECTION || "studioNames",
  publicPages: process.env.FIREBASE_PUBLICPAGES_COLLECTION || "publicPages",
  pairingCodes: process.env.FIREBASE_PAIRINGCODES_COLLECTION || "pairingCodes",
  customDomains: process.env.FIREBASE_CUSTOMDOMAINS_COLLECTION || "customDomains",
  faceDetectionQueue: process.env.FIREBASE_FACEDETECTIONQUEUE_COLLECTION || "faceDetectionQueue",
};
const ALBUM_SNAPSHOT_SUBCOLLECTION = "albumSnapshotChunks";
const FACE_GROUPS_SUBCOLLECTION = "faceDetectionGroups";
const FACE_MATCHES_SUBCOLLECTION = "faceDetectionPhotoMatches";
const FACE_DESCRIPTOR_CACHE_SUBCOLLECTION = "faceDetectionDescriptors";
const CUSTOM_DOMAIN_CNAME_TARGET = process.env.CUSTOM_DOMAIN_CNAME_TARGET || process.env.RENDER_EXTERNAL_HOSTNAME || "";
const FOLDER_CACHE_FRESH_MS = Number(process.env.FOLDER_CACHE_FRESH_MS || 5 * 60 * 1000);
const FOLDER_CACHE_STALE_MS = Number(process.env.FOLDER_CACHE_STALE_MS || 30 * 60 * 1000);
const MEDIA_CACHE_TTL_MS = Number(process.env.MEDIA_CACHE_TTL_MS || 30 * 60 * 1000);
const MEDIA_CACHE_MAX_BYTES = Number(process.env.MEDIA_CACHE_MAX_BYTES || 120 * 1024 * 1024);
const MEDIA_CACHE_MAX_ENTRY_BYTES = Number(process.env.MEDIA_CACHE_MAX_ENTRY_BYTES || 8 * 1024 * 1024);
const EVENT_UPLOAD_MAX_BYTES = Number(process.env.EVENT_UPLOAD_MAX_BYTES || 20 * 1024 * 1024);
const DRIVE_OAUTH_SCOPE = "https://www.googleapis.com/auth/drive";
const FACE_DETECTION_MAX_IMAGES = Number(process.env.FACE_DETECTION_MAX_IMAGES || 350);
const FACE_DETECTION_POLL_MS = Number(process.env.FACE_DETECTION_POLL_MS || 12000);
const FACE_DETECTION_LOCK_LEASE_MS = Number(process.env.FACE_DETECTION_LOCK_LEASE_MS || 10 * 60 * 1000);
const FACE_DETECTION_PER_IMAGE_TIMEOUT_MS = Number(process.env.FACE_DETECTION_PER_IMAGE_TIMEOUT_MS || 30000);
const FACE_DETECTION_PER_PHOTO_BUDGET_MS = Number(process.env.FACE_DETECTION_PER_PHOTO_BUDGET_MS || 60000);
const FACE_DETECTION_DISTANCE_THRESHOLD = Number(process.env.FACE_DETECTION_DISTANCE_THRESHOLD || 0.43);
const FACE_DETECTION_MIN_FACE_PIXELS = Number(process.env.FACE_DETECTION_MIN_FACE_PIXELS || 72);
const FACE_DETECTION_MIN_QUALITY_SCORE = Number(process.env.FACE_DETECTION_MIN_QUALITY_SCORE || 0.24);
const FACE_DETECTION_SMALL_CLUSTER_ABSORB_THRESHOLD = Number(
  process.env.FACE_DETECTION_SMALL_CLUSTER_ABSORB_THRESHOLD || 0.42
);
const FACE_MODEL_DIR = path.join(DATA_DIR, "face-models");
const FACE_MODEL_BASE_URL =
  process.env.FACE_MODEL_BASE_URL ||
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
const FACE_MODEL_MANIFESTS = [
  "tiny_face_detector_model-weights_manifest.json",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
];

const IMAGE_MIME_PREFIX = "image/";
const VIDEO_MIME_PREFIX = "video/";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
let firestoreDb = null;
let driveServiceTokenCache = null;
const folderTreeCache = new Map();
const mediaResponseCache = new Map();
const mediaInflightRequests = new Map();
let mediaCacheSizeBytes = 0;
let eventsStoreMutationChain = Promise.resolve();
let faceMergeStoreMutationChain = Promise.resolve();
let faceQueueStoreMutationChain = Promise.resolve();
let faceResultsStoreMutationChain = Promise.resolve();

const DRIVE_LINK_ACCESS_ERROR =
  "We couldn’t open that Google Drive folder. Make sure the link is correct and the folder is shared as 'Anyone with the link' with Viewer access, then try again.";

function buildMediaCacheKey(fileId, mode) {
  return `${fileId}:${mode}`;
}

function evictExpiredMediaCacheEntries() {
  const now = Date.now();
  for (const [cacheKey, entry] of mediaResponseCache.entries()) {
    if (entry.expiresAt <= now) {
      mediaResponseCache.delete(cacheKey);
      mediaCacheSizeBytes = Math.max(0, mediaCacheSizeBytes - entry.body.length);
    }
  }
}

function enforceMediaCacheBudget() {
  if (mediaCacheSizeBytes <= MEDIA_CACHE_MAX_BYTES) {
    return;
  }

  const entries = Array.from(mediaResponseCache.entries()).sort(
    (left, right) => left[1].storedAt - right[1].storedAt
  );

  for (const [cacheKey, entry] of entries) {
    mediaResponseCache.delete(cacheKey);
    mediaCacheSizeBytes = Math.max(0, mediaCacheSizeBytes - entry.body.length);
    if (mediaCacheSizeBytes <= MEDIA_CACHE_MAX_BYTES) {
      break;
    }
  }
}

function getCachedMediaResponse(cacheKey) {
  evictExpiredMediaCacheEntries();
  const entry = mediaResponseCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  return entry;
}

function storeCachedMediaResponse(cacheKey, entry) {
  if (!entry?.body?.length || entry.body.length > MEDIA_CACHE_MAX_ENTRY_BYTES) {
    return;
  }

  const previousEntry = mediaResponseCache.get(cacheKey);
  if (previousEntry) {
    mediaCacheSizeBytes = Math.max(0, mediaCacheSizeBytes - previousEntry.body.length);
  }

  mediaResponseCache.set(cacheKey, entry);
  mediaCacheSizeBytes += entry.body.length;
  enforceMediaCacheBudget();
}

function sendCachedMediaResponse(res, entry) {
  res.writeHead(entry.status, {
    "Content-Type": entry.contentType,
    "Content-Length": String(entry.body.length),
    "Cache-Control": entry.cacheControl,
  });
  res.end(entry.body);
}

async function fetchMediaCandidateWithCache(candidates, rangeHeader, cacheKey) {
  if (cacheKey && mediaInflightRequests.has(cacheKey)) {
    return mediaInflightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    let lastError = "Unable to fetch media from Google Drive.";

    for (const candidate of candidates) {
      const candidateUrl = typeof candidate === "string" ? candidate : String(candidate?.url || "");
      const candidateHeaders =
        candidate && typeof candidate === "object" && !Array.isArray(candidate)
          ? { ...(candidate.headers || {}) }
          : {};
      const response = await fetch(candidateUrl, {
        redirect: "follow",
        headers: rangeHeader ? { ...candidateHeaders, Range: rangeHeader } : candidateHeaders,
      });
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        lastError = `Media request failed (${response.status}) for ${candidateUrl}`;
        continue;
      }

      if (!response.body || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
        lastError = `Non-media response returned for ${candidateUrl}`;
        continue;
      }

      const contentRange = response.headers.get("content-range");
      const acceptRanges = response.headers.get("accept-ranges");
      const cacheControl =
        !rangeHeader && (contentType.startsWith("image/") || contentType.startsWith("video/"))
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "public, max-age=3600";

      if (!rangeHeader) {
        const body = Buffer.from(await response.arrayBuffer());
        const result = {
          status: response.status,
          contentType,
          cacheControl,
          body,
          contentRange,
          acceptRanges,
        };
        if (cacheKey) {
          storeCachedMediaResponse(cacheKey, {
            ...result,
            storedAt: Date.now(),
            expiresAt: Date.now() + MEDIA_CACHE_TTL_MS,
          });
        }
        return result;
      }

      return {
        status: response.status,
        contentType,
        cacheControl,
        body: response.body,
        contentLength: response.headers.get("content-length"),
        contentRange,
        acceptRanges,
      };
    }

    throw new Error(lastError);
  })();

  if (cacheKey) {
    mediaInflightRequests.set(cacheKey, fetchPromise);
  }

  try {
    return await fetchPromise;
  } finally {
    if (cacheKey) {
      mediaInflightRequests.delete(cacheKey);
    }
  }
}

function findEventOwnerUidByDriveFileId(fileId) {
  const normalizedFileId = String(fileId || "").trim();
  if (!normalizedFileId) {
    return "";
  }

  const events = readEventsStore().events || [];
  for (const event of events) {
    if (String(event?.backgroundDriveFileId || "").trim() === normalizedFileId) {
      return String(event?.ownerUid || "").trim();
    }
    const photoLists = [event?.queuedPhotos || [], event?.livePhotos || [], event?.rejectedPhotos || []];
    for (const list of photoLists) {
      if (list.some((photo) => String(photo?.driveFileId || "").trim() === normalizedFileId)) {
        return String(event?.ownerUid || "").trim();
      }
    }
  }

  return "";
}

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(REMOTE_CODES_FILE)) {
    fs.writeFileSync(REMOTE_CODES_FILE, "", "utf8");
  }

  if (!fs.existsSync(PUBLIC_PAGE_LIKES_FILE)) {
    fs.writeFileSync(PUBLIC_PAGE_LIKES_FILE, "{}\n", "utf8");
  }
  if (!fs.existsSync(FACE_DETECTION_QUEUE_FILE)) {
    fs.writeFileSync(FACE_DETECTION_QUEUE_FILE, JSON.stringify({ jobs: {} }, null, 2) + "\n", "utf8");
  }
  if (!fs.existsSync(FACE_DETECTION_RESULTS_FILE)) {
    fs.writeFileSync(FACE_DETECTION_RESULTS_FILE, JSON.stringify({ pages: {} }, null, 2) + "\n", "utf8");
  }

  if (!fs.existsSync(EVENTS_STORE_FILE)) {
    fs.writeFileSync(EVENTS_STORE_FILE, JSON.stringify({ events: [] }, null, 2) + "\n", "utf8");
  }

  if (!fs.existsSync(DRIVE_CONNECTIONS_FILE)) {
    fs.writeFileSync(
      DRIVE_CONNECTIONS_FILE,
      JSON.stringify({ connections: {}, pendingStates: {} }, null, 2) + "\n",
      "utf8"
    );
  }
}

function ensureFaceModelStore() {
  ensureDataStore();
  if (!fs.existsSync(FACE_MODEL_DIR)) {
    fs.mkdirSync(FACE_MODEL_DIR, { recursive: true });
  }
}

async function ensureFaceModelFiles() {
  ensureFaceModelStore();
  const fallbackBaseUrls = Array.from(
    new Set(
      [
        FACE_MODEL_BASE_URL,
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights",
        "https://raw.githubusercontent.com/vladmandic/face-api/main/model",
        "https://raw.githubusercontent.com/vladmandic/face-api/master/model",
      ]
        .map((value) => String(value || "").trim().replace(/\/+$/, ""))
        .filter(Boolean)
    )
  );

  const downloadModelFile = async (fileName) => {
    const targetPath = path.join(FACE_MODEL_DIR, fileName);
    if (fs.existsSync(targetPath)) {
      return targetPath;
    }
    let downloaded = false;
    let lastStatus = "";
    for (const baseUrl of fallbackBaseUrls) {
      const modelUrl = `${baseUrl}/${fileName}`;
      try {
        const response = await fetch(modelUrl);
        if (!response.ok) {
          lastStatus = `${response.status} from ${modelUrl}`;
          continue;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(targetPath, buffer);
        downloaded = true;
        break;
      } catch (error) {
        lastStatus = error?.message || String(error);
      }
    }
    if (!downloaded) {
      throw new Error(`Face model download failed for ${fileName}${lastStatus ? ` (${lastStatus})` : ""}`);
    }
    return targetPath;
  };

  for (const manifestName of FACE_MODEL_MANIFESTS) {
    const manifestPath = await downloadModelFile(manifestName);
    let manifestEntries = [];
    try {
      manifestEntries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (error) {
      throw new Error(`Face model manifest parse failed for ${manifestName}: ${error.message}`);
    }
    for (const entry of Array.isArray(manifestEntries) ? manifestEntries : []) {
      const paths = Array.isArray(entry?.paths) ? entry.paths : [];
      for (const shardFile of paths) {
        if (typeof shardFile === "string" && shardFile.trim()) {
          await downloadModelFile(shardFile.trim());
        }
      }
    }
  }
}

async function ensureFaceRuntime() {
  if (faceModelsReady) {
    return;
  }
  if (!faceapi || !tfjsNode || !canvasLib) {
    ({ default: faceapi } = await import("@vladmandic/face-api"));
    tfjsNode = require("@tensorflow/tfjs-node");
    canvasLib = require("canvas");
    const { Canvas, Image, ImageData } = canvasLib;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    faceapi.tf = tfjsNode;
  }
  await ensureFaceModelFiles();
  await faceapi.nets.tinyFaceDetector.loadFromDisk(FACE_MODEL_DIR);
  await faceapi.nets.faceLandmark68TinyNet.loadFromDisk(FACE_MODEL_DIR);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(FACE_MODEL_DIR);
  faceModelsReady = true;
  faceDetectionRuntimeError = "";
}

function toDataUrlFromCanvas(canvas, mimeType = "image/jpeg", quality = 0.86) {
  const buffer = canvas.toBuffer(mimeType, { quality });
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function withTimeout(promise, timeoutMs, label = "operation") {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function euclideanDistance(left, right) {
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    total += delta * delta;
  }
  return Math.sqrt(total);
}

function averageDescriptor(samples) {
  if (!samples.length) {
    return [];
  }
  const length = samples[0].length;
  const accumulator = new Float32Array(length);
  for (const sample of samples) {
    for (let i = 0; i < length; i += 1) {
      accumulator[i] += sample[i];
    }
  }
  for (let i = 0; i < length; i += 1) {
    accumulator[i] /= samples.length;
  }
  return Array.from(accumulator);
}

function clusterFaceDescriptors(detections) {
  const groups = [];
  for (const detection of detections) {
    const descriptor = detection.descriptor;
    let bestGroup = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const group of groups) {
      const distance = euclideanDistance(descriptor, group.center);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestGroup = group;
      }
    }
    if (bestGroup && bestDistance <= FACE_DETECTION_DISTANCE_THRESHOLD) {
      bestGroup.samples.push(descriptor);
      bestGroup.photos.add(detection.photoId);
      if (!bestGroup.previewDataUrl && detection.previewDataUrl) {
        bestGroup.previewDataUrl = detection.previewDataUrl;
      }
      bestGroup.center = averageDescriptor(bestGroup.samples);
      continue;
    }
    groups.push({
      id: `face_${String(groups.length + 1).padStart(3, "0")}`,
      center: descriptor.slice(),
      samples: [descriptor],
      photos: new Set([detection.photoId]),
      previewDataUrl: detection.previewDataUrl || "",
    });
  }
  return groups
    .map((group) => ({
      id: group.id,
      count: group.samples.length,
      photoIds: Array.from(group.photos),
      previewDataUrl: group.previewDataUrl || "",
      center: group.center,
    }))
    .sort((left, right) => right.count - left.count);
}

function absorbSmallFaceGroups(groups) {
  const working = Array.isArray(groups)
    ? groups.map((group) => ({
        id: String(group.id || "").trim(),
        center: Array.isArray(group.center) ? group.center.slice() : [],
        count: Math.max(0, Number(group.count) || 0),
        photoIds: Array.isArray(group.photoIds) ? group.photoIds.map((photoId) => String(photoId || "").trim()).filter(Boolean) : [],
        previewDataUrl: String(group.previewDataUrl || "").trim(),
      }))
    : [];
  let absorbedGroupCount = 0;
  for (let i = 0; i < working.length; i += 1) {
    const group = working[i];
    if (!group?.center?.length || group.count > 1) {
      continue;
    }
    let bestGroupIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let j = 0; j < working.length; j += 1) {
      if (i === j) {
        continue;
      }
      const candidate = working[j];
      if (!candidate?.center?.length) {
        continue;
      }
      const distance = euclideanDistance(group.center, candidate.center);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestGroupIndex = j;
      }
    }
    if (bestGroupIndex < 0 || bestDistance > FACE_DETECTION_SMALL_CLUSTER_ABSORB_THRESHOLD) {
      continue;
    }
    const destination = working[bestGroupIndex];
    const destinationWeight = Math.max(1, destination.count);
    const sourceWeight = Math.max(1, group.count);
    const totalWeight = destinationWeight + sourceWeight;
    destination.center = destination.center.map((value, index) => (
      ((value * destinationWeight) + ((group.center[index] || 0) * sourceWeight)) / totalWeight
    ));
    destination.count += group.count;
    destination.photoIds = Array.from(new Set([...(destination.photoIds || []), ...(group.photoIds || [])]));
    if (!destination.previewDataUrl && group.previewDataUrl) {
      destination.previewDataUrl = group.previewDataUrl;
    }
    working.splice(i, 1);
    absorbedGroupCount += 1;
    i -= 1;
  }
  return {
    groups: working
      .map((group, index) => ({
        id: `face_${String(index + 1).padStart(3, "0")}`,
        count: Math.max(0, Number(group.count) || 0),
        photoIds: Array.from(new Set(group.photoIds || [])),
        previewDataUrl: String(group.previewDataUrl || "").trim(),
        center: Array.isArray(group.center) ? group.center.slice() : [],
      }))
      .sort((left, right) => right.count - left.count),
    absorbedGroupCount,
  };
}

async function fetchImageBufferForFaceDetection(fileId) {
  const candidates = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w960`,
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w960`,
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(API_KEY)}`,
  ];
  const result = await fetchMediaCandidateWithCache(candidates, null, "");
  if (!Buffer.isBuffer(result.body)) {
    const chunks = [];
    for await (const chunk of result.body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  return result.body;
}

async function detectFacesInPhotoBuffer(photo, buffer) {
  const image = await canvasLib.loadImage(buffer);
  const sourceCanvas = canvasLib.createCanvas(image.width, image.height);
  const sourceContext = sourceCanvas.getContext("2d");
  sourceContext.drawImage(image, 0, 0, image.width, image.height);

  const candidateOptions = [
    { inputSize: 512, scoreThreshold: 0.35 },
    { inputSize: 416, scoreThreshold: 0.35 },
    { inputSize: 320, scoreThreshold: 0.35 },
    { inputSize: 320, scoreThreshold: 0.28 },
  ];

  let detections = [];
  for (const options of candidateOptions) {
    const passDetections = await faceapi
      .detectAllFaces(sourceCanvas, new faceapi.TinyFaceDetectorOptions(options))
      .withFaceLandmarks(true)
      .withFaceDescriptors();
    if (passDetections.length > detections.length) {
      detections = passDetections;
    }
    if (detections.length > 0 && options.inputSize >= 416) {
      break;
    }
  }

  return detections.map((entry) => {
    const box = entry?.detection?.box || { x: 0, y: 0, width: image.width, height: image.height };
    const detectionScore = Number(entry?.detection?.score) || 0;
    const minSide = Math.max(0, Math.min(Number(box.width) || 0, Number(box.height) || 0));
    if (minSide < FACE_DETECTION_MIN_FACE_PIXELS) {
      return null;
    }
    if (detectionScore < FACE_DETECTION_MIN_QUALITY_SCORE) {
      return null;
    }
    const leftEyePoints = entry?.landmarks?.getLeftEye?.() || [];
    const rightEyePoints = entry?.landmarks?.getRightEye?.() || [];
    if (leftEyePoints.length < 4 || rightEyePoints.length < 4) {
      return null;
    }
    const pad = Math.max(12, Math.round(Math.min(box.width, box.height) * 0.2));
    const cropX = clamp(Math.floor(box.x - pad), 0, image.width - 1);
    const cropY = clamp(Math.floor(box.y - pad), 0, image.height - 1);
    const cropWidth = clamp(Math.ceil(box.width + pad * 2), 16, image.width - cropX);
    const cropHeight = clamp(Math.ceil(box.height + pad * 2), 16, image.height - cropY);
    const previewCanvas = canvasLib.createCanvas(128, 128);
    const previewContext = previewCanvas.getContext("2d");
    previewContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, 128, 128);
    return {
      photoId: photo.id,
      descriptor: Array.from(entry.descriptor || []),
      previewDataUrl: toDataUrlFromCanvas(previewCanvas, "image/jpeg", 0.82),
    };
  }).filter(Boolean);
}

function buildFaceDescriptorSignature(photo) {
  const id = String(photo?.id || "").trim();
  const name = String(photo?.name || "").trim().toLowerCase();
  const mimeType = String(photo?.mimeType || "").trim().toLowerCase();
  const width = Number(photo?.width) || 0;
  const height = Number(photo?.height) || 0;
  return `${id}:${name}:${mimeType}:${width}x${height}:d${FACE_DETECTION_DISTANCE_THRESHOLD}:a${FACE_DETECTION_SMALL_CLUSTER_ABSORB_THRESHOLD}:m${FACE_DETECTION_MIN_FACE_PIXELS}:q${FACE_DETECTION_MIN_QUALITY_SCORE}`;
}

async function loadFaceDetectionsFromCache(publicPageRef, photo) {
  const photoId = String(photo?.id || "").trim();
  if (!photoId) {
    return null;
  }
  const cacheRef = publicPageRef.collection(FACE_DESCRIPTOR_CACHE_SUBCOLLECTION).doc(photoId);
  const snapshot = await cacheRef.get();
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data() || {};
  if (String(data.signature || "") !== buildFaceDescriptorSignature(photo)) {
    return null;
  }
  const detections = Array.isArray(data.detections) ? data.detections : [];
  return detections
    .map((entry) => ({
      photoId,
      descriptor: Array.isArray(entry?.descriptor) ? entry.descriptor : [],
      previewDataUrl: String(entry?.previewDataUrl || "").trim(),
    }))
    .filter((entry) => entry.descriptor.length > 0);
}

async function saveFaceDetectionsToCache(publicPageRef, photo, detections) {
  const photoId = String(photo?.id || "").trim();
  if (!photoId) {
    return;
  }
  const cacheRef = publicPageRef.collection(FACE_DESCRIPTOR_CACHE_SUBCOLLECTION).doc(photoId);
  await cacheRef.set(
    {
      signature: buildFaceDescriptorSignature(photo),
      photoId,
      detections: Array.isArray(detections)
        ? detections.map((entry) => ({
            descriptor: Array.isArray(entry?.descriptor) ? entry.descriptor : [],
            previewDataUrl: String(entry?.previewDataUrl || "").trim(),
          }))
        : [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

async function clearFaceDetectionSubcollections(publicPageRef) {
  const groupsSnapshot = await publicPageRef.collection(FACE_GROUPS_SUBCOLLECTION).get();
  const matchesSnapshot = await publicPageRef.collection(FACE_MATCHES_SUBCOLLECTION).get();
  const batch = firestoreDb.batch();
  groupsSnapshot.docs.forEach((snapshotDoc) => batch.delete(snapshotDoc.ref));
  matchesSnapshot.docs.forEach((snapshotDoc) => batch.delete(snapshotDoc.ref));
  if (groupsSnapshot.size || matchesSnapshot.size) {
    await batch.commit();
  }
}

async function persistFaceDetectionResultsLocal(pageId, groupedFaces, detectedPhotos, publicPageIds = []) {
  await withFaceResultsStoreMutation(async () => {
    const store = readFaceDetectionResultsStore();
    const photoFaceMap = {};
    for (const group of groupedFaces) {
      for (const photoId of group.photoIds || []) {
        if (!photoFaceMap[photoId]) {
          photoFaceMap[photoId] = [];
        }
        photoFaceMap[photoId].push(group.id);
      }
    }
    const matches = {};
    for (const photo of detectedPhotos) {
      const photoId = String(photo?.id || "").trim();
      if (!photoId) {
        continue;
      }
      matches[photoId] = Array.isArray(photoFaceMap[photoId]) ? photoFaceMap[photoId] : [];
    }
    store.pages[pageId] = {
      pageId,
      publicPageIds: Array.isArray(publicPageIds) ? publicPageIds.map((id) => String(id || "").trim()).filter(Boolean) : [],
      updatedAt: new Date().toISOString(),
      groups: groupedFaces.map((group) => ({
        id: String(group?.id || "").trim(),
        count: Math.max(0, Number(group?.count) || 0),
        photoCount: Array.isArray(group?.photoIds) ? group.photoIds.length : 0,
        photoIds: Array.isArray(group?.photoIds) ? group.photoIds.map((id) => String(id || "").trim()).filter(Boolean) : [],
        previewDataUrl: String(group?.previewDataUrl || "").trim(),
      })),
      matches,
    };
    writeFaceDetectionResultsStore(store);
  });
}

async function processFaceDetectionAlbum(queueData, updateJobProgress) {
  const pageId = String(queueData?.pageId || "").trim();
  const ownerUid = String(queueData?.ownerUid || "").trim();
  if (!pageId || !ownerUid) {
    throw new Error("Invalid queue payload.");
  }
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Firestore read backend unavailable.");
  }
  const pageRef = db.collection(FIREBASE_COLLECTIONS.users).doc(ownerUid).collection("pages").doc(pageId);
  const pageSnapshot = await pageRef.get();
  if (!pageSnapshot.exists) {
    throw new Error("Album page not found.");
  }

  const page = pageSnapshot.data() || {};
  const driveLink = String(page.driveLink || "").trim();
  if (!driveLink) {
    throw new Error("Album is missing Drive link.");
  }

  const folderId = extractFolderId(driveLink);
  if (!folderId) {
    throw new Error("Could not resolve Drive folder id.");
  }

  const publicPageSnapshots = await db
    .collection(FIREBASE_COLLECTIONS.publicPages)
    .where("pageId", "==", pageId)
    .get();
  const publicPageIds = publicPageSnapshots.docs.map((docSnap) => docSnap.id);

  const folderResult = await fetchFolderResult(folderId, false);
  const allImages = Array.isArray(folderResult?.images) ? folderResult.images : [];
  const images = allImages.filter((file) => String(file.mimeType || "").startsWith(IMAGE_MIME_PREFIX)).slice(0, FACE_DETECTION_MAX_IMAGES);
  const totalPhotoCount = images.length;
  await updateJobProgress(0, totalPhotoCount);

  const detections = [];
  let processedPhotoCount = 0;
  for (const image of images) {
    try {
      const photoDetections = await withTimeout(
        (async () => {
          const buffer = await withTimeout(
            fetchImageBufferForFaceDetection(image.id),
            FACE_DETECTION_PER_IMAGE_TIMEOUT_MS,
            `fetch image ${image.id}`
          );
          const detected = await withTimeout(
            detectFacesInPhotoBuffer(image, buffer),
            FACE_DETECTION_PER_IMAGE_TIMEOUT_MS,
            `detect faces ${image.id}`
          );
          return detected;
        })(),
        FACE_DETECTION_PER_PHOTO_BUDGET_MS,
        `process photo ${image.id}`
      );

      detections.push(...photoDetections);
    } catch (error) {
      console.warn(`Face detection skipped image ${image.id}: ${error.message}`);
    } finally {
      processedPhotoCount += 1;
      await updateJobProgress(processedPhotoCount, totalPhotoCount);
    }
  }

  const groupedFacesInitial = clusterFaceDescriptors(detections);
  const absorbResult = absorbSmallFaceGroups(groupedFacesInitial);
  const groupedFaces = absorbResult.groups;

  const faceDetectionPayload = normalizeFaceDetectionJob({
    status: "completed",
    source: String(queueData?.source || "").trim() || "manual",
    queuedAt: queueData?.queuedAt || new Date().toISOString(),
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    faceGroupCount: groupedFaces.length,
    detectedPhotoCount: groupedFaces.reduce((total, group) => total + group.photoIds.length, 0),
    scannedPhotoCount: images.length,
    runtimeError: "",
    progressPercent: 100,
    processedPhotoCount: images.length,
    totalPhotoCount,
    pageId,
    ownerUid,
    pageSlug: queueData?.pageSlug,
    pageName: queueData?.pageName,
    studioSlug: queueData?.studioSlug,
    publicPageIds,
  });

  await persistFaceDetectionResultsLocal(pageId, groupedFaces, images, publicPageIds);
  await withFaceQueueStoreMutation(async () => {
    const store = readFaceDetectionQueueStore();
    store.jobs[pageId] = { ...faceDetectionPayload };
    writeFaceDetectionQueueStore(store);
  });
}

function getFaceDetectionWorkerLockRef(db) {
  return db.collection("_system").doc("faceDetectionWorkerLock");
}

async function acquireFaceDetectionWorkerLock(db) {
  const lockRef = getFaceDetectionWorkerLockRef(db);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const expiresAtIso = new Date(nowMs + FACE_DETECTION_LOCK_LEASE_MS).toISOString();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef);
    const data = snapshot.exists ? (snapshot.data() || {}) : {};
    const lockedBy = String(data.lockedBy || "").trim();
    const expiresAtMs = Date.parse(String(data.expiresAt || ""));
    const isExpired = !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs;
    const canAcquire = !lockedBy || isExpired || lockedBy === FACE_DETECTION_WORKER_ID;
    if (!canAcquire) {
      return false;
    }
    transaction.set(
      lockRef,
      {
        lockedBy: FACE_DETECTION_WORKER_ID,
        acquiredAt: nowIso,
        updatedAt: nowIso,
        expiresAt: expiresAtIso,
      },
      { merge: true }
    );
    return true;
  });
}

async function releaseFaceDetectionWorkerLock(db) {
  const lockRef = getFaceDetectionWorkerLockRef(db);
  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(lockRef);
      if (!snapshot.exists) {
        return;
      }
      const data = snapshot.data() || {};
      const lockedBy = String(data.lockedBy || "").trim();
      if (lockedBy && lockedBy !== FACE_DETECTION_WORKER_ID) {
        return;
      }
      transaction.set(
        lockRef,
        {
          lockedBy: "",
          releasedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: "",
        },
        { merge: true }
      );
    });
  } catch (error) {
    console.warn(`Failed to release face detection lock: ${error.message}`);
  }
}

function isTransientFaceQueueError(error) {
  const message = String(error?.message || "").toLowerCase();
  if (!message) {
    return false;
  }
  return (
    message.includes("resource_exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("deadline exceeded") ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable")
  );
}

async function runFaceDetectionQueuePass() {
  if (faceDetectionProcessingLoopActive) {
    return;
  }
  faceDetectionProcessingLoopActive = true;
  try {
    const nowMs = Date.now();
    const staleProcessingCutoffMs = nowMs - Math.max(FACE_DETECTION_LOCK_LEASE_MS * 2, 10 * 60 * 1000);
    await withFaceQueueStoreMutation(async () => {
      const store = readFaceDetectionQueueStore();
      for (const [pageId, rawJob] of Object.entries(store.jobs || {})) {
        const job = normalizeFaceDetectionJob(rawJob || {});
        if (job.status !== "processing") {
          continue;
        }
        const startedMs =
          Date.parse(String(job.processingStartedAt || "")) ||
          Date.parse(String(job.updatedAt || "")) ||
          Date.parse(String(job.queuedAt || "")) ||
          0;
        if (!(startedMs > 0 && startedMs < staleProcessingCutoffMs)) {
          continue;
        }
        store.jobs[pageId] = {
          ...job,
          status: "queued",
          processingStartedAt: "",
          updatedAt: new Date().toISOString(),
          runtimeError: "Recovered stale processing job.",
        };
      }
      writeFaceDetectionQueueStore(store);
    });

    const queueStore = readFaceDetectionQueueStore();
    const queuedJobs = Object.values(queueStore.jobs || {})
      .map((job) => normalizeFaceDetectionJob(job || {}))
      .filter((job) => job.status === "queued" && job.pageId);
    if (!queuedJobs.length) {
      return;
    }
    queuedJobs.sort((left, right) => {
      const leftMs = Date.parse(String(left.queuedAt || "")) || 0;
      const rightMs = Date.parse(String(right.queuedAt || "")) || 0;
      return leftMs - rightMs;
    });
    const job = queuedJobs[0];

    await withFaceQueueStoreMutation(async () => {
      const store = readFaceDetectionQueueStore();
      const fresh = normalizeFaceDetectionJob(store.jobs[job.pageId] || {});
      if (fresh.status !== "queued") {
        return false;
      }
      const nowIso = new Date().toISOString();
      store.jobs[job.pageId] = {
        ...fresh,
        status: "processing",
        processingStartedAt: nowIso,
        updatedAt: nowIso,
        runtimeError: "",
      };
      writeFaceDetectionQueueStore(store);
    });

    try {
      await ensureFaceRuntime();
      await processFaceDetectionAlbum(job, async (processedPhotoCount, totalPhotoCount) => {
        await withFaceQueueStoreMutation(async () => {
          const store = readFaceDetectionQueueStore();
          const current = normalizeFaceDetectionJob(store.jobs[job.pageId] || {});
          if (!current.pageId || current.status !== "processing") {
            return;
          }
          const safeTotal = Math.max(1, Number(totalPhotoCount) || 0);
          const clampedProcessed = Math.max(0, Math.min(Number(processedPhotoCount) || 0, Number(totalPhotoCount) || 0));
          let progressPercent = (Number(totalPhotoCount) || 0) > 0 ? Math.max(0, Math.min(100, Math.floor((clampedProcessed / safeTotal) * 100))) : 100;
          if ((Number(totalPhotoCount) || 0) > 0 && clampedProcessed < (Number(totalPhotoCount) || 0)) {
            progressPercent = Math.min(progressPercent, 99);
          }
          store.jobs[job.pageId] = {
            ...current,
            status: "processing",
            updatedAt: new Date().toISOString(),
            progressPercent,
            processedPhotoCount: clampedProcessed,
            totalPhotoCount: Math.max(0, Number(totalPhotoCount) || 0),
          };
          writeFaceDetectionQueueStore(store);
        });
      });
    } catch (error) {
      const errorMessage = error?.message || "Face detection failed.";
      if (isTransientFaceQueueError(error)) {
        await withFaceQueueStoreMutation(async () => {
          const store = readFaceDetectionQueueStore();
          const current = normalizeFaceDetectionJob(store.jobs[job.pageId] || {});
          store.jobs[job.pageId] = {
            ...current,
            status: "queued",
            processingStartedAt: "",
            updatedAt: new Date().toISOString(),
            runtimeError: `Transient retry: ${errorMessage}`,
          };
          writeFaceDetectionQueueStore(store);
        });
        return;
      }
      await withFaceQueueStoreMutation(async () => {
        const store = readFaceDetectionQueueStore();
        const current = normalizeFaceDetectionJob(store.jobs[job.pageId] || {});
        const nowIso = new Date().toISOString();
        store.jobs[job.pageId] = {
          ...current,
          status: "failed",
          updatedAt: nowIso,
          failedAt: nowIso,
          runtimeError: errorMessage,
        };
        writeFaceDetectionQueueStore(store);
      });
    }
  } catch (runtimeError) {
    faceDetectionRuntimeError = runtimeError?.message || "Face detection runtime unavailable";
    console.warn(`Face detection runtime unavailable: ${faceDetectionRuntimeError}`);
  } finally {
    faceDetectionProcessingLoopActive = false;
  }
}

function startFaceDetectionQueueWorker() {
  if (!getFirestoreDb()) {
    console.warn("Face detection queue worker is waiting for Firestore Admin configuration.");
  }
  const run = () => {
    runFaceDetectionQueuePass().catch((error) => {
      console.warn(`Face detection queue pass failed: ${error.message}`);
    });
  };
  run();
  setInterval(run, FACE_DETECTION_POLL_MS);
}

function readEventsStore() {
  ensureDataStore();

  try {
    const content = fs.readFileSync(EVENTS_STORE_FILE, "utf8").trim();
    if (!content) {
      return { events: [] };
    }
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.events)) {
      return { events: [] };
    }
    return parsed;
  } catch (error) {
    return { events: [] };
  }
}

function writeEventsStore(store) {
  ensureDataStore();
  const normalized = {
    events: Array.isArray(store?.events) ? store.events : [],
  };
  fs.writeFileSync(EVENTS_STORE_FILE, JSON.stringify(normalized, null, 2) + "\n", "utf8");
}

async function withEventsStoreMutation(handler) {
  const run = eventsStoreMutationChain.then(() => handler());
  eventsStoreMutationChain = run.catch(() => {});
  return run;
}

function readDriveConnectionsStore() {
  ensureDataStore();

  try {
    const content = fs.readFileSync(DRIVE_CONNECTIONS_FILE, "utf8").trim();
    if (!content) {
      return { connections: {}, pendingStates: {} };
    }
    const parsed = JSON.parse(content);
    return {
      connections: parsed?.connections && typeof parsed.connections === "object" ? parsed.connections : {},
      pendingStates: parsed?.pendingStates && typeof parsed.pendingStates === "object" ? parsed.pendingStates : {},
    };
  } catch (error) {
    return { connections: {}, pendingStates: {} };
  }
}

function writeDriveConnectionsStore(store) {
  ensureDataStore();
  const normalized = {
    connections: store?.connections && typeof store.connections === "object" ? store.connections : {},
    pendingStates: store?.pendingStates && typeof store.pendingStates === "object" ? store.pendingStates : {},
  };
  fs.writeFileSync(DRIVE_CONNECTIONS_FILE, JSON.stringify(normalized, null, 2) + "\n", "utf8");
}

function cloneEvent(event) {
  return JSON.parse(JSON.stringify(event));
}

function normalizeEventVisibility(event, now = Date.now()) {
  const startAt = Date.parse(String(event?.startAt || ""));
  const endAt = Date.parse(String(event?.endAt || ""));

  let phase = "upcoming";
  if (Number.isFinite(endAt) && now > endAt) {
    phase = "ended";
  } else if (Number.isFinite(startAt) && now >= startAt) {
    phase = "live";
  } else if (Number.isFinite(startAt) && Number.isFinite(endAt) && now >= startAt && now <= endAt) {
    phase = "live";
  }

  return {
    ...event,
    phase,
    queueCount: Array.isArray(event?.queuedPhotos) ? event.queuedPhotos.length : 0,
    liveCount: Array.isArray(event?.livePhotos) ? event.livePhotos.length : 0,
  };
}

function sanitizeEventForClient(event) {
  const normalized = normalizeEventVisibility(cloneEvent(event));
  return {
    id: normalized.id,
    slug: normalized.slug,
    name: normalized.name,
    tagline: normalized.tagline || "",
    startAt: normalized.startAt || "",
    endAt: normalized.endAt || "",
    createdAt: normalized.createdAt || "",
    phase: normalized.phase,
    queueCount: normalized.queueCount,
    liveCount: normalized.liveCount,
    code: normalized.code || "",
    uploadUrl: normalized.uploadUrl || "",
    displayUrl: normalized.displayUrl || "",
    moderationUrl: normalized.moderationUrl || "",
    logoLink: normalized.logoLink || "",
    faviconLink: normalized.faviconLink || "",
    homepageLink: normalized.homepageLink || "",
    qrPngDataUrl: normalized.qrPngDataUrl || "",
    parentFolderUrl: normalized.parentFolderUrl || "",
    queueFolderUrl: normalized.queueFolderUrl || "",
    liveFolderUrl: normalized.liveFolderUrl || "",
    backgroundUrl: normalized.backgroundUrl || "",
    template: normalized.template || "template-1",
  };
}

function getFileExtensionFromMimeType(mimeType = "") {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") {
    return "jpg";
  }
  if (normalized === "image/png") {
    return "png";
  }
  if (normalized === "image/webp") {
    return "webp";
  }
  if (normalized === "image/gif") {
    return "gif";
  }
  return "jpg";
}

function readAllEvents() {
  return readEventsStore().events.map((event) => normalizeEventVisibility(event));
}

function writeAllEvents(events) {
  writeEventsStore({ events });
}

function findEventById(eventId) {
  return readAllEvents().find((event) => event.id === eventId) || null;
}

function findEventBySlug(slug) {
  return readAllEvents().find((event) => event.slug === slug) || null;
}

function findEventByPublicToken(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    return null;
  }

  const directMatch = findEventBySlug(normalizedToken);
  if (directMatch) {
    return directMatch;
  }

  return (
    readAllEvents().find((event) => {
      const uploadPath = String(event?.uploadUrl || "").trim();
      const displayPath = String(event?.displayUrl || "").trim();
      const eventSlug = String(event?.slug || "").trim();
      const safeSegments = (value) => {
        if (!value) {
          return [];
        }
        try {
          return new URL(value, "https://carnival.local").pathname.split("/").filter(Boolean);
        } catch (_error) {
          return [];
        }
      };
      const uploadSegments = safeSegments(uploadPath);
      const displaySegments = safeSegments(displayPath);
      return (
        uploadSegments.includes(normalizedToken) ||
        displaySegments.includes(normalizedToken) ||
        eventSlug.endsWith(normalizedToken)
      );
    }) || null
  );
}

function findEventByCode(code) {
  const normalizedCode = String(code || "").trim();
  if (!normalizedCode) {
    return null;
  }

  return readAllEvents().find((event) => String(event.code || "").trim() === normalizedCode) || null;
}

function findEventByModerationToken(token) {
  return readAllEvents().find((event) => event.moderationToken === token) || null;
}

function readPublicPageLikesStore() {
  ensureDataStore();

  try {
    const content = fs.readFileSync(PUBLIC_PAGE_LIKES_FILE, "utf8").trim();
    if (!content) {
      return {};
    }

    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function writePublicPageLikesStore(store) {
  ensureDataStore();
  fs.writeFileSync(PUBLIC_PAGE_LIKES_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function readFaceMergeOverridesStore() {
  ensureDataStore();
  try {
    const content = fs.readFileSync(FACE_MERGE_OVERRIDES_FILE, "utf8").trim();
    if (!content) {
      return { pages: {} };
    }
    const parsed = JSON.parse(content);
    return {
      pages: parsed?.pages && typeof parsed.pages === "object" ? parsed.pages : {},
    };
  } catch (_error) {
    return { pages: {} };
  }
}

function writeFaceMergeOverridesStore(store) {
  ensureDataStore();
  const normalized = {
    pages: store?.pages && typeof store.pages === "object" ? store.pages : {},
  };
  fs.writeFileSync(FACE_MERGE_OVERRIDES_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

async function withFaceMergeStoreMutation(handler) {
  const run = faceMergeStoreMutationChain.then(() => handler());
  faceMergeStoreMutationChain = run.catch(() => {});
  return run;
}

function readFaceDetectionQueueStore() {
  ensureDataStore();
  try {
    const content = fs.readFileSync(FACE_DETECTION_QUEUE_FILE, "utf8").trim();
    if (!content) {
      return { jobs: {} };
    }
    const parsed = JSON.parse(content);
    return {
      jobs: parsed?.jobs && typeof parsed.jobs === "object" ? parsed.jobs : {},
    };
  } catch (_error) {
    return { jobs: {} };
  }
}

function writeFaceDetectionQueueStore(store) {
  ensureDataStore();
  const normalized = {
    jobs: store?.jobs && typeof store.jobs === "object" ? store.jobs : {},
  };
  fs.writeFileSync(FACE_DETECTION_QUEUE_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

async function withFaceQueueStoreMutation(handler) {
  const run = faceQueueStoreMutationChain.then(() => handler());
  faceQueueStoreMutationChain = run.catch(() => {});
  return run;
}

function readFaceDetectionResultsStore() {
  ensureDataStore();
  try {
    const content = fs.readFileSync(FACE_DETECTION_RESULTS_FILE, "utf8").trim();
    if (!content) {
      return { pages: {} };
    }
    const parsed = JSON.parse(content);
    return {
      pages: parsed?.pages && typeof parsed.pages === "object" ? parsed.pages : {},
    };
  } catch (_error) {
    return { pages: {} };
  }
}

function writeFaceDetectionResultsStore(store) {
  ensureDataStore();
  const normalized = {
    pages: store?.pages && typeof store.pages === "object" ? store.pages : {},
  };
  fs.writeFileSync(FACE_DETECTION_RESULTS_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

async function withFaceResultsStoreMutation(handler) {
  const run = faceResultsStoreMutationChain.then(() => handler());
  faceResultsStoreMutationChain = run.catch(() => {});
  return run;
}

function normalizeFaceDetectionJob(job = {}) {
  return {
    pageId: String(job.pageId || "").trim(),
    ownerUid: String(job.ownerUid || "").trim(),
    studioSlug: String(job.studioSlug || "").trim(),
    pageSlug: String(job.pageSlug || "").trim(),
    pageName: String(job.pageName || "").trim(),
    source: String(job.source || "manual").trim() || "manual",
    status: ["queued", "processing", "completed", "failed", "idle"].includes(String(job.status || "").trim())
      ? String(job.status || "").trim()
      : "idle",
    queuedAt: String(job.queuedAt || "").trim(),
    updatedAt: String(job.updatedAt || "").trim(),
    completedAt: String(job.completedAt || "").trim(),
    failedAt: String(job.failedAt || "").trim(),
    processingStartedAt: String(job.processingStartedAt || "").trim(),
    runtimeError: String(job.runtimeError || "").trim(),
    progressPercent: Math.max(0, Math.min(100, Number(job.progressPercent) || 0)),
    processedPhotoCount: Math.max(0, Number(job.processedPhotoCount) || 0),
    totalPhotoCount: Math.max(0, Number(job.totalPhotoCount) || 0),
    faceGroupCount: Math.max(0, Number(job.faceGroupCount) || 0),
    detectedPhotoCount: Math.max(0, Number(job.detectedPhotoCount) || 0),
    scannedPhotoCount: Math.max(0, Number(job.scannedPhotoCount) || 0),
    publicPageIds: Array.isArray(job.publicPageIds)
      ? job.publicPageIds.map((id) => String(id || "").trim()).filter(Boolean)
      : [],
  };
}

function normalizeFaceGroupEntry(entry = {}) {
  return {
    id: String(entry.id || "").trim() || String(entry.faceId || "").trim(),
    count: Math.max(0, Number(entry.count) || 0),
    photoCount: Math.max(0, Number(entry.photoCount) || 0),
    photoIds: Array.isArray(entry.photoIds)
      ? entry.photoIds.map((photoId) => String(photoId || "").trim()).filter(Boolean)
      : [],
    previewDataUrl: String(entry.previewDataUrl || "").trim(),
    mergedFrom: Array.isArray(entry.mergedFrom)
      ? entry.mergedFrom.map((faceId) => String(faceId || "").trim()).filter(Boolean)
      : [],
  };
}

async function getEffectiveFaceGroupsForPublicPage(db, publicPageId) {
  const pageSnapshot = await db.collection(FIREBASE_COLLECTIONS.publicPages).doc(publicPageId).get();
  if (!pageSnapshot.exists) {
    return null;
  }

  const pageData = pageSnapshot.data() || {};
  const pageId = String(pageData.pageId || "").trim();
  const queueStore = readFaceDetectionQueueStore();
  const localJob = normalizeFaceDetectionJob(queueStore.jobs?.[pageId] || {});
  const faceDetection = localJob.pageId ? localJob : pageData.faceDetection || null;
  const resultsStore = readFaceDetectionResultsStore();
  const localPage = resultsStore.pages?.[pageId] && typeof resultsStore.pages[pageId] === "object" ? resultsStore.pages[pageId] : null;
  const localGroups = Array.isArray(localPage?.groups) ? localPage.groups : [];

  const groupMap = new Map();
  localGroups.forEach((entry) => {
    const normalized = normalizeFaceGroupEntry(entry || {});
    if (normalized.id) {
      groupMap.set(normalized.id, normalized);
    }
  });

  if (pageId) {
    const store = readFaceMergeOverridesStore();
    const pageOverrides = Array.isArray(store?.pages?.[pageId]?.groups) ? store.pages[pageId].groups : [];
    for (const overrideRaw of pageOverrides) {
      const override = normalizeFaceGroupEntry(overrideRaw);
      if (!override.id) {
        continue;
      }
      const sourceIds = Array.isArray(overrideRaw?.sourceFaceIds)
        ? overrideRaw.sourceFaceIds.map((faceId) => String(faceId || "").trim()).filter(Boolean)
        : [];
      const mergedPhotoIds = new Set(override.photoIds);
      sourceIds.forEach((sourceId) => {
        const sourceGroup = groupMap.get(sourceId);
        if (sourceGroup) {
          sourceGroup.photoIds.forEach((photoId) => mergedPhotoIds.add(photoId));
          if (!override.previewDataUrl && sourceGroup.previewDataUrl) {
            override.previewDataUrl = sourceGroup.previewDataUrl;
          }
          groupMap.delete(sourceId);
        }
      });
      override.photoIds = Array.from(mergedPhotoIds);
      override.photoCount = override.photoIds.length;
      override.count = Math.max(override.count, override.photoCount);
      override.mergedFrom = sourceIds;
      groupMap.set(override.id, override);
    }
  }

  const groups = Array.from(groupMap.values()).filter((entry) => entry.id);
  return { pageSnapshot, faceDetection, pageId, groups };
}

function getStoredPublicPageLikes(publicPageId) {
  const normalizedPageId = String(publicPageId || "").trim();
  if (!normalizedPageId) {
    return {};
  }

  const store = readPublicPageLikesStore();
  const pageLikes = store[normalizedPageId];
  if (!pageLikes || typeof pageLikes !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(pageLikes)
      .map(([photoId, count]) => [String(photoId || "").trim(), Math.max(0, Number(count) || 0)])
      .filter(([photoId]) => photoId)
  );
}

function readRemoteMappings() {
  ensureDataStore();
  const content = fs.readFileSync(REMOTE_CODES_FILE, "utf8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, url, createdAt, permanentFlag, folderName = ""] = line.split("\t");
      return { code, url, createdAt, permanent: permanentFlag === "1", folderName };
    });
}

function writeRemoteMappings(mappings) {
  ensureDataStore();
  const body = mappings
    .map((entry) =>
      [entry.code, entry.url || "", entry.createdAt || "", entry.permanent ? "1" : "0", entry.folderName || ""].join("\t")
    )
    .join("\n");
  fs.writeFileSync(REMOTE_CODES_FILE, body ? `${body}\n` : "", "utf8");
}

function generateRemoteCode() {
  return generateNumericCode(6);
}

function generatePermanentRemoteCode() {
  return generateNumericCode(7);
}

function generateNumericCode(length) {
  const mappings = readRemoteMappings();
  let code = "";

  do {
    code = Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
  } while (mappings.some((entry) => entry.code === code));

  return code;
}

async function generateUniqueRemoteCode(codeExists, createCode = generateRemoteCode) {
  let code = "";

  do {
    code = createCode();
  } while (await codeExists(code));

  return code;
}

function normalizeRemoteUrl(url) {
  return String(url || "").trim();
}

function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEventPublicSlug(eventName) {
  const base = slugifyValue(eventName) || "event";
  return `${base}-${crypto.randomBytes(3).toString("hex")}`;
}

function createOpaqueToken(size = 18) {
  return crypto.randomBytes(size).toString("hex");
}

function createEventCode() {
  const events = readAllEvents();
  let code = "";

  do {
    code = generateNumericCode(9);
  } while (events.some((event) => String(event?.code || "").trim() === code));

  return code;
}

function getFirebaseServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!json && !base64 && !jsonPath) {
    return null;
  }

  const parsed = JSON.parse(
    json ||
      (jsonPath
        ? fs.readFileSync(path.resolve(jsonPath), "utf8")
        : Buffer.from(base64, "base64").toString("utf8"))
  );

  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

function getDriveServiceAccount() {
  const json = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  const base64 = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_BASE64;
  const jsonPath = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH;

  if (json || base64 || jsonPath) {
    const parsed = JSON.parse(
      json ||
        (jsonPath
          ? fs.readFileSync(path.resolve(jsonPath), "utf8")
          : Buffer.from(base64, "base64").toString("utf8"))
    );
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  }

  return getFirebaseServiceAccount();
}

function getGoogleDriveOAuthConfig() {
  const clientId = String(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET || "").trim();
  const redirectUri = String(process.env.GOOGLE_DRIVE_OAUTH_REDIRECT_URI || "").trim();
  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }
  return { clientId, clientSecret, redirectUri };
}

function getDriveUserConnection(uid) {
  const normalizedUid = String(uid || "").trim();
  if (!normalizedUid) {
    return null;
  }
  const store = readDriveConnectionsStore();
  const connection = store.connections[normalizedUid];
  return connection && typeof connection === "object" ? connection : null;
}

function getFirestoreDb() {
  if (!initializeFirebaseApp || !getFirebaseFirestore) {
    return null;
  }

  if (firestoreDb) {
    return firestoreDb;
  }

  if (!getFirebaseApps().length) {
    const serviceAccount = getFirebaseServiceAccount();

    if (serviceAccount) {
      initializeFirebaseApp({
        credential: firebaseCert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      initializeFirebaseApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      return null;
    }
  }

  firestoreDb = getFirebaseFirestore();
  return firestoreDb;
}

async function getDriveServiceAccessToken() {
  const serviceAccount = getDriveServiceAccount();
  if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
    throw new Error(
      "Drive write access is not configured yet. Add a Google service account and share the parent folder with it before creating events."
    );
  }

  if (driveServiceTokenCache?.token && driveServiceTokenCache.expiresAt > Date.now() + 60_000) {
    return driveServiceTokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");
  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key).toString("base64url");
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Could not get a Google Drive access token.");
  }

  driveServiceTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
  };

  return payload.access_token;
}

async function getDriveUserAccessToken(uid) {
  const connection = getDriveUserConnection(uid);
  const oauthConfig = getGoogleDriveOAuthConfig();
  if (!connection?.refreshToken || !oauthConfig) {
    throw new Error("Google Drive is not connected for this studio yet. Connect it before creating events.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      refresh_token: connection.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Could not refresh Google Drive access.");
  }

  const store = readDriveConnectionsStore();
  store.connections[String(uid || "").trim()] = {
    ...store.connections[String(uid || "").trim()],
    email: connection.email || "",
    scope: connection.scope || DRIVE_OAUTH_SCOPE,
    accessToken: payload.access_token,
    expiresAt: Date.now() + (Number(payload.expires_in) || 3600) * 1000,
    updatedAt: new Date().toISOString(),
    refreshToken: connection.refreshToken,
  };
  writeDriveConnectionsStore(store);
  return payload.access_token;
}

async function getDriveWriteAccessTokenForUser(uid) {
  const connection = getDriveUserConnection(uid);
  if (connection?.accessToken && Number(connection.expiresAt || 0) > Date.now() + 60_000) {
    return connection.accessToken;
  }
  return getDriveUserAccessToken(uid);
}

async function driveWriteRequest(url, { method = "GET", headers = {}, body, accessToken } = {}) {
  const token = accessToken || await getDriveServiceAccessToken();
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const errorMessage =
      payload?.error?.message || payload?.error_description || String(payload || "").trim();
    throw new Error(errorMessage || `Google Drive request failed (${response.status}).`);
  }

  return payload;
}

async function driveCreateSubfolder(parentId, folderName, accessToken) {
  const metadata = {
    name: folderName,
    mimeType: FOLDER_MIME_TYPE,
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  return driveWriteRequest("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
    accessToken,
  });
}

async function driveMoveFileToFolder(fileId, fromFolderId, toFolderId, accessToken) {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("addParents", toFolderId);
  if (fromFolderId) {
    url.searchParams.set("removeParents", fromFolderId);
  }
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("fields", "id,name");

  return driveWriteRequest(url.toString(), {
    method: "PATCH",
    accessToken,
  });
}

async function driveUploadFileToFolder({ folderId, fileName, mimeType, buffer, accessToken }) {
  const boundary = `carnivalshowcase-${crypto.randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({
    name: fileName,
    parents: [folderId],
  });
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const closing = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([preamble, buffer, closing]);

  return driveWriteRequest(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
      accessToken,
    }
  );
}

function parseFirestoreValue(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }
  if ("booleanValue" in value) {
    return Boolean(value.booleanValue);
  }
  if ("integerValue" in value) {
    return Number(value.integerValue);
  }
  if ("doubleValue" in value) {
    return Number(value.doubleValue);
  }
  if ("timestampValue" in value) {
    return value.timestampValue;
  }
  if ("nullValue" in value) {
    return null;
  }
  if ("mapValue" in value) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map((entry) => parseFirestoreValue(entry));
  }

  return null;
}

function parseFirestoreFields(fields) {
  return Object.fromEntries(
    Object.entries(fields || {}).map(([key, value]) => [key, parseFirestoreValue(value)])
  );
}

async function getCustomDomainRecord(domain) {
  const normalizedDomain = normalizeHostname(domain);
  if (!normalizedDomain) {
    return null;
  }

  const db = getFirestoreDb();
  if (db) {
    const snapshot = await db.collection(FIREBASE_COLLECTIONS.customDomains).doc(normalizedDomain).get();
    if (!snapshot.exists) {
      return null;
    }
    return snapshot.data() || null;
  }

  if (!FIREBASE_WEB_CONFIG.projectId || !FIREBASE_WEB_CONFIG.apiKey) {
    return null;
  }

  const documentUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      FIREBASE_WEB_CONFIG.projectId
    )}/databases/(default)/documents/${FIREBASE_COLLECTIONS.customDomains}/${encodeURIComponent(
      normalizedDomain
    )}`
  );
  documentUrl.searchParams.set("key", FIREBASE_WEB_CONFIG.apiKey);

  const response = await fetch(documentUrl);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Custom domain lookup failed (${response.status}): ${body}`);
  }

  const document = await response.json();
  return parseFirestoreFields(document.fields || {});
}

function isExpired(createdAt) {
  const timestamp = Date.parse(createdAt || "");
  if (Number.isNaN(timestamp)) {
    return true;
  }
  return Date.now() - timestamp > CODE_EXPIRY_MS;
}

function isEntryExpired(entry) {
  if (entry?.permanent) {
    return false;
  }
  return isExpired(entry?.createdAt);
}

function pruneExpiredMappings() {
  const mappings = readRemoteMappings();
  const activeMappings = mappings.filter((entry) => !isEntryExpired(entry));

  if (activeMappings.length !== mappings.length) {
    writeRemoteMappings(activeMappings);
  }

  return activeMappings;
}

async function writeRemoteLinkToStore(url, permanent = false) {
  const normalizedUrl = normalizeRemoteUrl(url);
  const db = getFirestoreDb();
  let folderName = "Google Drive folder";

  if (API_KEY) {
    const folderId = extractFolderId(normalizedUrl);
    if (folderId) {
      try {
        const folderMeta = await driveGetFile(folderId);
        if (folderMeta?.name) {
          folderName = folderMeta.name;
        }
      } catch (error) {
        // If metadata lookup fails, still allow code creation; the admin table can fall back later.
      }
    }
  }

  if (!db) {
    const mappings = pruneExpiredMappings();
    const existingEntry = mappings.find(
      (entry) => normalizeRemoteUrl(entry.url) === normalizedUrl && Boolean(entry.permanent) === permanent
    );

    if (existingEntry) {
      if (!existingEntry.folderName && folderName) {
        existingEntry.folderName = folderName;
        writeRemoteMappings(mappings);
      }
      return { success: true, code: existingEntry.code, reused: true, store: "file" };
    }

    const code = permanent ? generatePermanentRemoteCode() : generateRemoteCode();
    mappings.push({
      code,
      url: normalizedUrl,
      createdAt: new Date().toISOString(),
      permanent,
      folderName,
    });
    writeRemoteMappings(mappings);
    return { success: true, code, reused: false, store: "file" };
  }

  const collection = db.collection(FIREBASE_COLLECTION);
  const duplicateSnapshot = await collection
    .where("normalizedUrl", "==", normalizedUrl)
    .limit(5)
    .get();

  let reusableEntry = null;
  const expiredDocs = [];

  duplicateSnapshot.forEach((doc) => {
    const data = doc.data();
    if (isEntryExpired(data)) {
      expiredDocs.push(doc.ref.delete());
      return;
    }

    if (!reusableEntry && Boolean(data.permanent) === permanent) {
      reusableEntry = { code: doc.id, ...data };
    }
  });

  if (expiredDocs.length) {
    await Promise.all(expiredDocs);
  }

  if (reusableEntry) {
    if (!reusableEntry.folderName && folderName) {
      await collection.doc(reusableEntry.code).set({ folderName }, { merge: true });
    }
    return { success: true, code: reusableEntry.code, reused: true, store: "firestore" };
  }

  const code = await generateUniqueRemoteCode(async (candidate) => {
    const existingDoc = await collection.doc(candidate).get();
    return existingDoc.exists;
  }, permanent ? generatePermanentRemoteCode : generateRemoteCode);

  const createdAt = new Date().toISOString();
  await collection.doc(code).set({
    url: normalizedUrl,
    normalizedUrl,
    createdAt,
    permanent,
    folderName,
  });

  return { success: true, code, reused: false, store: "firestore" };
}

async function resolveRemoteLinkFromStore(code) {
  const db = getFirestoreDb();

  if (!db) {
    const entry = pruneExpiredMappings().find((item) => item.code === code);
    if (!entry) {
      return null;
    }

    return {
      code: entry.code,
      url: entry.url || "",
      ready: Boolean(entry.url),
      permanent: Boolean(entry.permanent),
      folderName: entry.folderName || "",
      store: "file",
    };
  }

  const doc = await db.collection(FIREBASE_COLLECTION).doc(code).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data() || {};
  if (isEntryExpired(data)) {
    await doc.ref.delete();
    return null;
  }

  return {
    code: doc.id,
    url: data.url || "",
    ready: Boolean(data.url),
    permanent: Boolean(data.permanent),
    folderName: data.folderName || "",
    store: "firestore",
  };
}

async function deleteRemoteCode(code, url) {
  const normalizedUrl = normalizeRemoteUrl(url);
  const db = getFirestoreDb();

  if (!db) {
    const mappings = pruneExpiredMappings();
    const entry = mappings.find((item) => item.code === code);
    if (!entry) {
      return { deleted: false };
    }

    if (normalizeRemoteUrl(entry.url) !== normalizedUrl) {
      return { deleted: false };
    }

    writeRemoteMappings(mappings.filter((item) => item.code !== code));
    return { deleted: true, store: "file" };
  }

  const docRef = db.collection(FIREBASE_COLLECTION).doc(code);
  const doc = await docRef.get();
  if (!doc.exists) {
    return { deleted: false };
  }

  const data = doc.data() || {};
  if (normalizeRemoteUrl(data.url) !== normalizedUrl) {
    return { deleted: false };
  }

  await docRef.delete();
  return { deleted: true, store: "firestore" };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function readRawRequestBuffer(req, maxBytes = EVENT_UPLOAD_MAX_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        reject(new Error("Upload is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

function parseMultipartForm(buffer, contentType) {
  const boundaryMatch = String(contentType || "").match(/boundary=([^;]+)/i);
  if (!boundaryMatch) {
    throw new Error("Upload boundary is missing.");
  }

  const boundary = `--${boundaryMatch[1]}`;
  const raw = buffer.toString("binary");
  const segments = raw.split(boundary).slice(1, -1);
  const fields = {};
  const files = [];

  for (const segment of segments) {
    const cleaned = segment.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const headerEnd = cleaned.indexOf("\r\n\r\n");
    if (headerEnd < 0) {
      continue;
    }

    const headerText = cleaned.slice(0, headerEnd);
    const bodyBinary = cleaned.slice(headerEnd + 4);
    const headers = Object.fromEntries(
      headerText.split("\r\n").map((line) => {
        const index = line.indexOf(":");
        return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
      })
    );
    const disposition = headers["content-disposition"] || "";
    const nameMatch = disposition.match(/name=\"([^\"]+)\"/i);
    if (!nameMatch) {
      continue;
    }
    const fieldName = nameMatch[1];
    const fileNameMatch = disposition.match(/filename=\"([^\"]*)\"/i);

    if (fileNameMatch && fileNameMatch[1]) {
      const contentTypeHeader = headers["content-type"] || "application/octet-stream";
      files.push({
        fieldName,
        fileName: fileNameMatch[1],
        mimeType: contentTypeHeader,
        buffer: Buffer.from(bodyBinary, "binary"),
      });
    } else {
      fields[fieldName] = Buffer.from(bodyBinary, "binary").toString("utf8");
    }
  }

  return { fields, files };
}

function getPreferredLanIp() {
  const networks = os.networkInterfaces();
  for (const addresses of Object.values(networks)) {
    for (const address of addresses || []) {
      if (
        address.family === "IPv4" &&
        !address.internal &&
        (
          address.address.startsWith("192.168.") ||
          address.address.startsWith("10.") ||
          address.address.startsWith("172.")
        )
      ) {
        return address.address;
      }
    }
  }

  return null;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, statusCode, html) {
  const body = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CarnivalStories</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;padding:40px;color:#111;background:#fff}h1{font-size:24px;line-height:1.2;margin:0}</style></head><body>${html}</body></html>`;
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function normalizeHostname(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
}

function getExpectedCustomDomainTarget(req) {
  const configuredTarget = normalizeHostname(CUSTOM_DOMAIN_CNAME_TARGET);
  if (configuredTarget) {
    return configuredTarget;
  }

  return normalizeHostname((req.headers.host || "").split(":")[0]);
}

function getDomainHostLabel(domain) {
  const normalizedDomain = normalizeHostname(domain);
  return normalizedDomain ? normalizedDomain.split(".")[0] || "album" : "album";
}

function getRequestProtocol(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (forwardedProto) {
    return forwardedProto;
  }

  const hostName = normalizeHostname((req.headers.host || "").split(":")[0]);
  if (
    hostName &&
    hostName !== "localhost" &&
    hostName !== "127.0.0.1" &&
    hostName !== "0.0.0.0"
  ) {
    return "https";
  }

  return "http";
}

function getParentDomainRedirectHost(hostname) {
  const normalizedHost = normalizeHostname(hostname);
  const configuredTarget = normalizeHostname(CUSTOM_DOMAIN_CNAME_TARGET);
  if (
    !normalizedHost ||
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".onrender.com") ||
    (configuredTarget && normalizedHost === configuredTarget)
  ) {
    return "";
  }

  const labels = normalizedHost.split(".");
  if (labels.length < 3) {
    return "";
  }

  return labels.slice(1).join(".");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAbsoluteUrl(req, value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  try {
    return new URL(rawValue).toString();
  } catch (error) {
    return new URL(rawValue, `${getRequestProtocol(req)}://${req.headers.host}`).toString();
  }
}

function parsePublicPageRequest(pathname, requestHost) {
  const normalizedHost = normalizeHostname(requestHost);
  const pathSegments = String(pathname || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));

  if (!pathSegments.length || pathSegments[0] === "studio") {
    return null;
  }

  if (pathSegments.length >= 2) {
    const studioSlug = pathSegments[0];
    const pageSlug = pathSegments[1];
    return {
      studioSlug,
      pageSlug,
      publicPageId: `${studioSlug}__${pageSlug}`,
      isCustomDomain: false,
    };
  }

  if (!normalizedHost || !pathSegments[0]) {
    return null;
  }

  return {
    customDomain: normalizedHost,
    pageSlug: pathSegments[0],
    publicPageId: `${normalizedHost}__${pathSegments[0]}`,
    isCustomDomain: true,
  };
}

async function getPublicPageRecordById(publicPageId) {
  if (!publicPageId) {
    return null;
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db.collection(FIREBASE_COLLECTIONS.publicPages).doc(publicPageId).get();
      return snapshot.exists ? snapshot.data() || null : null;
    } catch (_) {
      // Fall through to REST lookup below so legacy pages still resolve
      // when admin credentials are unavailable or temporarily throttled.
    }
  }

  if (!FIREBASE_WEB_CONFIG.projectId || !FIREBASE_WEB_CONFIG.apiKey) {
    return null;
  }

  const documentUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      FIREBASE_WEB_CONFIG.projectId
    )}/databases/(default)/documents/${FIREBASE_COLLECTIONS.publicPages}/${encodeURIComponent(publicPageId)}`
  );
  documentUrl.searchParams.set("key", FIREBASE_WEB_CONFIG.apiKey);

  const response = await fetch(documentUrl);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Public page lookup failed (${response.status}): ${body}`);
  }

  const document = await response.json();
  return parseFirestoreFields(document.fields || {});
}

async function getAlbumSnapshotChunksForPublicPage(publicPageId) {
  if (!publicPageId) {
    return [];
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db
        .collection(FIREBASE_COLLECTIONS.publicPages)
        .doc(publicPageId)
        .collection(ALBUM_SNAPSHOT_SUBCOLLECTION)
        .orderBy("index", "asc")
        .get();

      return snapshot.docs
        .map((doc) => doc.data() || {})
        .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
    } catch (_) {
      // Fall through to REST lookup below for resilience.
    }
  }

  if (!FIREBASE_WEB_CONFIG.projectId || !FIREBASE_WEB_CONFIG.apiKey) {
    return [];
  }

  const collectionUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      FIREBASE_WEB_CONFIG.projectId
    )}/databases/(default)/documents/${FIREBASE_COLLECTIONS.publicPages}/${encodeURIComponent(
      publicPageId
    )}/${ALBUM_SNAPSHOT_SUBCOLLECTION}`
  );
  collectionUrl.searchParams.set("key", FIREBASE_WEB_CONFIG.apiKey);

  const response = await fetch(collectionUrl);
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Album snapshot lookup failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return (payload.documents || [])
    .map((document) => parseFirestoreFields(document.fields || {}))
    .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));
}

async function getAlbumSnapshotForPublicPage(publicPageId, pageRecord) {
  const chunkCount = Number(pageRecord?.albumSnapshotChunkCount) || 0;
  if (!publicPageId || !chunkCount) {
    return null;
  }

  const chunks = await getAlbumSnapshotChunksForPublicPage(publicPageId);
  if (!chunks.length) {
    return null;
  }

  return {
    version: Number(pageRecord?.albumSnapshotVersion) || 1,
    rootName: String(pageRecord?.albumSnapshotRootName || ""),
    folderCount: Number(pageRecord?.albumSnapshotFolderCount) || 0,
    mediaCount: Number(pageRecord?.albumSnapshotMediaCount) || 0,
    generatedAt: String(pageRecord?.albumSnapshotGeneratedAt || ""),
    includeYoutubeVideosFolder: Boolean(pageRecord?.includeYoutubeVideosFolder),
    youtubeLinks: Array.isArray(pageRecord?.youtubeLinks)
      ? pageRecord.youtubeLinks.map((item) => ({
          url: String(item?.url || "").trim(),
          title: String(item?.title || "").trim(),
          thumbnailUrl: String(item?.thumbnailUrl || "").trim(),
          validated: Boolean(item?.validated),
        }))
      : [],
    folders: chunks.flatMap((chunk) => (Array.isArray(chunk.folders) ? chunk.folders : [])),
  };
}

async function getPairingCodeRecordById(code) {
  const normalizedCode = String(code || "").trim();
  if (!normalizedCode) {
    return null;
  }

  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db.collection(FIREBASE_COLLECTIONS.pairingCodes).doc(normalizedCode).get();
      if (snapshot.exists) {
        const pairingData = snapshot.data() || {};
        const pairingPublicPageId =
          String(pairingData.publicPageId || "").trim() ||
          (pairingData.studioSlug && pairingData.pageSlug
            ? `${String(pairingData.studioSlug).trim()}__${String(pairingData.pageSlug).trim()}`
            : "");

        if (!pairingPublicPageId) {
          const pageMatch = await db
            .collection(FIREBASE_COLLECTIONS.publicPages)
            .where("pairingCode", "==", normalizedCode)
            .limit(1)
            .get();
          if (!pageMatch.empty) {
            const doc = pageMatch.docs[0];
            const data = doc.data() || {};
            return {
              ...pairingData,
              code: normalizedCode,
              pairingCode: normalizedCode,
              publicPageId: doc.id,
              pageId: String(data.pageId || pairingData.pageId || "").trim(),
              studioSlug: String(data.studioSlug || pairingData.studioSlug || "").trim(),
              pageSlug: String(data.pageSlug || pairingData.pageSlug || "").trim(),
              pageName: String(data.pageName || pairingData.pageName || "").trim(),
              ownerUid: String(data.ownerUid || pairingData.ownerUid || "").trim(),
              folderName: String(data.pageName || pairingData.folderName || "").trim(),
              url: String(data.driveLink || pairingData.url || "").trim(),
              normalizedUrl: String(data.driveLink || pairingData.normalizedUrl || pairingData.url || "").trim(),
              createdAt: String(pairingData.createdAt || data.createdAt || "").trim(),
              permanent: true,
            };
          }
        }

        return pairingData;
      }

      // Legacy fallback: some old albums have pairingCode on publicPages but
      // no matching pairingCodes doc.
      const pageMatch = await db
        .collection(FIREBASE_COLLECTIONS.publicPages)
        .where("pairingCode", "==", normalizedCode)
        .limit(1)
        .get();
      if (!pageMatch.empty) {
        const doc = pageMatch.docs[0];
        const data = doc.data() || {};
        return {
          code: normalizedCode,
          pairingCode: normalizedCode,
          publicPageId: doc.id,
          pageId: String(data.pageId || "").trim(),
          studioSlug: String(data.studioSlug || "").trim(),
          pageSlug: String(data.pageSlug || "").trim(),
          pageName: String(data.pageName || "").trim(),
          ownerUid: String(data.ownerUid || "").trim(),
          folderName: String(data.pageName || "").trim(),
          url: String(data.driveLink || "").trim(),
          normalizedUrl: String(data.driveLink || "").trim(),
          createdAt: String(data.createdAt || "").trim(),
          permanent: true,
        };
      }
      return null;
    } catch (_) {
      // Fall through to REST lookup below for legacy compatibility.
    }
  }

  if (!FIREBASE_WEB_CONFIG.projectId || !FIREBASE_WEB_CONFIG.apiKey) {
    return null;
  }

  const documentUrl = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      FIREBASE_WEB_CONFIG.projectId
    )}/databases/(default)/documents/${FIREBASE_COLLECTIONS.pairingCodes}/${encodeURIComponent(normalizedCode)}`
  );
  documentUrl.searchParams.set("key", FIREBASE_WEB_CONFIG.apiKey);

  const response = await fetch(documentUrl);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Pairing code lookup failed (${response.status}): ${body}`);
  }

  const document = await response.json();
  return parseFirestoreFields(document.fields || {});
}

async function lookupFirebaseAccountByIdToken(idToken) {
  const token = String(idToken || "").trim();
  if (!token || !FIREBASE_WEB_CONFIG.apiKey) {
    return null;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_CONFIG.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.users?.[0] || null;
}

async function deleteFirebaseAccountByIdToken(idToken) {
  const token = String(idToken || "").trim();
  if (!token || !FIREBASE_WEB_CONFIG.apiKey) {
    return false;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${encodeURIComponent(FIREBASE_WEB_CONFIG.apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    }
  );

  return response.ok;
}

async function requireAdminRequest(req, res) {
  const authorization = String(req.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  const account = await lookupFirebaseAccountByIdToken(token);

  if (!account?.email || account.email.toLowerCase() !== "carnivalshowcase@gmail.com") {
    sendJson(res, 403, { error: "Admin access required." });
    return null;
  }

  return account;
}

async function requireAuthenticatedRequest(req, res) {
  const authorization = String(req.headers.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  const account = await lookupFirebaseAccountByIdToken(token);

  if (!account?.localId) {
    sendJson(res, 401, { error: "Authentication required." });
    return null;
  }

  return account;
}

function buildGoogleDriveOAuthState() {
  return createOpaqueToken(24);
}

function getDriveConnectionStatusPayload(uid) {
  const connection = getDriveUserConnection(uid);
  return {
    connected: Boolean(connection?.refreshToken),
    email: connection?.email || "",
    connectedAt: connection?.connectedAt || "",
    updatedAt: connection?.updatedAt || "",
    scope: connection?.scope || "",
  };
}

async function handleDriveConnectionStatus(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  sendJson(res, 200, getDriveConnectionStatusPayload(account.localId));
}

async function handleRemoveDriveConnection(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  const store = readDriveConnectionsStore();
  if (store.connections && store.connections[account.localId]) {
    delete store.connections[account.localId];
    writeDriveConnectionsStore(store);
  }

  sendJson(res, 200, { ok: true });
}

async function handleStartDriveOAuth(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  const oauthConfig = getGoogleDriveOAuthConfig();
  if (!oauthConfig) {
    sendJson(res, 503, {
      error: "Google Drive OAuth is not configured on the server yet.",
    });
    return;
  }

  const state = buildGoogleDriveOAuthState();
  const store = readDriveConnectionsStore();
  store.pendingStates[state] = {
    uid: account.localId,
    email: account.email || "",
    createdAt: new Date().toISOString(),
  };
  writeDriveConnectionsStore(store);

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", oauthConfig.clientId);
  authUrl.searchParams.set("redirect_uri", oauthConfig.redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", DRIVE_OAUTH_SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);

  sendJson(res, 200, { authUrl: authUrl.toString() });
}

async function handleDriveOAuthCallback(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const oauthConfig = getGoogleDriveOAuthConfig();
  if (!oauthConfig) {
    sendHtml(res, 503, "<h1>Google Drive OAuth is not configured.</h1>");
    return;
  }

  const state = String(requestUrl.searchParams.get("state") || "").trim();
  const code = String(requestUrl.searchParams.get("code") || "").trim();
  const error = String(requestUrl.searchParams.get("error") || "").trim();
  const store = readDriveConnectionsStore();
  const pendingState = store.pendingStates[state];

  if (!pendingState?.uid) {
    sendHtml(res, 400, "<h1>This Google Drive connection link is no longer valid.</h1>");
    return;
  }

  delete store.pendingStates[state];
  writeDriveConnectionsStore(store);

  if (error) {
    res.writeHead(302, {
      Location: `/studio?drive=error&message=${encodeURIComponent(error)}`,
      "Cache-Control": "no-store",
    });
    res.end();
    return;
  }

  if (!code) {
    sendHtml(res, 400, "<h1>Missing Google Drive authorization code.</h1>");
    return;
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      redirect_uri: oauthConfig.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    sendHtml(res, 400, `<h1>${escapeHtml(tokenPayload.error_description || tokenPayload.error || "Could not connect Google Drive.")}</h1>`);
    return;
  }

  const nextStore = readDriveConnectionsStore();
  nextStore.connections[pendingState.uid] = {
    uid: pendingState.uid,
    email: pendingState.email || "",
    refreshToken: tokenPayload.refresh_token || nextStore.connections[pendingState.uid]?.refreshToken || "",
    accessToken: tokenPayload.access_token,
    expiresAt: Date.now() + (Number(tokenPayload.expires_in) || 3600) * 1000,
    scope: tokenPayload.scope || DRIVE_OAUTH_SCOPE,
    connectedAt: nextStore.connections[pendingState.uid]?.connectedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeDriveConnectionsStore(nextStore);

  res.writeHead(302, {
    Location: "/studio?drive=connected",
    "Cache-Control": "no-store",
  });
  res.end();
}

async function hydrateRemoteMappingFolderName(entry) {
  if (entry?.folderName || !entry?.url || !API_KEY) {
    return entry;
  }

  const folderId = extractFolderId(entry.url);
  if (!folderId) {
    return entry;
  }

  try {
    const folderMeta = await driveGetFile(folderId);
    if (folderMeta?.name) {
      return {
        ...entry,
        folderName: folderMeta.name,
      };
    }
  } catch (error) {
    // Leave the name blank if Google Drive metadata cannot be fetched now.
  }

  return entry;
}

async function listRemoteLinksForAdmin() {
  const db = getFirestoreDb();

  if (!db) {
    const mappings = pruneExpiredMappings();
    const hydratedMappings = await Promise.all(mappings.map((entry) => hydrateRemoteMappingFolderName(entry)));
    const changed = hydratedMappings.some((entry, index) => entry.folderName !== mappings[index].folderName);
    if (changed) {
      writeRemoteMappings(hydratedMappings);
    }
    return hydratedMappings.map((entry) => ({
      code: entry.code,
      url: entry.url || "",
      createdAt: entry.createdAt || "",
      permanent: Boolean(entry.permanent),
      folderName: entry.folderName || "Google Drive folder",
      source: "remote",
    }));
  }

  const snapshot = await db.collection(FIREBASE_COLLECTION).get();
  const docs = snapshot.docs;
  const activeEntries = [];
  const deletions = [];
  const updates = [];

  for (const linkDoc of docs) {
    const data = linkDoc.data() || {};
    if (isEntryExpired(data)) {
      deletions.push(linkDoc.ref.delete());
      continue;
    }

    const hydrated = await hydrateRemoteMappingFolderName({
      code: linkDoc.id,
      url: data.url || "",
      createdAt: data.createdAt || "",
      permanent: Boolean(data.permanent),
      folderName: data.folderName || "",
    });

    if (hydrated.folderName && hydrated.folderName !== (data.folderName || "")) {
      updates.push(linkDoc.ref.set({ folderName: hydrated.folderName }, { merge: true }));
    }

    activeEntries.push({
      code: linkDoc.id,
      url: data.url || "",
      createdAt: data.createdAt || "",
      permanent: Boolean(data.permanent),
      folderName: hydrated.folderName || "Google Drive folder",
      source: "remote",
    });
  }

  if (deletions.length || updates.length) {
    await Promise.all([...deletions, ...updates]);
  }

  return activeEntries;
}

async function deletePermanentLinkByAdmin(payload) {
  const db = getFirestoreDb();
  if (!db) {
    throw new Error("Permanent link deletion requires Firebase admin credentials on the server.");
  }

  const code = String(payload.code || "").trim();
  const ownerUid = String(payload.ownerUid || "").trim();
  const pageId = String(payload.pageId || "").trim();
  const publicPageId = String(payload.publicPageId || "").trim();
  const customDomainPublicPageId = String(payload.customDomainPublicPageId || "").trim();

  if (!code || !ownerUid || !pageId) {
    throw new Error("Missing permanent link identifiers.");
  }

  const batch = db.batch();
  batch.delete(db.collection(FIREBASE_COLLECTIONS.users).doc(ownerUid).collection("pages").doc(pageId));
  batch.delete(db.collection(FIREBASE_COLLECTIONS.pairingCodes).doc(code));

  if (publicPageId) {
    batch.delete(db.collection(FIREBASE_COLLECTIONS.publicPages).doc(publicPageId));
  }

  if (customDomainPublicPageId) {
    batch.delete(db.collection(FIREBASE_COLLECTIONS.publicPages).doc(customDomainPublicPageId));
  }

  await batch.commit();
  return { deleted: true, source: "permanent" };
}

async function deleteDocumentRefsInBatches(db, refs) {
  const uniqueRefs = [];
  const seen = new Set();
  for (const ref of refs) {
    if (!ref?.path || seen.has(ref.path)) {
      continue;
    }
    seen.add(ref.path);
    uniqueRefs.push(ref);
  }

  let deleted = 0;
  for (let index = 0; index < uniqueRefs.length; index += 400) {
    const slice = uniqueRefs.slice(index, index + 400);
    const batch = db.batch();
    slice.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += slice.length;
  }
  return deleted;
}

async function handleDeleteAccount(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  const db = getFirestoreDb();
  if (!db) {
    sendJson(res, 503, { error: "Account deletion requires Firebase admin credentials on the server." });
    return;
  }

  const uid = String(account.localId || "").trim();
  if (!uid) {
    sendJson(res, 400, { error: "Invalid account identifier." });
    return;
  }

  const refsToDelete = [];
  const userRef = db.collection(FIREBASE_COLLECTIONS.users).doc(uid);
  refsToDelete.push(userRef);

  const userSnapshot = await userRef.get().catch(() => null);
  const studioSlug = String(userSnapshot?.data?.()?.studioSlug || "").trim();

  const pagesSnapshot = await userRef.collection("pages").get().catch(() => null);
  const ownedPageIds = new Set();
  if (pagesSnapshot) {
    for (const pageDoc of pagesSnapshot.docs) {
      refsToDelete.push(pageDoc.ref);
      const pageData = pageDoc.data() || {};
      const pageId = String(pageDoc.id || "").trim();
      const pageSlug = String(pageData.pageSlug || "").trim();
      const customDomain = normalizeHostname(pageData.customDomain || "");
      if (pageId) {
        ownedPageIds.add(pageId);
      }
      if (studioSlug && pageSlug) {
        refsToDelete.push(db.collection(FIREBASE_COLLECTIONS.publicPages).doc(`${studioSlug}__${pageSlug}`));
      }
      if (customDomain && pageSlug) {
        refsToDelete.push(db.collection(FIREBASE_COLLECTIONS.publicPages).doc(`${customDomain}__${pageSlug}`));
      }
    }
  }

  for (const pageId of ownedPageIds) {
    const siblingPublicPageSnapshots = await db
      .collection(FIREBASE_COLLECTIONS.publicPages)
      .where("pageId", "==", pageId)
      .get()
      .catch(() => null);
    if (siblingPublicPageSnapshots) {
      siblingPublicPageSnapshots.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref));
    }
  }

  const publicPagesByOwner = await db
    .collection(FIREBASE_COLLECTIONS.publicPages)
    .where("ownerUid", "==", uid)
    .get()
    .catch(() => null);
  if (publicPagesByOwner) {
    publicPagesByOwner.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref));
  }

  if (studioSlug) {
    refsToDelete.push(db.collection(FIREBASE_COLLECTIONS.studioNames).doc(studioSlug));
    const publicPagesByStudioSlug = await db
      .collection(FIREBASE_COLLECTIONS.publicPages)
      .where("studioSlug", "==", studioSlug)
      .get()
      .catch(() => null);
    if (publicPagesByStudioSlug) {
      publicPagesByStudioSlug.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref));
    }
  }

  const pairingCodesSnapshot = await db
    .collection(FIREBASE_COLLECTIONS.pairingCodes)
    .where("ownerUid", "==", uid)
    .get()
    .catch(() => null);
  if (pairingCodesSnapshot) {
    pairingCodesSnapshot.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref));
  }

  const customDomainsSnapshot = await db
    .collection(FIREBASE_COLLECTIONS.customDomains)
    .where("uid", "==", uid)
    .get()
    .catch(() => null);
  if (customDomainsSnapshot) {
    customDomainsSnapshot.docs.forEach((docSnapshot) => refsToDelete.push(docSnapshot.ref));
  }

  const deletedDocuments = await deleteDocumentRefsInBatches(db, refsToDelete);

  const driveStore = readDriveConnectionsStore();
  if (driveStore.connections && driveStore.connections[uid]) {
    delete driveStore.connections[uid];
    writeDriveConnectionsStore(driveStore);
  }

  await withEventsStoreMutation(async () => {
    const store = readEventsStore();
    const nextEvents = (store.events || []).filter((event) => String(event?.ownerUid || "").trim() !== uid);
    if (nextEvents.length !== (store.events || []).length) {
      writeEventsStore({ events: nextEvents });
    }
  }).catch(() => {});

  const authorization = String(req.headers.authorization || "");
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const idToken = tokenMatch?.[1]?.trim() || "";
  const authAccountDeleted = await deleteFirebaseAccountByIdToken(idToken).catch(() => false);

  sendJson(res, 200, {
    success: true,
    deletedDocuments,
    authAccountDeleted,
  });
}

async function incrementPublicPagePhotoLike(publicPageId, photoId) {
  const db = getFirestoreDb();
  const normalizedPageId = String(publicPageId || "").trim();
  const normalizedPhotoId = String(photoId || "").trim();
  if (!normalizedPageId || !normalizedPhotoId) {
    throw new Error("Missing photo like identifiers.");
  }

  if (!db) {
    const store = readPublicPageLikesStore();
    const existingLikes =
      store[normalizedPageId] && typeof store[normalizedPageId] === "object" ? store[normalizedPageId] : {};
    const currentCount = Math.max(0, Number(existingLikes[normalizedPhotoId]) || 0);
    const nextCount = currentCount + 1;
    store[normalizedPageId] = {
      ...existingLikes,
      [normalizedPhotoId]: nextCount,
    };
    writePublicPageLikesStore(store);
    return { publicPageId: normalizedPageId, photoId: normalizedPhotoId, count: nextCount, source: "vps" };
  }

  const pageRef = db.collection(FIREBASE_COLLECTIONS.publicPages).doc(normalizedPageId);
  const nextCount = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(pageRef);
    if (!snapshot.exists) {
      throw new Error("This studio page does not exist.");
    }

    const pageData = snapshot.data() || {};
    const existingLikes = pageData.photoLikes && typeof pageData.photoLikes === "object" ? pageData.photoLikes : {};
    const currentCount = Number(existingLikes[normalizedPhotoId]) || 0;
    const updatedLikes = {
      ...existingLikes,
      [normalizedPhotoId]: currentCount + 1,
    };

    transaction.set(pageRef, { photoLikes: updatedLikes }, { merge: true });
    return currentCount + 1;
  });

  return { publicPageId: normalizedPageId, photoId: normalizedPhotoId, count: nextCount, source: "firestore" };
}

async function decrementPublicPagePhotoLike(publicPageId, photoId) {
  const db = getFirestoreDb();
  const normalizedPageId = String(publicPageId || "").trim();
  const normalizedPhotoId = String(photoId || "").trim();
  if (!normalizedPageId || !normalizedPhotoId) {
    throw new Error("Missing photo like identifiers.");
  }

  if (!db) {
    const store = readPublicPageLikesStore();
    const existingLikes =
      store[normalizedPageId] && typeof store[normalizedPageId] === "object" ? store[normalizedPageId] : {};
    const currentCount = Math.max(0, Number(existingLikes[normalizedPhotoId]) || 0);
    const nextCount = Math.max(0, currentCount - 1);
    store[normalizedPageId] = {
      ...existingLikes,
      [normalizedPhotoId]: nextCount,
    };
    writePublicPageLikesStore(store);
    return { publicPageId: normalizedPageId, photoId: normalizedPhotoId, count: nextCount, source: "vps" };
  }

  const pageRef = db.collection(FIREBASE_COLLECTIONS.publicPages).doc(normalizedPageId);
  const nextCount = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(pageRef);
    if (!snapshot.exists) {
      throw new Error("This studio page does not exist.");
    }

    const pageData = snapshot.data() || {};
    const existingLikes = pageData.photoLikes && typeof pageData.photoLikes === "object" ? pageData.photoLikes : {};
    const currentCount = Math.max(0, Number(existingLikes[normalizedPhotoId]) || 0);
    const updatedLikes = {
      ...existingLikes,
      [normalizedPhotoId]: Math.max(0, currentCount - 1),
    };

    transaction.set(pageRef, { photoLikes: updatedLikes }, { merge: true });
    return updatedLikes[normalizedPhotoId];
  });

  return { publicPageId: normalizedPageId, photoId: normalizedPhotoId, count: nextCount, source: "firestore" };
}

async function handlePublicPageLikes(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const publicPageId = String(requestUrl.searchParams.get("publicPageId") || "").trim();

  if (!publicPageId) {
    sendJson(res, 400, { error: "Missing public page identifier." });
    return;
  }

  const fileLikes = getStoredPublicPageLikes(publicPageId);
  const db = getFirestoreDb();

  if (!db) {
    sendJson(res, 200, { publicPageId, photoLikes: fileLikes, source: "vps" });
    return;
  }

  const snapshot = await db.collection(FIREBASE_COLLECTIONS.publicPages).doc(publicPageId).get();
  const firestoreLikes =
    snapshot.exists && snapshot.data()?.photoLikes && typeof snapshot.data().photoLikes === "object"
      ? snapshot.data().photoLikes
      : {};

  const merged = { ...firestoreLikes };
  for (const [photoId, count] of Object.entries(fileLikes)) {
    merged[photoId] = Math.max(0, Number(merged[photoId]) || 0, Number(count) || 0);
  }

  sendJson(res, 200, { publicPageId, photoLikes: merged, source: "firestore" });
}

async function handlePublicPageFaceGroups(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const publicPageId = String(requestUrl.searchParams.get("publicPageId") || "").trim();
  if (!publicPageId) {
    sendJson(res, 400, { error: "Missing public page identifier." });
    return;
  }

  const db = getFirestoreDb();
  let effective = null;
  if (db) {
    effective = await getEffectiveFaceGroupsForPublicPage(db, publicPageId);
  } else {
    const resultsStore = readFaceDetectionResultsStore();
    const queueStore = readFaceDetectionQueueStore();
    const localEntry = Object.values(resultsStore.pages || {}).find((entry) =>
      Array.isArray(entry?.publicPageIds) && entry.publicPageIds.includes(publicPageId)
    );
    if (localEntry) {
      const pageId = String(localEntry.pageId || "").trim();
      effective = {
        pageSnapshot: { exists: true },
        faceDetection: normalizeFaceDetectionJob(queueStore.jobs?.[pageId] || { status: "completed" }),
        pageId,
        groups: Array.isArray(localEntry.groups) ? localEntry.groups.map((entry) => normalizeFaceGroupEntry(entry)) : [],
      };
    }
  }
  if (!effective?.pageSnapshot?.exists) {
    sendJson(res, 404, { error: "This studio page does not exist." });
    return;
  }
  const faceDetection = effective.faceDetection || null;
  const groups = effective.groups.map((entry) => ({
    id: entry.id,
    count: Math.max(0, Number(entry.count) || 0),
    photoCount: Math.max(0, Number(entry.photoCount) || 0),
    previewDataUrl: String(entry.previewDataUrl || "").trim(),
  }));

  sendJson(res, 200, {
    publicPageId,
    status: String(faceDetection?.status || "idle").trim() || "idle",
    faceDetection,
    groups,
  });
}

async function handlePublicPageFaceMatches(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const publicPageId = String(requestUrl.searchParams.get("publicPageId") || "").trim();
  const faceId = String(requestUrl.searchParams.get("faceId") || "").trim();
  if (!publicPageId || !faceId) {
    sendJson(res, 400, { error: "Missing face filter parameters." });
    return;
  }

  const db = getFirestoreDb();
  let effective = null;
  if (db) {
    effective = await getEffectiveFaceGroupsForPublicPage(db, publicPageId);
  } else {
    const resultsStore = readFaceDetectionResultsStore();
    const localEntry = Object.values(resultsStore.pages || {}).find((entry) =>
      Array.isArray(entry?.publicPageIds) && entry.publicPageIds.includes(publicPageId)
    );
    if (localEntry) {
      effective = {
        groups: Array.isArray(localEntry.groups) ? localEntry.groups.map((entry) => normalizeFaceGroupEntry(entry)) : [],
      };
    }
  }
  if (!effective?.groups?.length) {
    sendJson(res, 200, { publicPageId, faceId, photoIds: [] });
    return;
  }
  const group = effective.groups.find((entry) => String(entry.id || "").trim() === faceId) || null;
  const photoIds = group?.photoIds || [];
  sendJson(res, 200, { publicPageId, faceId, photoIds });
}

async function handleMergePublicPageFaces(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const pageId = String(body?.pageId || "").trim();
    const requestedPublicPageIds = Array.isArray(body?.publicPageIds)
      ? body.publicPageIds.map((id) => String(id || "").trim()).filter(Boolean)
      : [];
    const faceIds = Array.from(
      new Set(
        (Array.isArray(body?.faceIds) ? body.faceIds : [])
          .map((faceId) => String(faceId || "").trim())
          .filter(Boolean)
      )
    );

    if (!pageId) {
      sendJson(res, 400, { error: "Missing page identifier." });
      return;
    }
    if (faceIds.length < 2) {
      sendJson(res, 400, { error: "Select at least two face groups to merge." });
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      sendJson(res, 503, { error: "Face detection backend is unavailable." });
      return;
    }

    const pageRef = db.collection(FIREBASE_COLLECTIONS.users).doc(account.localId).collection("pages").doc(pageId);
    const pageSnapshot = await pageRef.get();
    if (!pageSnapshot.exists) {
      sendJson(res, 404, { error: "Album not found." });
      return;
    }

    const siblingPublicPageSnapshots = await db.collection(FIREBASE_COLLECTIONS.publicPages).where("pageId", "==", pageId).get();
    const siblingPublicPages = siblingPublicPageSnapshots.docs.filter((docSnap) => {
      const data = docSnap.data() || {};
      const ownerUid = String(data.ownerUid || "").trim();
      return !ownerUid || ownerUid === account.localId;
    });
    if (!siblingPublicPages.length) {
      sendJson(res, 404, { error: "Public page not found." });
      return;
    }

    const preferredSource = siblingPublicPages.find((docSnap) => requestedPublicPageIds.includes(docSnap.id)) || siblingPublicPages[0];
    const sourcePublicPageRef = preferredSource.ref;
    const sourcePublicPageId = String(preferredSource.id || "").trim();
    const effective = await getEffectiveFaceGroupsForPublicPage(db, sourcePublicPageId);
    const existingGroups = (effective?.groups || []).filter((group) => faceIds.includes(String(group.id || "").trim()));

    if (existingGroups.length < 2) {
      sendJson(res, 400, { error: "No mergeable face groups were found." });
      return;
    }

    const mergedFaceId = `face_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const mergedPhotoIds = Array.from(
      new Set(
        existingGroups.flatMap((group) =>
          Array.isArray(group.photoIds) ? group.photoIds.map((photoId) => String(photoId || "").trim()).filter(Boolean) : []
        )
      )
    );
    const mergedCount = existingGroups.reduce((total, group) => total + Math.max(0, Number(group.count) || 0), 0);
    const previewDataUrl = String(existingGroups.find((group) => String(group.previewDataUrl || "").trim())?.previewDataUrl || "").trim();

    await withFaceMergeStoreMutation(async () => {
      const store = readFaceMergeOverridesStore();
      const pageOverrides = store.pages?.[pageId] && typeof store.pages[pageId] === "object" ? store.pages[pageId] : {};
      const groups = Array.isArray(pageOverrides.groups) ? pageOverrides.groups : [];
      const mergedFrom = existingGroups.map((group) => String(group.id || "").trim()).filter(Boolean);
      const mergedGroup = {
        id: mergedFaceId,
        sourceFaceIds: mergedFrom,
        mergedFrom,
        count: mergedCount,
        photoCount: mergedPhotoIds.length,
        photoIds: mergedPhotoIds,
        previewDataUrl,
        updatedAt: new Date().toISOString(),
      };
      const nextGroups = groups.filter((group) => {
        const groupId = String(group?.id || "").trim();
        if (!groupId) {
          return false;
        }
        if (groupId === mergedFaceId) {
          return false;
        }
        const sourceIds = Array.isArray(group?.sourceFaceIds)
          ? group.sourceFaceIds.map((id) => String(id || "").trim()).filter(Boolean)
          : [];
        if (sourceIds.some((id) => mergedFrom.includes(id))) {
          return false;
        }
        return true;
      });
      nextGroups.push(mergedGroup);
      store.pages = store.pages && typeof store.pages === "object" ? store.pages : {};
      store.pages[pageId] = {
        groups: nextGroups,
        updatedAt: new Date().toISOString(),
      };
      writeFaceMergeOverridesStore(store);
    });

    sendJson(res, 200, { ok: true, mergedPublicPages: siblingPublicPages.length });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not merge face groups." });
  }
}

async function handleFaceDetectionEnqueue(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }
  try {
    const body = await readRequestBody(req);
    const pageId = String(body?.pageId || "").trim();
    if (!pageId) {
      sendJson(res, 400, { error: "Missing page identifier." });
      return;
    }
    const db = getFirestoreDb();
    if (!db) {
      sendJson(res, 503, { error: "Firestore read backend unavailable." });
      return;
    }
    const pageRef = db.collection(FIREBASE_COLLECTIONS.users).doc(account.localId).collection("pages").doc(pageId);
    const pageSnapshot = await pageRef.get();
    if (!pageSnapshot.exists) {
      sendJson(res, 404, { error: "Album not found." });
      return;
    }
    const pageData = pageSnapshot.data() || {};
    const siblingPublicPageSnapshots = await db.collection(FIREBASE_COLLECTIONS.publicPages).where("pageId", "==", pageId).get();
    const publicPageIds = siblingPublicPageSnapshots.docs.map((docSnap) => docSnap.id);
    await withFaceQueueStoreMutation(async () => {
      const queueStore = readFaceDetectionQueueStore();
      const existing = normalizeFaceDetectionJob(queueStore.jobs?.[pageId] || {});
      if (existing.status === "queued" || existing.status === "processing") {
        throw new Error("Face detection is already in progress for this album.");
      }
      const nowIso = new Date().toISOString();
      queueStore.jobs[pageId] = normalizeFaceDetectionJob({
        pageId,
        ownerUid: account.localId,
        pageName: String(pageData.pageName || "").trim(),
        pageSlug: String(pageData.pageSlug || "").trim(),
        studioSlug: String(pageData.studioSlug || "").trim(),
        source: String(body?.source || "manual").trim() || "manual",
        status: "queued",
        queuedAt: nowIso,
        updatedAt: nowIso,
        completedAt: "",
        failedAt: "",
        processingStartedAt: "",
        runtimeError: "",
        progressPercent: 0,
        processedPhotoCount: 0,
        totalPhotoCount: 0,
        publicPageIds,
      });
      writeFaceDetectionQueueStore(queueStore);
      await withFaceResultsStoreMutation(async () => {
        const resultsStore = readFaceDetectionResultsStore();
        const current = resultsStore.pages?.[pageId] || {};
        resultsStore.pages[pageId] = {
          ...(current && typeof current === "object" ? current : {}),
          pageId,
          publicPageIds,
          updatedAt: nowIso,
        };
        writeFaceDetectionResultsStore(resultsStore);
      });
    });
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 400, { error: error?.message || "Could not queue face detection." });
  }
}

async function handleFaceDetectionStatuses(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pageIds = String(requestUrl.searchParams.get("pageIds") || "")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const only = new Set(pageIds);
  const queueStore = readFaceDetectionQueueStore();
  const jobs = Object.values(queueStore.jobs || {})
    .map((job) => normalizeFaceDetectionJob(job || {}))
    .filter((job) => job.ownerUid === account.localId && (!only.size || only.has(job.pageId)));

  const queued = jobs
    .filter((job) => job.status === "queued")
    .sort((left, right) => (Date.parse(left.queuedAt || "") || 0) - (Date.parse(right.queuedAt || "") || 0));
  const queuePositionByPageId = new Map();
  queued.forEach((job, index) => {
    queuePositionByPageId.set(job.pageId, index + 1);
  });

  const statuses = {};
  for (const pageId of only) {
    const job = jobs.find((entry) => entry.pageId === pageId) || normalizeFaceDetectionJob({ pageId, ownerUid: account.localId, status: "idle" });
    statuses[pageId] = {
      ...job,
      requestedAt: job.queuedAt || "",
      error: job.runtimeError || "",
      queuePosition: queuePositionByPageId.get(pageId) || 0,
    };
  }
  sendJson(res, 200, { statuses });
}

async function handleEventPhotoLike(req, res) {
  try {
    const body = await readRequestBody(req);
    const slug = String(body.slug || "").trim();
    const photoId = String(body.photoId || "").trim();
    const result = await adjustEventPhotoLike(slug, photoId, 1);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not save the photo like." });
  }
}

async function handleEventPhotoUnlike(req, res) {
  try {
    const body = await readRequestBody(req);
    const slug = String(body.slug || "").trim();
    const photoId = String(body.photoId || "").trim();
    const result = await adjustEventPhotoLike(slug, photoId, -1);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not update the photo like." });
  }
}

async function getPublicPageRecordForRequest(req, requestUrl, requestHost) {
  const route = parsePublicPageRequest(requestUrl.pathname, requestHost);
  if (!route?.publicPageId) {
    return null;
  }

  let pageRecord = await getPublicPageRecordById(route.publicPageId);
  if (pageRecord) {
    return pageRecord;
  }

  if (route.isCustomDomain && route.customDomain) {
    const customDomainRecord = await getCustomDomainRecord(route.customDomain);
    const studioSlug = String(customDomainRecord?.studioSlug || "").trim();
    if (studioSlug) {
      pageRecord = await getPublicPageRecordById(`${studioSlug}__${route.pageSlug}`);
      if (pageRecord) {
        return pageRecord;
      }
    }
  }

  return null;
}

function buildPageMetaTags(req, pageRecord) {
  const pageName = String(pageRecord?.pageName || "").trim();
  const studioName = String(pageRecord?.studioName || "").trim();
  const tagline = String(pageRecord?.tagline || "").trim();
  const pairingCode = String(pageRecord?.pairingCode || "").trim();
  const title = [tagline || pageName, studioName].filter(Boolean).join(" | ") || "CarnivalShowcase";
  const descriptionParts = [];
  if (tagline) {
    descriptionParts.push(tagline);
  } else if (pageName) {
    descriptionParts.push(pageName);
  }
  if (studioName) {
    descriptionParts.push(`Studio: ${studioName}`);
  }
  if (pairingCode) {
    descriptionParts.push(`Pairing code: ${pairingCode}`);
  }
  const description = descriptionParts.join(" · ") || "View this gallery on CarnivalShowcase.";
  const imageUrl = buildAbsoluteUrl(
    req,
    pageRecord?.coverImageUrl || pageRecord?.coverThumbnailUrl || ""
  );
  const pageUrl = buildAbsoluteUrl(req, req.url || "/");

  const metaTags = [
    ["description", description, "name"],
    ["og:type", "website", "property"],
    ["og:title", title, "property"],
    ["og:description", description, "property"],
    ["og:url", pageUrl, "property"],
    ["twitter:card", imageUrl ? "summary_large_image" : "summary", "name"],
    ["twitter:title", title, "name"],
    ["twitter:description", description, "name"],
  ];

  if (imageUrl) {
    metaTags.push(["og:image", imageUrl, "property"]);
    metaTags.push(["twitter:image", imageUrl, "name"]);
  }

  return {
    title,
    tags: metaTags
      .filter(([, content]) => String(content || "").trim())
      .map(([key, content, attribute]) => `    <meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`)
      .join("\n"),
  };
}

function injectPageMetadata(html, metadata) {
  if (!metadata?.title) {
    return html;
  }

  const titleTag = `<title>${escapeHtml(metadata.title)}</title>`;
  const withTitle = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  const metaBlock = `${metadata.tags}\n${titleTag}`;
  return withTitle.replace(titleTag, metaBlock);
}

function hasFirebaseWebConfigEnv() {
  return Boolean(
    FIREBASE_WEB_CONFIG.apiKey &&
      FIREBASE_WEB_CONFIG.authDomain &&
      FIREBASE_WEB_CONFIG.projectId &&
      FIREBASE_WEB_CONFIG.storageBucket &&
      FIREBASE_WEB_CONFIG.messagingSenderId &&
      FIREBASE_WEB_CONFIG.appId
  );
}

function sendFirebaseConfigScript(res) {
  if (hasFirebaseWebConfigEnv()) {
    const body = `window.CARNIVAL_FIREBASE = ${JSON.stringify({
      firebaseConfig: FIREBASE_WEB_CONFIG,
      collections: FIREBASE_COLLECTIONS,
    }, null, 2)};\n`;

    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.end(body);
    return;
  }

  if (fs.existsSync(FIREBASE_CONFIG_FILE)) {
    sendFile(res, FIREBASE_CONFIG_FILE);
    return;
  }

  const fallbackBody = "window.CARNIVAL_FIREBASE = {};\n";
  res.writeHead(200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Content-Length": Buffer.byteLength(fallbackBody),
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.end(fallbackBody);
}

async function proxyDriveImage(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const fileId = requestUrl.searchParams.get("id");
  const requestedMode = requestUrl.searchParams.get("mode");
  const mode =
    requestedMode === "thumb" || requestedMode === "screen" ? requestedMode : "full";
  const rangeHeader = req.headers.range;
  const allowMediaCache = !rangeHeader && (mode === "thumb" || mode === "screen");
  const mediaCacheKey = allowMediaCache ? buildMediaCacheKey(fileId, mode) : "";

  if (!API_KEY) {
    sendJson(res, 500, {
      error:
        "Missing GOOGLE_DRIVE_API_KEY environment variable. Add it before starting the server.",
    });
    return;
  }

  if (!fileId) {
    sendJson(res, 400, { error: "Missing image file id." });
    return;
  }

  try {
    if (mediaCacheKey) {
      const cachedEntry = getCachedMediaResponse(mediaCacheKey);
      if (cachedEntry) {
        sendCachedMediaResponse(res, cachedEntry);
        return;
      }
    }

    const publicCandidates =
      mode === "thumb"
        ? [
            `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w480`,
            `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w480`,
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(API_KEY)}`,
          ]
        : mode === "screen"
          ? [
              `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1920`,
              `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1920`,
              `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`,
              `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`,
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(API_KEY)}`,
            ]
        : [
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${encodeURIComponent(API_KEY)}`,
            `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`,
            `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w1600`,
            `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
          ];

    const candidates = [...publicCandidates];
    const ownerUid = findEventOwnerUidByDriveFileId(fileId);
    if (ownerUid) {
      try {
        const driveToken = await getDriveWriteAccessTokenForUser(ownerUid);
        candidates.unshift({
          url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          headers: {
            Authorization: `Bearer ${driveToken}`,
          },
        });
      } catch (error) {
        console.warn(`Falling back to public event media fetch for ${fileId}: ${error.message}`);
      }
    }

    const result = await fetchMediaCandidateWithCache(candidates, rangeHeader, mediaCacheKey);
    if (Buffer.isBuffer(result.body)) {
      res.writeHead(result.status, {
        "Content-Type": result.contentType,
        "Content-Length": String(result.body.length),
        "Cache-Control": result.cacheControl,
      });
      res.end(result.body);
      return;
    }

    if (!result.body) {
      throw new Error("Unable to stream media from Google Drive.");
    }

    const responseHeaders = {
      "Content-Type": result.contentType,
      "Cache-Control": result.cacheControl,
    };
    if (result.contentLength) {
      responseHeaders["Content-Length"] = result.contentLength;
    }
    if (result.contentRange) {
      responseHeaders["Content-Range"] = result.contentRange;
    }
    if (result.acceptRanges || result.contentRange || rangeHeader) {
      responseHeaders["Accept-Ranges"] = result.acceptRanges || "bytes";
    }

    res.writeHead(result.status, responseHeaders);
    for await (const chunk of result.body) {
      res.write(chunk);
    }
    res.end();
    return;
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "File not found." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType =
      {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
      }[extension] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.end(content);
  });
}

async function sendIndexWithPageMetadata(req, res, filePath, pageRecord) {
  try {
    const html = await fs.promises.readFile(filePath, "utf8");
    const metadata = buildPageMetaTags(req, pageRecord);
    const content = injectPageMetadata(html, metadata);
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    res.end(content);
  } catch (error) {
    sendJson(res, 500, { error: "Could not render page metadata." });
  }
}

function sanitizePathname(pathname) {
  const resolvedPath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!resolvedPath.startsWith(PUBLIC_DIR)) {
    return null;
  }
  return resolvedPath;
}

function resolveStaticPathname(pathname) {
  const pathSegments = pathname.split("/").filter(Boolean);
  const hasFileExtension = Boolean(path.extname(pathname));

  if (pathname.startsWith("/assets/")) {
    return pathname;
  }

  if (
    pathname === "/" ||
    pathname === "/direct" ||
    pathname === "/studio" ||
    pathname.startsWith("/studio/") ||
    pathname.startsWith("/event/") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/event-moderate/") ||
    pathname === "/folders" ||
    pathname === "/gallery" ||
    pathSegments.length === 2
  ) {
    return "/index.html";
  }

  if (pathname === "/privacy-policy") {
    return "/privacy-policy.html";
  }

  if (pathname === "/terms-of-service") {
    return "/terms-of-service.html";
  }

  if (pathname === "/remote") {
    return "/remote.html";
  }

  if (pathname === "/remote-tv") {
    return "/remote-tv.html";
  }

  if (pathSegments.length === 1 && !hasFileExtension) {
    return "/index.html";
  }

  return pathname;
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

async function driveListFiles(parentId, pageToken) {
  const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
  driveUrl.searchParams.set("key", API_KEY);
  driveUrl.searchParams.set(
    "q",
    `'${parentId}' in parents and trashed = false`
  );
  driveUrl.searchParams.set(
    "fields",
    "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, imageMediaMetadata)"
  );
  driveUrl.searchParams.set("pageSize", "1000");
  driveUrl.searchParams.set("orderBy", "folder,name_natural");
  driveUrl.searchParams.set("supportsAllDrives", "true");
  driveUrl.searchParams.set("includeItemsFromAllDrives", "true");
  if (pageToken) {
    driveUrl.searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(driveUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive API request failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function driveGetFile(fileId) {
  const driveUrl = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  driveUrl.searchParams.set("key", API_KEY);
  driveUrl.searchParams.set("fields", "id,name,mimeType");
  driveUrl.searchParams.set("supportsAllDrives", "true");

  const response = await fetch(driveUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive metadata request failed (${response.status}): ${text}`);
  }

  return response.json();
}

function formatDriveAccessError(error) {
  const message = String(error?.message || "");
  if (
    message.includes("Drive metadata request failed (404)") ||
    message.includes("Drive metadata request failed (403)") ||
    message.includes("File not found") ||
    message.includes("notFound") ||
    message.includes("insufficientFilePermissions") ||
    message.includes("The user does not have sufficient permissions")
  ) {
    return DRIVE_LINK_ACCESS_ERROR;
  }

  return message || "We couldn’t verify that Google Drive folder right now.";
}

function createImageUrl(fileId, mode = "full") {
  const url = new URL("/api/image", "http://localhost");
  url.searchParams.set("id", fileId);
  if (mode === "thumb" || mode === "screen") {
    url.searchParams.set("mode", "thumb");
    if (mode === "screen") {
      url.searchParams.set("mode", "screen");
    }
  }
  return `${url.pathname}${url.search}`;
}

function isSupportedMediaFile(file, includeVideos = false) {
  if (!file.mimeType) {
    return false;
  }

  const normalizedName = String(file.name || "").trim();
  if (
    !normalizedName ||
    normalizedName.startsWith("._") ||
    normalizedName === ".DS_Store"
  ) {
    return false;
  }

  if (file.mimeType.startsWith(IMAGE_MIME_PREFIX)) {
    return true;
  }

  return includeVideos && file.mimeType.startsWith(VIDEO_MIME_PREFIX);
}

async function readFolderTree(folderId, rootName = "Root Folder", includeVideos = false) {
  const queue = [{ id: folderId, node: null, path: "" }];
  const images = [];
  let root = null;

  while (queue.length > 0) {
    const current = queue.shift();
    const node = {
      id: current.id,
      name: current.node ? current.node.name : rootName,
      folders: [],
      images: [],
    };

    if (!root) {
      root = node;
    } else if (current.node) {
      current.node.target.folders.push(node);
    }

    let pageToken = undefined;
    do {
      const data = await driveListFiles(current.id, pageToken);
      const files = data.files || [];

      for (const file of files) {
        if (file.mimeType === FOLDER_MIME_TYPE) {
          queue.push({
            id: file.id,
            path: current.path ? `${current.path}/${file.name}` : file.name,
            node: {
              name: file.name,
              target: node,
            },
          });
          continue;
        }

        if (!isSupportedMediaFile(file, includeVideos)) {
          continue;
        }

        const image = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          path: current.path || "",
          width: Number(file.imageMediaMetadata?.width) || null,
          height: Number(file.imageMediaMetadata?.height) || null,
          url: createImageUrl(file.id, "full"),
          slideshowUrl: file.mimeType.startsWith(VIDEO_MIME_PREFIX)
            ? createImageUrl(file.id, "full")
            : createImageUrl(file.id, "screen"),
          thumbnailUrl: createImageUrl(file.id, "thumb"),
          webViewLink: file.webViewLink || "",
        };

        node.images.push(image);
        images.push(image);
      }

      pageToken = data.nextPageToken;
    } while (pageToken);
  }

  return {
    folderId,
    tree: root,
    images,
  };
}

function getFolderCacheKey(folderId, includeVideos) {
  return `${folderId}:${includeVideos ? "videos" : "images"}`;
}

function extractYoutubeVideoId(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }

  const normalizedRaw = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedRaw);
  } catch (_) {
    const inlineMatch = raw.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    return inlineMatch?.[1] ? String(inlineMatch[1]).trim() : "";
  }

  const host = normalizeHostname(parsedUrl.hostname);
  if (!host) {
    return "";
  }

  if (host === "youtu.be") {
    const candidate = String(parsedUrl.pathname || "").replace(/^\/+/, "").split("/")[0];
    return candidate || "";
  }

  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    if (parsedUrl.pathname === "/watch") {
      return String(parsedUrl.searchParams.get("v") || "").trim();
    }

    const shortMatch = parsedUrl.pathname.match(/^\/shorts\/([^/?#]+)/i);
    if (shortMatch?.[1]) {
      return String(shortMatch[1]).trim();
    }

    const embedMatch = parsedUrl.pathname.match(/^\/embed\/([^/?#]+)/i);
    if (embedMatch?.[1]) {
      return String(embedMatch[1]).trim();
    }
  }

  return "";
}

function isValidYoutubeVideoId(videoId) {
  return /^[A-Za-z0-9_-]{11}$/.test(String(videoId || "").trim());
}

async function fetchYoutubeMetadata(videoId) {
  const normalizedId = String(videoId || "").trim();
  if (!normalizedId) {
    return null;
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(normalizedId)}`;
  const providers = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent(canonicalUrl)}`,
  ];

  for (const endpoint of providers) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "CarnivalStories/1.0 (+https://carnivalshowcase.kaustubhmokashi.com)",
        },
      });
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const title = String(payload?.title || "").trim();
      const thumbnailUrl = String(payload?.thumbnail_url || "").trim();
      if (!title) {
        continue;
      }
      return { title, thumbnailUrl };
    } catch (_) {
      // Try next provider
    }
  }

  return null;
}

function buildYoutubeFallbackMetadata(videoId) {
  const normalizedId = String(videoId || "").trim();
  if (!normalizedId) {
    return null;
  }

  return {
    title: `YouTube Video (${normalizedId})`,
    thumbnailUrl: `https://img.youtube.com/vi/${encodeURIComponent(normalizedId)}/hqdefault.jpg`,
  };
}

async function fetchFolderResult(folderId, includeVideos = false) {
  const folderMeta = await driveGetFile(folderId);
  if (folderMeta.mimeType !== FOLDER_MIME_TYPE) {
    const error = new Error("The provided link does not point to a Google Drive folder.");
    error.statusCode = 400;
    throw error;
  }

  return readFolderTree(folderId, folderMeta.name || "Root Folder", includeVideos);
}

function scheduleFolderCacheRefresh(cacheKey, folderId, includeVideos) {
  const existingEntry = folderTreeCache.get(cacheKey) || {};
  if (existingEntry.refreshPromise) {
    return existingEntry.refreshPromise;
  }

  const refreshPromise = fetchFolderResult(folderId, includeVideos)
    .then((result) => {
      folderTreeCache.set(cacheKey, {
        result,
        fetchedAt: Date.now(),
        refreshPromise: null,
      });
      return result;
    })
    .catch((error) => {
      const currentEntry = folderTreeCache.get(cacheKey);
      if (currentEntry) {
        currentEntry.refreshPromise = null;
        folderTreeCache.set(cacheKey, currentEntry);
      }
      throw error;
    });

  folderTreeCache.set(cacheKey, {
    ...existingEntry,
    refreshPromise,
  });

  return refreshPromise;
}

async function getFolderResultWithCache(folderId, includeVideos = false) {
  const cacheKey = getFolderCacheKey(folderId, includeVideos);
  const cacheEntry = folderTreeCache.get(cacheKey);
  const now = Date.now();

  if (cacheEntry?.result && cacheEntry?.fetchedAt) {
    const age = now - cacheEntry.fetchedAt;
    if (age <= FOLDER_CACHE_FRESH_MS) {
      return { result: cacheEntry.result, cacheStatus: "fresh" };
    }

    if (age <= FOLDER_CACHE_STALE_MS) {
      scheduleFolderCacheRefresh(cacheKey, folderId, includeVideos).catch(() => {});
      return { result: cacheEntry.result, cacheStatus: "stale" };
    }
  }

  const result = await scheduleFolderCacheRefresh(cacheKey, folderId, includeVideos);
  return { result, cacheStatus: "miss" };
}

async function handleApiFolder(req, res) {
  if (!API_KEY) {
    sendJson(res, 500, {
      error:
        "Missing GOOGLE_DRIVE_API_KEY environment variable. Add it before starting the server.",
    });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const input = requestUrl.searchParams.get("url") || "";
  const includeVideos = requestUrl.searchParams.get("includeVideos") === "1";
  const folderId = extractFolderId(input);

  if (!folderId) {
    sendJson(res, 400, {
      error:
        "Could not extract a Google Drive folder ID from the provided input.",
    });
    return;
  }

  try {
    const { result, cacheStatus } = await getFolderResultWithCache(folderId, includeVideos);
    sendJson(res, 200, {
      ...result,
      cacheStatus,
    });
  } catch (error) {
    if (error?.statusCode === 400) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    sendJson(res, 500, {
      error: formatDriveAccessError(error),
    });
  }
}

async function handleApiFolderMeta(req, res) {
  if (!API_KEY) {
    sendJson(res, 500, {
      error:
        "Missing GOOGLE_DRIVE_API_KEY environment variable. Add it before starting the server.",
    });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const input = requestUrl.searchParams.get("url") || "";
  const folderId = extractFolderId(input);

  if (!folderId) {
    sendJson(res, 400, {
      error:
        "Could not extract a Google Drive folder ID from the provided input.",
    });
    return;
  }

  try {
    const folderMeta = await driveGetFile(folderId);
    if (folderMeta.mimeType !== FOLDER_MIME_TYPE) {
      sendJson(res, 400, { error: "The provided link does not point to a Google Drive folder." });
      return;
    }

    sendJson(res, 200, {
      id: folderMeta.id,
      name: folderMeta.name,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: formatDriveAccessError(error),
    });
  }
}

async function handleYoutubeValidate(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const rawUrl = String(requestUrl.searchParams.get("url") || "").trim();
  const videoId = extractYoutubeVideoId(rawUrl);

  if (!videoId || !isValidYoutubeVideoId(videoId)) {
    sendJson(res, 400, {
      error: "Please enter a valid YouTube link.",
    });
    return;
  }

  const metadata = (await fetchYoutubeMetadata(videoId)) || buildYoutubeFallbackMetadata(videoId) || {
    title: `YouTube Video (${videoId})`,
    thumbnailUrl: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`,
  };

  sendJson(res, 200, {
    videoId,
    title: metadata.title,
    thumbnailUrl: metadata.thumbnailUrl,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  });
}

async function handleSaveRemoteLink(req, res) {
  try {
    const body = await readRequestBody(req);
    const url = normalizeRemoteUrl(body.url);
    const permanent = body.permanent === true;

    if (!url) {
      sendJson(res, 400, { error: "A Google Drive URL is required." });
      return;
    }

    if (!API_KEY) {
      sendJson(res, 500, {
        error:
          "Missing GOOGLE_DRIVE_API_KEY environment variable. Add it before starting the server.",
      });
      return;
    }

    const folderId = extractFolderId(url);
    if (!folderId) {
      sendJson(res, 400, {
        error: "Please paste a valid Google Drive folder link.",
      });
      return;
    }

    let folderMeta;
    try {
      folderMeta = await driveGetFile(folderId);
      if (folderMeta.mimeType !== FOLDER_MIME_TYPE) {
        sendJson(res, 400, { error: "The provided link does not point to a Google Drive folder." });
        return;
      }
    } catch (error) {
      sendJson(res, 400, { error: formatDriveAccessError(error) });
      return;
    }

    const result = await writeRemoteLinkToStore(url, permanent);
    sendJson(res, 200, {
      ...result,
      folderName: folderMeta?.name || "Google Drive folder",
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid request body." });
  }
}

async function handleResolveRemoteCode(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const code = String(requestUrl.searchParams.get("code") || "").trim();

  if (!/^\d{6}$|^\d{7}$|^\d{9}$/.test(code)) {
    sendJson(res, 400, { error: "Code must be a 6, 7, or 9 digit number." });
    return;
  }

  const event = findEventByCode(code);
  if (event?.displayUrl) {
    sendJson(res, 200, {
      code,
      url: String(event.displayUrl || "").trim(),
      ready: true,
      permanent: true,
      source: "event",
    });
    return;
  }

  const entry = await resolveRemoteLinkFromStore(code);
  if (entry) {
    sendJson(res, 200, {
      code: entry.code,
      url: entry.url || "",
      ready: Boolean(entry.url),
      permanent: Boolean(entry.permanent),
      source: "remote",
    });
    return;
  }

  const pairingRecord = await getPairingCodeRecordById(code);
  if (pairingRecord?.url) {
    sendJson(res, 200, {
      code,
      url: String(pairingRecord.url || "").trim(),
      ready: true,
      permanent: true,
      source: "firestore",
    });
    return;
  }

  sendJson(res, 404, { error: "Code not found or it has expired. Generate a new code." });
}

async function handleResolvePairingCode(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const code = String(requestUrl.searchParams.get("code") || "").trim();

  if (!/^\d{6}$|^\d{7}$|^\d{9}$/.test(code)) {
    sendJson(res, 400, { error: "Code must be a 6, 7, or 9 digit number." });
    return;
  }

  const event = findEventByCode(code);
  if (event?.displayUrl) {
    sendJson(res, 200, {
      code,
      mode: "event-presentation",
      url: String(event.displayUrl || "").trim(),
      ready: true,
      permanent: true,
      source: "event",
      folderName: String(event.name || "Event"),
      eventSlug: String(event.slug || "").trim(),
      eventName: String(event.name || "Event"),
      eventPhotos: Array.isArray(event.livePhotos) ? event.livePhotos.map(sanitizeEventPhoto) : [],
    });
    return;
  }

  const pairingRecord = await getPairingCodeRecordById(code);
  if (pairingRecord) {
    const publicPageId =
      String(pairingRecord.publicPageId || "").trim() ||
      (pairingRecord.studioSlug && pairingRecord.pageSlug
        ? `${String(pairingRecord.studioSlug).trim()}__${String(pairingRecord.pageSlug).trim()}`
        : "");
    const pageRecord = publicPageId ? await getPublicPageRecordById(publicPageId) : null;
    const snapshot = pageRecord ? await getAlbumSnapshotForPublicPage(publicPageId, pageRecord) : null;
    const folderUrl =
      String(pageRecord?.driveLink || "").trim() ||
      String(pairingRecord.url || "").trim() ||
      String(pairingRecord.normalizedUrl || "").trim();
    const publicPageUrl = buildPublicPageUrl(req, pageRecord, publicPageId);

    if (snapshot?.folders?.length) {
      sendJson(res, 200, {
        code,
        mode: "snapshot",
        ready: true,
        permanent: true,
        source: "firestore",
        publicPageUrl,
        folderName: String(pairingRecord.folderName || pageRecord?.pageName || "Google Drive folder"),
        folderUrl,
        pageBackgroundColor: String(pageRecord?.branding?.backgroundColor || "").trim(),
        snapshot,
      });
      return;
    }

    if (folderUrl) {
      sendJson(res, 200, {
        code,
        mode: "folder",
        url: publicPageUrl || folderUrl,
        publicPageUrl,
        ready: true,
        permanent: true,
        source: publicPageUrl ? "firestore-public-page" : "firestore",
        folderName: String(pairingRecord.folderName || pageRecord?.pageName || "Google Drive folder"),
      });
      return;
    }
  }

  const remoteEntry = await resolveRemoteLinkFromStore(code);
  if (remoteEntry?.url) {
    sendJson(res, 200, {
      code: remoteEntry.code,
      mode: "folder",
      url: remoteEntry.url,
      ready: true,
      permanent: Boolean(remoteEntry.permanent),
      folderName: remoteEntry.folderName || "Google Drive folder",
      source: "remote",
    });
    return;
  }

  sendJson(res, 404, { error: "Code not found or it has expired. Generate a new code." });
}

async function handleDeleteRemoteCode(req, res) {
  try {
    const body = await readRequestBody(req);
    const code = String(body.code || "").trim();
    const url = normalizeRemoteUrl(body.url);

    if (!/^\d{6}$|^\d{7}$/.test(code)) {
      sendJson(res, 400, { error: "Please enter the full code." });
      return;
    }

    if (!url) {
      sendJson(res, 400, { error: "Please paste the original Google Drive folder link." });
      return;
    }

    const result = await deleteRemoteCode(code, url);
    if (!result.deleted) {
      sendJson(res, 404, {
        error: "We couldn’t match that code with the Google Drive link provided.",
      });
      return;
    }

    sendJson(res, 200, {
      success: true,
      message: "Code deleted.",
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Invalid request body." });
  }
}

async function handlePublicPageLike(req, res) {
  try {
    const body = await readRequestBody(req);
    const publicPageId = String(body.publicPageId || "").trim();
    const photoId = String(body.photoId || "").trim();

    if (!publicPageId || !photoId) {
      sendJson(res, 400, { error: "Missing photo like identifiers." });
      return;
    }

    const result = await incrementPublicPagePhotoLike(publicPageId, photoId);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not save the photo like." });
  }
}

async function handlePublicPageUnlike(req, res) {
  try {
    const body = await readRequestBody(req);
    const publicPageId = String(body.publicPageId || "").trim();
    const photoId = String(body.photoId || "").trim();

    if (!publicPageId || !photoId) {
      sendJson(res, 400, { error: "Missing photo like identifiers." });
      return;
    }

    const result = await decrementPublicPagePhotoLike(publicPageId, photoId);
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not remove the photo like." });
  }
}

async function handleAdminLinks(req, res) {
  const admin = await requireAdminRequest(req, res);
  if (!admin) {
    return;
  }

  try {
    const links = await listRemoteLinksForAdmin();
    sendJson(res, 200, { links });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Could not load links." });
  }
}

async function handleAdminDeleteLink(req, res) {
  const admin = await requireAdminRequest(req, res);
  if (!admin) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const kind = String(body.kind || "").trim();

    if (kind === "temporary") {
      const code = String(body.code || "").trim();
      const url = normalizeRemoteUrl(body.url);
      if (!code || !url) {
        sendJson(res, 400, { error: "Temporary links need both code and Drive link." });
        return;
      }

      const result = await deleteRemoteCode(code, url);
      if (!result.deleted) {
        sendJson(res, 404, { error: "We couldn’t find that temporary link anymore." });
        return;
      }

      sendJson(res, 200, { success: true });
      return;
    }

    if (kind === "permanent") {
      const result = await deletePermanentLinkByAdmin(body);
      sendJson(res, 200, { success: true, ...result });
      return;
    }

    sendJson(res, 400, { error: "Unknown link type." });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not delete link." });
  }
}

async function handleAdminListEvents(req, res) {
  const admin = await requireAdminRequest(req, res);
  if (!admin) {
    return;
  }

  try {
    const events = readAllEvents().map((event) => {
      const queued = Array.isArray(event.queuedPhotos) ? event.queuedPhotos.length : 0;
      const live = Array.isArray(event.livePhotos) ? event.livePhotos.length : 0;
      const rejected = Array.isArray(event.rejectedPhotos) ? event.rejectedPhotos.length : 0;
      return {
        id: String(event.id || "").trim(),
        ownerUid: String(event.ownerUid || "").trim(),
        name: String(event.name || "").trim(),
        phase: String(event.phase || "upcoming").trim(),
        createdAt: String(event.createdAt || "").trim(),
        startAt: String(event.startAt || "").trim(),
        endAt: String(event.endAt || "").trim(),
        uploadedPhotoCount: queued + live + rejected,
      };
    });
    sendJson(res, 200, { events });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Could not load events." });
  }
}

async function handleAdminDeleteEvent(req, res) {
  const admin = await requireAdminRequest(req, res);
  if (!admin) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const eventId = String(body.id || "").trim();
    if (!eventId) {
      sendJson(res, 400, { error: "Event id is required." });
      return;
    }
    await withEventsStoreMutation(async () => {
      const store = readEventsStore();
      const nextEvents = store.events.filter((event) => String(event?.id || "").trim() !== eventId);
      if (nextEvents.length === store.events.length) {
        throw new Error("Event not found.");
      }
      writeEventsStore({ events: nextEvents });
    });
    sendJson(res, 200, { success: true });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not delete event." });
  }
}

async function handlePairingOrigin(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const hostHeader = req.headers.host || "";
  const protocol = requestUrl.protocol;
  const hostName = hostHeader.split(":")[0];
  const port = hostHeader.includes(":") ? hostHeader.split(":")[1] : String(PORT);

  let origin = `${protocol}//${hostHeader}`;
  if (
    !hostName ||
    hostName === "localhost" ||
    hostName === "127.0.0.1" ||
    hostName === "0.0.0.0" ||
    hostName === "10.0.2.2"
  ) {
    const lanIp = getPreferredLanIp();
    if (lanIp) {
      origin = `${protocol}//${lanIp}:${port}`;
    }
  }

  sendJson(res, 200, { origin });
}

async function handleDomainVerification(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const domain = normalizeHostname(requestUrl.searchParams.get("domain") || "");
  const expectedTarget = getExpectedCustomDomainTarget(req);

  if (!domain) {
    sendJson(res, 200, {
      ok: false,
      domain: "",
      host: "album",
      expectedTarget,
      message: "Enter your album domain to verify its DNS settings.",
    });
    return;
  }

  if (!expectedTarget || expectedTarget === "localhost" || expectedTarget === "127.0.0.1") {
    sendJson(res, 200, {
      ok: false,
      domain,
      host: getDomainHostLabel(domain),
      expectedTarget,
      message: "DNS verification is only available on your deployed environment.",
    });
    return;
  }

  try {
    const cnameRecords = await dns.resolveCname(domain);
    const normalizedRecords = cnameRecords.map((record) => normalizeHostname(record));
    const isMatch = normalizedRecords.includes(expectedTarget);

    sendJson(res, 200, {
      ok: isMatch,
      domain,
      host: getDomainHostLabel(domain),
      expectedTarget,
      records: normalizedRecords,
      message: isMatch
        ? "DNS verified."
        : `We found ${normalizedRecords.join(", ") || "no CNAME record"}, but this domain must point to ${expectedTarget}.`,
    });
  } catch (error) {
    sendJson(res, 200, {
      ok: false,
      domain,
      host: getDomainHostLabel(domain),
      expectedTarget,
      message: `We couldn't find a valid CNAME for ${domain} yet. Point it to ${expectedTarget} and try again.`,
    });
  }
}

async function handleDomainAllowance(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const domain = normalizeHostname(requestUrl.searchParams.get("domain") || "");
  const expectedTarget = getExpectedCustomDomainTarget(req);

  if (!domain) {
    sendJson(res, 400, { ok: false, error: "Missing domain query parameter." });
    return;
  }

  if (
    domain === "localhost" ||
    domain === "127.0.0.1" ||
    domain === "0.0.0.0" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)
  ) {
    sendJson(res, 403, { ok: false, error: "Local or IP-based hosts are not eligible." });
    return;
  }

  if (expectedTarget && domain === expectedTarget) {
    sendJson(res, 200, { ok: true, domain, source: "platform-host" });
    return;
  }

  try {
    const record = await getCustomDomainRecord(domain);
    if (!record) {
      sendJson(res, 403, { ok: false, error: "Domain is not connected to any studio." });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      domain,
      source: "custom-domain",
      studioSlug: record.studioSlug || "",
      uid: record.uid || "",
    });
  } catch (error) {
    sendJson(res, 503, { ok: false, error: error.message || "Domain lookup failed." });
  }
}

function buildOriginFromRequest(req) {
  const host = req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim() || "https";
  return `${proto}://${host}`;
}

function extractOriginFromHomepageLink(homepageLink) {
  const raw = String(homepageLink || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname) return "";
    return `https://${parsed.hostname}`;
  } catch (_) {
    return "";
  }
}

async function resolveStudioCustomDomainOrigin(studioSlug) {
  const slug = String(studioSlug || "").trim().toLowerCase();
  const db = getFirestoreDb();
  if (!slug || !db) return "";
  try {
    const snapshot = await db
      .collection(FIREBASE_COLLECTIONS.customDomains)
      .where("studioSlug", "==", slug)
      .limit(1)
      .get();
    if (snapshot.empty) return "";
    const domain = normalizeHostname(snapshot.docs[0]?.id || "");
    if (!domain) return "";
    return `https://${domain}`;
  } catch (_) {
    return "";
  }
}

async function resolveEventOrigin(req, { homepageLink = "", studioSlug = "", customDomain = "" } = {}) {
  const normalizedCustomDomain = normalizeHostname(customDomain);
  if (normalizedCustomDomain) {
    return `https://${normalizedCustomDomain}`;
  }

  const fromCustomDomain = await resolveStudioCustomDomainOrigin(studioSlug);
  if (fromCustomDomain) return fromCustomDomain;

  const fromHomepage = extractOriginFromHomepageLink(homepageLink);
  if (fromHomepage) return fromHomepage;

  return buildOriginFromRequest(req);
}

function buildPublicPageUrl(req, pageRecord = {}, publicPageId = "") {
  const pageSlug = String(pageRecord?.pageSlug || "").trim();
  if (!pageSlug) {
    return "";
  }

  const customDomain = normalizeHostname(pageRecord?.customDomain || "");
  if (customDomain) {
    return `https://${customDomain}/${encodeURIComponent(pageSlug)}`;
  }

  const studioSlug =
    String(pageRecord?.studioSlug || "").trim() ||
    String(publicPageId || "")
      .split("__")[0]
      .trim();
  if (studioSlug) {
    return `${buildOriginFromRequest(req)}/${encodeURIComponent(studioSlug)}/${encodeURIComponent(pageSlug)}`;
  }

  return "";
}

function combineEventDateTime(dateValue, timeValue) {
  const date = String(dateValue || "").trim();
  const time = String(timeValue || "").trim();
  if (!date) {
    return "";
  }
  const normalizedTime = time || "00:00";
  return new Date(`${date}T${normalizedTime}:00`).toISOString();
}

function buildEventPhotoRecord(event, driveFile, uploadedAt = new Date().toISOString()) {
  const driveFileId = String(driveFile?.id || "").trim();
  return {
    id: createOpaqueToken(10),
    driveFileId,
    name: String(driveFile?.name || "").trim() || "Event photo",
    mimeType: String(driveFile?.mimeType || IMAGE_MIME_PREFIX).trim() || IMAGE_MIME_PREFIX,
    uploadedAt,
    thumbnailUrl: createImageUrl(driveFileId, "thumb"),
    slideshowUrl: createImageUrl(driveFileId, "screen"),
    fullUrl: createImageUrl(driveFileId, "full"),
    webViewLink: String(driveFile?.webViewLink || "").trim(),
    likeCount: 0,
    eventId: event.id,
  };
}

function sanitizeEventPhoto(photo) {
  return {
    id: photo.id,
    driveFileId: photo.driveFileId,
    name: photo.name,
    mimeType: photo.mimeType,
    uploadedAt: photo.uploadedAt,
    thumbnailUrl: photo.thumbnailUrl,
    slideshowUrl: photo.slideshowUrl,
    fullUrl: photo.fullUrl,
    likeCount: Math.max(0, Number(photo.likeCount) || 0),
    webViewLink: photo.webViewLink || "",
  };
}

function findEventPhoto(event, photoId) {
  const normalizedPhotoId = String(photoId || "").trim();
  if (!event || !normalizedPhotoId) {
    return null;
  }

  return (
    event.livePhotos?.find((photo) => photo.id === normalizedPhotoId) ||
    event.queuedPhotos?.find((photo) => photo.id === normalizedPhotoId) ||
    event.rejectedPhotos?.find((photo) => photo.id === normalizedPhotoId) ||
    null
  );
}

async function adjustEventPhotoLike(slug, photoId, delta) {
  const normalizedSlug = String(slug || "").trim();
  const normalizedPhotoId = String(photoId || "").trim();
  if (!normalizedSlug || !normalizedPhotoId) {
    throw new Error("Missing event photo like identifiers.");
  }

  const store = readEventsStore();
  const event = store.events.find((entry) => entry.slug === normalizedSlug);
  if (!event) {
    throw new Error("Event not found.");
  }

  const photo = findEventPhoto(event, normalizedPhotoId);
  if (!photo) {
    throw new Error("Photo not found.");
  }

  const currentCount = Math.max(0, Number(photo.likeCount) || 0);
  photo.likeCount = Math.max(0, currentCount + delta);
  writeEventsStore(store);

  return {
    slug: normalizedSlug,
    photoId: normalizedPhotoId,
    count: photo.likeCount,
  };
}

async function handleCreateEvent(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const name = String(body.name || "").trim();
    const studioName = String(body.studioName || "").trim();
    const studioSlug = String(body.studioSlug || "").trim();
    const logoLink = String(body.logoLink || "").trim();
    const faviconLink = String(body.faviconLink || "").trim();
    const homepageLink = String(body.homepageLink || "").trim();
    const qrPngDataUrl = String(body.qrPngDataUrl || "").trim();
    const tagline = String(body.tagline || "").trim();
    const startAt = combineEventDateTime(body.startDate, body.startTime);
    const endAt = combineEventDateTime(body.endDate, body.endTime);

    if (!name) {
      sendJson(res, 400, { error: "Event name is required." });
      return;
    }

    const parentFolderName = `CarnivalStories_${name}`;
    const queueFolderName = "Queue";
    const liveFolderName = "Live";
    const driveAccessToken = await getDriveWriteAccessTokenForUser(account.localId);
    const parentFolder = await driveCreateSubfolder("root", parentFolderName, driveAccessToken);
    const queueFolder = await driveCreateSubfolder(parentFolder.id, queueFolderName, driveAccessToken);
    const liveFolder = await driveCreateSubfolder(parentFolder.id, liveFolderName, driveAccessToken);

    const event = normalizeEventVisibility({
      id: createOpaqueToken(10),
      slug: createEventPublicSlug(name),
      code: createEventCode(),
      moderationToken: createOpaqueToken(16),
      ownerUid: account.localId,
      ownerEmail: account.email || "",
      studioName,
      studioSlug,
      customDomain: String(body.customDomain || "").trim(),
      logoLink,
      faviconLink,
      homepageLink,
      qrPngDataUrl,
      name,
      tagline,
      startAt,
      endAt,
      createdAt: new Date().toISOString(),
      parentFolderId: parentFolder.id,
      parentFolderUrl: String(parentFolder.webViewLink || "").trim(),
      queueFolderId: queueFolder.id,
      queueFolderUrl: String(queueFolder.webViewLink || "").trim(),
      liveFolderId: liveFolder.id,
      liveFolderUrl: String(liveFolder.webViewLink || "").trim(),
      backgroundDriveFileId: "",
      backgroundUrl: "",
      template: "template-1",
      queuedPhotos: [],
      livePhotos: [],
      rejectedPhotos: [],
    });

    const origin = await resolveEventOrigin(req, {
      homepageLink,
      studioSlug,
      customDomain: String(body.customDomain || "").trim(),
    });
    event.uploadUrl = `${origin}/e/${event.slug}`;
    event.displayUrl = `${origin}/event/${event.slug}/present`;
    event.moderationUrl = `${origin}/event-moderate/${event.moderationToken}`;

    const store = readEventsStore();
    store.events.unshift(event);
    writeEventsStore(store);

    sendJson(res, 200, { event: sanitizeEventForClient(event) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not create event." });
  }
}

async function handleGetModerationEvent(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const token = String(requestUrl.searchParams.get("token") || "").trim();
  const event = findEventByModerationToken(token);

  if (!event) {
    sendJson(res, 404, { error: "Event not found." });
    return;
  }

  sendJson(res, 200, {
    event: {
      ...sanitizeEventForClient(event),
      queuedPhotos: event.queuedPhotos.map(sanitizeEventPhoto),
      livePhotos: event.livePhotos.map(sanitizeEventPhoto),
    },
  });
}

async function handleListEvents(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  const events = readAllEvents()
    .filter((event) => event.ownerUid === account.localId)
    .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));

  sendJson(res, 200, { events: events.map(sanitizeEventForClient) });
}

async function handleGetManagedEvent(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const eventId = String(requestUrl.searchParams.get("id") || "").trim();
  const event = findEventById(eventId);

  if (!event || event.ownerUid !== account.localId) {
    sendJson(res, 404, { error: "Event not found." });
    return;
  }

  sendJson(res, 200, {
    event: {
      ...sanitizeEventForClient(event),
      queuedPhotos: event.queuedPhotos.map(sanitizeEventPhoto),
      livePhotos: event.livePhotos.map(sanitizeEventPhoto),
    },
  });
}

async function handleGetPublicEvent(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const slug = String(requestUrl.searchParams.get("slug") || "").trim();
  const event = findEventByPublicToken(slug);

  if (!event) {
    sendJson(res, 404, { error: "Event not found." });
    return;
  }

  sendJson(res, 200, {
    event: {
      ...sanitizeEventForClient(event),
      livePhotos: event.livePhotos.map(sanitizeEventPhoto),
    },
  });
}

async function handleGenerateQr(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const text = String(requestUrl.searchParams.get("text") || "").trim();
  if (!text) {
    sendJson(res, 400, { error: "QR text is required." });
    return;
  }

  try {
    const pngBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: "M",
      type: "png",
      width: 512,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#0000",
      },
    });
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": String(pngBuffer.length),
      "Cache-Control": "no-store",
    });
    res.end(pngBuffer);
  } catch (error) {
    sendJson(res, 500, { error: "Could not generate QR code." });
  }
}

async function handleUpdateEvent(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const eventId = String(body.id || "").trim();
    const store = readEventsStore();
    const event = store.events.find((entry) => entry.id === eventId && entry.ownerUid === account.localId);
    if (!event) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    event.name = String(body.name || event.name || "").trim() || event.name;
    event.tagline = String(body.tagline || "").trim();
    event.logoLink = String(body.logoLink || event.logoLink || "").trim();
    event.faviconLink = String(body.faviconLink || event.faviconLink || "").trim();
    event.homepageLink = String(body.homepageLink || event.homepageLink || "").trim();
    event.customDomain = String(body.customDomain || event.customDomain || "").trim();
    event.qrPngDataUrl = String(body.qrPngDataUrl || event.qrPngDataUrl || "").trim();
    event.startAt = combineEventDateTime(body.startDate, body.startTime) || event.startAt;
    event.endAt = combineEventDateTime(body.endDate, body.endTime) || event.endAt;
    event.template = String(body.template || event.template || "template-1").trim() || "template-1";
    const origin = await resolveEventOrigin(req, {
      homepageLink: event.homepageLink,
      studioSlug: event.studioSlug,
      customDomain: event.customDomain,
    });
    event.uploadUrl = `${origin}/e/${event.slug}`;
    event.displayUrl = `${origin}/event/${event.slug}/present`;
    event.moderationUrl = `${origin}/event-moderate/${event.moderationToken}`;
    writeEventsStore(store);

    sendJson(res, 200, { event: sanitizeEventForClient(normalizeEventVisibility(event)) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not update event." });
  }
}

async function handleDeleteEvent(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const eventId = String(body.id || "").trim();
    const store = readEventsStore();
    const nextEvents = store.events.filter((event) => !(event.id === eventId && event.ownerUid === account.localId));
    if (nextEvents.length === store.events.length) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }
    writeEventsStore({ events: nextEvents });
    sendJson(res, 200, { success: true });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not delete event." });
  }
}

async function handleModerateEventPhoto(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const body = await readRequestBody(req);
    const eventId = String(body.eventId || "").trim();
    const photoId = String(body.photoId || "").trim();
    const action = String(body.action || "").trim();
    const store = readEventsStore();
    const event = store.events.find((entry) => entry.id === eventId && entry.ownerUid === account.localId);

    if (!event) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    const queueIndex = event.queuedPhotos.findIndex((photo) => photo.id === photoId);
    const liveIndex = event.livePhotos.findIndex((photo) => photo.id === photoId);
    const driveAccessToken = await getDriveWriteAccessTokenForUser(event.ownerUid);

    if (action === "approve") {
      if (queueIndex < 0) {
        sendJson(res, 404, { error: "Queued photo not found." });
        return;
      }
      const [photo] = event.queuedPhotos.splice(queueIndex, 1);
      await driveMoveFileToFolder(photo.driveFileId, event.queueFolderId, event.liveFolderId, driveAccessToken);
      event.livePhotos.unshift(photo);
    } else if (action === "approve-live") {
      if (liveIndex < 0) {
        sendJson(res, 404, { error: "Live photo not found." });
        return;
      }
    } else if (action === "reject") {
      if (queueIndex < 0) {
        sendJson(res, 404, { error: "Queued photo not found." });
        return;
      }
      const [photo] = event.queuedPhotos.splice(queueIndex, 1);
      event.rejectedPhotos.unshift(photo);
    } else if (action === "remove-live") {
      if (liveIndex < 0) {
        sendJson(res, 404, { error: "Live photo not found." });
        return;
      }
      const [photo] = event.livePhotos.splice(liveIndex, 1);
      await driveMoveFileToFolder(photo.driveFileId, event.liveFolderId, event.queueFolderId, driveAccessToken);
      event.queuedPhotos.unshift(photo);
    } else {
      sendJson(res, 400, { error: "Unknown moderation action." });
      return;
    }

    writeEventsStore(store);
    sendJson(res, 200, {
      event: {
        ...sanitizeEventForClient(normalizeEventVisibility(event)),
        queuedPhotos: event.queuedPhotos.map(sanitizeEventPhoto),
        livePhotos: event.livePhotos.map(sanitizeEventPhoto),
      },
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not update event photos." });
  }
}

async function handleModerateEventPhotoByToken(req, res) {
  try {
    const body = await readRequestBody(req);
    const token = String(body.token || "").trim();
    const photoId = String(body.photoId || "").trim();
    const action = String(body.action || "").trim();
    const store = readEventsStore();
    const event = store.events.find((entry) => entry.moderationToken === token);

    if (!event) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    const queueIndex = event.queuedPhotos.findIndex((photo) => photo.id === photoId);
    const liveIndex = event.livePhotos.findIndex((photo) => photo.id === photoId);
    const driveAccessToken = await getDriveWriteAccessTokenForUser(event.ownerUid);

    if (action === "approve") {
      if (queueIndex < 0) {
        sendJson(res, 404, { error: "Queued photo not found." });
        return;
      }
      const [photo] = event.queuedPhotos.splice(queueIndex, 1);
      await driveMoveFileToFolder(photo.driveFileId, event.queueFolderId, event.liveFolderId, driveAccessToken);
      event.livePhotos.unshift(photo);
    } else if (action === "approve-live") {
      if (liveIndex < 0) {
        sendJson(res, 404, { error: "Live photo not found." });
        return;
      }
    } else if (action === "reject") {
      if (queueIndex < 0) {
        sendJson(res, 404, { error: "Queued photo not found." });
        return;
      }
      const [photo] = event.queuedPhotos.splice(queueIndex, 1);
      event.rejectedPhotos.unshift(photo);
    } else if (action === "remove-live") {
      if (liveIndex < 0) {
        sendJson(res, 404, { error: "Live photo not found." });
        return;
      }
      const [photo] = event.livePhotos.splice(liveIndex, 1);
      await driveMoveFileToFolder(photo.driveFileId, event.liveFolderId, event.queueFolderId, driveAccessToken);
      event.queuedPhotos.unshift(photo);
    } else {
      sendJson(res, 400, { error: "Unknown moderation action." });
      return;
    }

    writeEventsStore(store);
    sendJson(res, 200, {
      event: {
        ...sanitizeEventForClient(normalizeEventVisibility(event)),
        queuedPhotos: event.queuedPhotos.map(sanitizeEventPhoto),
        livePhotos: event.livePhotos.map(sanitizeEventPhoto),
      },
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not update event photos." });
  }
}

async function handleEventUpload(req, res) {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const contentType = req.headers["content-type"] || "";
    const rawBody = await readRawRequestBuffer(req);
    const { fields, files } = parseMultipartForm(rawBody, contentType);
    const slug = String(fields.slug || requestUrl.searchParams.get("slug") || "").trim();
    const event = findEventBySlug(slug);

    if (!event) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    if (normalizeEventVisibility(event).phase !== "live") {
      sendJson(res, 400, { error: "Uploads are available only while the event is live." });
      return;
    }

    const file = files.find((entry) => entry.fieldName === "photo") || files[0];
    if (!file?.buffer?.length) {
      sendJson(res, 400, { error: "Please select a photo first." });
      return;
    }

    if (!String(file.mimeType || "").startsWith(IMAGE_MIME_PREFIX)) {
      sendJson(res, 400, { error: "Only image uploads are supported right now." });
      return;
    }

    const driveAccessToken = await getDriveWriteAccessTokenForUser(event.ownerUid);
    const driveFile = await driveUploadFileToFolder({
      folderId: event.queueFolderId,
      fileName: file.fileName || `event-photo-${Date.now()}.jpg`,
      mimeType: file.mimeType,
      buffer: file.buffer,
      accessToken: driveAccessToken,
    });

    const store = readEventsStore();
    const mutableEvent = store.events.find((entry) => entry.id === event.id);
    if (!mutableEvent) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    const photoRecord = buildEventPhotoRecord(mutableEvent, driveFile);
    mutableEvent.queuedPhotos.unshift(photoRecord);
    writeEventsStore(store);

    sendJson(res, 200, {
      success: true,
      photo: sanitizeEventPhoto(photoRecord),
      message: "Photo uploaded and queued for moderation.",
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not upload photo." });
  }
}

async function handleEventBackgroundUpload(req, res) {
  const account = await requireAuthenticatedRequest(req, res);
  if (!account) {
    return;
  }

  try {
    const contentType = req.headers["content-type"] || "";
    const rawBody = await readRawRequestBuffer(req);
    const { fields, files } = parseMultipartForm(rawBody, contentType);
    const eventId = String(fields.eventId || "").trim();
    if (!eventId) {
      sendJson(res, 400, { error: "Event id is required." });
      return;
    }

    const store = readEventsStore();
    const event = store.events.find((entry) => entry.id === eventId && entry.ownerUid === account.localId);
    if (!event) {
      sendJson(res, 404, { error: "Event not found." });
      return;
    }

    const file = files.find((entry) => entry.fieldName === "background") || files[0];
    if (!file?.buffer?.length) {
      sendJson(res, 400, { error: "Please upload a background image." });
      return;
    }
    if (!String(file.mimeType || "").startsWith(IMAGE_MIME_PREFIX)) {
      sendJson(res, 400, { error: "Only image files are allowed for background." });
      return;
    }

    const extension = getFileExtensionFromMimeType(file.mimeType);
    const driveAccessToken = await getDriveWriteAccessTokenForUser(account.localId);
    const driveFile = await driveUploadFileToFolder({
      folderId: event.parentFolderId,
      fileName: `Background.${extension}`,
      mimeType: file.mimeType,
      buffer: file.buffer,
      accessToken: driveAccessToken,
    });
    const driveFileId = String(driveFile?.id || "").trim();
    event.backgroundDriveFileId = driveFileId;
    event.backgroundUrl = createImageUrl(driveFileId, "full");
    writeEventsStore(store);

    sendJson(res, 200, { event: sanitizeEventForClient(normalizeEventVisibility(event)) });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "Could not upload event background." });
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const requestHost = normalizeHostname((req.headers.host || "").split(":")[0]);

  if (requestUrl.pathname === "/firebase-config.js") {
    sendFirebaseConfigScript(res);
    return;
  }

  if (requestUrl.pathname === "/api/folder") {
    await handleApiFolder(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/folder-meta") {
    await handleApiFolderMeta(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/youtube/validate" && req.method === "GET") {
    await handleYoutubeValidate(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/image") {
    await proxyDriveImage(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/remote/link" && req.method === "POST") {
    await handleSaveRemoteLink(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/remote/resolve") {
    await handleResolveRemoteCode(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/pairing/resolve") {
    await handleResolvePairingCode(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/remote/delete" && req.method === "POST") {
    await handleDeleteRemoteCode(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/public-page/like" && req.method === "POST") {
    await handlePublicPageLike(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/public-page/unlike" && req.method === "POST") {
    await handlePublicPageUnlike(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/public-page/likes" && req.method === "GET") {
    await handlePublicPageLikes(req, res);
    return;
  }

  if ((requestUrl.pathname === "/api/public-page/faces" || requestUrl.pathname === "/api/public-page/face-groups") && req.method === "GET") {
    await handlePublicPageFaceGroups(req, res);
    return;
  }

  if ((requestUrl.pathname === "/api/public-page/face-photos" || requestUrl.pathname === "/api/public-page/face-matches") && req.method === "GET") {
    await handlePublicPageFaceMatches(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/public-page/merge-faces" && req.method === "POST") {
    await handleMergePublicPageFaces(req, res);
    return;
  }
  if (requestUrl.pathname === "/api/face-detection/enqueue" && req.method === "POST") {
    await handleFaceDetectionEnqueue(req, res);
    return;
  }
  if (requestUrl.pathname === "/api/face-detection/statuses" && req.method === "GET") {
    await handleFaceDetectionStatuses(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/photo-like" && req.method === "POST") {
    await handleEventPhotoLike(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/photo-unlike" && req.method === "POST") {
    await handleEventPhotoUnlike(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/admin/links" && req.method === "GET") {
    await handleAdminLinks(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/admin/links/delete" && req.method === "POST") {
    await handleAdminDeleteLink(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/admin/events" && req.method === "GET") {
    await handleAdminListEvents(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/admin/events/delete" && req.method === "POST") {
    await handleAdminDeleteEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/drive/connection" && req.method === "GET") {
    await handleDriveConnectionStatus(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/drive/connection/remove" && req.method === "POST") {
    await handleRemoveDriveConnection(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/account/delete" && req.method === "POST") {
    await handleDeleteAccount(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/drive/oauth/start" && req.method === "POST") {
    await handleStartDriveOAuth(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/drive/oauth/callback" && req.method === "GET") {
    await handleDriveOAuthCallback(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events" && req.method === "GET") {
    await handleListEvents(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events" && req.method === "POST") {
    await handleCreateEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/manage" && req.method === "GET") {
    await handleGetManagedEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/update" && req.method === "POST") {
    await handleUpdateEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/delete" && req.method === "POST") {
    await handleDeleteEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/moderate" && req.method === "POST") {
    await handleModerateEventPhoto(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/public" && req.method === "GET") {
    await handleGetPublicEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/upload" && req.method === "POST") {
    await handleEventUpload(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/background" && req.method === "POST") {
    await handleEventBackgroundUpload(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/moderation" && req.method === "GET") {
    await handleGetModerationEvent(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/events/moderation" && req.method === "POST") {
    await handleModerateEventPhotoByToken(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/qr" && req.method === "GET") {
    await handleGenerateQr(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/domain/verify") {
    await handleDomainVerification(req, res);
    return;
  }

  if (requestUrl.pathname === "/api/domain/allow") {
    await handleDomainAllowance(req, res);
    return;
  }

  if (requestUrl.pathname === "/") {
    const parentDomainHost = getParentDomainRedirectHost(requestHost);
    if (parentDomainHost) {
      const redirectUrl = `${getRequestProtocol(req)}://${parentDomainHost}${requestUrl.search || ""}`;
      res.writeHead(302, { Location: redirectUrl, "Cache-Control": "no-store" });
      res.end();
      return;
    }
  }

  const pathname = resolveStaticPathname(requestUrl.pathname);
  const filePath = sanitizePathname(pathname);
  if (!filePath) {
    sendJson(res, 400, { error: "Invalid path." });
    return;
  }

  if (pathname === "/index.html") {
    const pageRecord = await getPublicPageRecordForRequest(req, requestUrl, requestHost);
    if (pageRecord) {
      await sendIndexWithPageMetadata(req, res, filePath, pageRecord);
      return;
    }
  }

  sendFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`Gallery slideshow running at http://${HOST}:${PORT}`);
  startFaceDetectionQueueWorker();
});
