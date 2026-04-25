# Carnival Showcase TV

This is a native Android TV client for Carnival Showcase.

It is not a WebView wrapper. The app renders its own TV-first UI and talks to the existing Carnival Showcase backend for:

- pairing code resolution
- Google Drive folder loading
- image delivery

## Backend URL

The app reads the backend base URL from `gradle.properties`:

```properties
carnivalShowcaseBaseUrl=http://10.0.2.2:3000
```

Use:

- `http://10.0.2.2:3000` for the Android emulator talking to your local machine
- your LAN IP like `http://192.168.x.x:3000` for a physical TV device on the same network
- your deployed Carnival Showcase URL for a hosted backend

## Open in Android Studio

1. Open the `carnival-showcase-tv` folder in Android Studio.
2. Let Gradle sync.
3. Run it on an Android TV emulator or physical Android TV device.

## Current native flow

- code entry
- direct link entry
- folder grid
- photo grid using thumbnails
- fullscreen slideshow using full images
