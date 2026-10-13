/* ============================================================
   buddy.js — the mentor buddy
   The character art is five SVG poses in assets/buddy/
   (idle, thinking, happy, pointing, celebrate). This file:
     1. Loads the five pose files once, then mounts them into #buddy
     2. Exposes a tiny API the rest of the app uses:
          buddy.set("happy")       switch pose (+ its animation)
          buddy.set("happy", 1500) switch, then return to idle after 1.5s
          buddy.say("Nice!")       change the speech bubble text
          buddy.mount(el)          put a second buddy somewhere (debug strip)

   The current state is a data-state attribute on the host box.
   buddy.css decides which pose is visible and how it moves.
   So JS decides WHAT the buddy feels, CSS decides how that LOOKS.
   ============================================================ */

const BUDDY_STATES = ["idle", "thinking", "happy", "pointing", "celebrate"];

const buddy = (() => {
  const host = document.getElementById("buddy");
  const speechEl = document.getElementById("speech");
  let revertTimer = null;
  let instances = 0;

  // Fetch each pose file once (in parallel). We keep the raw text so we
  // can mount as many copies as we like.
  const posesReady = Promise.all(
    BUDDY_STATES.map((state) =>
      fetch(`assets/buddy/${state}.svg?v=${document.querySelector('meta[name="build"]').content}`).then((res) => res.text())
    )
  );

  // Put all five poses inside `el`. SVG ids (the clip paths) are global to
  // the whole page, so each copy gets its own suffix: a second copy that
  // pointed at the first copy's clip would silently lose its clipping.
  async function mount(el, state = "idle") {
    const texts = await posesReady;
    const n = ++instances;
    el.classList.add("buddy");
    el.setAttribute("data-state", state);
    el.innerHTML = texts
      .map((svg) => svg.replace(/(id="|url\(#)([a-z]+-clip)/g, `$1$2-${n}`))
      .join("");
  }

  function set(state, ms = 0) {
    clearTimeout(revertTimer);

    // Trick: if we set the same state twice in a row, the CSS animation
    // would NOT replay. Removing the attribute, forcing the browser to
    // notice (offsetWidth), then setting it again restarts it.
    host.removeAttribute("data-state");
    void host.offsetWidth;
    host.setAttribute("data-state", state);

    if (ms > 0) {
      revertTimer = setTimeout(() => set("idle"), ms);
    }
  }

  // Change the speech bubble. Same replay trick for the little "pop".
  function say(text) {
    speechEl.textContent = text;
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");
  }

  mount(host, "idle");

  return { set, say, mount };
})();
