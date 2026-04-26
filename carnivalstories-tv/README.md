# CarnivalStories TV

This is a native Android TV client for CarnivalStories.

It is not a WebView wrapper. The app renders its own TV-first UI and talks to the existing CarnivalStories backend for:

- pairing code resolution
- Google Drive folder loading
- image delivery

## Backend URL

The TV app uses two different URLs from `gradle.properties`:

- `carnivalShowcaseBaseUrl`
  This is the backend the Android app calls for:
  - pairing code resolution
  - Google Drive folder loading
  - image delivery
- `carnivalShowcasePairingUrl`
  This is the public QR destination shown on the TV for the phone remote.

```properties
carnivalShowcaseBaseUrl=https://carnivalshowcase.kaustubhmokashi.com
carnivalShowcasePairingUrl=https://carnivalshowcase.kaustubhmokashi.com/remote-tv
```

Use:

- `https://carnivalshowcase.kaustubhmokashi.com` for the hosted CarnivalStories backend

## Open in Android Studio

1. Open the `carnivalstories-tv` folder in Android Studio.
2. Let Gradle sync.
3. Run it on an Android TV emulator or physical Android TV device.

## Current native flow

- code entry
- direct link entry
- folder grid
- photo grid using thumbnails
- fullscreen slideshow using full images
