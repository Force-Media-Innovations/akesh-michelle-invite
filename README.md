# Akesh & Michelle wedding invitation

Static site, no build step. Upload this folder to Vercel as-is (Framework preset: Other).

## Preview on your computer
- `npm run dev`, then open http://localhost:3000
- Or in VS Code, install the **Live Preview** extension (by Microsoft), then right-click `index.html` > **Show Preview**.

## Settings
Edit `config.js`:
- `mapUrl`: the client's exact Google Maps link for the kovil.
- `rsvpEndpoint`: the Google Apps Script web app URL (see `apps-script.gs`). While it is empty, the form shows the thank-you message but nothing is saved.
- `music`: e.g. `assets/music.mp3` to add background music with an on/off button.

## Personal links
Add `?to=Name` to the link to greet a guest by name and prefill the RSVP, e.g. `https://yourdomain.com/?to=Rahul%20Perera`.

## Files
- `index.html`, `style.css`, `main.js`, `config.js`
- `assets/intro.mp4` (+ `intro.webm` fallback): intro video, played with no controls after "Tap to open"
- `assets/*.webp|svg`: artwork extracted from the client's Canva design
- `assets/vendor/`: GSAP, ScrollTrigger and Lenis (smooth scrolling), self-hosted
