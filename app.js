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
  mode: "javascript",
  lineNumbers: true,
  indentUnit: 2,
  tabSize: 2,
  lineWrapping: true,
});

// Remember the starter code so Reset can bring it back.
const starterCode = editor.getValue();

// ---------- 2. Grab the elements we update ----------

const runBtn = document.getElementById("run-btn");
const resetBtn = document.getElementById("reset-btn");
const outputEl = document.getElementById("output");
const statusEl = document.getElementById("status");
const speechEl = document.getElementById("speech");

// ---------- 3. Running code safely ----------

const TIME_LIMIT_MS = 3000; // if code runs longer than this, we stop it
let worker = null;          // the current sandbox (null when idle)
let timer = null;           // the countdown that catches infinite loops

function runCode() {
  const code = editor.getValue(); // text currently in the editor

  // If a previous run is still going, kill it first.
  stopWorker();

  // Clear the output area and show "Running…"
  outputEl.textContent = "";
  setStatus("running", "Running…");
  say("Running your code…");

  // Make a brand-new sandbox for every run so nothing leaks between runs.
  worker = new Worker("runner.js");

  // Messages from the sandbox arrive here, one at a time.
  worker.onmessage = (event) => {
    const { type, text } = event.data;

    if (type === "log") {
      appendOutput(text);
    } else if (type === "error") {
      appendOutput(text, true);
    } else if (type === "exception") {
      // The learner's code threw an error. Show it and stop.
      appendOutput(text, true);
      setStatus("bad", "Error");
      say("Hmm, something went wrong. Read the red line, it tells you what happened.");
      stopWorker();
    } else if (type === "done") {
      // The program finished with no errors.
      if (outputEl.textContent === "") {
        appendOutput("(your program ran, but it didn't print anything)");
      }
      setStatus("ok", "Ran successfully");
      say("Nice! Your code ran with no errors.");
      stopWorker();
    }
  };

  // If the worker itself crashes (rare), surface that too.
  worker.onerror = (event) => {
    appendOutput(event.message || "Unknown error", true);
    setStatus("bad", "Error");
    stopWorker();
  };

  // Send the code into the sandbox. This is the moment it starts running.
  worker.postMessage({ code });

  // Safety net: if we hear nothing for 3 seconds, assume an infinite loop.
  timer = setTimeout(() => {
    appendOutput("Stopped: your code ran for too long. Is there a loop that never ends?", true);
    setStatus("bad", "Timed out");
    say("Your program never finished, so I stopped it. Check your loops!");
    stopWorker();
  }, TIME_LIMIT_MS);
}

function stopWorker() {
  if (worker) {
    worker.terminate(); // instantly kills the sandbox, even mid-loop
    worker = null;
  }
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
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

function say(text) {
  speechEl.textContent = text;
}

// ---------- 5. Wire up the buttons ----------

runBtn.addEventListener("click", runCode);

resetBtn.addEventListener("click", () => {
  editor.setValue(starterCode);
  outputEl.innerHTML = '<span class="output-hint">Press Run to see what your code does.</span>';
  setStatus("", "");
  say("Back to the starting code. Give it another try!");
});

// Keyboard shortcut: Ctrl+Enter (or Cmd+Enter on Mac) runs the code
editor.setOption("extraKeys", {
  "Ctrl-Enter": runCode,
  "Cmd-Enter": runCode,
});
