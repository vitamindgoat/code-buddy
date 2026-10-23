/* ============================================================
   backup.js — save your progress to a file, load it back, and print
   a progress report.

   CodeBuddy has no accounts: everything lives in this browser
   (localStorage keys starting with "codebuddy."). So:
     backup.download()   saves all of it as one .json file
     backup.restore()    picks a file, checks it really is a CodeBuddy
                         backup, asks first, then loads it and reloads
     backup.report()     a one-page progress report you can print or
                         save as PDF (for a teacher or a parent)

   app.js passes in what the report needs: backup.init({ ... }).
   ============================================================ */

const backup = (() => {
  const $ = (id) => document.getElementById(id);
  const PREFIX = "codebuddy.";
  let ctx = null;

  const today = () => new Date().toISOString().slice(0, 10);
  function collect() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) data[k] = localStorage.getItem(k);
    }
    return data;
  }
  function download() {
    let data; try { data = collect(); } catch { return ctx.toast("Couldn't read your progress in this browser."); }
    const file = { app: "CodeBuddy", kind: "progress-backup", version: 1, exported: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(file, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `CodeBuddy-progress-${today()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (window.sfx) sfx.success();
  }

  // A file is accepted only if it's a CodeBuddy backup whose progress parses.
  function validate(text) {
    let f; try { f = JSON.parse(text); } catch { return "That file isn't a CodeBuddy backup (it isn't valid JSON)."; }
    if (!f || f.app !== "CodeBuddy" || f.kind !== "progress-backup" || typeof f.data !== "object" || !f.data) return "That file isn't a CodeBuddy backup.";
    const keys = Object.keys(f.data);
    if (!keys.length || keys.some((k) => !k.startsWith(PREFIX) || typeof f.data[k] !== "string")) return "That backup file looks damaged.";
    if (f.data["codebuddy.progress"]) { try { const p = JSON.parse(f.data["codebuddy.progress"]); if (typeof p !== "object" || !p) throw 0; } catch { return "The progress inside that backup is damaged."; } }
    return f;
  }
  function restore() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0]; if (!file) return;
      if (file.size > 5e6) return ctx.toast("That file is too big to be a CodeBuddy backup.");
      const f = validate(await file.text());
      if (typeof f === "string") return ctx.toast(f);
      let done = 0;
      try { const p = JSON.parse(f.data["codebuddy.progress"] || "{}"); done = Object.keys(p.done || {}).length; } catch {}
      const when = new Date(f.exported).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      ctx.confirm({
        title: "Load this backup?",
        sub: `It's from ${when} with ${done} finished item${done === 1 ? "" : "s"}. It replaces everything in this browser right now, including your saved programs.`,
        yes: "Yes, load the backup", no: "Cancel",
        onYes: () => {
          try {
            for (const k of Object.keys(collect())) localStorage.removeItem(k);
            for (const [k, v] of Object.entries(f.data)) localStorage.setItem(k, v);
          } catch { return ctx.toast("Couldn't save the backup in this browser (storage may be full or blocked)."); }
          location.reload();
        },
      });
    });
    input.click();
  }

  // ---------- the printable report ----------
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function report() {
    const d = ctx.data();
    const pct = Math.round((d.stats.done / d.stats.total) * 100);
    const mods = d.modules.map((m) => `
      <section class="rep-mod">
        <h3>Module ${m.n}: ${esc(m.title)} <span>${m.done}/${m.total}${m.quiz ? ` · quiz ${m.quiz.score}/${m.quiz.total}` : ""}</span></h3>
        <table><thead><tr><th>#</th><th>Lesson</th><th>Lesson</th><th>Practice</th></tr></thead><tbody>
        ${m.lessons.map((l) => `<tr><td>${l.number}</td><td>${esc(l.title)}</td><td>${l.done ? "✓" : "–"}</td><td>${l.reading ? "<span class='rep-na'>reading</span>" : l.practice ? "✓" : "–"}</td></tr>`).join("")}
        </tbody></table>
      </section>`).join("");
    $("report-body").innerHTML = `
      <div class="rep-top">
        <div><div class="rep-brand">CodeBuddy · Progress report</div>
          <h2>${esc(d.name || "Learner")}</h2>
          <div class="rep-date">${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div></div>
        <div class="rep-pct"><b>${pct}%</b><span>of the course</span></div>
      </div>
      <div class="rep-bar"><i style="width:${pct}%"></i></div>
      <div class="rep-stats">
        <div><b>${d.stats.lessons}</b><span>lessons</span></div>
        <div><b>${d.stats.practices}</b><span>practices</span></div>
        <div><b>${d.stats.quizzes}</b><span>quizzes</span></div>
        <div><b>${d.stats.quizzes ? d.stats.avg + "%" : "–"}</b><span>quiz average</span></div>
        <div><b>${d.streak.best}</b><span>best streak (days)</span></div>
        <div><b>${d.dailyCount}</b><span>daily challenges</span></div>
      </div>
      ${mods}
      <section class="rep-mod"><h3>Badges <span>${d.badges.length} of ${d.badgeTotal}</span></h3>
        <p class="rep-badges">${d.badges.length ? d.badges.map((b) => `<span>${b.icon} ${esc(b.name)}</span>`).join("") : "None yet."}</p></section>
      <p class="rep-foot">${d.complete ? "Course complete. Certificate earned." : `${d.stats.total - d.stats.done} items to go until the certificate.`} Days active: ${d.daysActive}. Made with CodeBuddy, a free learn-to-code app.</p>`;
    const root = $("report");
    root.hidden = false; root.classList.remove("show"); void root.offsetWidth; root.classList.add("show");
    document.body.classList.add("printing-report");
    setTimeout(() => $("report-print").focus(), 300);
    if (window.sfx) sfx.pop();
  }
  function closeReport() { $("report").hidden = true; document.body.classList.remove("printing-report"); }
  $("report-print").addEventListener("click", () => window.print());
  $("report-close").addEventListener("click", closeReport);
  $("report").addEventListener("click", (e) => { if (e.target === $("report")) closeReport(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("report").hidden) closeReport(); });

  function init(c) { ctx = c; }
  return { download, restore, report, validate, init };
})();
