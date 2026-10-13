/* ============================================================
   tutor.js — the tutor engine
   Watches what the learner types and compares it, piece by piece,
   against the current lesson. Decides when the buddy speaks, what the
   editor shows (ghost letters, red underlines), and when to celebrate.

   Two modes:
     lesson    guided: ghost letters show what's left, the buddy explains
               each piece as it's typed. Mistakes are silent (red underline
               + ghost); clicking the buddy gives the hint.
     practice  on your own: a task, no ghost, no explanations. Clicking the
               buddy gives up to 3 hints; the 3rd turns ghost letters on.

   No AI here: every message comes from the lesson data or from a
   small set of rules. That makes hints instant, accurate, and safe.

   Public API (used by app.js):
     tutor.start(lesson)        guided lesson
     tutor.startPractice(lesson)
     tutor.onChange()           call whenever the editor text changes
     tutor.onRun(result)        call with { ok, output } after a run
     tutor.hint()               the learner clicked the buddy
     tutor.review(stepIndex)    repeat a step's instructions (code untouched)
     tutor.current              { mode, lesson, stepIndex, partIndex, complete, celebrated }
   ============================================================ */

const tutor = (() => {
  const STUCK_AFTER_MISTAKE_MS = 6000;  // a wrong char sits there this long -> "Stuck?" tag
  const STUCK_AFTER_IDLE_MS = 25000;    // no typing this long -> "Stuck?" tag

  let mode = "lesson";
  let lesson = null;
  let stepIndex = 0;      // which step (line) the learner is on
  let partIndex = 0;      // which piece of that line they're on
  let complete = false;   // all lines typed correctly, waiting for Run
  let celebrated = false; // output matched at least once
  let hintsUsed = 0;      // practice mode
  let lastSaid = "";
  let mistake = false;    // currently off course?
  let stuckTimer = null;
  let diagnoseTimer = null;

  // Hooks that app.js fills in (keeps this file independent of the page)
  const ui = {
    getCode: () => "",
    getCursorLine: () => 0,
    setCode: () => {},
    renderSteps: () => {},
    markLine: () => {},
    markWrong: () => {},      // (lineNumber, fromCh, toCh) or () to clear
    ghost: () => {},          // (lineNumber, text) or () to clear
    stuckTag: () => {},       // (true/false) show the "Stuck?" callout
    onPartDone: () => {},
    onStepDone: () => {},     // (lineNumber)
    onMistake: () => {},
    onComplete: () => {},     // lesson or practice finished (output matched)
    onReadyToRun: () => {},   // whole program typed: point at Run
    explainLength: () => "normal",   // "short" | "normal" | "long" (settings)
    ghostMode: () => "always",       // "always" | "stuck" (settings)
  };

  // Trim or expand an explanation to the learner's chosen length
  function explainText(part) {
    const len = ui.explainLength();
    const lines = part.explain.split("\n");
    if (len === "short") return lines[0];
    if (len === "long" && part.say) return `${part.explain}\n(${part.say})`;
    return part.explain;
  }

  // ---------- normalizing: what counts as "the same code" ----------

  // Python doesn't care about spaces outside of strings, and ' vs " is
  // the same thing. So "print ( 'hi' )" should match 'print("hi")'.
  // We walk the text char by char: drop whitespace unless inside quotes,
  // and turn ' into ". We also remember, for each kept character, where it
  // came from in the original text (so we can highlight the right spot).
  function normMap(text) {
    let out = "", quote = null;
    const map = [];
    [...text].forEach((ch, i) => {
      if (quote) {
        if (ch === quote) { quote = null; out += '"'; } else out += ch;
        map.push(i);
      } else if (ch === '"' || ch === "'") {
        quote = ch; out += '"'; map.push(i);
      } else if (!/\s/.test(ch)) {
        out += ch; map.push(i);
      }
    });
    return { s: out, map };
  }
  const norm = (text) => normMap(text).s;

  // Indentation LEVEL (4 spaces or a tab = one level). The one place
  // where spaces matter in Python.
  function indentLevel(line) {
    const lead = line.match(/^[ \t]*/)[0];
    return Math.round((lead.replace(/\t/g, "    ").length) / 4);
  }

  function lineMatches(typed, target) {
    return norm(typed) === norm(target) && indentLevel(typed) === indentLevel(target);
  }

  // How many of a step's parts has the typed line completed?
  function countParts(typed, step) {
    const t = norm(typed);
    let done = 0, sofar = "";
    for (const part of step.parts) {
      sofar += norm(part.text);
      if (t.startsWith(sofar)) done++; else break;
    }
    return done;
  }

  // ---------- figuring out where the learner is ----------

  // Non-blank lines, with their real line numbers (for pointing at them)
  function codeLines() {
    return ui.getCode().split("\n")
      .map((text, number) => ({ text, number }))
      .filter((l) => l.text.trim() !== "");
  }

  const targets = () => (mode === "practice" ? lesson.practice.solution : lesson.steps.map((s) => s.code));

  // How many leading lines already match?
  function countCorrect(lines) {
    const t = targets();
    let n = 0;
    while (n < t.length && n < lines.length && lineMatches(lines[n].text, t[n])) n++;
    return n;
  }

  // Where does a typed line diverge from its target? Returns
  // { onTrack, wrongAt (index in typed), indent: "more"|"less"|null }
  function compare(typed, target) {
    const { s: t, map } = normMap(typed);
    const g = norm(target);
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    const onTrack = i === t.length;              // everything typed so far matches
    const wrongAt = onTrack ? null : map[i];
    let indent = null;
    if (t.length > 0) {
      const want = indentLevel(target), have = indentLevel(typed);
      if (have < want) indent = "more"; else if (have > want) indent = "less";
    }
    return { onTrack, wrongAt, matched: i, indent };
  }

  // What's left of the target line, as it should be typed (for the ghost)
  function remainder(typed, target) {
    const { s: t } = normMap(typed);
    const { s: g, map } = normMap(target);
    // blank line: show the whole thing, minus any indentation already there
    if (t === "") return target.slice(Math.min(typed.length, target.match(/^[ \t]*/)[0].length));
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    if (i < t.length) return "";                 // off course: no ghost
    const from = i < g.length ? map[i] : target.length;
    return target.slice(from);
  }

  // ---------- speaking ----------

  function say(text, state) {
    if (text === lastSaid) return;
    lastSaid = text;
    buddy.say(text, state);
  }

  const step = () => lesson.steps[stepIndex];
  const part = () => step().parts[partIndex];

  // "Type" section: the piece the learner should type right now
  function typeSection(label = "Type") {
    if (complete) return "# Next\nPress Run!";
    const p = part();
    return `# ${label}\n${p.say}\n\`${p.text}\``;
  }

  // ---------- the main loop: called on every edit ----------

  function onChange() {
    clearTimeout(diagnoseTimer);
    ui.stuckTag(false);
    armStuck(STUCK_AFTER_IDLE_MS);
    diagnoseTimer = setTimeout(check, mode === "practice" ? 250 : 350);
  }

  function armStuck(ms) {
    clearTimeout(stuckTimer);
    if (!lesson || complete) return;
    stuckTimer = setTimeout(() => { if (!complete) ui.stuckTag(true); }, ms);
  }

  function check() {
    if (!lesson || complete) return;
    if (mode === "practice") return checkPractice();

    const lines = codeLines();
    const n = countCorrect(lines);

    if (n > stepIndex) {
      // they finished one or more whole lines
      const finished = lesson.steps[n - 1];
      const lastPart = finished.parts[finished.parts.length - 1];
      stepIndex = n; partIndex = 0; mistake = false;
      ui.renderSteps(stepIndex);
      ui.markWrong();
      ui.onStepDone(lines[n - 1].number);
      if (stepIndex === lesson.steps.length) {
        complete = true;
        ui.ghost(); ui.markLine(null); ui.stuckTag(false);
        say(`# ✓ \`${lastPart.text}\`\n${explainText(lastPart)}\n# Whole program typed!\nPress Run to see what it really prints.`, "happy");
        ui.onReadyToRun();
        return;
      }
      showGhost(lines, n);
      ui.markLine(lines[n] ? lines[n].number : null);
      say(`# ✓ \`${lastPart.text}\`\n${explainText(lastPart)}\n${typeSection("Next line")}`, "happy");
      return;
    }

    if (n < stepIndex) {
      // they broke a line that used to be right
      stepIndex = n; partIndex = 0;
      ui.renderSteps(stepIndex);
    }

    const line = lines[stepIndex];
    const typed = line ? line.text : "";
    const cmp = compare(typed, step().code);
    const off = !cmp.onTrack || (cmp.indent && norm(typed).length > 1);

    if (off) {
      // Silent: red underline + no ghost. The buddy only speaks if asked.
      if (!mistake) { mistake = true; ui.onMistake(); }
      ui.markLine(line.number);
      ui.markWrong(line.number, cmp.wrongAt ?? 0, typed.length);
      ui.ghost();
      armStuck(STUCK_AFTER_MISTAKE_MS);
      return;
    }

    mistake = false;
    ui.markWrong();
    ui.markLine(line ? line.number : ui.getCursorLine());
    showGhost(lines, stepIndex);

    // Did they finish a PIECE of the line? Teach it.
    const p = line ? countParts(typed, step()) : 0;
    if (p > partIndex) {
      const done = step().parts[p - 1];
      partIndex = p;
      ui.onPartDone();
      say(`# ✓ \`${done.text}\`\n${explainText(done)}\n${typeSection("Now type")}`, "happy");
    } else if (p < partIndex) {
      partIndex = p;
    }
  }

  // Ghost letters for the line being worked on (lesson mode, or practice
  // after the 3rd hint)
  function showGhost(lines, idx) {
    const g = ghostFor(lines, idx);
    g ? ui.ghost(g.lineNumber, g.text) : ui.ghost();
  }

  // What the ghost should show right now: { lineNumber, text } or null.
  // Pure (no side effects), so app.js can call it on every keystroke.
  let ghostAsked = false;   // in "stuck" ghost mode: shown after a hint click
  function ghostFor(lines, idx) {
    if (!lesson || complete) return null;
    if (mode === "practice" && hintsUsed < 3) return null;
    if (mode === "lesson" && ui.ghostMode() === "stuck" && !ghostAsked) return null;
    const target = targets()[idx];
    if (!target) return null;
    const line = lines[idx];
    const cursorLine = ui.getCursorLine();
    if (!line) {
      // the next line doesn't exist yet: if the cursor still sits on a
      // finished line, the only thing to do is press Enter
      const cursorText = ui.getCode().split("\n")[cursorLine] || "";
      if (cursorText.trim() !== "") return { lineNumber: cursorLine, text: "  ⏎" };
      return { lineNumber: cursorLine, text: remainder(cursorText, target) };
    }
    return { lineNumber: line.number, text: remainder(line.text, target) };
  }

  function ghostNow() {
    if (!lesson) return null;
    const lines = codeLines();
    return ghostFor(lines, countCorrect(lines));
  }

  function checkPractice() {
    const lines = codeLines();
    const n = countCorrect(lines);
    ui.renderSteps(n);
    if (hintsUsed >= 3) {
      // ghost mode: behave like a lesson, but silent
      const line = lines[n];
      const typed = line ? line.text : "";
      const target = lesson.practice.solution[n];
      if (!target) { ui.ghost(); ui.markWrong(); return; }
      const cmp = compare(typed, target);
      if (!cmp.onTrack) { ui.markWrong(line.number, cmp.wrongAt ?? 0, typed.length); ui.ghost(); }
      else { ui.markWrong(); showGhost(lines, n); }
    }
  }

  // ---------- the learner clicked the buddy ----------

  function hint() {
    if (!lesson) return;
    ui.stuckTag(false);
    if (mode === "practice") return practiceHint();
    ghostAsked = true;
    showGhost(codeLines(), stepIndex);
    if (complete) return say("# All typed!\nPress Run to see it work.", "pointing");

    const lines = codeLines();
    const line = lines[stepIndex];
    const typed = line ? line.text : "";
    const cmp = compare(typed, step().code);
    lastSaid = "";

    if (cmp.indent === "more") return say(`# Hint\nThis line needs to be indented more.\nPress Tab at the start.\n${typeSection()}`, "pointing");
    if (cmp.indent === "less") return say(`# Hint\nThis line is indented too much.\nPress Backspace at the start.\n${typeSection()}`, "pointing");
    if (!cmp.onTrack) {
      const s = step();
      const h = (s.hints || []).find((h) => h.match.test(typed));
      const g = norm(s.code), i = cmp.matched;
      const generic = `The red part isn't right.\nAfter \`${g.slice(Math.max(0, i - 8), i) || "the start"}\` it should be ${describe(g[i])}.`;
      return say(`# Hint\n${h ? h.say : generic}\nDelete the red part and follow the gray letters.\n${typeSection()}`, "pointing");
    }
    say(`# Hint\nYou're on track! The gray letters show what's left.\n${typeSection()}`, "pointing");
  }

  const NAMES = {
    '"': 'a quote mark `"`', "(": "an open parenthesis `(`", ")": "a close parenthesis `)`",
    ":": "a colon `:`", "=": "an equals sign `=`", "+": "a plus sign `+`", ",": "a comma `,`",
    "!": "an exclamation mark `!`", "*": "a star `*`", "#": "a hash `#`", "%": "a percent sign `%`", "/": "a slash `/`",
  };
  const describe = (ch) => (ch === undefined ? "nothing more" : NAMES[ch] || (/\d/.test(ch) ? `the number \`${ch}\`` : `the letter \`${ch}\``));

  function practiceHint() {
    const p = lesson.practice;
    if (hintsUsed >= 3) return say(`# No hints left\nThe gray letters show the answer.\n*Hint 3/3*`, "thinking");
    hintsUsed++;
    lastSaid = "";
    const left = 3 - hintsUsed;
    const extra = hintsUsed === 3 ? "\nGray letters are on now. Follow them." : `\n${left} hint${left === 1 ? "" : "s"} left.`;
    say(`# Hint ${hintsUsed} of 3\n${p.hints[hintsUsed - 1]}${extra}`, "pointing");
    if (hintsUsed === 3) checkPractice();
  }

  // ---------- clicking a step in the panel ----------

  function review(i) {
    if (!lesson || mode === "practice") return;
    clearTimeout(diagnoseTimer);
    const s = lesson.steps[i];
    const lines = codeLines();
    if (lines[i]) ui.markLine(lines[i].number);
    lastSaid = "";
    if (i < stepIndex) {
      const recap = s.parts.map((p) => `\`${p.text.trim()}\` ${p.explain.split("\n")[0]}`).join("\n");
      say(`# Line ${i + 1}\n${recap}`, "pointing");
    } else if (i === stepIndex) {
      say(complete ? "# All typed!\nPress Run to see it work." : typeSection(), "pointing");
    } else {
      say(`# Not yet\nFirst finish line ${stepIndex + 1}.\n${typeSection()}`, "pointing");
    }
  }

  // ---------- after Run ----------

  function onRun({ ok, output }) {
    if (!lesson || !ok) return; // errors are handled by app.js (it has the line number)
    const expected = mode === "practice" ? lesson.practice.expectedOutput : lesson.expectedOutput;
    lastSaid = "";
    if (output.trim() === expected && !celebrated) {
      celebrated = true;
      complete = true;
      ui.ghost(); ui.markWrong(); ui.stuckTag(false);
      const done = mode === "practice" ? "You solved it on your own!" : lesson.done;
      say(`# Ran your code ✓\n# YES!\n${done}`, "celebrate");
      ui.onComplete(mode);
    } else if (celebrated) {
      say("# Ran your code ✓\nNice experiment!\nChange something else and run it again,\nor move on.", "happy");
    } else if (mode === "practice") {
      say(`# Ran your code ✓\nBut that's not the output we want yet.\n# Goal\n${lesson.practice.task}\nClick me for a hint.`, "thinking");
    } else if (!complete) {
      say(`# Ran your code ✓\nIt works so far! But we're not finished.\n${typeSection()}`, "happy");
    } else {
      say("# Ran your code ✓\nBut the output isn't what I expected.\nCompare it with the steps on the left.", "thinking");
    }
  }

  // ---------- starting ----------

  function reset(l) {
    lesson = l;
    stepIndex = 0; partIndex = 0; hintsUsed = 0; ghostAsked = false;
    complete = false; celebrated = false; mistake = false;
    lastSaid = "";
    clearTimeout(stuckTimer); clearTimeout(diagnoseTimer);
    ui.ghost(); ui.markWrong(); ui.stuckTag(false);
    ui.setCode("");
  }

  function start(l) {
    mode = "lesson";
    reset(l);
    ui.renderSteps(0);
    ui.markLine(0);
    const who = l.inputs ? `\n# The user will type\n\`${l.inputs.join("`, `")}\`` : "";
    say(`# Lesson ${l.number} · ${l.title}\n${l.intro}${who}\n${typeSection()}`, "idle");
    showGhost([], 0);
    armStuck(STUCK_AFTER_IDLE_MS);
  }

  function startPractice(l) {
    mode = "practice";
    reset(l);
    ui.renderSteps(0);
    ui.markLine(0);
    const who = l.practice.inputs ? `\n# The user will type\n\`${l.practice.inputs.join("`, `")}\`` : "";
    say(`# Practice · ${l.title}\nYour turn, no help from me.\n# Goal\n${l.practice.task}${who}\n# Stuck?\nClick me. You get 3 hints.`, "idle");
    armStuck(STUCK_AFTER_IDLE_MS);
  }

  return {
    start, startPractice, onChange, onRun, hint, review, ghostNow, ui,
    get current() { return { mode, lesson, stepIndex, partIndex, complete, celebrated, hintsUsed }; },
  };
})();
