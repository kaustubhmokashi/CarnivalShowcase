const http = require("http");
const dns = require("dns").promises;
const os = require("os");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

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
const CODE_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000;
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
};
const CUSTOM_DOMAIN_CNAME_TARGET = process.env.CUSTOM_DOMAIN_CNAME_TARGET || process.env.RENDER_EXTERNAL_HOSTNAME || "";
const FOLDER_CACHE_FRESH_MS = Number(process.env.FOLDER_CACHE_FRESH_MS || 5 * 60 * 1000);
const FOLDER_CACHE_STALE_MS = Number(process.env.FOLDER_CACHE_STALE_MS || 30 * 60 * 1000);
const MEDIA_CACHE_TTL_MS = Number(process.env.MEDIA_CACHE_TTL_MS || 30 * 60 * 1000);
const MEDIA_CACHE_MAX_BYTES = Number(process.env.MEDIA_CACHE_MAX_BYTES || 120 * 1024 * 1024);
const MEDIA_CACHE_MAX_ENTRY_BYTES = Number(process.env.MEDIA_CACHE_MAX_ENTRY_BYTES || 8 * 1024 * 1024);

const IMAGE_MIME_PREFIX = "image/";
const VIDEO_MIME_PREFIX = "video/";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
let firestoreDb = null;
const folderTreeCache = new Map();
const mediaResponseCache = new Map();
const mediaInflightRequests = new Map();
let mediaCacheSizeBytes = 0;

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
      const response = await fetch(candidate, {
        redirect: "follow",
        headers: rangeHeader ? { Range: rangeHeader } : undefined,
      });
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        lastError = `Media request failed (${response.status}) for ${candidate}`;
        continue;
      }

      if (!response.body || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
        lastError = `Non-media response returned for ${candidate}`;
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

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(REMOTE_CODES_FILE)) {
    fs.writeFileSync(REMOTE_CODES_FILE, "", "utf8");
  }
}

function readRemoteMappings() {
  ensureDataStore();
  const content = fs.readFileSync(REMOTE_CODES_FILE, "utf8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, url, createdAt, permanentFlag] = line.split("\t");
      return { code, url, createdAt, permanent: permanentFlag === "1" };
    });
}

function writeRemoteMappings(mappings) {
  ensureDataStore();
  const body = mappings
    .map((entry) =>
      [entry.code, entry.url || "", entry.createdAt || "", entry.permanent ? "1" : "0"].join("\t")
    )
    .join("\n");
  fs.writeFileSync(REMOTE_CODES_FILE, body ? `${body}\n` : "", "utf8");
}

function generateRemoteCode() {
  return generateNumericCode(6);
}

function generatePermanentRemoteCode() {
  return generateNumericCode(9);
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

  if (!db) {
    const mappings = pruneExpiredMappings();
    const existingEntry = mappings.find(
      (entry) => normalizeRemoteUrl(entry.url) === normalizedUrl && Boolean(entry.permanent) === permanent
    );

    if (existingEntry) {
      return { success: true, code: existingEntry.code, reused: true, store: "file" };
    }

    const code = permanent ? generatePermanentRemoteCode() : generateRemoteCode();
    mappings.push({
      code,
      url: normalizedUrl,
      createdAt: new Date().toISOString(),
      permanent,
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
    const snapshot = await db.collection(FIREBASE_COLLECTIONS.publicPages).doc(publicPageId).get();
    return snapshot.exists ? snapshot.data() || null : null;
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
  const title = tagline || pageName || "CarnivalShowcase";
  const description =
    tagline ||
    [pageName, studioName].filter(Boolean).join(" · ") ||
    "View this gallery on CarnivalShowcase.";
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

    const candidates =
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
    pathname === "/folders" ||
    pathname === "/gallery" ||
    pathSegments.length === 2
  ) {
    return "/index.html";
  }

  if (pathname === "/privacy-policy") {
    return "/privacy-policy.html";
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

  if (!/^\d{6}$|^\d{9}$/.test(code)) {
    sendJson(res, 400, { error: "Code must be a 6 or 9 digit number." });
    return;
  }

  const entry = await resolveRemoteLinkFromStore(code);
  if (!entry) {
    sendJson(res, 404, { error: "Code not found or it has expired. Generate a new code." });
    return;
  }

  sendJson(res, 200, {
    code: entry.code,
    url: entry.url || "",
    ready: Boolean(entry.url),
  });
}

async function handleDeleteRemoteCode(req, res) {
  try {
    const body = await readRequestBody(req);
    const code = String(body.code || "").trim();
    const url = normalizeRemoteUrl(body.url);

    if (!/^\d{6}$|^\d{9}$/.test(code)) {
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

  if (requestUrl.pathname === "/api/remote/delete" && req.method === "POST") {
    await handleDeleteRemoteCode(req, res);
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
});
