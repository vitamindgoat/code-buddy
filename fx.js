/* ============================================================
   fx.js — visual effects
   Small, dependency-free effects drawn on a full-screen <canvas>
   that sits above everything and ignores the mouse.

     fx.confetti()        big burst from the top: lesson complete
     fx.burst(x, y)       small sparkle pop at a point: a line done
     fx.ripple(button, e) click ripple inside a button

   Each particle is a plain object { x, y, vx, vy, ... }. Every frame we
   move them, draw them, and drop the ones that have faded out.
   ============================================================ */

const fx = (() => {
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const COLORS = ["#74bcfe", "#1e6fd9", "#ffb703", "#ff5d8f", "#17a673", "#8b5cf6", "#b6e3ff"];
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
      else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (particles.length) requestAnimationFrame(frame);
    else running = false;
  }

  function go() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  // Confetti rains from the top edge, like someone threw it from above
  function confetti(count = 160) {
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, w), y: rand(-40, -10),
        vx: rand(-1.5, 1.5), vy: rand(2, 6),
        gravity: 0.08, rot: rand(0, 6.28), spin: rand(-0.2, 0.2),
        size: rand(8, 14), color: pick(COLORS),
        shape: Math.random() < 0.7 ? "rect" : "dot",
        life: 1, decay: rand(0.004, 0.008),
      });
    }
    go();
  }

  // A little firework of dots from one point
  function burst(x, y, count = 18) {
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

  return { confetti, burst, ripple };
})();
