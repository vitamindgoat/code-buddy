/* ============================================================
   badges.js — achievements, toasts and the Trophies screen
   A small set of badges earned by doing things in the course. Earned
   badges live in progress.badges as { id: "YYYY-MM-DD" } (app.js saves
   them). Each new one pops a toast in the corner (queued, so a burst of
   three plays one after another) with its own little jingle.

     badges.earn(id)           give a badge (no-op if already earned)
     badges.check(ctx)         look at the course state and award any
                               badges that are now deserved
     badges.show()             open the Trophies screen
     badges.count()            [earned, total]
     badges.init({ get, save }) wire to the saved progress

   Everything is drawn with emoji + CSS: no image files.
   ============================================================ */

const badges = (() => {
  const $ = (id) => document.getElementById(id);
  const LIST = [
    { id: "first-line",   icon: "keyboard", name: "First line",       hint: "Type your first full line of code." },
    { id: "first-run",    icon: "play_arrow", name: "It runs!",         hint: "Run a program for the first time." },
    { id: "first-lesson", icon: "menu_book", name: "Lesson one",       hint: "Finish your first coding lesson." },
    { id: "no-hints",     icon: "psychology", name: "No hints needed",  hint: "Solve a practice without asking for a hint." },
    { id: "first-quiz",   icon: "edit_note", name: "Quiz taker",       hint: "Finish a module quiz." },
    { id: "perfect-quiz", icon: "military_tech", name: "Perfect score",    hint: "Get every question right on a quiz." },
    { id: "module",       icon: "flag", name: "Module master",    hint: "Finish every lesson, practice and quiz in a module." },
    { id: "five",         icon: "counter_5", name: "High five",        hint: "Finish 5 lessons." },
    { id: "ten",          icon: "filter_9_plus", name: "Double digits",    hint: "Finish 10 lessons." },
    { id: "all",          icon: "trophy", name: "Graduate",         hint: "Finish the whole course." },
    { id: "scratch",      icon: "edit", name: "Scribbler",        hint: "Open the scratch pad during a quiz." },
    { id: "comeback",     icon: "repeat", name: "Back again",       hint: "Come back on another day to keep going." },
    { id: "fixer",        icon: "wand_stars", name: "Quick fix",        hint: "Fix a typo with the autocorrect bubble." },
    { id: "final",        icon: "sports_esports", name: "Game maker",       hint: "Finish the final project: build the guessing game." },
    { id: "bug-squash",   icon: "bug_report", name: "Bug squasher",     hint: "Fix a program that crashed on purpose." },
  ];
  let earned = {}, save = () => {};
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- toasts ----------
  const stack = $("toast-stack");
  const queue = []; let showing = false;
  function toast(b) {
    queue.push(b);
    if (!showing) next();
  }
  function next() {
    const b = queue.shift();
    if (!b) { showing = false; return; }
    showing = true;
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.innerHTML = `<span class="toast-icon">${icon(b.icon)}</span><span class="toast-text"><b>Badge earned</b><span>${b.name}</span></span>`;
    el.addEventListener("click", () => { el.classList.add("out"); });
    stack.appendChild(el);
    if (window.sfx) sfx.badge();
    const gone = () => { el.remove(); setTimeout(next, 180); };
    el.addEventListener("animationend", (e) => { if (e.animationName === "toast-out") gone(); });
    setTimeout(() => el.classList.add("out"), 3200);
    setTimeout(() => { if (el.isConnected) gone(); }, 4000);   // in case animations are off
  }

  function earn(id) {
    if (earned[id] || !LIST.some((b) => b.id === id)) return false;
    earned[id] = today();
    save(earned);
    toast(LIST.find((b) => b.id === id));
    renderButton();
    return true;
  }

  // ctx: { lessonsDone, moduleDone, quizDone, quizPerfect, courseDone, practiceNoHints, firstRun }
  function check(ctx = {}) {
    if (ctx.lessonsDone >= 1 && ctx.lessonType === "code") earn("first-lesson");
    if (ctx.practiceNoHints) earn("no-hints");
    if (ctx.quizDone) earn("first-quiz");
    if (ctx.quizPerfect) earn("perfect-quiz");
    if (ctx.moduleDone) earn("module");
    if (ctx.lessonsDone >= 5) earn("five");
    if (ctx.lessonsDone >= 10) earn("ten");
    if (ctx.courseDone) earn("all");
  }

  // ---------- Trophies screen ----------
  const root = $("trophies");
  function renderButton() {
    const [n, t] = count();
    for (const el of document.querySelectorAll("[data-trophy-count]")) el.textContent = `${n} / ${t}`;
  }
  function show() {
    const [n, t] = count();
    $("trophies-sub").textContent = n === t ? "You earned every single one. Legend." : n ? `${n} of ${t} earned. ${t - n} to go.` : `${t} to earn. Each one is a little milestone.`;
    $("trophies-grid").innerHTML = LIST.map((b, i) => {
      const on = earned[b.id];
      const when = on ? new Date(on + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
      return `<div class="trophy ${on ? "on" : ""}" style="--i:${i}" title="${b.hint}">
        <span class="trophy-icon">${icon(on ? b.icon : "lock")}</span>
        <b>${b.name}</b>
        <span class="trophy-hint">${on ? `Earned ${when}` : b.hint}</span>
      </div>`;
    }).join("");
    fx.open(root);
    if (window.sfx) sfx.pop();
    setTimeout(() => $("trophies-close").focus(), 400);
  }
  function hide() { fx.close(root); }
  $("trophies-close").addEventListener("click", hide);
  root.addEventListener("click", (e) => { if (e.target === root) hide(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) hide(); });

  function count() { return [Object.keys(earned).filter((id) => LIST.some((b) => b.id === id)).length, LIST.length]; }
  function init(o) { earned = o.get() || {}; save = o.save; renderButton(); }

  return { earn, check, show, hide, count, init, LIST, get open() { return !root.hidden; } };
})();
