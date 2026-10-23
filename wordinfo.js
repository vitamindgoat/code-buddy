/* ============================================================
   wordinfo.js — "what does this word mean?" tooltips in the editors
   Hover over a Python word (desktop) or tap it (phone) and a small card
   explains it in plain words, with a tiny example. Works in every editor:
   lessons, practice and quiz code questions. Words inside strings and comments are left alone.

     wordinfo.attach(cm)   turn it on for a CodeMirror editor
   ============================================================ */

const wordinfo = (() => {
  const WORDS = {
    print: ["Shows something on the screen (in the output).", 'print("Hi")  →  Hi'],
    input: ["Asks the user a question and waits for them to type. Always gives back text (a string).", 'name = input("Name? ")'],
    int: ["Turns something into a whole number, like the text \"12\" into 12.", 'int("12") + 1  →  13'],
    str: ["Turns something into text (a string), so you can join it with other text.", '"Age: " + str(12)'],
    float: ["Turns something into a decimal number.", 'float("2.5")  →  2.5'],
    bool: ["Turns something into True or False.", "bool(0)  →  False"],
    len: ["Counts how many characters (or items) something has.", 'len("hey")  →  3'],
    range: ["Makes a run of numbers for a for loop. Stops just BEFORE the end number.", "range(1, 4)  →  1, 2, 3"],
    for: ["Repeats the indented lines once for each item, like each number in a range.", "for i in range(3):"],
    in: ["Used with for: \"for each item in this\". Also checks if something is inside something else.", '"a" in "cat"  →  True'],
    while: ["Repeats the indented lines as long as the condition stays True.", "while count > 0:"],
    if: ["Runs the indented lines only when the condition is True.", "if age >= 13:"],
    elif: ["\"Else if\": checked only when the if above it was False.", "elif score >= 80:"],
    else: ["Runs when none of the if / elif conditions above were True.", "else:"],
    and: ["True only when BOTH sides are True. Like an AND gate.", "True and False  →  False"],
    or: ["True when AT LEAST ONE side is True. Like an OR gate.", "True or False  →  True"],
    not: ["Flips True to False and False to True. Like a NOT gate.", "not True  →  False"],
    True: ["One of the two boolean values: yes / on / 1.", "is_raining = True"],
    False: ["One of the two boolean values: no / off / 0.", "is_raining = False"],
    None: ["Python's word for \"nothing here\".", "result = None"],
    break: ["Leaves the loop right away, even if it wasn't finished.", "if n == 4: break"],
    continue: ["Skips the rest of this round of the loop and jumps to the next one.", "if n == 3: continue"],
    def: ["Defines your own function: a named block of code you can run again and again.", "def greet(name):"],
    return: ["Sends a value back out of a function.", "return n * 2"],
    import: ["Brings in extra tools (a module) that Python has built in.", "import random"],
    random: ["A module for random things, like dice rolls.", "random.randint(1, 6)"],
    randint: ["Picks a random whole number between two numbers, including both ends.", "random.randint(1, 10)"],
    max: ["Gives the biggest of the values.", "max(4, 11)  →  11"],
    min: ["Gives the smallest of the values.", "min(4, 11)  →  4"],
    abs: ["Gives the distance from zero: drops the minus sign.", "abs(-5)  →  5"],
    round: ["Rounds to the nearest whole number.", "round(3.7)  →  4"],
    sum: ["Adds up all the items in a list.", "sum([1, 2, 3])  →  6"],
    type: ["Tells you what type a value is: int, float, str or bool.", 'type("15")  →  str'],
    end: ["Changes what print puts at the end. Normally a new line; end=\"\" keeps going on the same line.", 'print("*", end="")'],
    pass: ["Does nothing. A placeholder for code you'll write later.", "if x > 5: pass"],
    is: ["Checks whether two things are the very same object. Usually you want == instead.", "x is None"],
    upper: ["Makes text ALL CAPITALS.", '"hi".upper()  →  HI'],
    lower: ["Makes text all lowercase.", '"Hi".lower()  →  hi'],
  };
  const tip = document.createElement("div");
  tip.className = "wordtip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
  document.body.appendChild(tip);
  let timer = null, hideTimer = null, shownFor = null, shownAt = 0;
  // tapping into an editor can scroll it a little to show the cursor; that
  // tiny scroll right after a card appears shouldn't close it
  const scrolled = () => { if (Date.now() - shownAt > 600) hide(); };

  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  function show(cm, word, from) {
    const info = WORDS[word]; if (!info) return;
    const at = cm.charCoords(from, "window");
    tip.innerHTML = `<code class="wordtip-word">${esc(word)}</code><span class="wordtip-what">${esc(info[0])}</span><code class="wordtip-ex">${esc(info[1])}</code>`;
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = Math.max(8, Math.min(window.innerWidth - w - 8, at.left - 10));
    let y = at.bottom + 8;
    if (y + h > window.innerHeight - 8) y = at.top - h - 8;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
    tip.classList.remove("in"); void tip.offsetWidth; tip.classList.add("in");
    shownFor = word + from.line + ":" + from.ch;
    shownAt = Date.now();
  }
  function hide() { clearTimeout(timer); clearTimeout(hideTimer); tip.hidden = true; shownFor = null; }
  // only ever one pending hide, so a stale one can't cancel a card that's about to show
  function hideSoon(ms) { clearTimeout(hideTimer); hideTimer = setTimeout(hide, ms); }

  // the known word under a screen point, or null (strings/comments don't count)
  function wordAt(cm, x, y) {
    const pos = cm.coordsChar({ left: x, top: y }, "window");
    const line = cm.getLine(pos.line); if (line == null) return null;
    const range = cm.findWordAt(pos);
    const word = cm.getRange(range.anchor, range.head);
    if (!WORDS[word]) return null;
    // make sure the point is really over the word, not past the end of the line
    const a = cm.charCoords(range.anchor, "window"), b = cm.charCoords(range.head, "window");
    if (x < a.left - 2 || x > b.left + 2 || y < a.top || y > a.bottom) return null;
    const style = cm.getTokenTypeAt({ line: pos.line, ch: range.anchor.ch + 1 }) || "";
    if (/string|comment/.test(style)) return null;
    return { word, from: range.anchor };
  }

  function attach(cm) {
    const el = cm.getWrapperElement();
    const coarse = () => matchMedia("(pointer: coarse)").matches;
    el.addEventListener("mousemove", (e) => {
      if (coarse()) return;
      const hit = wordAt(cm, e.clientX, e.clientY);
      clearTimeout(timer);
      if (!hit) { if (!tip.hidden) hideSoon(120); return; }
      clearTimeout(hideTimer);
      const key = hit.word + hit.from.line + ":" + hit.from.ch;
      if (key === shownFor) return;
      timer = setTimeout(() => show(cm, hit.word, hit.from), tip.hidden ? 450 : 80);
    });
    el.addEventListener("mouseleave", () => { clearTimeout(timer); hideSoon(150); });
    // phones: a tap on a known word shows its card for a few seconds
    let down = null;
    el.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: Date.now() }; });
    el.addEventListener("pointerup", (e) => {
      if (!coarse() || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || Date.now() - down.t > 600) return;
      const hit = wordAt(cm, e.clientX, e.clientY);
      if (!hit) return hide();
      show(cm, hit.word, hit.from);
      hideSoon(3500);
    });
    cm.on("keydown", hide);
    cm.on("scroll", scrolled);
    cm.on("blur", () => { if (!coarse()) hide(); });
  }
  window.addEventListener("scroll", scrolled, { passive: true, capture: true });
  window.addEventListener("resize", hide);

  return { attach, WORDS };
})();
