/* ============================================================
   finish.js — the course-complete screen and the certificate
   Shown once everything (every lesson, practice and quiz) is done, and
   again any time from the sidebar's "Certificate" button. Before the
   course is finished the same screen works as a progress report, with
   the certificate locked.

     finish.show({ complete, stats, name, onName, onBack })
       complete  true when every item is done
       stats     { done, total, lessons, practices, quizzes, avg, hints }
       name      the name to print (may be "")
       onName    called with the name whenever the learner edits it
       onBack    called when the screen closes
     finish.hide()

   The certificate is drawn on a <canvas> (1600 x 1131, landscape A4-ish)
   so it downloads as a crisp PNG and can go through the Web Share API on
   phones. The learner's name is fitted to the width, never cut off.
   ============================================================ */

const finish = (() => {
  const $ = (id) => document.getElementById(id);
  const root = $("finish"), canvas = $("cert-canvas"), nameInput = $("finish-name");
  const W = 1600, H = 1131;
  let opts = null, logoImg = null, drawTimer = null;

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

  async function draw() {
    if (!opts) return;
    const c = canvas.getContext("2d");
    canvas.width = W; canvas.height = H;
    try { await Promise.all([document.fonts.load('800 96px "Nunito"'), document.fonts.load('700 30px "Nunito"'), document.fonts.load('900 30px "Nunito"')]); } catch {}
    const logo = await loadLogo();
    const name = (opts.name || "").trim() || "Future Programmer";
    const st = opts.stats;

    // paper
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#f3f9ff"); g.addColorStop(1, "#e4f3ff");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // faint dot grid, like the editor's scratch pad
    c.fillStyle = "rgba(19, 90, 182, 0.08)";
    for (let x = 60; x < W; x += 40) for (let y = 60; y < H; y += 40) { c.beginPath(); c.arc(x, y, 1.6, 0, Math.PI * 2); c.fill(); }
    // double border
    c.lineWidth = 6; c.strokeStyle = "#135ab6"; c.strokeRect(40, 40, W - 80, H - 80);
    c.lineWidth = 2; c.strokeStyle = "#74bcfe"; c.strokeRect(58, 58, W - 116, H - 116);
    // corner ornaments
    c.fillStyle = "#1e6fd9";
    for (const [x, y] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]) {
      c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = "#1e6fd9";
    }
    // ribbon stripe on the left
    c.fillStyle = "#1e6fd9"; c.fillRect(72, 60, 22, H - 120);
    c.fillStyle = "#74bcfe"; c.fillRect(94, 60, 8, H - 120);

    c.textAlign = "center"; c.textBaseline = "alphabetic";
    const cx = W / 2 + 40;
    if (logo) c.drawImage(logo, cx - 70, 92, 140, 140);
    c.fillStyle = "#06337e"; c.font = '900 34px Nunito, "Segoe UI", sans-serif'; c.fillText("CodeBuddy", cx, 272);
    c.fillStyle = "#135ab6"; c.font = '800 24px Nunito, "Segoe UI", sans-serif';
    c.letterSpacing = "8px"; c.fillText("CERTIFICATE OF COMPLETION", cx, 330); c.letterSpacing = "0px";

    c.fillStyle = "#5b6475"; c.font = '700 30px Nunito, "Segoe UI", sans-serif'; c.fillText("This certifies that", cx, 430);
    c.fillStyle = "#06337e"; fitText(c, name, cx, 540, 1150, 104, 800);
    // underline under the name
    c.strokeStyle = "#b6e3ff"; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 520, 568); c.lineTo(cx + 520, 568); c.stroke();

    c.fillStyle = "#5b6475"; c.font = '700 30px Nunito, "Segoe UI", sans-serif';
    c.fillText("completed the full CodeBuddy Python course:", cx, 640);
    c.fillStyle = "#1d2433"; c.font = '800 34px Nunito, "Segoe UI", sans-serif';
    const avg = st.quizzes ? ` · quiz average ${st.avg}%` : "";
    c.fillText(`${st.lessons} lessons · ${st.practices} practices · ${st.quizzes} quizzes${avg}`, cx, 696);

    // signature line + date
    c.textAlign = "left"; c.fillStyle = "#1d2433";
    c.strokeStyle = "#135ab6"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(260, 900); c.lineTo(700, 900); c.stroke();
    c.font = '800 30px Nunito, "Segoe UI", sans-serif'; c.fillText("Buddy", 262, 886);
    c.fillStyle = "#5b6475"; c.font = '700 22px Nunito, "Segoe UI", sans-serif'; c.fillText("Your coding buddy", 262, 936);
    c.textAlign = "right"; c.fillStyle = "#1d2433";
    c.beginPath(); c.moveTo(W - 180, 900); c.lineTo(W - 620, 900); c.stroke();
    c.font = '800 30px Nunito, "Segoe UI", sans-serif'; c.fillText(fmtDate(), W - 182, 886);
    c.fillStyle = "#5b6475"; c.font = '700 22px Nunito, "Segoe UI", sans-serif'; c.fillText("Date completed", W - 182, 936);

    c.textAlign = "center"; c.fillStyle = "#135ab6"; c.font = '800 22px Nunito, "Segoe UI", sans-serif';
    c.fillText("Learned Python by typing every line, one step at a time.", cx, 1030);
  }

  function blob() { return new Promise((res) => canvas.toBlob(res, "image/png")); }
  function fileName() { return `CodeBuddy-certificate-${(opts?.name || "").trim().replace(/[^\w-]+/g, "_") || "me"}.png`; }

  async function download() {
    await draw();
    const b = await blob(); if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (window.sfx) sfx.success();
  }
  async function share() {
    await draw();
    const b = await blob(); if (!b) return;
    const file = new File([b], fileName(), { type: "image/png" });
    try { await navigator.share({ files: [file], title: "My CodeBuddy certificate", text: "I finished the CodeBuddy Python course!" }); } catch {}
  }

  function stat(n, label) { return `<div class="finish-stat"><b>${n}</b><span>${label}</span></div>`; }

  function show(o) {
    opts = o;
    const st = o.stats;
    root.classList.toggle("complete-yes", o.complete);
    $("finish-kicker").textContent = o.complete ? "Course complete" : "Your progress";
    const who = (o.name || "").trim();
    $("finish-title").textContent = o.complete ? `You finished CodeBuddy${who ? `, ${who}` : ""}!` : `${st.done} of ${st.total} done`;
    $("finish-sub").textContent = o.complete
      ? "Every lesson, every practice, every quiz. That is real Python you wrote."
      : `${st.total - st.done} to go. Finish everything to unlock your certificate.`;
    $("finish-stats").innerHTML = stat(st.lessons, "lessons") + stat(st.practices, "practices") + stat(st.quizzes, "quizzes") + stat(st.quizzes ? `${st.avg}%` : "–", "quiz average")
      + (st.streak ? `<div class="finish-streak">🔥 <b>${st.streak.cur}</b> day streak <span>· best ${st.streak.best}</span></div>` : "");
    $("finish-cert").hidden = !o.complete;
    $("finish-locked").hidden = o.complete;
    $("finish-pct").style.width = `${Math.round((st.done / st.total) * 100)}%`;
    nameInput.value = o.name || "";
    $("cert-share").hidden = !(navigator.canShare && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] }));
    if (window.buddy) buddy.mount($("finish-buddy"), o.complete ? "celebrate" : "happy");
    root.hidden = false;
    root.classList.remove("show"); void root.offsetWidth; root.classList.add("show");
    if (o.complete) { draw(); setTimeout(() => (o.name ? $("cert-download") : nameInput).focus(), 450); }
    else setTimeout(() => $("finish-back").focus(), 450);
  }
  function hide() {
    if (root.hidden) return;
    root.hidden = true;
    if (opts?.onBack) opts.onBack();
  }

  nameInput.addEventListener("input", () => {
    if (opts?.onName) opts.onName(nameInput.value);
    if (opts) opts.name = nameInput.value;
    clearTimeout(drawTimer); drawTimer = setTimeout(draw, 150);
  });
  $("cert-download").addEventListener("click", download);
  $("cert-share").addEventListener("click", share);
  $("finish-back").addEventListener("click", hide);
  $("finish-close").addEventListener("click", hide);
  root.addEventListener("click", (e) => { if (e.target === root) hide(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) hide(); });

  // ---------- Quiz score share card ----------
  // A square 1080x1080 PNG (the size social apps like), same paper look as
  // the certificate: logo, module, big score, percent ring, name and date.
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

  return { show, hide, scoreCard, shareScore, get open() { return !root.hidden; } };
})();
window.finishScreen = finish;   // quiz.js has its own finish(), so it reaches this one by name
