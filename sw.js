/* ============================================================
   sw.js — the service worker: makes CodeBuddy an installable app that
   keeps working offline after the first visit.

   Two rules, chosen so a new deploy can never get stuck behind a cache:
   - The site's own files: NETWORK FIRST. Online, you always get the newest
     version (and a copy is kept). Offline, the kept copy is used.
   - Python (Pyodide from jsDelivr) and the font: CACHE FIRST. Those URLs
     contain a version number, so a cached copy is always the right one,
     and Python (~10 MB) doesn't download again on every visit.

   app.js registers this as sw.js?v=BUILD, so every deploy installs a fresh
   worker that pre-caches that build's files and clears older copies.
   ============================================================ */

const BUILD = new URL(self.location).searchParams.get("v") || "dev";
const SITE = `codebuddy-site-${BUILD}`;
const LIBS = "codebuddy-libs-1";
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";

const v = (f) => `${f}?v=${BUILD}`;
const SITE_FILES = [
  "./", "index.html", "manifest.webmanifest",
  ...["app.js", "tutor.js", "buddy.js", "lessons.js", "quiz.js", "read.js", "tour.js", "scratch.js", "finish.js", "badges.js", "playground.js", "viz.js", "daily.js", "fx.js", "sfx.js", "runner.js",
      "styles.css", "buddy.css", "dark.css",
      "assets/logo.svg", "assets/logo.png", "assets/logo-192.png", "assets/favicon.png",
      ...["idle", "thinking", "happy", "pointing", "celebrate"].map((p) => `assets/buddy/${p}.svg`)].map(v),
  "vendor/codemirror/codemirror.css", "vendor/codemirror/codemirror.js", "vendor/codemirror/python.js",
];
const PYODIDE_FILES = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"].map((f) => PYODIDE + f);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const site = await caches.open(SITE);
    await site.addAll(SITE_FILES);
    // Python is big: fetch it in the background, and don't fail the install if it can't
    const libs = await caches.open(LIBS);
    await Promise.all(PYODIDE_FILES.map(async (u) => { if (!(await libs.match(u))) { try { const r = await fetch(u, { mode: "cors" }); if (r.ok) await libs.put(u, r); } catch {} } }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("codebuddy-site-") && key !== SITE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) { const c = await caches.open(SITE); c.put(req, res.clone()); }
        return res;
      } catch {
        const cached = (await caches.match(req)) || (req.mode === "navigate" ? await caches.match("index.html", { ignoreSearch: true }) : null);
        return cached || Response.error();
      }
    })());
    return;
  }

  if (url.href.startsWith(PYODIDE) || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith((async () => {
      const c = await caches.open(LIBS);
      const hit = await c.match(req, { ignoreSearch: url.href.startsWith(PYODIDE) });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    })());
  }
});
