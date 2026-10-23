/* ============================================================
   finish.js — the quiz score share card
   "Share score" on a finished quiz draws a square PNG card (logo, module,
   score ring, name, date) and shares it with the Web Share API on phones,
   or downloads it on computers.

     finishScreen.scoreCard({ module, score, total, name })  -> PNG blob
     finishScreen.shareScore({ module, score, total, name })
   ============================================================ */

const finish = (() => {
  let logoImg = null;
  const loadLogo = () => logoImg || (logoImg = new Promise((res) => {
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null);
    img.src = `assets/logo.png?v=${document.querySelector('meta[name="build"]').content}`;
  }));
  function fmtDate(d = new Date()) {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  // Draw text that shrinks until it fits `maxW`
  function fitText(c, text, x, y, maxW, size, weight = 800, min = 28) {
    let s = size;
    do { c.font = `${weight} ${s}px Nunito, "Segoe UI", sans-serif`; if (c.measureText(text).width <= maxW) break; s -= 2; } while (s > min);
    c.fillText(text, x, y);
    return s;
  }

  // ---------- Quiz score share card ----------
  // A square 1080x1080 PNG (the size social apps like), same paper look as
  // logo, module, big score, percent ring, name and date.
  async function scoreCard({ module, score, total, name }) {
    const S = 1080, cv = document.createElement("canvas"); cv.width = cv.height = S;
    const c = cv.getContext("2d");
    try { await Promise.all([document.fonts.load('900 160px "Nunito"'), document.fonts.load('800 40px "Nunito"')]); } catch {}
    const logo = await loadLogo();
    const pct = Math.round((score / total) * 100);
    const g = c.createLinearGradient(0, 0, S, S); g.addColorStop(0, "#f3f9ff"); g.addColorStop(1, "#dcefff");
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    c.fillStyle = "rgba(19, 90, 182, 0.08)";
    for (let x = 50; x < S; x += 40) for (let y = 50; y < S; y += 40) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
    c.lineWidth = 6; c.strokeStyle = "#135ab6"; c.strokeRect(36, 36, S - 72, S - 72);
    c.lineWidth = 2; c.strokeStyle = "#74bcfe"; c.strokeRect(54, 54, S - 108, S - 108);
    c.textAlign = "center";
    if (logo) c.drawImage(logo, S / 2 - 60, 96, 120, 120);
    c.fillStyle = "#06337e"; c.font = '900 34px Nunito, "Segoe UI", sans-serif'; c.fillText("CodeBuddy", S / 2, 252);
    c.fillStyle = "#135ab6"; c.font = '800 26px Nunito, "Segoe UI", sans-serif';
    c.letterSpacing = "6px"; c.fillText("QUIZ SCORE", S / 2, 312); c.letterSpacing = "0px";
    c.fillStyle = "#1d2433"; fitText(c, module, S / 2, 372, S - 220, 44, 800, 26);
    // percent ring
    const cx = S / 2, cy = 600, r = 170;
    c.lineCap = "round"; c.lineWidth = 30;
    c.strokeStyle = "#cfe6ff"; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = pct === 100 ? "#17a673" : "#1e6fd9";
    c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100); c.stroke();
    c.fillStyle = "#06337e"; c.font = '900 120px Nunito, "Segoe UI", sans-serif'; c.fillText(`${score}/${total}`, cx, cy + 22);
    c.fillStyle = pct === 100 ? "#17a673" : "#1e6fd9"; c.font = '900 46px Nunito, "Segoe UI", sans-serif'; c.fillText(`${pct}%`, cx, cy + 86);
    const line = pct === 100 ? "Perfect score!" : pct >= 70 ? "Nice work!" : "Getting there!";
    c.fillStyle = "#1d2433"; c.font = '900 50px Nunito, "Segoe UI", sans-serif'; c.fillText(line, S / 2, 868);
    c.fillStyle = "#5b6475"; c.font = '700 30px Nunito, "Segoe UI", sans-serif';
    c.fillText(`${(name || "").trim() ? name.trim() + " · " : ""}${fmtDate()}`, S / 2, 926);
    c.fillStyle = "#135ab6"; c.font = '800 24px Nunito, "Segoe UI", sans-serif'; c.fillText("Learning Python with CodeBuddy", S / 2, 990);
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }
  // Share it as a file where the device can (phones), otherwise download it.
  async function shareScore(o) {
    const b = await scoreCard(o); if (!b) return "fail";
    const file = new File([b], `CodeBuddy-quiz-${o.score}-of-${o.total}.png`, { type: "image/png" });
    const text = `I scored ${o.score}/${o.total} on the "${o.module}" quiz in CodeBuddy!`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "My CodeBuddy quiz score", text }); return "shared"; } catch { return "cancel"; }
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    try { await navigator.clipboard.writeText(text); return "downloaded+copied"; } catch { return "downloaded"; }
  }

  return { scoreCard, shareScore };
})();

window.finishScreen = finish;   // quiz.js has its own finish(), so it reaches this one by name
