# PGN UTD Website

## File Structure

```
pgn-utd/
├── index.html          ← Main page (HTML structure only)
├── css/
│   └── styles.css      ← All styles & color variables
├── js/
│   └── main.js         ← All interactivity (login, tabs, accordion)
└── assets/
    └── images/         ← Drop your photos here
```

## How to Edit

### Change the portal password
Open `js/main.js` and update this line at the top:
```js
const PORTAL_PASSWORD = "pgnutd2025";
```

### Add a new class to the Lineage section
Copy a `class-block` div in `index.html` and fill in the brother names.

### Add real photos to the portal
Replace the `.photo-placeholder` divs in `index.html` with:
```html
<img src="assets/images/your-photo.jpg" alt="Event Name" style="width:100%; border-radius:2px;" />
```

### Update member directory
Find the `#tab-directory` section in `index.html` and edit the `.dir-card` entries.

### Update contact info
Search for `pgn.utd@utdallas.edu` and `@pgn_utd` in `index.html` and replace with real details.

## How to Go Live

**Option 1 — GitHub Pages (free)**
1. Create a GitHub repo
2. Upload all files keeping the folder structure
3. Go to Settings → Pages → Deploy from main branch

**Option 2 — Netlify (free, drag & drop)**
1. Go to netlify.com
2. Drag the entire `pgn-utd/` folder into the deploy area
3. Done — you get a live URL instantly

**Option 3 — Your own hosting**
Upload all files via FTP keeping the same folder structure.
