/* ============================================================
   tutor.js — the tutor engine
   Watches what the learner types and compares it, line by line,
   against the current lesson's steps. Decides when the buddy should
   speak, what to say, and which line he should float next to.

   No AI here: every message comes from the lesson data or from a
   small set of rules. That makes hints instant, accurate, and safe.

   Public API (used by app.js):
     tutor.start(lessonIndex)   load a lesson, clear the editor
     tutor.onChange()           call whenever the editor text changes
     tutor.onRun(result)        call with { ok, output } after a run
     tutor.current              { lesson, stepIndex, complete }
   ============================================================ */

const tutor = (() => {
  const NUDGE_MS = 15000; // silence this long -> buddy gives the answer

  let lesson = null;
  let stepIndex = 0;      // which step (line) the learner is on
  let complete = false;   // all lines typed correctly, waiting for Run
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
    unlockNext: () => {},
  };

  // ---------- normalizing: what counts as "the same line" ----------

  // Python doesn't care about spaces outside of strings, and ' vs " is
  // the same thing. So "print ( 'hi' )" should match 'print("hi")'.
  // We walk the line char by char: drop whitespace unless inside quotes,
  // and turn ' into ".
  function norm(line) {
    let out = "", quote = null;
    for (const ch of line) {
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
    '"': 'a quote mark "', "(": "an open parenthesis (", ")": "a close parenthesis )",
    ":": "a colon :", "=": "an equals sign =", "+": "a plus sign +", ",": "a comma ,",
    "!": "an exclamation mark !", " ": "a space",
  };
  const describe = (ch) => (ch === undefined ? "nothing more" : NAMES[ch] || `the letter ${ch}`);

  // `left` = the learner has moved on past this line (so an unfinished
  // line is a mistake now, not just "still typing")
  function diagnose(typed, step, left) {
    const t = norm(typed), g = norm(step.code);
    if (t === "") return null;
    if (g.startsWith(t)) {
      // on track so far; only indentation could be wrong
      if (isIndented(step.code) && !isIndented(typed) && t.length > 2)
        return "This line needs to be indented: put 4 spaces at the start so it's inside the loop.";
      if (!isIndented(step.code) && isIndented(typed))
        return "Don't indent this line. Delete the spaces at the start.";
      if (left) {
        for (const h of step.hints || []) if (h.match.test(typed)) return h.say;
        return `That line isn't finished yet. After ${g.slice(Math.max(0, t.length - 8))} it still needs ${describe(g[t.length])}.`;
      }
      return null;
    }
    // lesson-specific hints first
    for (const h of step.hints || []) if (h.match.test(typed)) return h.say;
    // capital letters?
    if (t.toLowerCase() === g.slice(0, t.length).toLowerCase())
      return "Careful with capital letters! Python is picky: it all needs to be lowercase here.";
    // generic: find the first character that differs
    let i = 0;
    while (i < t.length && i < g.length && t[i] === g[i]) i++;
    const before = g.slice(Math.max(0, i - 8), i);
    if (i >= g.length) return `Looks like there's extra stuff at the end. The line should stop after ${before}`;
    return `Almost! After ${before || "the start"} I was expecting ${describe(g[i])}, but I see ${describe(t[i])}.`;
  }

  // ---------- speaking (with voice, if turned on) ----------

  function say(text, state, ms) {
    if (text === lastSaid) return;
    lastSaid = text;
    buddy.say(text);
    if (state) buddy.set(state, ms);
    voice.speak(text);
  }

  // ---------- the main loop: called on every edit ----------

  function onChange() {
    clearTimeout(diagnoseTimer);
    resetNudge();
    // wait until they pause for a moment so we don't nag every keystroke
    diagnoseTimer = setTimeout(check, 450);
  }

  function check() {
    if (!lesson || complete) return;
    const lines = codeLines();
    const n = countCorrect(lines);

    if (n > stepIndex) {
      // they finished one or more lines
      stepIndex = n;
      ui.renderSteps(stepIndex);
      if (stepIndex === lesson.steps.length) {
        complete = true;
        ui.markLine(null);
        say(`${lesson.steps[n - 1].explain} That's the whole program. Press Run!`, "happy", 1800);
        return;
      }
      say(`${lesson.steps[n - 1].explain} ${lesson.steps[n].say}`, "happy", 1500);
      ui.markLine(lines[n] ? lines[n].number : null);
      nudged = false;
      return;
    }

    if (n < stepIndex) {
      // they broke a line that used to be right
      stepIndex = n;
      ui.renderSteps(stepIndex);
    }

    const step = lesson.steps[stepIndex];
    const line = lines[stepIndex];
    const left = line ? ui.getCursorLine() > line.number : false;
    const problem = line ? diagnose(line.text, step, left) : null;

    if (problem) {
      ui.markLine(line.number);
      say(problem, "pointing");
    } else if (buddy.state === "pointing") {
      // they fixed it
      ui.markLine(line ? line.number : null);
      say("That's it, keep going!", "happy", 1200);
    } else {
      ui.markLine(line ? line.number : null);
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
      say(`Stuck? No worries. Here's the line, exactly: ${step.code.trim()}`, "thinking");
    }, NUDGE_MS);
  }

  // ---------- after Run ----------

  function onRun({ ok, output }) {
    if (!lesson) return;
    if (ok && output.trim() === lesson.expectedOutput) {
      say(`YES! ${lesson.done}`, "celebrate", 3000);
      ui.unlockNext(lesson.id);
    } else if (ok && !complete) {
      say(`It ran! But we're not finished. ${lesson.steps[stepIndex].say}`, "happy", 1500);
    } else if (ok) {
      say("It ran, but the output isn't quite what I expected. Compare it with the lesson and try again.", "thinking");
    }
    // errors are handled by app.js (it has the line number)
  }

  function start(index) {
    lesson = LESSONS[index];
    stepIndex = 0;
    complete = false;
    nudged = false;
    lastSaid = "";
    ui.setCode("");
    ui.renderSteps(0);
    ui.markLine(0);
    say(lesson.steps[0].say, "idle");
    resetNudge();
  }

  return {
    start, onChange, onRun, ui,
    get current() { return { lesson, stepIndex, complete }; },
  };
})();
