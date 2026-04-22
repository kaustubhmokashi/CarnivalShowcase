# CarnivalShowcase

This site lets you:

- paste a public Google Drive folder link
- browse nested folders
- view photos in a grid
- open photos in a slideshow with keyboard navigation

## Run locally

1. Create a Google Cloud project for the new account and enable the Google Drive API.
2. Put the new credentials in `.env`.

```bash
export GOOGLE_DRIVE_API_KEY=your_new_key_here
npm start
```

3. Open `http://localhost:3000`

## Notes

- The folder must be shared so the Google Drive API key can access it.
- Arrow keys move between slides.
- `Esc` closes the slideshow.

## Deploy on Render

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint or Web Service from that repo.
3. Use the included [`render.yaml`](/Users/kaustubh.mokashi/Documents/CarnivalShowcase/render.yaml).
4. Add this environment variable in Render:

```text
GOOGLE_DRIVE_API_KEY=your_new_google_drive_api_key
```

## Privacy Policy

Once deployed, a hosted privacy policy page is available at:

`https://your-render-service.onrender.com/privacy-policy`
