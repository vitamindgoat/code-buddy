/* ============================================================
   app.js — the main page
   Three jobs:
     1. Set up the CodeMirror editor
     2. On Run: send the code to the sandbox worker
     3. Show whatever comes back (output, errors, timeouts)
   ============================================================ */

// ---------- 1. Editor setup ----------

// CodeMirror takes over the <textarea id="code"> and turns it into a
// real editor with line numbers and syntax highlighting.
const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: "python",
  lineNumbers: true,
  indentUnit: 4,     // Python's standard indent is 4 spaces
  tabSize: 4,
  indentWithTabs: false,
  lineWrapping: true,
});

// Remember the starter code so Reset can bring it back.
const starterCode = editor.getValue();

// ---------- 2. Grab the elements we update ----------

const runBtn = document.getElementById("run-btn");
const resetBtn = document.getElementById("reset-btn");
const outputEl = document.getElementById("output");
const statusEl = document.getElementById("status");

// TEMPORARY: lesson 1's expected output, so "celebrate" can be tested.
// This moves into a proper lessons file when the lesson engine is built.
const LESSON_EXPECTED = "Hello, world!";

// ---------- 3. The sandbox ----------

const TIME_LIMIT_MS = 3000; // if code runs longer than this, we stop it
let worker = null;          // the sandbox that runs Python
let pythonReady = false;    // true once Pyodide has loaded inside the worker
let timer = null;           // the countdown that catches infinite loops
let errorLineHandle = null; // the editor line we highlighted red, if any

function startWorker() {
  pythonReady = false;
  runBtn.disabled = true;
  setStatus("running", "Loading Python…");

  // type: "module" lets runner.js use import(), which Pyodide needs.
  worker = new Worker("runner.js", { type: "module" });

  // Messages from the sandbox arrive here, one at a time.
  worker.onmessage = (event) => {
    const { type, text, line } = event.data;

    if (type === "ready") {
      pythonReady = true;
      runBtn.disabled = false;
      setStatus("", "");
      buddy.set("idle");
      buddy.say("Python is ready! Press Run when you are.");
    } else if (type === "log") {
      appendOutput(text);
    } else if (type === "error") {
      appendOutput(text, true);
    } else if (type === "exception") {
      // The learner's code threw an error. Show it, mark the line, stop.
      appendOutput(text, true);
      markErrorLine(line);
      setStatus("bad", "Error");
      finishRun();
      buddy.set("pointing");
      buddy.say(line
        ? `Hmm, something went wrong on line ${line}. Read the red text, it tells you what happened.`
        : "Hmm, something went wrong. Read the red text, it tells you what happened.");
    } else if (type === "done") {
      // The program finished with no errors.
      if (outputEl.textContent === "") {
        appendOutput("(your program ran, but it didn't print anything)");
      }
      setStatus("ok", "Ran successfully");
      finishRun();
      if (outputEl.textContent.trim() === LESSON_EXPECTED) {
        buddy.set("celebrate", 2600);
        buddy.say("YES! You did it! That's exactly right.");
      } else {
        buddy.set("happy", 1500);
        buddy.say("Nice! Your code ran with no errors.");
      }
    }
  };

  // If the worker itself crashes (rare), surface that too.
  worker.onerror = (event) => {
    appendOutput(event.message || "Unknown error", true);
    setStatus("bad", "Error");
    if (pythonReady) finishRun();
  };
}

function runCode() {
  if (!pythonReady) return;

  const code = editor.getValue(); // text currently in the editor

  // Clear the output area and show "Running…"
  outputEl.textContent = "";
  clearErrorLine();
  setStatus("running", "Running…");
  buddy.set("thinking");
  buddy.say("Running your code…");
  runBtn.disabled = true;

  // Send the code into the sandbox. This is the moment it starts running.
  worker.postMessage({ code });

  // Safety net: if we hear nothing for 3 seconds, assume an infinite loop.
  // The only way to stop a stuck worker is to kill it, so we do that and
  // start a fresh one (which means reloading Python).
  timer = setTimeout(() => {
    appendOutput("Stopped: your code ran for too long. Is there a loop that never ends?", true);
    setStatus("bad", "Timed out");
    buddy.set("thinking");
    buddy.say("Your program never finished, so I stopped it. Check your loops! Reloading Python…");
    worker.terminate(); // instantly kills the sandbox, even mid-loop
    timer = null;
    startWorker();
  }, TIME_LIMIT_MS);
}

// Called after every run, success or error: stop the clock, re-enable Run.
function finishRun() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  runBtn.disabled = false;
}

// ---------- 4. Small helpers for the UI ----------

function appendOutput(text, isError = false) {
  const line = document.createElement("div");
  line.textContent = text;
  if (isError) line.classList.add("err");
  outputEl.appendChild(line);
}

function setStatus(kind, text) {
  statusEl.className = "status " + kind;
  statusEl.textContent = text;
}

// Tint the line where the error happened so the learner can find it.
function markErrorLine(line) {
  if (!line) return;
  errorLineHandle = editor.addLineClass(line - 1, "background", "error-line");
}

function clearErrorLine() {
  if (errorLineHandle) {
    editor.removeLineClass(errorLineHandle, "background", "error-line");
    errorLineHandle = null;
  }
}

// ---------- 5. Wire up the buttons ----------

runBtn.addEventListener("click", runCode);

resetBtn.addEventListener("click", () => {
  editor.setValue(starterCode);
  clearErrorLine();
  outputEl.innerHTML = '<span class="output-hint">Press Run to see what your code does.</span>';
  setStatus("", "");
  buddy.set("idle");
  buddy.say("Back to the starting code. Give it another try!");
});

// Keyboard shortcut: Ctrl+Enter (or Cmd+Enter on Mac) runs the code
editor.setOption("extraKeys", {
  "Ctrl-Enter": runCode,
  "Cmd-Enter": runCode,
});

// Start loading Python right away so it's ready by the time they press Run.
startWorker();

// ---------- Dev helper: add ?debug to the URL to get state buttons ----------
if (location.search.includes("debug")) {
  const bar = document.getElementById("buddy-debug");
  bar.hidden = false;
  for (const state of ["idle", "thinking", "happy", "pointing", "celebrate"]) {
    const b = document.createElement("button");
    b.textContent = state;
    b.onclick = () => buddy.set(state);
    bar.appendChild(b);
  }
}
