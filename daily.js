/* ============================================================
   daily.js — the daily challenge
   One small coding puzzle per day. Everyone gets the same one on the same
   day (it's picked from the pool by the date), so a class can compare.
   You write the code, press Check, and your output is compared line by
   line with what it should print. Solving it counts toward the streak.

     daily.open()                 show today's challenge
     daily.today()                { date, n, challenge }
     daily.init({ isSolved, onSolved, solvedCount })

   The expected outputs were produced by running each reference solution
   in real Python, so they're exactly what Python prints.
   ============================================================ */

const daily = (() => {
  const $ = (id) => document.getElementById(id);
  const POOL = [
  {
    "title": "Countdown",
    "task": "Print the numbers 10 down to 1, one per line, then print Go!",
    "inputs": [],
    "expectedOutput": "10\n9\n8\n7\n6\n5\n4\n3\n2\n1\nGo!",
    "hint": "A while loop that subtracts 1 each round. Print Go! after the loop, with no indent.",
    "solution": "n = 10\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint(\"Go!\")"
  },
  {
    "title": "Even steps",
    "task": "Print the even numbers from 2 to 10, one per line.",
    "inputs": [],
    "expectedOutput": "2\n4\n6\n8\n10",
    "hint": "range can take a third number: the step. range(2, 11, 2) counts by twos.",
    "solution": "for n in range(2, 11, 2):\n    print(n)"
  },
  {
    "title": "Big sum",
    "task": "Add up every number from 1 to 100 and print the total.",
    "inputs": [],
    "expectedOutput": "5050",
    "hint": "Start total at 0, add each number in a loop, print after the loop. range stops before its end number.",
    "solution": "total = 0\nfor n in range(1, 101):\n    total = total + n\nprint(total)"
  },
  {
    "title": "Six times table",
    "task": "Print the 6 times table from 1 to 5, like: 6 x 1 = 6",
    "inputs": [],
    "expectedOutput": "6 x 1 = 6\n6 x 2 = 12\n6 x 3 = 18\n6 x 4 = 24\n6 x 5 = 30",
    "hint": "An f-string inside a for loop: f\"6 x {i} = {6 * i}\".",
    "solution": "for i in range(1, 6):\n    print(f\"6 x {i} = {6 * i}\")"
  },
  {
    "title": "Next birthday",
    "task": "Ask \"Age? \" and print \"Next year you'll be \" followed by the age plus 1.",
    "inputs": [
      "12"
    ],
    "expectedOutput": "Age? 12\nNext year you'll be 13",
    "hint": "input() gives text. Wrap it in int() before adding 1.",
    "solution": "age = int(input(\"Age? \"))\nprint(f\"Next year you'll be {age + 1}\")"
  },
  {
    "title": "Staircase",
    "task": "Print a staircase of stars: 1 star on the first line, then 2, 3 and 4.",
    "inputs": [],
    "expectedOutput": "*\n**\n***\n****",
    "hint": "\"*\" * 3 makes ***. Use the loop number as the count.",
    "solution": "for i in range(1, 5):\n    print(\"*\" * i)"
  },
  {
    "title": "FizzBuzz",
    "task": "Print the numbers 1 to 15, but print Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for multiples of both.",
    "inputs": [],
    "expectedOutput": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
    "hint": "% gives the remainder: n % 3 == 0 means n divides by 3. Check \"both\" (15) first.",
    "solution": "for n in range(1, 16):\n    if n % 15 == 0:\n        print(\"FizzBuzz\")\n    elif n % 3 == 0:\n        print(\"Fizz\")\n    elif n % 5 == 0:\n        print(\"Buzz\")\n    else:\n        print(n)"
  },
  {
    "title": "Biggest of three",
    "task": "With a = 4, b = 9 and c = 2, print the biggest of the three.",
    "inputs": [],
    "expectedOutput": "9",
    "hint": "max() takes as many values as you like.",
    "solution": "a = 4\nb = 9\nc = 2\nprint(max(a, b, c))"
  },
  {
    "title": "Hot or not",
    "task": "With c = 25 (degrees Celsius), print exactly: 25C is 77.0F  (the formula is c * 9 / 5 + 32).",
    "inputs": [],
    "expectedOutput": "25C is 77.0F",
    "hint": "Put the formula right inside the f-string braces. / always gives a decimal, so you get 77.0.",
    "solution": "c = 25\nprint(f\"{c}C is {c * 9 / 5 + 32}F\")"
  },
  {
    "title": "Even or odd",
    "task": "Ask \"Number? \" and print whether it's even or odd, like: 7 is odd",
    "inputs": [
      "7"
    ],
    "expectedOutput": "Number? 7\n7 is odd",
    "hint": "A number is even when n % 2 is 0.",
    "solution": "n = int(input(\"Number? \"))\nif n % 2 == 0:\n    print(f\"{n} is even\")\nelse:\n    print(f\"{n} is odd\")"
  },
  {
    "title": "Square numbers",
    "task": "Print the squares of 1 to 5 (1, 4, 9, 16, 25), one per line.",
    "inputs": [],
    "expectedOutput": "1\n4\n9\n16\n25",
    "hint": "A square is a number times itself.",
    "solution": "for n in range(1, 6):\n    print(n * n)"
  },
  {
    "title": "Pizza party",
    "task": "17 slices, 5 friends. Print exactly: Each person gets 3 slices, 2 left over.",
    "inputs": [],
    "expectedOutput": "Each person gets 3 slices, 2 left over.",
    "hint": "// is division without the decimal; % is what's left over.",
    "solution": "slices = 17\npeople = 5\nprint(f\"Each person gets {slices // people} slices, {slices % people} left over.\")"
  },
  {
    "title": "Password check",
    "task": "Ask \"Password? \". If it's shorter than 8 characters print Too short!, otherwise print Strong enough.",
    "inputs": [
      "abc"
    ],
    "expectedOutput": "Password? abc\nToo short!",
    "hint": "len() counts the characters in a string.",
    "solution": "pw = input(\"Password? \")\nif len(pw) < 8:\n    print(\"Too short!\")\nelse:\n    print(\"Strong enough\")"
  },
  {
    "title": "Keep doubling",
    "task": "Start at 1 and keep doubling, printing each number, as long as it's below 100.",
    "inputs": [],
    "expectedOutput": "1\n2\n4\n8\n16\n32\n64",
    "hint": "A while loop: print n, then n = n * 2.",
    "solution": "n = 1\nwhile n < 100:\n    print(n)\n    n = n * 2"
  },
  {
    "title": "Letter grade",
    "task": "With score = 73, print A for 90+, B for 80+, C for 70+, otherwise F.",
    "inputs": [],
    "expectedOutput": "C",
    "hint": "Check from the top grade down with if / elif / else.",
    "solution": "score = 73\nif score >= 90:\n    print(\"A\")\nelif score >= 80:\n    print(\"B\")\nelif score >= 70:\n    print(\"C\")\nelse:\n    print(\"F\")"
  },
  {
    "title": "Skip the threes",
    "task": "Print 1 to 10, one per line, but skip every multiple of 3.",
    "inputs": [],
    "expectedOutput": "1\n2\n4\n5\n7\n8\n10",
    "hint": "continue skips the rest of that round.",
    "solution": "for n in range(1, 11):\n    if n % 3 == 0:\n        continue\n    print(n)"
  },
  {
    "title": "Weather words",
    "task": "With temp = 30, print Hot day if it's above 25, Nice day if it's above 15, otherwise Cold day.",
    "inputs": [],
    "expectedOutput": "Hot day",
    "hint": "if, then elif, then else. Only the first true branch runs.",
    "solution": "temp = 30\nif temp > 25:\n    print(\"Hot day\")\nelif temp > 15:\n    print(\"Nice day\")\nelse:\n    print(\"Cold day\")"
  },
  {
    "title": "Leap year",
    "task": "With year = 2024, print exactly: 2024 is a leap year  (for this one, a year is a leap year if it divides evenly by 4).",
    "inputs": [],
    "expectedOutput": "2024 is a leap year",
    "hint": "year % 4 == 0 means no remainder when dividing by 4.",
    "solution": "year = 2024\nif year % 4 == 0:\n    print(f\"{year} is a leap year\")\nelse:\n    print(f\"{year} is not a leap year\")"
  },
  {
    "title": "Greeting card",
    "task": "Ask \"Name? \" and \"Age? \", then print: Happy 13th birthday, Ana!  (age plus 1, with th after it)",
    "inputs": [
      "Ana",
      "12"
    ],
    "expectedOutput": "Name? Ana\nAge? 12\nHappy 13th birthday, Ana!",
    "hint": "Two inputs, one int(). Then an f-string with both.",
    "solution": "name = input(\"Name? \")\nage = int(input(\"Age? \"))\nprint(f\"Happy {age + 1}th birthday, {name}!\")"
  },
  {
    "title": "Box of stars",
    "task": "Print a 3 by 3 box of # signs using a loop inside a loop.",
    "inputs": [],
    "expectedOutput": "###\n###\n###",
    "hint": "print(\"#\", end=\"\") stays on the line; an empty print() ends the row.",
    "solution": "for row in range(3):\n    for col in range(3):\n        print(\"#\", end=\"\")\n    print()"
  }
];
  const root = $("daily");
  const DRAFT = "codebuddy.daily.draft";
  let cm = null, hooks = { isSolved: () => false, onSolved: () => {}, solvedCount: () => 0 }, misses = 0, cur = null;

  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function today() {
    const d = new Date();
    const n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
    const i = ((n % POOL.length) + POOL.length) % POOL.length;
    return { date: dayKey(d), n: n + 1, challenge: POOL[i] };
  }
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const tidy = (t) => t.replace(/\r/g, "").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");

  function setResult(kind, html) { const r = $("daily-result"); r.className = "daily-result " + kind; r.innerHTML = html; r.hidden = !html; }

  async function check() {
    if (!sandbox.ready) { setResult("info", "Python is still loading. Try again in a moment."); return; }
    $("daily-check").disabled = true;
    const lines = [];
    const r = await sandbox.run(cm.getValue(), [...cur.challenge.inputs], (t, isErr) => { if (!isErr) lines.push(t); });
    $("daily-check").disabled = false;
    if (!r.ok) {
      misses++;
      const [t, b] = playground.explain(r.error);
      const chip = (x) => esc(x).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*([^*]+)\*/g, "$1");
      setResult("bad", `<b>${r.line ? `Line ${r.line}: ` : ""}${chip(t)}</b> ${chip(b)}<pre>${esc(r.error)}</pre>`);
      sfx.error(); afterMiss(); return;
    }
    const got = tidy(lines.join("\n")), want = tidy(cur.challenge.expectedOutput);
    if (got === want) {
      const first = !hooks.isSolved(cur.date);
      setResult("good", `<b>✓ Solved!</b> Your program printed exactly the right thing.${first ? " That counts for today's streak 🔥" : ""} New challenge tomorrow.`);
      $("daily-status").textContent = "✓ Solved";
      $("daily-status").className = "daily-status solved";
      if (first) { hooks.onSolved(cur.date); fx.confetti(140); sfx.levelUp(); } else sfx.success();
      return;
    }
    misses++;
    const g = got.split("\n"), w = want.split("\n");
    let k = 0; while (k < Math.max(g.length, w.length) && g[k] === w[k]) k++;
    const msg = !got ? "Your program didn't print anything."
      : k >= w.length ? `Your output has extra lines after line ${w.length}: <code>${esc(g[k])}</code>`
      : k >= g.length ? `You're missing line ${k + 1}: it should be <code>${esc(w[k])}</code>`
      : `Line ${k + 1} should be <code>${esc(w[k])}</code> but yours printed <code>${esc(g[k])}</code>`;
    setResult("bad", `<b>Not quite.</b> ${msg}<pre>${esc(got) || "(nothing)"}</pre>`);
    sfx.error(); afterMiss();
  }
  function afterMiss() { if (misses >= 2) $("daily-solution").hidden = false; }

  function render() {
    cur = today();
    const c = cur.challenge, solved = hooks.isSolved(cur.date);
    $("daily-kicker").textContent = `📅 Daily challenge · ${new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
    $("daily-title").textContent = c.title;
    $("daily-task").textContent = c.task;
    $("daily-expected").textContent = c.expectedOutput;
    $("daily-inputs").hidden = !c.inputs.length;
    $("daily-inputs").innerHTML = c.inputs.length ? `When your program asks, the user types ${c.inputs.map((x) => `<code>${esc(x)}</code>`).join(", then ")}.` : "";
    $("daily-hint-text").hidden = true; $("daily-hint-text").textContent = c.hint;
    $("daily-solution").hidden = true;
    $("daily-status").textContent = solved ? "✓ Solved" : "";
    $("daily-status").className = "daily-status" + (solved ? " solved" : "");
    setResult("", "");
    misses = 0;
    let draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch {}
    cm.setValue(draft && draft.date === cur.date ? draft.code : "");
  }

  function open() {
    root.hidden = false; root.classList.remove("show"); void root.offsetWidth; root.classList.add("show");
    if (!cm) {
      cm = CodeMirror.fromTextArea($("daily-code"), {
        mode: "python", lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false, lineWrapping: true,
        extraKeys: {
          "Ctrl-Enter": check, "Cmd-Enter": check,
          Tab: (c) => (c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection(" ".repeat(4 - (c.getCursor().ch % 4)), "end")),
          "Shift-Tab": (c) => c.indentSelection("subtract"),
          Backspace: (c) => (typeof smartBackspace === "function" ? smartBackspace(c) : CodeMirror.Pass),
        },
      });
      cm.getInputField().setAttribute("aria-label", "Daily challenge: write your Python here");
      if (typeof wordinfo !== "undefined") wordinfo.attach(cm);
      cm.on("change", () => { try { localStorage.setItem(DRAFT, JSON.stringify({ date: cur.date, code: cm.getValue() })); } catch {} });
      if (typeof keybar !== "undefined") keybar.attach(cm, check);
    }
    render();
    requestAnimationFrame(() => { cm.refresh(); if (!matchMedia("(pointer: coarse)").matches) cm.focus(); });
    sfx.pop();
  }
  function close() { root.hidden = true; }

  $("daily-check").addEventListener("click", check);
  $("daily-hint").addEventListener("click", () => { $("daily-hint-text").hidden = false; sfx.pop(); });
  $("daily-solution").addEventListener("click", () => {
    setResult("info", `<b>One way to solve it:</b><pre>${esc(cur.challenge.solution)}</pre>Try typing it yourself, then press Check.`);
  });
  $("daily-close").addEventListener("click", close);
  root.addEventListener("click", (e) => { if (e.target === root) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden && (typeof viz === "undefined" || !viz.isOpen)) close(); });

  function init(h) { hooks = { ...hooks, ...h }; }
  return { open, close, today, init, POOL, get isOpen() { return !root.hidden; } };
})();
