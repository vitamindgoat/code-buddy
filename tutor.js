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
  // Checkpoints: lessons with several lines stop after certain lines so the
  // learner runs the program and sees the output before typing more.
  let cpIndex = 0;        // which checkpoint we're working toward
  let awaitingRun = false;// the checkpoint line is typed; waiting for Run
  let talking = false;    // ghost letters wait until the buddy finishes
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
  // Explanation length (settings). Short: the first sentence only.
  // Normal: the explanation. Detailed: plus the "more" note when a part
  // has one (the why behind it, or a common mistake to watch for).
  function explainText(part) {
    const len = ui.explainLength();
    if (len === "short") return firstSentence(part.explain);
    if (len === "long" && part.more) return `${part.explain}\n${part.more}`;
    return part.explain;
  }
  function firstSentence(text) {
    const m = text.replace(/\n/g, " ").match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : text.split("\n")[0];
  }
  // Whole-message trim for Short: every plain line keeps its first sentence.
  // Labels (# ...) and code chips (lines that are just a `chip`) stay.
  function trimForLength(text) {
    if (ui.explainLength() !== "short") return text;
    return text.split("\n").map((line) => (line.startsWith("# ") || /^`[^`]*`$/.test(line.trim()) ? line : firstSentence(line))).join("\n");
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

  // A step may carry a `bug`: a broken version the learner types FIRST,
  // runs, and watches crash, before fixing it to the real code. While a
  // step's bug phase is on, its target (and parts) are the buggy version.
  let bugDone = {};           // step index -> true once the crash was seen
  let earlyFix = false;       // they fixed a bug line without running the crash
  const stepCode = (st, i) => (st.bug && !bugDone[i] ? st.bug.code : st.code);
  const stepParts = (st, i) => (st.bug && !bugDone[i] ? st.bug.parts : st.parts);
  const targets = () => (mode === "practice" ? lesson.practice.solution : lesson.steps.map((st, i) => stepCode(st, i)));
  // the practice goal as the buddy says it: the task, then the exact output
  function goalText(pr) {
    const lines = pr.expectedOutput.split("\n");
    const show = (l) => (/[<>]/.test(l) ? l : `\`${l}\``);   // <class 'float'> reads badly as code
    const out = lines.length === 1 ? `It should print ${show(lines[0])}.` : `It should print these ${lines.length} lines:\n${lines.map(show).join("\n")}`;
    return `${pr.task}\n${out}`;
  }
  const checkpoints = () => (lesson.checkpoints && lesson.checkpoints.length ? lesson.checkpoints : [{ after: lesson.steps.length - 1, output: lesson.expectedOutput }]);
  const checkpoint = () => checkpoints()[Math.min(cpIndex, checkpoints().length - 1)];
  // lines past the current checkpoint are off-limits until it's been run
  const lineLimit = () => (mode === "practice" ? Infinity : checkpoint().after + 1);

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
    text = trimForLength(text);
    if (text === lastSaid) return;
    lastSaid = text;
    talking = true;
    ui.ghost();                 // nothing to copy while he's explaining
    buddy.say(text, state);
  }
  // the buddy finished a message: now the gray letters may appear
  buddy.onDone(() => {
    talking = false;
    if (!lesson) return;
    const lines = codeLines();
    showGhost(lines, mode === "practice" ? countCorrect(lines) : Math.min(stepIndex, lines.length));
  });

  const step = () => lesson.steps[stepIndex];
  const part = () => stepParts(step(), stepIndex)[partIndex];

  // "Type" section: the piece the learner should type right now
  // "go to the next section": names the real button ("Practice", "Next lesson"...)
  function keepGoing() {
    const label = ui.nextLabel && ui.nextLabel();
    return label ? `# Keep going\nPress *${label}* to go to the next section.` : "# Keep going\nThat was the last one. You finished everything!";
  }
  function typeSection(label = "Type") {
    if (complete) return "# Next\nEverything is typed, so press Run!";
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
    if (!lesson) return;
    if (mode === "practice") return complete ? undefined : checkPractice();

    let lines = codeLines();
    let n = countCorrect(lines);

    if (complete || awaitingRun) {
      if (n >= stepIndex) {
        // everything typed is still there: nothing more to type until they Run
        if (awaitingRun) ui.ghost();
        return;
      }
      // they deleted or broke a line after finishing (or before running):
      // stop saying "all typed" and follow along again
      if (complete) {
        complete = false;
        // a finished lesson already showed its crash; don't make them redo it,
        // and skip the mid-lesson runs: the next stop is the whole program
        lesson.steps.forEach((st, i) => { if (st.bug) bugDone[i] = true; });
        cpIndex = checkpoints().length - 1;
        lines = codeLines(); n = countCorrect(lines);
      }
      awaitingRun = false;
      if (ui.onNotReady) ui.onNotReady();
      stepIndex = Math.min(n, targets().length);
      const cur = lines[stepIndex], st = lesson.steps[stepIndex];
      partIndex = cur && st ? countParts(cur.text, { parts: stepParts(st, stepIndex) }) : 0;
      mistake = false; lastSaid = "";
      ui.renderSteps(stepIndex);
      ui.markLine(cur ? cur.number : null);
      showGhost(lines, stepIndex);
      say(typeSection(`Back to line ${stepIndex + 1}`), "pointing");
      armStuck(STUCK_AFTER_IDLE_MS);
      return;
    }

    if (n > stepIndex) {
      // they finished one or more whole lines
      const finished = lesson.steps[n - 1];
      const fparts = stepParts(finished, n - 1);
      const lastPart = fparts[fparts.length - 1];
      stepIndex = n; partIndex = 0; mistake = false;
      ui.renderSteps(stepIndex);
      ui.markWrong();
      ui.onStepDone(lines[n - 1].number);
      if (finished.bug && bugDone[n - 1] && ui.onBugFixed) ui.onBugFixed();   // the planted crash is fixed
      if (stepIndex >= lineLimit()) {
        // reached a checkpoint: run it before going on
        awaitingRun = true;
        ui.ghost(); ui.markLine(null); ui.stuckTag(false);
        const last = cpIndex === checkpoints().length - 1;
        const cp = checkpoint();
        say(`# ✓ \`${lastPart.text}\`\n${explainText(lastPart)}\n# Now run it\n${cp.error ? "Press Run and watch what happens." : last ? "That's the whole program! Press Run to see what it prints." : "Before we add more, press Run and see what this prints so far."}`, "happy");
        ui.onReadyToRun();
        return;
      }
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
    const cmp = compare(typed, stepCode(step(), stepIndex));
    const off = !cmp.onTrack || (cmp.indent && norm(typed).length > 1);

    const stillBuggy = step().bug && bugDone[stepIndex] && norm(typed) === norm(step().bug.code);
    if (off && stillBuggy) {
      // the crash was seen; the old line just needs the fix the buddy showed
      ui.markWrong(); ui.markLine(line.number); ui.ghost();
      return;
    }
    if (off) {
      // Silent: red underline + no ghost. The buddy only speaks if asked.
      if (!mistake) { mistake = true; ui.onMistake(); }
      ui.markLine(line.number);
      ui.markWrong(line.number, cmp.wrongAt ?? 0, typed.length, stepCode(step(), stepIndex));
      ui.ghost();
      armStuck(STUCK_AFTER_MISTAKE_MS);
      return;
    }

    mistake = false;
    ui.markWrong();
    ui.markLine(line ? line.number : ui.getCursorLine());
    showGhost(lines, stepIndex);

    // Did they finish a PIECE of the line? Teach it.
    const p = line ? countParts(typed, { parts: stepParts(step(), stepIndex) }) : 0;
    if (p > partIndex) {
      const done = stepParts(step(), stepIndex)[p - 1];
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
  // Only the piece the buddy just asked for, not the whole rest of the line
  function pieceRemainder(typed, target) {
    const rest = remainder(typed, target);
    if (mode !== "lesson" || !rest) return rest;
    const parts = stepParts(step(), stepIndex);
    const upto = parts.slice(0, partIndex + 1).map((p) => p.text).join("");
    // how much of the target does the current piece reach?
    const reach = target.indexOf(upto.trim()) >= 0 ? target.indexOf(upto.trim()) + upto.trim().length : target.length;
    const typedLen = target.length - rest.length;
    return target.slice(typedLen, Math.max(typedLen, reach));
  }

  // What the ghost should show right now: { lineNumber, text } or null.
  // Pure (no side effects), so app.js can call it on every keystroke.
  let ghostAsked = false;   // in "stuck" ghost mode: shown after a hint click
  function ghostFor(lines, idx) {
    if (!lesson || complete) return null;
    if (mode === "practice" && !ghostAsked) return null;
    if (mode === "lesson" && ui.ghostMode() === "stuck" && !ghostAsked) return null;
    if (mode === "lesson" && (talking || awaitingRun)) return null;   // listen first; run first
    if (mode === "lesson" && idx >= lineLimit()) return null;
    const target = targets()[idx];
    if (!target) return null;
    const line = lines[idx];
    const cursorLine = ui.getCursorLine();
    if (!line) {
      // the next line doesn't exist yet: if the cursor still sits on a
      // finished line, the only thing to do is press Enter
      const cursorText = ui.getCode().split("\n")[cursorLine] || "";
      if (cursorText.trim() !== "") return { lineNumber: cursorLine, text: "  ⏎" };
      return { lineNumber: cursorLine, text: pieceRemainder(cursorText, target) };
    }
    return { lineNumber: line.number, text: pieceRemainder(line.text, target) };
  }

  function ghostNow() {
    if (!lesson) return null;
    const lines = codeLines();
    return ghostFor(lines, countCorrect(lines));
  }

  function checkPractice() {
    const lines = codeLines();
    const n = countCorrect(lines);
    if (ghostAsked) {
      // ghost mode: behave like a lesson, but silent
      const line = lines[n];
      const typed = line ? line.text : "";
      const target = lesson.practice.solution[n];
      if (!target) { ui.ghost(); ui.markWrong(); return; }
      const cmp = compare(typed, target);
      if (!cmp.onTrack) { ui.markWrong(line.number, cmp.wrongAt ?? 0, typed.length, target); ui.ghost(); }
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
    if (awaitingRun) return say("# Run it\nNothing more to type right now. Press Run and look at the output.", "pointing");

    const lines = codeLines();
    const line = lines[stepIndex];
    const typed = line ? line.text : "";
    const cmp = compare(typed, stepCode(step(), stepIndex));
    lastSaid = "";

    if (cmp.indent === "more") return say(`# Hint\nThis line needs to be indented more. Press Tab at the start of it.\n${typeSection()}`, "pointing");
    if (cmp.indent === "less") return say(`# Hint\nThis line is indented too much. Press Backspace at the start of it.\n${typeSection()}`, "pointing");
    if (!cmp.onTrack) {
      const s = step();
      const h = (s.hints || []).find((h) => h.match.test(typed));
      const g = norm(stepCode(s, stepIndex)), i = cmp.matched;
      const generic = `The red part isn't right.\nAfter \`${g.slice(Math.max(0, i - 8), i) || "the start"}\` it should be ${describe(g[i])}.`;
      return say(`# Hint\n${h ? h.say : generic}\nTap the little bubble above the red part to fix it.\n${typeSection()}`, "pointing");
    }
    say(`# Hint\nYou're on track! The gray letters show what's left.\n${typeSection()}`, "pointing");
  }

  const NAMES = {
    '"': 'a quote mark `"`', "(": "an open parenthesis `(`", ")": "a close parenthesis `)`",
    ":": "a colon `:`", "=": "an equals sign `=`", "+": "a plus sign `+`", ",": "a comma `,`",
    "!": "an exclamation mark `!`", "*": "a star `*`", "#": "a hash `#`", "%": "a percent sign `%`", "/": "a slash `/`",
  };
  const describe = (ch) => (ch === undefined ? "nothing more" : NAMES[ch] || (/\d/.test(ch) ? `the number \`${ch}\`` : `the letter \`${ch}\``));

  // Hints are questions, not answers: each one points at the idea they're
  // missing and leaves the typing to them. After three, the gray letters
  // turn on so nobody stays stuck forever.
  function practiceHint() {
    const p = lesson.practice;
    if (hintsUsed >= 3) {
      ghostAsked = true;
      checkPractice();
      return say(`# No hints left\nI'm out of questions, so the gray letters show the answer now. Follow them, then try to explain each line to yourself.`, "thinking");
    }
    hintsUsed++;
    lastSaid = "";
    const left = 3 - hintsUsed;
    const extra = hintsUsed === 3
      ? "\nThink about that one. If you're still stuck, click me once more and I'll show the gray letters."
      : `\nThink it through and give it a try. ${left} hint${left === 1 ? "" : "s"} left.`;
    say(`# Hint ${hintsUsed} of 3\n${p.hints[hintsUsed - 1]}${extra}`, "pointing");
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
      say(`# Not yet\nFinish line ${stepIndex + 1} first.\n${typeSection()}`, "pointing");
    }
  }

  // ---------- after Run ----------

  // Python crashed. If this checkpoint EXPECTED that crash (a bug step), the
  // crash is the lesson: explain it, then flip the step to its fixed code.
  // Returns true when handled, so app.js skips its generic error message.
  function onError({ error, line }) {
    if (!lesson || mode !== "lesson" || !awaitingRun) return false;
    const cp = checkpoint();
    if (!cp.error || !error.includes(cp.error)) return false;
    const i = cp.after;
    const st = lesson.steps[i];
    bugDone[i] = true;
    awaitingRun = false; cpIndex++;
    stepIndex = i; partIndex = 0;     // back onto this line, now with the fixed target
    const lines = codeLines();
    ui.renderSteps(stepIndex);
    if (lines[i]) ui.markLine(lines[i].number);
    lastSaid = "";
    say(`# It crashed, on purpose\n${st.bug.explain}\n# Fix it\n${st.bug.fix}\n\`${st.code.trim()}\``, "pointing");
    armStuck(STUCK_AFTER_IDLE_MS);
    return true;
  }

  function onRun({ ok, output }) {
    if (!lesson || !ok) return; // errors are handled by app.js (it has the line number)
    const expected = mode === "practice" ? lesson.practice.expectedOutput : lesson.expectedOutput;
    lastSaid = "";
    // a mid-lesson checkpoint: explain what printed, then open the next line
    if (mode === "lesson" && awaitingRun && checkpoint().error) {
      // they were meant to see a crash here but the code ran: they fixed
      // it early. Fine, count the bug as seen and judge the real output.
      bugDone[checkpoint().after] = true;
      cpIndex++;
      earlyFix = true;
    }
    if (mode === "lesson" && awaitingRun && cpIndex < checkpoints().length - 1) {
      const cp = checkpoint();
      if (output.trim() === cp.output.trim()) {
        awaitingRun = false; cpIndex++;
        const lines = codeLines();
        ui.markLine(ui.getCursorLine());
        say(`# Ran your code\n${cp.say || "That's exactly what we expected."}\n${typeSection("Next line")}`, "happy");
        armStuck(STUCK_AFTER_IDLE_MS);
      } else {
        say(`# Ran your code\nHmm, I expected it to print \`${cp.output.trim().split("\n").pop()}\`. Check the line against the steps on the left, then run it again.`, "thinking");
      }
      return;
    }
    if (output.trim() === expected && !celebrated) {
      celebrated = true;
      complete = true; awaitingRun = false;
      ui.ghost(); ui.markWrong(); ui.stuckTag(false);
      const done = mode === "practice" ? "You solved it on your own!" : earlyFix ? "You fixed the bug before it even crashed. Nice catch!" : lesson.done;
      say(`# Ran your code\nYes! It worked. ${done}\n# What now?\n${keepGoing().split("\n")[1]}`, "celebrate");
      ui.onComplete(mode);
    } else if (celebrated && !complete && output.trim() === expected) {
      // retyped after deleting: it's whole again
      complete = true; awaitingRun = false;
      ui.ghost(); ui.markWrong(); ui.stuckTag(false); if (ui.onNotReady) ui.onNotReady();
      say("# Ran your code\nAll back and working! Move on whenever you're ready.", "celebrate");
    } else if (celebrated) {
      say("# Ran your code\nNice experiment! Change something else and run it again, or move on when you're ready.", "happy");
    } else if (mode === "practice") {
      say(`# Ran your code\nIt ran, but that's not the output we want yet.\n# Goal\n${goalText(lesson.practice)}\n# Stuck?\nClick me if you want a hint.`, "thinking");
    } else if (!complete) {
      say(`# Ran your code\nIt works so far, but we're not finished yet.\n${typeSection()}`, "happy");
    } else {
      say("# Ran your code\nHmm, it ran, but the output isn't what I expected. Compare your lines with the steps on the left.", "thinking");
    }
  }

  // ---------- starting ----------

  function reset(l) {
    lesson = l;
    stepIndex = 0; partIndex = 0; hintsUsed = 0; ghostAsked = false;
    cpIndex = 0; awaitingRun = false; talking = false; bugDone = {}; earlyFix = false;
    complete = false; celebrated = false; mistake = false;
    lastSaid = "";
    clearTimeout(stuckTimer); clearTimeout(diagnoseTimer);
    ui.ghost(); ui.markWrong(); ui.stuckTag(false);
    ui.setCode("");
  }

  // saved = { code, hintsUsed, finished } from a previous visit (or null)
  function start(l, saved) {
    mode = "lesson";
    reset(l);
    if (saved && (saved.code || saved.hintsUsed)) return resume(saved);
    ui.renderSteps(0);
    ui.markLine(0);
    const who = l.inputs ? `\n# Input\nWhen the program asks, the user will type \`${l.inputs.join("`, then `")}\`.` : "";
    const deep = ui.explainLength() === "long" && l.why ? `\n# Why it matters\n${l.why}` : "";
    say(`# Lesson ${l.number} · ${l.title}\n${l.intro} Let's build it together, one piece at a time.${deep}${who}\n${typeSection()}`, "idle");
    showGhost([], 0);
    armStuck(STUCK_AFTER_IDLE_MS);
  }

  function startPractice(l, saved) {
    mode = "practice";
    reset(l);
    if (saved && (saved.code || saved.hintsUsed)) return resume(saved);
    ui.renderSteps(0);
    ui.markLine(0);
    const who = l.practice.inputs ? `\n# Input\nWhen the program asks, the user will type \`${l.practice.inputs.join("`, then `")}\`.` : "";
    const nm = ui.name && ui.name() ? `, ${ui.name()}` : "";
    say(`# Practice · ${l.title}\nYour turn${nm}! This time you write the code without my help.\n# Goal\n${goalText(l.practice)}${who}\n# Stuck?\nClick me. You get 3 hints.`, "idle");
    armStuck(STUCK_AFTER_IDLE_MS);
  }

  // Put the saved code back and work out where they were, without the
  // usual "you finished a line!" chatter for every line already typed.
  function resume(saved) {
    ui.setCode(saved.code);
    hintsUsed = saved.hintsUsed || 0; ghostAsked = !!saved.ghostAsked;
    const lines = codeLines();
    if (mode === "lesson") {
      // a fixed bug line in the saved code means that crash was already seen
      lesson.steps.forEach((st, i) => { const ln = lines[i]; if (st.bug && ln && lineMatches(ln.text, st.code)) bugDone[i] = true; });
      // so does a saved checkpoint position past an on-purpose crash: the
      // buggy line is still there, unfixed, and must not count as done
      if (saved.cpIndex !== undefined) checkpoints().forEach((cp, k) => { if (k < saved.cpIndex && cp.error) bugDone[cp.after] = true; });
    }
    const n = countCorrect(lines);
    stepIndex = Math.min(n, targets().length); partIndex = 0;
    if (mode === "lesson") {
      // which checkpoint are they on? a typed-but-not-run checkpoint line
      // means they still owe a Run
      cpIndex = 0;
      while (cpIndex < checkpoints().length - 1 && stepIndex > checkpoints()[cpIndex].after + 1) cpIndex++;
      awaitingRun = !saved.finished && stepIndex >= checkpoints()[cpIndex].after + 1;
      // a run they already did counts: the saved checkpoint position wins
      // when the code still matches it
      const prev = saved.cpIndex ? checkpoints()[saved.cpIndex - 1] : null;
      const reached = !prev ? 0 : prev.error ? prev.after : prev.after + 1;   // a crash checkpoint leaves you ON its line
      if (saved.cpIndex !== undefined && saved.cpIndex >= cpIndex && saved.cpIndex < checkpoints().length && stepIndex >= reached) {
        cpIndex = saved.cpIndex;
        awaitingRun = !saved.finished && !!saved.awaitingRun && stepIndex >= checkpoints()[cpIndex].after + 1;
      }
    }
    if (saved.finished) { complete = true; celebrated = true; }
    else if (mode === "lesson" && stepIndex === lesson.steps.length) complete = true;
    ui.renderSteps(stepIndex);
    ui.markLine(lines.length ? lines[Math.min(stepIndex, lines.length - 1)].number : 0);
    if (saved.finished) {
      ui.ghost(); ui.markWrong();
      say(mode === "practice"
        ? `# Welcome back!\nYou already solved this practice. Your code is still here.\n${keepGoing()}`
        : `# Welcome back!\nYou already finished this lesson. Your code is still here.\n${keepGoing()}`, "happy");
      return;
    }
    // Pick up the conversation where it stopped: the buddy repeats what he
    // was saying when they left (the last finished piece and what to type
    // next, or the "run it" prompt), after a short hello.
    let body;
    if (mode === "practice") body = `# Goal\n${goalText(lesson.practice)}`;
    else if (complete) body = "# Next\nEverything is typed. Press Run to see it work.";
    else {
      const cur = lines[stepIndex], step = lesson.steps[stepIndex];
      partIndex = cur && step ? countParts(cur.text, { parts: stepParts(step, stepIndex) }) : 0;
      const donePiece = (parts, k) => `# ✓ \`${parts[k].text}\`\n${explainText(parts[k])}\n`;
      const stillBug = step && step.bug && bugDone[stepIndex] && cur && norm(cur.text) === norm(step.bug.code);
      if (stillBug) {
        body = `# It crashed, on purpose\n${step.bug.explain}\n# Fix it\n${step.bug.fix}\n\`${step.code.trim()}\``;
        partIndex = 0;
      } else if (awaitingRun) {
        const fparts = stepParts(lesson.steps[stepIndex - 1], stepIndex - 1);
        const cp = checkpoint(), last = cpIndex === checkpoints().length - 1;
        body = `${donePiece(fparts, fparts.length - 1)}# Now run it\n${cp.error ? "Press Run and watch what happens." : last ? "That's the whole program! Press Run to see what it prints." : "Before we add more, press Run and see what this prints so far."}`;
      } else if (partIndex > 0) {
        body = `${donePiece(stepParts(step, stepIndex), partIndex - 1)}${typeSection("Now type")}`;
      } else if (stepIndex > 0) {
        const fparts = stepParts(lesson.steps[stepIndex - 1], stepIndex - 1);
        body = `${donePiece(fparts, fparts.length - 1)}${typeSection("Next line")}`;
      } else {
        body = `${lesson.intro}\n${typeSection()}`;
      }
    }
    const nm = ui.name && ui.name() ? `, ${ui.name()}` : "";
    say(`# Welcome back${nm}!\nYour code is right where you left it.\n${body}`, "happy");
    if (awaitingRun) ui.onReadyToRun();
    if (mode === "practice") checkPractice(); else showGhost(lines, stepIndex);
    clearTimeout(diagnoseTimer);   // setCode fired onChange; don't let it talk over the welcome
    armStuck(STUCK_AFTER_IDLE_MS);
  }

  return {
    start, startPractice, onChange, onRun, onError, hint, review, ghostNow, ui,
    get current() { return { mode, lesson, stepIndex, partIndex, complete, celebrated, hintsUsed, ghostAsked, cpIndex, awaitingRun }; },
    displayCode: (i) => (lesson && lesson.steps[i] ? stepCode(lesson.steps[i], i) : ""),
  };
})();
