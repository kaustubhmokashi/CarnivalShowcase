# Static Remote

This folder is a standalone static remote page.

You can upload this folder to:

- GitHub Pages
- Netlify
- Vercel static hosting
- any plain static web host

It does **not** depend on the hosted app for remote code creation.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`

## What it does

- creates 6-digit temporary codes
- creates 9-digit permanent codes
- writes them directly into Firestore
- deletes codes using `code + original url`
- reuses an existing code for the same folder when possible

## Firebase details you need

Put these into `firebase-config.js`:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

Also decide:

- `collectionName`
  - keep this as `pairingCodes` if you want to use the same collection your TV/backend already reads
- `temporaryCodeExpiryDays`
  - currently `2`
- `enableAnonymousAuth`
  - recommended `true`

## Recommended Firebase setup

1. Enable **Firestore**
2. Enable **Anonymous Authentication**
3. Use a Firestore ruleset that requires signed-in users

Example starting point:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pairingCodes/{code} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Important note

This static version does not validate the Google Drive link with the Google Drive API before saving.

That means:

- code creation is fully static
- invalid/private links can still get a code
- validation will happen later when the TV/backend tries to use the link

If you want later, you can add:

- a Firebase Cloud Function for Drive validation
- or a tiny separate validation service

without changing this folder’s UI structure much.
