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
     tutor.current              { lesson, stepIndex, partIndex, complete, celebrated }
   ============================================================ */

const tutor = (() => {
  const NUDGE_MS = 15000; // silence this long -> buddy gives the answer

  let lesson = null;
  let stepIndex = 0;      // which step (line) the learner is on
  let partIndex = 0;      // which piece of that line they're on
  let complete = false;   // all lines typed correctly, waiting for Run
  let celebrated = false; // output matched at least once
  let lastSaid = "";
  let nudgeTimer = null;
  let nudged = false;
  let diagnoseTimer = null;

  // Hooks that app.js fills in (keeps this file independent of the page)
  const ui = {
    getCode: () => "",
    getCursorLine: () => 0,
    setCode: () => {},
    renderSteps: () => {},
    markLine: () => {},
    onStepDone: () => {},
    unlockNext: () => {},
  };

  // ---------- normalizing: what counts as "the same code" ----------

  // Python doesn't care about spaces outside of strings, and ' vs " is
  // the same thing. So "print ( 'hi' )" should match 'print("hi")'.
  // We walk the text char by char: drop whitespace unless inside quotes,
  // and turn ' into ".
  function norm(text) {
    let out = "", quote = null;
    for (const ch of text) {
      if (quote) {
        if (ch === quote) { quote = null; out += '"'; } else out += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch; out += '"';
      } else if (!/\s/.test(ch)) {
        out += ch;
      }
    }
    return out;
  }

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

  // `left` = the learner has moved on past this line (so an unfinished
  // line is a mistake now, not just "still typing")
  function diagnose(typed, step, left) {
    const t = norm(typed), g = norm(step.code);
    if (t === "") return null;
    if (g.startsWith(t)) {
      // on track so far; only indentation could be wrong
      if (isIndented(step.code) && !isIndented(typed) && t.length > 2)
        return "This line needs to be indented.\nPut 4 spaces at the start\nso it's inside the loop.";
      if (!isIndented(step.code) && isIndented(typed))
        return "Don't indent this line.\nDelete the spaces at the start.";
      if (left) {
        for (const h of step.hints || []) if (h.match.test(typed)) return h.say;
        return `That line isn't finished yet.\nAfter \`${g.slice(Math.max(0, t.length - 8))}\` it still needs ${describe(g[t.length])}.`;
      }
      return null;
    }
    // lesson-specific hints first
    for (const h of step.hints || []) if (h.match.test(typed)) return h.say;
    // capital letters?
    if (t.toLowerCase() === g.slice(0, t.length).toLowerCase())
      return "Careful with capital letters!\nPython is picky: it all needs to be lowercase here.";
    // generic: find the first character that differs
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    const before = g.slice(Math.max(0, i - 8), i);
    if (i >= g.length) return `Looks like there's extra stuff at the end.\nThe line should stop after \`${before}\``;
    return `Almost!\nAfter \`${before || "the start"}\` I was expecting ${describe(g[i])},\nbut I see ${describe(t[i])}.`;
  }

  // ---------- speaking ----------

  function say(text, state, ms) {
    if (text === lastSaid) return;
    lastSaid = text;
    buddy.say(text);
    if (state) buddy.set(state, ms);
  }

  const partSay = (si, pi) => lesson.steps[si].parts[pi].say;

  // ---------- the main loop: called on every edit ----------

  function onChange() {
    clearTimeout(diagnoseTimer);
    resetNudge();
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
      stepIndex = n;
      partIndex = 0;
      nudged = false;
      ui.renderSteps(stepIndex);
      ui.onStepDone(lines[n - 1].number);
      const lastPart = finished.parts[finished.parts.length - 1].explain;
      if (stepIndex === lesson.steps.length) {
        complete = true;
        ui.markLine(null);
        say(`${lastPart}\nThat's the whole program.\nPress Run!`, "happy", 1800);
        return;
      }
      say(`${lastPart}\n${partSay(stepIndex, 0)}`, "happy", 1500);
      ui.markLine(lines[n] ? lines[n].number : null);
      return;
    }

    if (n < stepIndex) {
      // they broke a line that used to be right
      stepIndex = n;
      partIndex = 0;
      ui.renderSteps(stepIndex);
    }

    const step = lesson.steps[stepIndex];
    const line = lines[stepIndex];
    const left = line ? ui.getCursorLine() > line.number : false;
    const problem = line ? diagnose(line.text, step, left) : null;

    if (problem) {
      ui.markLine(line.number);
      say(problem, "pointing");
      return;
    }

    ui.markLine(line ? line.number : null);

    // No problem: did they finish a PIECE of the line? Teach it.
    const p = line ? countParts(line.text, step) : 0;
    if (p > partIndex) {
      partIndex = p;
      nudged = false;
      say(`${step.parts[p - 1].explain}\n${partSay(stepIndex, p)}`, "happy", 1200);
    } else if (p < partIndex) {
      partIndex = p;
    } else if (buddy.state === "pointing") {
      say("That's it, keep going!", "happy", 1200);
    }
  }

  // ---------- nudging when they go quiet ----------

  function resetNudge() {
    clearTimeout(nudgeTimer);
    if (!lesson || complete) return;
    nudgeTimer = setTimeout(() => {
      if (complete || nudged) return;
      nudged = true;
      const step = lesson.steps[stepIndex];
      say(`Stuck? No worries.\nHere's the whole line:\n\`${step.code.trim()}\``, "thinking");
    }, NUDGE_MS);
  }

  // ---------- clicking a step in the panel ----------

  function review(i) {
    if (!lesson) return;
    clearTimeout(diagnoseTimer);
    const step = lesson.steps[i];
    const lines = codeLines();
    if (lines[i]) ui.markLine(lines[i].number);
    if (i < stepIndex) {
      // a finished line: walk through what each piece meant
      const recap = step.parts.map((p) => `\`${p.text.trim()}\` ${p.explain.split("\n")[0]}`).join("\n");
      say(`Line ${i + 1}:\n${recap}`, "pointing");
    } else if (i === stepIndex) {
      say(complete ? "All typed!\nPress Run to see it work." : partSay(i, partIndex), "pointing");
    } else {
      say(`First finish line ${stepIndex + 1}:\n\`${lesson.steps[stepIndex].code.trim()}\``, "pointing");
    }
    lastSaid = ""; // so the next real event can repeat itself if needed
  }

  // ---------- after Run ----------

  function onRun({ ok, output }) {
    if (!lesson) return;
    if (ok && output.trim() === lesson.expectedOutput && !celebrated) {
      celebrated = true;
      say(`YES!\n${lesson.done}`, "celebrate", 3000);
      ui.unlockNext(lesson.id);
    } else if (ok && celebrated) {
      say("Nice experiment!\nChange something else and run it again,\nor go to the next lesson.", "happy", 1500);
    } else if (ok && !complete) {
      say(`It ran! But we're not finished.\n${partSay(stepIndex, partIndex)}`, "happy", 1500);
    } else if (ok) {
      say("It ran, but the output isn't what I expected.\nCompare it with the steps on the left.", "thinking");
    }
    // errors are handled by app.js (it has the line number)
  }

  function start(index) {
    lesson = LESSONS[index];
    stepIndex = 0;
    partIndex = 0;
    complete = false;
    celebrated = false;
    nudged = false;
    lastSaid = "";
    ui.setCode("");
    ui.renderSteps(0);
    ui.markLine(0);
    say(`Lesson ${index + 1}: ${lesson.title}\n${partSay(0, 0)}`, "idle");
    resetNudge();
  }

  return {
    start, onChange, onRun, review, ui,
    get current() { return { lesson, stepIndex, partIndex, complete, celebrated }; },
  };
})();
