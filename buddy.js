/* ============================================================
   buddy.js — the mentor buddy
   The character art is five SVG poses in assets/buddy/
   (idle, thinking, happy, pointing, celebrate). This file:
     1. Loads all five poses into #buddy when the page opens
     2. Exposes a tiny API the rest of the app uses:
          buddy.set("happy")       switch pose (+ its animation)
          buddy.set("happy", 1500) switch, then return to idle after 1.5s
          buddy.say("Nice!")       change the speech bubble text

   The current state is a data-state attribute on the #buddy box.
   buddy.css decides which pose is visible and how it moves.
   So JS decides WHAT the buddy feels, CSS decides how that LOOKS.
   ============================================================ */

const BUDDY_STATES = ["idle", "thinking", "happy", "pointing", "celebrate"];

const buddy = (() => {
  const host = document.getElementById("buddy");
  const speechEl = document.getElementById("speech");
  let revertTimer = null;

  host.classList.add("buddy");
  host.setAttribute("data-state", "idle");

  // Fetch each pose file and drop its <svg> into the host. The poses are
  // fetched in parallel; a pose simply isn't visible until it has arrived.
  for (const state of BUDDY_STATES) {
    fetch(`assets/buddy/${state}.svg`)
      .then((res) => res.text())
      .then((svgText) => {
        host.insertAdjacentHTML("beforeend", svgText);
      });
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

  return { set, say };
})();
