/* ============================================================
   backup.js — the progress report.
     backup.report()     a one-page progress report you can print or
                         save as PDF (for a teacher or a parent)

   app.js passes in what the report needs: backup.init({ ... }).
   ============================================================ */

const backup = (() => {
  const $ = (id) => document.getElementById(id);
  let ctx = null;

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
      </div>
      ${mods}
      <section class="rep-mod"><h3>Badges <span>${d.badges.length} of ${d.badgeTotal}</span></h3>
        <p class="rep-badges">${d.badges.length ? d.badges.map((b) => `<span>${icon(b.icon)} ${esc(b.name)}</span>`).join("") : "None yet."}</p></section>
      <p class="rep-foot">${d.complete ? "Course complete!" : `${d.stats.total - d.stats.done} items left in the course.`} Days active: ${d.daysActive}. Made with CodeBuddy, a free learn-to-code app.</p>`;
    const root = $("report");
    fx.open(root);
    document.body.classList.add("printing-report");
    setTimeout(() => $("report-print").focus(), 300);
    if (window.sfx) sfx.pop();
  }
  function closeReport() { fx.close($("report"), () => document.body.classList.remove("printing-report")); }
  $("report-print").addEventListener("click", () => window.print());
  $("report-close").addEventListener("click", closeReport);
  $("report").addEventListener("click", (e) => { if (e.target === $("report")) closeReport(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("report").hidden) closeReport(); });

  function init(c) { ctx = c; }
  return { report, init };
})();
