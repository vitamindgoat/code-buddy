/* ============================================================
   tour.js — game-style tutorial spotlights
   Dims the whole page except one element, with a little card that
   explains it. Used for the first-visit walkthrough and for the
   "click Next lesson" moment after someone's very first lesson.

     tour.run(steps, onDone)
       steps: [{ target: "#css-selector", title, text,
                 place: "right" | "left" | "top" | "bottom",
                 waitForClick: true }]   <- step ends when the target is clicked
                                           (instead of showing a Next button)

   How the dimming works: the spotlight box sits over the target and has a
   gigantic box-shadow. The shadow IS the dark overlay. Everything stays
   clickable because the spotlight ignores the mouse (pointer-events: none).
   ============================================================ */

const tour = (() => {
  const spot = document.createElement("div");
  spot.className = "tour-spot";
  const tip = document.createElement("div");
  tip.className = "tour-tip";
  document.body.append(spot, tip);

  let steps = [], index = 0, onDone = null, cleanup = null;

  function run(list, done) {
    steps = list; index = 0; onDone = done;
    document.body.classList.add("touring");
    show();
    window.addEventListener("resize", place);
    window.addEventListener("keydown", onKey);
  }

  function onKey(e) { if (e.key === "Escape") end(); }

  function show() {
    if (cleanup) { cleanup(); cleanup = null; }
    const step = steps[index];
    if (!step) return end();
    const target = document.querySelector(step.target);
    if (!target) { index++; return show(); }

    tip.innerHTML = `
      <div class="tour-count">${index + 1} / ${steps.length}</div>
      <h3>${step.title}</h3>
      <p>${step.text}</p>
      <div class="tour-actions">
        ${step.waitForClick ? "" : `<button class="btn btn-ghost tour-skip" type="button">Skip</button>
        <button class="btn btn-primary tour-next" type="button">${index === steps.length - 1 ? "Let's go!" : "Next"}</button>`}
      </div>`;
    tip.querySelector(".tour-next")?.addEventListener("click", () => { index++; show(); });
    tip.querySelector(".tour-skip")?.addEventListener("click", end);

    if (step.waitForClick) {
      const handler = () => { index++; show(); };
      target.addEventListener("click", handler, { once: true });
      cleanup = () => target.removeEventListener("click", handler);
    }

    spot.classList.add("on");
    tip.classList.add("on");
    place();
  }

  // Put the spotlight over the target and the tip beside it
  function place() {
    const step = steps[index];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    const r = el.getBoundingClientRect();
    const pad = 8;
    spot.style.left = `${r.left - pad}px`;
    spot.style.top = `${r.top - pad}px`;
    spot.style.width = `${r.width + pad * 2}px`;
    spot.style.height = `${r.height + pad * 2}px`;

    const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 16;
    let left, top;
    switch (step.place || "right") {
      case "left":   left = r.left - tw - gap; top = r.top + r.height / 2 - th / 2; break;
      case "top":    left = r.left + r.width / 2 - tw / 2; top = r.top - th - gap; break;
      case "bottom": left = r.left + r.width / 2 - tw / 2; top = r.bottom + gap; break;
      default:       left = r.right + gap; top = r.top + r.height / 2 - th / 2;
    }
    // keep it on screen
    left = Math.max(12, Math.min(window.innerWidth - tw - 12, left));
    top = Math.max(12, Math.min(window.innerHeight - th - 12, top));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function end() {
    if (cleanup) { cleanup(); cleanup = null; }
    spot.classList.remove("on");
    tip.classList.remove("on");
    document.body.classList.remove("touring");
    window.removeEventListener("resize", place);
    window.removeEventListener("keydown", onKey);
    if (onDone) onDone();
    onDone = null;
  }

  return { run, end, get active() { return document.body.classList.contains("touring"); } };
})();
