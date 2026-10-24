/* ============================================================
   fx.js — visual effects
   Small, dependency-free effects drawn on a full-screen <canvas>
   that sits above everything and ignores the mouse.

     fx.confetti(n, style) a celebration. style: "rain" (from the top),
                          "cannons" (two corner cannons), "stars" (a star
                          shower) or nothing to pick rain/cannons at random
     fx.reaction(x, y, s) a little floating emoji (the buddy's reactions)
     fx.burst(x, y)       small sparkle pop at a point: a line done
     fx.ripple(button, e) click ripple inside a button

   Each particle is a plain object { x, y, vx, vy, ... }. Every frame we
   move them, draw them, and drop the ones that have faded out.
   ============================================================ */

const fx = (() => {
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");   // decoration only
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const COLORS = ["#74bcfe", "#1e6fd9", "#06337e", "#17a673", "#7fd6b8", "#b6e3ff", "#ffffff"];  // theme blues + greens, no yellow
  let particles = [];
  let running = false;

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function star(r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }
  // "Animations" off in Settings, or the device asks for less motion: no particles
  const calm = () => document.body.classList.contains("reduce-motion") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SHAPES = ["rect", "rect", "ribbon", "ribbon", "dot", "tri", "star"];

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.shape === "ribbon") { ctx.scale(1, Math.cos(p.rot * 3)); ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3); }
      else if (p.shape === "star") star(p.size / 2);
      else if (p.shape === "tri") { ctx.beginPath(); ctx.moveTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (particles.length) requestAnimationFrame(frame);
    else running = false;
  }

  function go() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // Confetti, three ways. Rain falls from the top edge; cannons fire up
  // from both bottom corners; stars is a gold-free star shower (perfect
  // scores). With no style it picks rain or cannons, so it stays fresh.
  let lastStyle = "";
  function confetti(count = 160, style) {
    if (calm()) return;
    if (!style) { style = Math.random() < 0.5 ? "rain" : "cannons"; if (style === lastStyle) style = style === "rain" ? "cannons" : "rain"; }
    lastStyle = style;
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const base = { rot: rand(0, 6.28), spin: rand(-0.2, 0.2), size: rand(8, 14), color: pick(COLORS), life: 1, decay: rand(0.004, 0.008) };
      if (style === "cannons") {
        const left = i % 2 === 0, angle = rand(-1.35, -0.9) * 1, speed = rand(9, 17);
        particles.push({ ...base, shape: pick(SHAPES), x: left ? -10 : w + 10, y: h + 10,
          vx: Math.cos(angle) * speed * (left ? 1 : -1), vy: Math.sin(angle) * speed, gravity: 0.2, decay: rand(0.005, 0.009) });
      } else if (style === "stars") {
        particles.push({ ...base, shape: Math.random() < 0.75 ? "star" : "dot", size: rand(10, 20), x: rand(0, w), y: rand(-60, -10),
          vx: rand(-1, 1), vy: rand(1.5, 4), gravity: 0.05, spin: rand(-0.08, 0.08) });
      } else {
        particles.push({ ...base, shape: pick(SHAPES), x: rand(0, w), y: rand(-40, -10), vx: rand(-1.5, 1.5), vy: rand(2, 6), gravity: 0.08 });
      }
    }
    go();
  }

  // A floating emoji that drifts up and fades (the buddy's reactions)
  function reaction(x, y, symbol) {
    const el = document.createElement("span");
    el.className = "fx-react"; el.innerHTML = window.icon ? icon(symbol) : "";
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.setProperty("--dx", `${rand(-30, 30)}px`);
    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
    setTimeout(() => el.remove(), 1600);
  }

  // A little firework of dots from one point
  function burst(x, y, count = 18) {
    if (calm()) return;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, 6.28), speed = rand(1.5, 4.5);
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 0.05, rot: 0, spin: 0,
        size: rand(4, 8), color: pick(COLORS), shape: "dot",
        life: 1, decay: rand(0.02, 0.04),
      });
    }
    go();
  }

  // Material-style ripple inside a button, from where you clicked
  function ripple(button, event) {
    const r = document.createElement("span");
    r.className = "ripple";
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    r.style.width = r.style.height = `${size}px`;
    r.style.left = `${(event?.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
    r.style.top = `${(event?.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
    button.appendChild(r);
    r.addEventListener("animationend", () => r.remove());
  }

  // Close a popup smoothly: play the exit animation, then hide it.
  // Opening it again before that finishes cancels the close.
  function close(el, then) {
    if (!el || el.hidden) { if (then) then(); return; }
    if (el.classList.contains("closing")) return;
    if (calm()) { el.hidden = true; if (then) then(); return; }
    el.classList.add("closing");
    setTimeout(() => {
      if (!el.classList.contains("closing")) return;   // reopened meanwhile
      el.classList.remove("closing"); el.hidden = true; if (then) then();
    }, 170);
  }
  // Show a popup (cancels a close in progress) and replay its open animation
  function open(el, cls = "show") {
    el.classList.remove("closing"); el.hidden = false;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  }
  return { confetti, burst, ripple, reaction, close, open };
})();
