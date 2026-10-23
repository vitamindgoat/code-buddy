/* ============================================================
   runner.js — the SANDBOX
   This file runs inside a Web Worker: a separate thread with
   NO access to the page (no document, no DOM, no app variables).
   The learner's Python runs here, so if it crashes or loops
   forever, the page itself is never affected.

   Python in the browser is made possible by Pyodide: the real
   CPython interpreter compiled to WebAssembly. We load it once
   when the worker starts, then reuse it for every Run.

   The main page talks to us with postMessage, and we talk back
   the same way. Think of it as passing notes under a door.
   ============================================================ */

const PYODIDE_VERSION = "314.0.7"; // Pyodide versions track Python: 314 = Python 3.14
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function send(type, text = "", extra = {}) {
  // self = the worker's global object (like `window` on a page)
  self.postMessage({ type, text, ...extra });
}

// ---------- 1. Load Python (happens once, takes a few seconds) ----------

// This worker is a JavaScript module, so we can import Pyodide directly.
// If the download fails (offline, blocked network) the page is told so it
// can offer a Retry instead of waiting forever.
let loadPyodide = null;
try { ({ loadPyodide } = await import(PYODIDE_URL + "pyodide.mjs")); }
catch (e) { send("loadfail", String(e && e.message || e)); }

let pyodide = null;

const ready = (async () => {
  if (!loadPyodide) return new Promise(() => {});
  try { pyodide = await loadPyodide({ indexURL: PYODIDE_URL }); }
  catch (e) { send("loadfail", String(e && e.message || e)); return new Promise(() => {}); }

  // Anything Python prints goes to "stdout". We catch it line by line
  // and send each line back to the page as a "log" message.
  pyodide.setStdout({ batched: (line) => send("log", line) });
  pyodide.setStderr({ batched: (line) => send("error", line) });

  send("ready");
})();

// ---------- 2. Run code when the page asks ----------

self.onmessage = async (event) => {
  await ready; // never run before Python has finished loading

  const { code, inputs = [] } = event.data;

  // input() can't pause for typing inside a worker, so the lesson says what
  // "the user types" and we feed those answers in, echoing them the way a
  // real terminal would. Works through builtins, so it survives the fresh
  // globals below.
  pyodide.runPython(`
import builtins, json
_cb_inputs = json.loads(${JSON.stringify(JSON.stringify(inputs))})
def _cb_input(prompt=""):
    value = _cb_inputs.pop(0) if _cb_inputs else ""
    print(str(prompt) + value)
    return value
builtins.input = _cb_input
`);

  try {
    // Fresh, empty globals every run so variables from the last run
    // don't secretly stick around and confuse a beginner.
    const globals = pyodide.toPy({});
    pyodide.runPython(code, { globals });
    globals.destroy();
    send("done");
  } catch (err) {
    // Any mistake in the learner's code lands here instead of crashing.
    send("exception", friendlyError(err.message), { line: errorLine(err.message) });
  }
};

// ---------- 3. Make Python's error messages readable ----------

// Pyodide gives us a full traceback like:
//   Traceback (most recent call last):
//     File "<exec>", line 2, in <module>
//   NameError: name 'prnt' is not defined
// Beginners only need the last line. The buddy can explain the rest.
function friendlyError(traceback) {
  const lines = traceback.trim().split("\n");
  return lines[lines.length - 1];
}

// Pull out which line of the learner's code the error happened on.
// "<exec>" is the name Pyodide gives to the code we passed in.
function errorLine(traceback) {
  const matches = [...traceback.matchAll(/File "<exec>", line (\d+)/g)];
  return matches.length ? Number(matches[matches.length - 1][1]) : null;
}
