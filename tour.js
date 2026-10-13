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
    requestAnimationFrame(place);
    sfx.pop();
  }

  // Put the spotlight over the target and the tip beside it, centered on
  // it, with an arrow pointing at it. If the preferred side doesn't fit on
  // screen, flip to the opposite side.
  function place() {
    const step = steps[index];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    const r = el.getBoundingClientRect();
    const pad = 8;
    const sp = { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
    spot.style.left = `${sp.left}px`; spot.style.top = `${sp.top}px`;
    spot.style.width = `${sp.width}px`; spot.style.height = `${sp.height}px`;
    const cx = sp.left + sp.width / 2, cy = sp.top + sp.height / 2;

    const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 18;
    const W = window.innerWidth, H = window.innerHeight;
    const fits = {
      right:  sp.left + sp.width + gap + tw <= W - 12,
      left:   sp.left - gap - tw >= 12,
      bottom: sp.top + sp.height + gap + th <= H - 12,
      top:    sp.top - gap - th >= 12,
    };
    const opposite = { right: "left", left: "right", top: "bottom", bottom: "top" };
    let side = step.place || "right";
    if (!fits[side]) side = fits[opposite[side]] ? opposite[side] : (["bottom", "top", "right", "left"].find((k) => fits[k]) || side);

    let left, top;
    if (side === "right")       { left = sp.left + sp.width + gap; top = cy - th / 2; }
    else if (side === "left")   { left = sp.left - gap - tw;       top = cy - th / 2; }
    else if (side === "bottom") { left = cx - tw / 2;              top = sp.top + sp.height + gap; }
    else                        { left = cx - tw / 2;              top = sp.top - gap - th; }
    left = Math.max(12, Math.min(W - tw - 12, left));
    top = Math.max(12, Math.min(H - th - 12, top));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.dataset.side = side;
    // the arrow sits on the tip's edge, lined up with the target's center
    const ax = Math.max(18, Math.min(tw - 18, cx - left));
    const ay = Math.max(18, Math.min(th - 18, cy - top));
    tip.style.setProperty("--ax", `${ax}px`);
    tip.style.setProperty("--ay", `${ay}px`);
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
