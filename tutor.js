/* ============================================================
   tutor.js — the tutor engine
   Watches what the learner types and compares it, piece by piece,
   against the current lesson. Decides when the buddy should speak,
   what to say, and which line he should float next to.

   No AI here: every message comes from the lesson data or from a
   small set of rules. That makes hints instant, accurate, and safe.

   Public API (used by app.js):
     tutor.start(lessonIndex)   load a lesson, clear the editor
     tutor.onChange()           call whenever the editor text changes
     tutor.onRun(result)        call with { ok, output } after a run
     tutor.review(stepIndex)    repeat a step's instructions (code untouched)
     tutor.stuck()              show ghost letters for what's left
     tutor.gotThis()            learner says they're fine
     tutor.current              { lesson, stepIndex, partIndex, complete, celebrated }
   ============================================================ */

const tutor = (() => {
  const OFFER_HINT_MS = 30000; // quiet this long -> remind them they can click the buddy

  let lesson = null;
  let stepIndex = 0;      // which step (line) the learner is on
  let partIndex = 0;      // which piece of that line they're on
  let complete = false;   // all lines typed correctly, waiting for Run
  let celebrated = false; // output matched at least once
  let ghosting = false;   // showing ghost letters for the current line
  let lastSaid = "";
  let offerTimer = null;
  let offered = false;
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
    onStepDone: () => {},
    unlockNext: () => {},
  };

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

  const isIndented = (line) => /^\s/.test(line);

  function lineMatches(typed, target) {
    if (norm(typed) !== norm(target)) return false;
    // indentation is the one place spaces DO matter in Python
    return isIndented(typed) === isIndented(target);
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

  // How many leading lines already match the lesson?
  function countCorrect(lines) {
    let n = 0;
    while (n < lesson.steps.length && n < lines.length && lineMatches(lines[n].text, lesson.steps[n].code)) n++;
    return n;
  }

  // ---------- turning a mistake into a kid-friendly sentence ----------

  const NAMES = {
    '"': 'a quote mark `"`', "(": "an open parenthesis `(`", ")": "a close parenthesis `)`",
    ":": "a colon `:`", "=": "an equals sign `=`", "+": "a plus sign `+`", ",": "a comma `,`",
    "!": "an exclamation mark `!`", " ": "a space",
  };
  const describe = (ch) => (ch === undefined ? "nothing more" : NAMES[ch] || `the letter \`${ch}\``);

  // Returns { text, wrongAt } or null. wrongAt = index in the TYPED line of
  // the first wrong character (so the editor can underline it), or null.
  function diagnose(typed, step, left) {
    const { s: t, map } = normMap(typed);
    const g = norm(step.code);
    if (t === "") return null;
    if (g.startsWith(t)) {
      // on track so far; only indentation could be wrong
      if (isIndented(step.code) && !isIndented(typed) && t.length > 2)
        return { text: "This line needs to be indented.\nPut 4 spaces at the start\nso it's inside the loop.", wrongAt: 0 };
      if (!isIndented(step.code) && isIndented(typed))
        return { text: "Don't indent this line.\nDelete the spaces at the start.", wrongAt: 0 };
      if (left) {
        for (const h of step.hints || []) if (h.match.test(typed)) return { text: h.say, wrongAt: null };
        return { text: `That line isn't finished yet.\nIt still needs ${describe(g[t.length])}.`, wrongAt: null };
      }
      return null;
    }
    // where does it go wrong?
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    const wrongAt = map[i] ?? typed.length;
    // lesson-specific hints first
    for (const h of step.hints || []) if (h.match.test(typed)) return { text: h.say, wrongAt };
    // capital letters?
    if (t.toLowerCase() === g.slice(0, t.length).toLowerCase())
      return { text: "Careful with capital letters!\nPython is picky: it all needs to be lowercase here.", wrongAt };
    const before = g.slice(Math.max(0, i - 8), i);
    if (i >= g.length) return { text: `There's extra stuff at the end.\nThe line should stop after \`${before}\``, wrongAt };
    return { text: `After \`${before || "the start"}\` I was expecting ${describe(g[i])},\nbut I see ${describe(t[i])}.`, wrongAt };
  }

  // ---------- composing messages ----------

  const step = () => lesson.steps[stepIndex];
  const part = () => step().parts[partIndex];

  // "# Type" section: what the learner should type right now
  function typeSection(label = "Type") {
    if (complete) return "# Next\nPress Run!";
    const p = part();
    return `# ${label}\n${p.say}\n\`${p.text}\``;
  }

  function say(text, state) {
    if (text === lastSaid) return;
    lastSaid = text;
    buddy.say(text, state);
  }

  // ---------- the main loop: called on every edit ----------

  function onChange() {
    clearTimeout(diagnoseTimer);
    resetOffer();
    // wait until they pause for a moment so we don't nag every keystroke
    diagnoseTimer = setTimeout(check, 400);
  }

  function check() {
    if (!lesson || complete) return;
    const lines = codeLines();
    const n = countCorrect(lines);

    if (n > stepIndex) {
      // they finished one or more whole lines
      const finished = lesson.steps[n - 1];
      const lastPart = finished.parts[finished.parts.length - 1];
      stepIndex = n;
      partIndex = 0;
      offered = false;
      stopGhost();
      ui.renderSteps(stepIndex);
      ui.onStepDone(lines[n - 1].number);
      if (stepIndex === lesson.steps.length) {
        complete = true;
        ui.markLine(null);
        say(`# ✓ \`${lastPart.text}\`\n${lastPart.explain}\n# Whole program typed!\nPress Run to see it work.`, "happy");
        return;
      }
      ui.markLine(lines[n] ? lines[n].number : null);
      say(`# ✓ \`${lastPart.text}\`\n${lastPart.explain}\n${typeSection("Next line")}`, "happy");
      return;
    }

    if (n < stepIndex) {
      // they broke a line that used to be right
      stepIndex = n;
      partIndex = 0;
      ui.renderSteps(stepIndex);
    }

    const line = lines[stepIndex];
    const left = line ? ui.getCursorLine() > line.number : false;
    const problem = line ? diagnose(line.text, step(), left) : null;

    if (problem) {
      ui.markLine(line.number);
      ui.markWrong(line.number, problem.wrongAt, line.text.length);
      if (ghosting) ui.ghost(line.number, ghostText(line.text));
      say(`# Hmm\n${problem.text}\n${typeSection()}`, "pointing");
      return;
    }

    ui.markWrong();
    ui.markLine(line ? line.number : null);
    if (ghosting) ui.ghost(line ? line.number : ui.getCursorLine(), ghostText(line ? line.text : ""));

    // No problem: did they finish a PIECE of the line? Teach it.
    const p = line ? countParts(line.text, step()) : 0;
    if (p > partIndex) {
      const done = step().parts[p - 1];
      partIndex = p;
      offered = false;
      say(`# ✓ \`${done.text}\`\n${done.explain}\n${typeSection("Now type")}`, "happy");
    } else if (p < partIndex) {
      partIndex = p;
    } else if (buddy.state === "pointing") {
      say(`# That's it!\nKeep going.\n${typeSection()}`, "happy");
    }
  }

  // ---------- stuck: ghost letters instead of a speech ----------

  // What's left of the current line, as it should be typed
  function ghostText(typed) {
    const target = step().code;
    const { s: t } = normMap(typed);
    const { s: g, map } = normMap(target);
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    if (i < t.length) return "";                 // they're off course: fix first
    const from = i < g.length ? map[i] : target.length;
    return target.slice(from);
  }

  function stuck() {
    if (!lesson || complete) return;
    ghosting = true;
    const lines = codeLines();
    const line = lines[stepIndex];
    ui.ghost(line ? line.number : ui.getCursorLine(), ghostText(line ? line.text : ""));
    say(`# Here's a hint\nThe gray letters show what's left.\nType them and they turn real.\n${typeSection()}`, "pointing");
  }

  function gotThis() {
    stopGhost();
    say(`# You've got this!\n${typeSection()}`, "happy");
  }

  function stopGhost() {
    ghosting = false;
    ui.ghost();
  }

  // ---------- a gentle reminder that help exists ----------

  function resetOffer() {
    clearTimeout(offerTimer);
    if (!lesson || complete) return;
    offerTimer = setTimeout(() => {
      if (complete || offered) return;
      offered = true;
      say(`# Need a hint?\nClick me anytime.\n${typeSection()}`, "thinking");
    }, OFFER_HINT_MS);
  }

  // ---------- clicking a step in the panel ----------

  function review(i) {
    if (!lesson) return;
    clearTimeout(diagnoseTimer);
    const s = lesson.steps[i];
    const lines = codeLines();
    if (lines[i]) ui.markLine(lines[i].number);
    if (i < stepIndex) {
      // a finished line: walk through what each piece meant
      const recap = s.parts.map((p) => `\`${p.text.trim()}\` ${p.explain.split("\n")[0]}`).join("\n");
      say(`# Line ${i + 1}\n${recap}`, "pointing");
    } else if (i === stepIndex) {
      say(complete ? "# All typed!\nPress Run to see it work." : typeSection(), "pointing");
    } else {
      say(`# Not yet\nFirst finish line ${stepIndex + 1}.\n${typeSection()}`, "pointing");
    }
    lastSaid = ""; // so the next real event can repeat itself if needed
  }

  // ---------- after Run ----------

  function onRun({ ok, output }) {
    if (!lesson || !ok) return; // errors are handled by app.js (it has the line number)
    if (output.trim() === lesson.expectedOutput && !celebrated) {
      celebrated = true;
      say(`# Ran your code ✓\n# YES!\n${lesson.done}`, "celebrate");
      ui.unlockNext(lesson.id);
    } else if (celebrated) {
      say("# Ran your code ✓\nNice experiment!\nChange something else and run it again,\nor go to the next lesson.", "happy");
    } else if (!complete) {
      say(`# Ran your code ✓\nIt works so far! But we're not finished.\n${typeSection()}`, "happy");
    } else {
      say("# Ran your code ✓\nBut the output isn't what I expected.\nCompare it with the steps on the left.", "thinking");
    }
  }

  function start(index) {
    lesson = LESSONS[index];
    stepIndex = 0;
    partIndex = 0;
    complete = false;
    celebrated = false;
    offered = false;
    lastSaid = "";
    stopGhost();
    ui.markWrong();
    ui.setCode("");
    ui.renderSteps(0);
    ui.markLine(0);
    say(`# Lesson ${index + 1} · ${lesson.title}\n${lesson.intro}\n${typeSection()}`, "idle");
    resetOffer();
  }

  return {
    start, onChange, onRun, review, stuck, gotThis, ui,
    get current() { return { lesson, stepIndex, partIndex, complete, celebrated }; },
  };
})();
