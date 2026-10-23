/* ============================================================
   playground.js — free coding, no lesson
   A blank editor where you write whatever you want. Run it, and if
   Python complains, Buddy translates the error into plain English and
   points at the line. Programs can be saved to "My programs" (in this
   browser only), and there are a few examples to start from.

     playground.open()   show it        playground.close()   hide it

   Saved programs: localStorage "codebuddy.programs" =
     [{ id, name, code, inputs, updated }]
   The program you're working on autosaves as a draft, so closing the
   Playground (or the tab) never loses work.
   ============================================================ */

const playground = (() => {
  const $ = (id) => document.getElementById(id);
  const root = $("playground");
  const STORE = "codebuddy.programs", DRAFT = "codebuddy.playground.draft";
  let cm = null, current = null, saveTimer = null, errMark = null, running = false;

  const EXAMPLES = [
    { name: "Hello, you", inputs: "Sam", code: 'name = input("What is your name? ")\nprint(f"Hello, {name}! Welcome to the Playground.")\n' },
    { name: "Countdown", inputs: "", code: 'n = 5\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Liftoff! 🚀")\n' },
    { name: "Times table", inputs: "7", code: 'num = int(input("Which times table? "))\nfor i in range(1, 11):\n    print(f"{num} x {i} = {num * i}")\n' },
    { name: "Star pyramid", inputs: "", code: 'for row in range(1, 6):\n    print(" " * (5 - row) + "*" * (2 * row - 1))\n' },
    { name: "Grade checker", inputs: "86", code: 'score = int(input("Score? "))\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")\nelse:\n    print("Keep practicing!")\n' },
    { name: "Dice roller", inputs: "", code: 'import random\n\nfor roll in range(3):\n    print("You rolled", random.randint(1, 6))\n' },
  ];

  // ---------- storage ----------
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
  const store = (list) => { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {} };
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ id: current?.id || null, name: $("pg-name").value, code: cm.getValue(), inputs: $("pg-inputs").value })); } catch {} };

  // ---------- Buddy's plain-English error explanations ----------
  function explain(error) {
    const m = (re) => error.match(re);
    let x;
    if ((x = m(/NameError: name '(.+?)' is not defined/))) return [`Python doesn't know the name \`${x[1]}\`.`, `Check the spelling (Python cares about capitals too), or make sure you created \`${x[1]}\` on a line *before* you use it. If it's text, it needs quotes.`];
    if (m(/IndentationError: expected an indented block/)) return ["A line needs to be indented.", "After a line ending in `:` (like `if`, `for`, `while`), the next lines must be pushed in with Tab."];
    if (m(/IndentationError: unexpected indent/)) return ["This line is indented when it shouldn't be.", "Only lines inside an `if`, `for`, `while` (after a `:`) get pushed in. Use Shift+Tab to pull it back."];
    if (m(/IndentationError|TabError/)) return ["The indentation doesn't line up.", "Lines in the same block must be pushed in by the same amount."];
    if (m(/SyntaxError: .*'\(' was never closed|SyntaxError: unexpected EOF|was never closed/)) return ["Something was opened but never closed.", "Count your `(` and `)` and your quotes. Every opening one needs a closing partner."];
    if (m(/SyntaxError: unterminated string/)) return ["A piece of text is missing its closing quote.", "Text starts and ends with a quote: `\"like this\"`."];
    if (m(/SyntaxError: expected ':'/)) return ["A `:` is missing.", "Lines starting with `if`, `elif`, `else`, `for` and `while` must end with a colon."];
    if (m(/SyntaxError/)) return ["Python can't read this line.", "Look for a typo, a missing quote or bracket, or a missing `:`."];
    if ((x = m(/TypeError: can only concatenate str \(not "(\w+)"\) to str/))) return [`You tried to join text with a ${x[1] === "int" ? "number" : x[1]}.`, "`+` can't mix text and numbers. Wrap the number in `str()`, or use an f-string like `f\"Score: {score}\"`."];
    if (m(/TypeError: unsupported operand type\(s\) for [+\-*\/]+: 'int' and 'str'|'str' and 'int'/)) return ["You're doing math with text.", "Something here is a string (maybe from `input()`). Turn it into a number first with `int()`."];
    if (m(/TypeError/)) return ["Two things here don't work together.", "Check the types: are you mixing text and numbers, or calling something that isn't a function?"];
    if (m(/ZeroDivisionError/)) return ["You divided by zero.", "That has no answer, even for a computer. Check the number on the right of `/`, `//` or `%`."];
    if ((x = m(/ValueError: invalid literal for int\(\) with base 10: '(.*)'/))) return [`\`int()\` can't turn "${x[1]}" into a number.`, "Only digits can become an int. If this came from `input()`, check the answer in the box below the editor."];
    if (m(/ValueError/)) return ["A value isn't the kind Python expected here.", "Read the message carefully: it says what it was given."];
    if (m(/^Stopped|ran for too long|took too long/i)) return ["Your program didn't stop.", "That's usually a `while` loop whose condition never becomes False. Make sure something inside the loop changes it."];
    if (m(/ModuleNotFoundError/)) return ["That module isn't available here.", "The Playground has Python's built-in modules, like `random` and `math`."];
    return ["Python stopped with an error.", "Read the last line of the message: it names the problem. Then check the line it points to."];
  }

  // a tiny markdown: `code` -> chip, *x* -> bold
  const rich = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))
    .replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*([^*]+)\*/g, "<b>$1</b>");

  function say(title, body, pose = "idle") {
    $("pg-say").innerHTML = `<b class="pg-say-title">${rich(title)}</b>${body ? `<span>${rich(body)}</span>` : ""}`;
    $("pg-say").classList.remove("pop"); void $("pg-say").offsetWidth; $("pg-say").classList.add("pop");
    $("pg-buddy").setAttribute("data-state", pose);
  }

  // ---------- running ----------
  async function run() {
    if (running) return;
    if (!sandbox.ready) { say("Python is still loading…", "Give it a second, then press Run again.", "thinking"); return; }
    running = true;
    const out = $("pg-output"); out.innerHTML = "";
    clearErr();
    $("pg-run").disabled = true; sfx.run();
    $("pg-status").className = "status running"; $("pg-status").textContent = "Running…";
    const inputs = $("pg-inputs").value.split("\n").filter((l, i, a) => l !== "" || i < a.length - 1);
    const t0 = performance.now();
    const lines = [];
    const r = await sandbox.run(cm.getValue(), inputs, (text, isErr) => {
      if (!isErr) lines.push(text);
      const d = document.createElement("div"); d.className = isErr ? "err out-line" : "out-line"; d.textContent = text; out.appendChild(d);
    });
    const ms = Math.round(performance.now() - t0);
    running = false; $("pg-run").disabled = false;
    // phones: the output (and Buddy under it) is below the editor, so bring it into view
    if (matchMedia("(max-width: 760px)").matches) $("pg-out-card").scrollIntoView({ behavior: "smooth", block: "start" });
    if (r.ok) {
      if (!lines.length) out.innerHTML = '<div class="output-hint">Your program ran, but didn\'t print anything. Add a print() to see results.</div>';
      $("pg-status").className = "status ok";
      $("pg-status").textContent = lines.length ? `${lines.length} line${lines.length === 1 ? "" : "s"} printed · ${ms} ms` : `No output · ${ms} ms`;
      say(pickWin(), lines.length ? "" : "Nothing printed yet. Try adding `print()`.", "happy");
      badges.earn("playground");
    } else {
      const d = document.createElement("div"); d.className = "err out-line"; d.textContent = r.error; out.appendChild(d);
      $("pg-status").className = "status bad";
      $("pg-status").textContent = /Stopped/.test(r.error) ? "Stopped after 3s" : r.line ? `Error on line ${r.line}` : "Error";
      const [t, b] = explain(r.error);
      say(r.line ? `Line ${r.line}: ${t}` : t, b, "pointing");
      if (r.line) markErr(r.line);
      sfx.error();
    }
  }
  const WINS = ["It works!", "Nice, it ran!", "Look at that!", "Clean run!", "That's real Python!"];
  let lastWin = -1;
  function pickWin() { let i; do { i = Math.floor(Math.random() * WINS.length); } while (i === lastWin); lastWin = i; return WINS[i]; }
  function markErr(line) { if (line - 1 < cm.lineCount()) { errMark = cm.addLineClass(line - 1, "background", "error-line"); cm.scrollIntoView({ line: line - 1, ch: 0 }, 60); } }
  function clearErr() { if (errMark) { cm.removeLineClass(errMark, "background", "error-line"); errMark = null; } }

  // ---------- programs list ----------
  function renderList() {
    const list = load().sort((a, b) => b.updated - a.updated);
    $("pg-mine").innerHTML = list.length
      ? list.map((p) => `<li><button class="pg-item ${current && current.id === p.id ? "on" : ""}" data-id="${p.id}" type="button"><span class="pg-item-name"></span><span class="pg-item-date">${new Date(p.updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></button><button class="pg-del" data-del="${p.id}" type="button" aria-label="Delete">✕</button></li>`).join("")
      : '<li class="pg-empty">Nothing saved yet. Write something and press Save.</li>';
    // names go in as text, never as HTML
    $("pg-mine").querySelectorAll(".pg-item").forEach((b) => { b.querySelector(".pg-item-name").textContent = list.find((p) => p.id === b.dataset.id).name; });
    $("pg-mine").querySelectorAll(".pg-item").forEach((b) => b.addEventListener("click", () => openProgram(load().find((p) => p.id === b.dataset.id))));
    $("pg-mine").querySelectorAll(".pg-del").forEach((b) => b.addEventListener("click", () => {
      const p = load().find((x) => x.id === b.dataset.del); if (!p) return;
      if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "Delete?"; b.classList.add("armed"); setTimeout(() => { b.dataset.armed = ""; b.textContent = "✕"; b.classList.remove("armed"); }, 2500); return; }
      store(load().filter((x) => x.id !== p.id));
      if (current && current.id === p.id) current = null;
      renderList(); sfx.click();
    }));
  }
  function openProgram(p, { quiet = false } = {}) {
    if (!p) return;
    current = p.id ? { id: p.id } : null;
    cm.setValue(p.code || ""); $("pg-inputs").value = p.inputs || ""; $("pg-name").value = p.name || "Untitled";
    $("pg-output").innerHTML = '<div class="output-hint">Press Run to see what your code does.</div>';
    $("pg-status").textContent = ""; $("pg-status").className = "status";
    clearErr(); renderList(); saveDraft();
    if (!quiet) { say(p.id ? `Opened "${p.name}"` : `Example: ${p.name}`, p.id ? "" : "Press Run to try it, then change anything you like.", "idle"); sfx.pop(); }
    cm.focus(); cm.setCursor(cm.lineCount(), 0);
  }
  function save() {
    const name = $("pg-name").value.trim() || "Untitled";
    const list = load();
    const now = Date.now();
    if (current && list.some((p) => p.id === current.id)) {
      const p = list.find((p) => p.id === current.id); Object.assign(p, { name, code: cm.getValue(), inputs: $("pg-inputs").value, updated: now });
    } else {
      current = { id: "p" + now.toString(36) };
      list.push({ id: current.id, name, code: cm.getValue(), inputs: $("pg-inputs").value, updated: now });
    }
    store(list); saveDraft(); renderList();
    $("pg-save").textContent = "✓ Saved"; setTimeout(() => ($("pg-save").textContent = "Save"), 1400);
    sfx.success();
  }
  function fresh() {
    current = null;
    openProgram({ name: "Untitled", code: "# Write any Python you like, then press Run\n", inputs: "" }, { quiet: true });
    say("A blank page!", "Write anything you like. I'll help if Python complains.", "happy");
  }

  // ---------- open / close ----------
  function ensureEditor() {
    if (cm) return;
    cm = CodeMirror.fromTextArea($("pg-code"), {
      mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, lineWrapping: true,
      extraKeys: {
        "Ctrl-Enter": run, "Cmd-Enter": run,
        Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection(" ".repeat(4 - (c.getCursor().ch % 4)), "end")),
        "Shift-Tab": (c) => c.indentSelection("subtract"),
        Backspace: (c) => (typeof smartBackspace === "function" ? smartBackspace(c) : CodeMirror.Pass),
      },
    });
    cm.getInputField().setAttribute("aria-label", "Playground editor: write any Python here");
    if (typeof wordinfo !== "undefined") wordinfo.attach(cm);
    cm.on("change", () => { clearErr(); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 400); });
    $("pg-inputs").addEventListener("input", () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 400); });
    if (typeof keybar !== "undefined") keybar.attach(cm, run);   // phone key bar (app.js)
    $("pg-examples").innerHTML = EXAMPLES.map((e, i) => `<li><button class="pg-item" data-ex="${i}" type="button"><span class="pg-item-name">${e.name}</span></button></li>`).join("");
    $("pg-examples").querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => openProgram({ ...EXAMPLES[+b.dataset.ex], id: null })));
    let draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch {}
    if (draft) { current = draft.id ? { id: draft.id } : null; cm.setValue(draft.code || ""); $("pg-inputs").value = draft.inputs || ""; $("pg-name").value = draft.name || "Untitled"; }
    else { cm.setValue(EXAMPLES[0].code); $("pg-inputs").value = EXAMPLES[0].inputs; $("pg-name").value = "Untitled"; }
    if (window.buddy) buddy.mount($("pg-buddy"), "happy");
  }
  // the lesson page behind the Playground: unreachable (Tab, screen readers) while it's open
  const setBehind = (on) => document.querySelectorAll("body > header.topbar, body > main.layout").forEach((el) => { el.inert = on; });
  let lastFocus = null;
  function open() {
    lastFocus = document.activeElement;
    root.hidden = false; document.body.classList.add("pg-open");
    setBehind(true);
    root.classList.remove("show"); void root.offsetWidth; root.classList.add("show");
    ensureEditor();
    renderList();
    requestAnimationFrame(() => { cm.refresh(); if (!matchMedia("(pointer: coarse)").matches) cm.focus(); });
    say(load().length ? "Welcome back to the Playground!" : "Welcome to the Playground!", "Write any Python you want and press Run. Stuck? Open an example on the left.", "happy");
    sfx.pop();
  }
  function close() {
    if (root.hidden) return;
    saveDraft();
    root.hidden = true; document.body.classList.remove("pg-open");
    setBehind(false);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch {}
  }

  $("pg-run").addEventListener("click", run);
  $("pg-step").addEventListener("click", () => viz.open(cm.getValue(), $("pg-inputs").value.split("\n").filter((l, i, a) => l !== "" || i < a.length - 1)));
  $("pg-save").addEventListener("click", save);
  $("pg-new").addEventListener("click", fresh);
  $("pg-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden && !document.querySelector(".complete:not([hidden])")) close(); });

  // open with a ready-made program (the final project's "make it random")
  function openWith(p) {
    open();
    openProgram({ ...p, id: null }, { quiet: true });
    say(`Here's "${p.name}"!`, p.note || "Press Run to play. Change the answers in the box below to guess differently.", "celebrate");
  }

  return { open, openWith, close, explain, run, get isOpen() { return !root.hidden; }, get editor() { return cm; } };
})();
