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

  const { code, inputs = [], mode } = event.data;
  if (mode === "trace") { trace(code, inputs); return; }

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

// ---------- 2b. Step-through: record every line as it runs ----------
// For the code visualizer. Python's sys.settrace calls us before each line
// of the learner's code runs; we save that line number, a copy of every
// variable (as short text) and everything printed so far. The page then
// plays the recording back one step at a time. A step limit keeps infinite
// loops from running forever.
const TRACE_PY = `
import sys, json, builtins, types

def _cb_trace(_cb_src, _cb_answers, _cb_limit=500):
    steps, out = [], []
    class _Out:
        def write(self, s): out.append(s)
        def flush(self): pass
    answers = list(_cb_answers)
    def _inp(prompt=""):
        value = answers.pop(0) if answers else ""
        out.append(str(prompt) + value + "\\n")
        return value
    def show(v):
        try: r = repr(v)
        except Exception: r = "?"
        return r if len(r) <= 60 else r[:57] + "..."
    def snap(frame, g):
        d = frame.f_locals if frame.f_code.co_name != "<module>" else g
        res = []
        for k, v in list(d.items()):
            if k.startswith("_") or isinstance(v, (types.ModuleType, types.FunctionType, type)) or k in ("input",):
                continue
            res.append([k, show(v), type(v).__name__])
        return res
    class _Limit(Exception): pass
    g = {"__name__": "__main__", "input": _inp}
    def tr(frame, event, arg):
        if frame.f_code.co_filename != "<step>":
            return None
        if event == "line":
            if len(steps) >= _cb_limit:
                raise _Limit()
            steps.append({"line": frame.f_lineno, "vars": snap(frame, g), "out": "".join(out), "fn": frame.f_code.co_name})
        return tr
    error, error_line, limited = None, None, False
    old_out = sys.stdout
    try:
        code = compile(_cb_src, "<step>", "exec")
        sys.stdout = _Out()
        sys.settrace(tr)
        try:
            exec(code, g)
        finally:
            sys.settrace(None)
            sys.stdout = old_out
    except _Limit:
        limited = True
    except SyntaxError as e:
        error, error_line = f"SyntaxError: {e.msg}", e.lineno
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
        tb = e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<step>":
                error_line = tb.tb_lineno
            tb = tb.tb_next
    steps.append({"line": None, "vars": [[k, show(v), type(v).__name__] for k, v in g.items() if not k.startswith("_") and not isinstance(v, (types.ModuleType, types.FunctionType, type)) and k != "input"], "out": "".join(out), "fn": "<module>"})
    return json.dumps({"steps": steps, "error": error, "errorLine": error_line, "limited": limited})
`;
let traceReady = false;
function trace(code, inputs) {
  try {
    if (!traceReady) { pyodide.runPython(TRACE_PY); traceReady = true; }
    const fn = pyodide.globals.get("_cb_trace");
    const json = fn(code, pyodide.toPy(inputs));
    fn.destroy();
    send("trace", json);
  } catch (err) {
    send("trace", JSON.stringify({ steps: [], error: friendlyError(String(err.message || err)), errorLine: null, limited: false }));
  }
}

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
