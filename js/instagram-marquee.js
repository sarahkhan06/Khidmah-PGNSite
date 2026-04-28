/**
 * Instagram marquee on the contact page: each card links to a real post and
 * shows its thumbnail when possible.
 *
 * Data sources (first match wins):
 *   1) `/data/instagram-marquee.json` in `public/`
 *   2) Firestore `instagram/marquee` → field `posts` (array)
 *
 * Each post:
 *   { "permalink": "https://www.instagram.com/p/SHORTCODE/", "label": "optional chip",
 *     "thumbnailUrl": "optional — if omitted, resolved via oEmbed" }
 *
 * Thumbnail resolution: public oEmbed proxy [noembed.com](https://noembed.com)
 * (`/embed?url=…&format=json`) returns `thumbnail_url` + `title` for many
 * Instagram permalinks without a Meta access token. If it fails, the card
 * keeps the CSS gradient until you add `thumbnailUrl` manually or use Graph API.
 *
 * Add more objects to `posts` for more distinct placecards (the script cycles
 * `posts` across every card in the marquee track).
 */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4MaSbpYbFVcnLjhGAg4T0y3UYMktwUUE",
  authDomain: "pgn-utd-portal.firebaseapp.com",
  projectId: "pgn-utd-portal",
  storageBucket: "pgn-utd-portal.firebasestorage.app",
  messagingSenderId: "770209804962",
  appId: "1:770209804962:web:eaa0e54fc2e26c88589dfb",
  measurementId: "G-3BT7LNXGEQ",
};

function cssUrl(u) {
  return encodeURI(u).replace(/'/g, "%27");
}

function chipText(p, i, len) {
  const label = (p.label || "").trim();
  if (label) return label;
  const t = (p.resolvedTitle || "").trim();
  if (t) return t.length > 36 ? `${t.slice(0, 34)}…` : t;
  return `Post ${(i % len) + 1}`;
}

/** @param {{ permalink?: string, thumbnailUrl?: string, label?: string, resolvedTitle?: string }[]} posts */
function applyPosts(posts) {
  const cards = document.querySelectorAll(".ig-marquee-banner .ig-marquee-card");
  if (!cards.length || !posts?.length) return;
  const n = posts.length;

  cards.forEach((card, i) => {
    const p = posts[i % n];
    if (!p?.permalink) return;

    card.setAttribute("href", p.permalink);

    const cover = card.querySelector(".ig-marquee-card__cover");
    const meta = card.querySelector(".ig-marquee-card__meta");
    const chip = chipText(p, i, n);
    if (meta) meta.textContent = chip;
    card.setAttribute("aria-label", `Open Instagram post: ${chip.replace(/"/g, "")}`);

    if (!cover || !p.thumbnailUrl) return;

    cover.classList.add("ig-marquee-card__cover--photo");
    cover.style.removeProperty("--ig-cover");
    const u = cssUrl(p.thumbnailUrl);
    cover.style.backgroundImage = `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.62) 100%), url("${u}")`;
    cover.style.backgroundSize = "cover, cover";
    cover.style.backgroundPosition = "center, center";
    cover.style.backgroundRepeat = "no-repeat, no-repeat";
  });
}

const oembedCache = new Map();

async function fetchOembed(permalink) {
  if (oembedCache.has(permalink)) return oembedCache.get(permalink);
  const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(permalink)}&format=json`;
  let out = { thumbnail_url: "", title: "" };
  try {
    const r = await fetch(endpoint);
    if (!r.ok) {
      oembedCache.set(permalink, out);
      return out;
    }
    const j = await r.json();
    if (j.error) {
      oembedCache.set(permalink, out);
      return out;
    }
    out = {
      thumbnail_url: typeof j.thumbnail_url === "string" ? j.thumbnail_url : "",
      title: typeof j.title === "string" ? j.title : "",
    };
  } catch {
    /* keep empty */
  }
  oembedCache.set(permalink, out);
  return out;
}

async function enrichPosts(posts) {
  const unique = [...new Set(posts.map((p) => p.permalink).filter(Boolean))];
  await Promise.all(unique.map((url) => fetchOembed(url)));
  return posts.map((p) => {
    const o = p.permalink ? oembedCache.get(p.permalink) : null;
    const hasLabel = !!(p.label || "").trim();
    return {
      ...p,
      thumbnailUrl: p.thumbnailUrl || o?.thumbnail_url || "",
      resolvedTitle: !hasLabel && o?.title ? o.title : "",
    };
  });
}

async function loadPostsFromFirestore() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snap = await getDoc(doc(db, "instagram", "marquee"));
  if (!snap.exists()) return null;
  const data = snap.data();
  return Array.isArray(data.posts) && data.posts.length ? data.posts : null;
}

async function loadPostsFromJson() {
  const res = await fetch("/data/instagram-marquee.json", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data.posts) && data.posts.length ? data.posts : null;
}

async function loadPosts() {
  try {
    const fromJson = await loadPostsFromJson();
    if (fromJson?.length) return fromJson;
  } catch (e) {
    console.warn("[instagram-marquee] JSON:", e);
  }
  try {
    const fromDb = await loadPostsFromFirestore();
    if (fromDb?.length) return fromDb;
  } catch (e) {
    console.warn("[instagram-marquee] Firestore:", e);
  }
  return null;
}

async function init() {
  const posts = await loadPosts();
  if (!posts?.length) return;
  const enriched = await enrichPosts(posts);
  applyPosts(enriched);
}

init();
