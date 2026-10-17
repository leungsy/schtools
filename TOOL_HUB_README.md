# Tool Hub — GitHub Pages update

This package contains:

- `index.html`: main Tool Hub with CRToolbox, HALP, and two additional editable, linked tool cards. Each card shows **Last updated: DATE** until you edit its value.
- `student-facing-tools/index.html`: placeholder collection landing page.
- `just-for-fun/index.html`: placeholder collection landing page.

## Install

Upload or merge these files into the ROOT of your GitHub Pages repository. Keep your existing `crtoolbox/` and `halp/` directories untouched.

## Configure tool links and dates

Open the main `index.html` and search for `const APPS = [`.

Each app has two settings you can edit:

```javascript
lastUpdated: '17 Oct 2026',
url: './tool-3/'
```

- Change **lastUpdated** to the correct date for that specific tool; dates are not automatically updated.
- Change **url** to an existing online URL or a path within the repository.
- **Tool 3** and **Tool 4** are now clickable cards linked to `./tool-3/` and `./tool-4/` respectively. **Those links will show a 404 until you add the corresponding folders containing `index.html`, or change the URLs to working destinations.**
- HALP's `url` remains blank as before. Set it when HALP has been published.

The two collection links at the bottom work once their folders are uploaded alongside `index.html`.
