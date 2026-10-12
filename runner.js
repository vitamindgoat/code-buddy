/* ============================================================
   runner.js — the SANDBOX
   This file runs inside a Web Worker: a separate thread with
   NO access to the page (no document, no DOM, no app variables).
   The learner's code runs here, so if it crashes or loops
   forever, the page itself is never affected.

   The main page talks to us with postMessage, and we talk back
   the same way. Think of it as passing notes under a door.
   ============================================================ */

// Collect every console.log call so we can send it back as output.
// We replace the worker's console.log with our own function.
const lines = [];

function send(type, text) {
  // self = the worker's global object (like `window` on a page)
  self.postMessage({ type, text });
}

console.log = (...args) => {
  // Turn each argument into a string the way a real console would
  const text = args.map(stringify).join(" ");
  lines.push(text);
  send("log", text);
};

// console.error behaves like log but we tag it so it shows in red
console.error = (...args) => {
  send("error", args.map(stringify).join(" "));
};

function stringify(value) {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// The main page sends us { code: "..." } when the learner presses Run.
self.onmessage = (event) => {
  const code = event.data.code;

  try {
    // new Function() turns a string of code into a real function.
    // We call it immediately. This is how "Run" actually runs.
    const program = new Function(code);
    program();
    send("done", "");
  } catch (err) {
    // Any mistake in the learner's code lands here instead of crashing.
    // We send the error NAME and MESSAGE so the buddy can explain it.
    send("exception", `${err.name}: ${err.message}`);
  }
};
