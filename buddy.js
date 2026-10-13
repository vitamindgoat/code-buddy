/* ============================================================
   buddy.js — the mentor buddy
   The character art is five SVG poses in assets/buddy/
   (idle, thinking, happy, pointing, celebrate). This file:
     1. Loads the five pose files once, then mounts them into #buddy
     2. Exposes a tiny API the rest of the app uses:
          buddy.set("happy")       switch pose (+ its animation)
          buddy.say(text, state)   speech bubble, typed out like a typewriter;
                                   the pose holds until the bubble is done
                                   ("\n" = new line, `code` = chip, "# x" = label)
          buddy.state              the current state name
          buddy.floatTo(y)         slide the floating buddy to y px (in the editor)
          buddy.onClick(fn)        what happens when the learner clicks him
          buddy.mount(el)          put a second buddy somewhere (debug strip)

   The current state is a data-state attribute on the host box.
   buddy.css decides which pose is visible and how it moves.
   So JS decides WHAT the buddy feels, CSS decides how that LOOKS.
   ============================================================ */

const BUDDY_STATES = ["idle", "thinking", "happy", "pointing", "celebrate"];
const ONE_SHOT = ["happy", "celebrate"];   // poses that go back to idle after talking

const buddy = (() => {
  const host = document.getElementById("buddy");
  const floatEl = document.getElementById("buddy-float");
  const speechEl = document.getElementById("speech");
  let revertTimer = null;
  let instances = 0;

  // Fetch each pose file once (in parallel). We keep the raw text so we
  // can mount as many copies as we like.
  const posesReady = Promise.all(
    BUDDY_STATES.map((state) =>
      fetch(`assets/buddy/${state}.svg?v=${document.querySelector('meta[name="build"]').content}`).then((res) => res.text())
    )
  );

  // Put all five poses inside `el`. SVG ids (the clip paths) are global to
  // the whole page, so each copy gets its own suffix: a second copy that
  // pointed at the first copy's clip would silently lose its clipping.
  async function mount(el, state = "idle") {
    const texts = await posesReady;
    const n = ++instances;
    el.classList.add("buddy");
    el.setAttribute("data-state", state);
    el.innerHTML = texts
      .map((svg) => svg.replace(/(id="|url\(#)([a-z]+-clip)/g, `$1$2-${n}`))
      .join("");
  }

  function set(state, ms = 0) {
    clearTimeout(revertTimer);

    // Trick: if we set the same state twice in a row, the CSS animation
    // would NOT replay. Removing the attribute, forcing the browser to
    // notice (offsetWidth), then setting it again restarts it.
    host.removeAttribute("data-state");
    void host.offsetWidth;
    host.setAttribute("data-state", state);

    if (ms > 0) {
      revertTimer = setTimeout(() => set("idle"), ms);
    }
  }

  // ---------- the speech bubble: a typewriter ----------

  // A message is text with "\n" for new lines, `backticks` for code and
  // "# " at the start of a line for a section label. We build the bubble
  // with all the text in place but hidden, then reveal it character by
  // character: on a timer, or in sync with the voice when it's on.
  // Clicking the bubble reveals it all (and stops the voice).
  let CHAR_MS = 16;
  let speed = 1;               // settings: 0.5 (slow) .. 2 (fast)
  function setSpeed(f) { speed = f; CHAR_MS = Math.round(16 / f); }
  let typingTimer = null;
  let chars = [];        // every revealable character span, in order
  let revealed = 0;      // how many are shown so far
  let spoken = "";       // the text the voice reads (labels left out)
  let spokenIndex = [];  // chars[i] -> its index in `spoken`

  function say(message, state) {
    clearTimeout(typingTimer);
    chars = []; spokenIndex = []; revealed = 0; spoken = "";
    speechEl.innerHTML = "";
    speechEl.classList.add("typing");

    for (const raw of message.split("\n")) {
      const isLabel = raw.startsWith("# ");
      const lineText = isLabel ? raw.slice(2) : raw;
      const line = document.createElement("div");
      line.className = isLabel ? "speech-label " + labelClass(lineText) : "speech-line";
      // split into: `code chips`, *vocab terms*, and plain text
      lineText.split(/(`[^`]*`|\*[^*]+\*)/).forEach((piece) => {
        if (!piece) return;
        const isCode = piece.startsWith("`");
        const isTerm = !isCode && piece.startsWith("*") && piece.length > 2;
        const text = isCode || isTerm ? piece.slice(1, -1) : piece;
        let el;
        if (isCode) { el = document.createElement("code"); el.className = "chip"; }
        else if (isTerm) { el = document.createElement("span"); el.className = "term " + termClass(text); }
        else el = document.createElement("span");
        // code chips get syntax colors: each token is its own span
        const groups = isCode ? tokenize(text) : [{ cls: "", text }];
        // how each character of a chip is SPOKEN ("(" -> "open paren")
        const spokenChip = isCode ? speakCode(text) : null;
        let ci = 0;
        for (const g of groups) {
          const holder = g.cls ? document.createElement("span") : el;
          if (g.cls) { holder.className = "tok " + g.cls; el.appendChild(holder); }
          if (isLabel) {
            holder.appendChild(document.createTextNode(g.text));   // labels show at once
          } else {
            for (const ch of g.text) {
              const c = document.createElement("span");
              c.className = "ch";
              c.textContent = ch;
              holder.appendChild(c);
              chars.push(c);
              spokenIndex.push(spoken.length);
              spoken += isCode ? spokenChip[ci++] : ch;
            }
          }
        }
        if (isCode && !isLabel) spoken += " ";
        line.appendChild(el);
      });
      if (!isLabel) spoken += " ";
      speechEl.appendChild(line);
    }
    // ALL-CAPS words like OR, AND, NOT get spelled out letter by letter by
    // the voice. Lowercase them for speech only (same length, so the
    // typewriter mapping stays exact). Real acronyms stay.
    spoken = spoken.replace(/\b([A-Z]{2,5})\b/g, (w) => (KEEP_CAPS.has(w) ? w : w.toLowerCase()));

    // pop + start revealing
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");

    if (state) set(state);   // the pose holds until the bubble finishes

    const started = voice.speak(spoken, {
      // the speech engine tells us where it is; we keep the text in step
      onWord: (charIndex) => revealTo(charIndex + 18),
      onEnd: () => finishTyping(false),
    });
    if (started) {
      // Some voices (Chrome's Google ones) never send word events, so we
      // also pace the reveal at roughly speaking speed. Word events, when
      // they do arrive, snap it forward. The voice's own "end" finishes it.
      paced();
    } else {
      tick();
    }
  }

  const SPEECH_MS_PER_CHAR = 70;   // ~14 characters a second at rate 1.0
  function paced() {
    if (revealed >= chars.length) return;        // wait for the voice to end
    chars[revealed++].classList.add("on");
    typingTimer = setTimeout(paced, Math.round(SPEECH_MS_PER_CHAR / speed));
  }

  const KEEP_CAPS = new Set(["CSP", "RLE", "API", "JPEG", "PNG", "URL", "HTML", "CSS"]);

  // How the voice reads code: one spoken piece per character, so the
  // typewriter can stay in sync. Symbols get names; text inside quotes is
  // read naturally; two-character operators are named once.
  const SYMBOLS = {
    "(": "open paren ", ")": "close paren ", "[": "open bracket ", "]": "close bracket ",
    "{": "open brace ", "}": "close brace ", ":": "colon ", "=": "equals ", "+": "plus ",
    "-": "minus ", "*": "star ", "/": "slash ", "%": "percent ", "#": "hash ", ",": "comma ",
    ".": "dot ", "!": "exclamation ", "<": "less than ", ">": "greater than ", "_": "underscore ",
    "\\": "backslash ", "⏎": "enter ", "·": " ",
  };
  const PAIRS = { "==": "double equals ", "!=": "not equals ", "//": "double slash ", ">=": "greater or equal ", "<=": "less or equal ", "**": "to the power of " };
  function speakCode(code) {
    const out = [];
    let quote = null;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i], two = code.slice(i, i + 2);
      if (quote) {
        if (ch === quote) { quote = null; out.push(" quote "); }
        else if (ch === "\\" && i + 1 < code.length) { out.push(" backslash " + code[i + 1] + " "); i++; out.push(""); }
        else out.push(ch);                       // words inside quotes read naturally
      } else if (ch === '"' || ch === "'") {
        quote = ch; out.push(" quote ");
      } else if (PAIRS[two]) {
        out.push(" " + PAIRS[two]); out.push(""); i++;
      } else if (SYMBOLS[ch]) {
        out.push(" " + SYMBOLS[ch]);
      } else if (ch === " ") {
        out.push(" ");
      } else {
        out.push(ch);
      }
    }
    return out;
  }

  // Vocabulary words get a color by category
  const TERMS = {
    purple: ["function", "functions"],
    teal: ["variable", "variables", "accumulator"],
    pink: ["keyword", "keywords", "conditional", "if", "elif", "else"],
    green: ["string", "strings"],
    orange: ["repeat", "loop", "for loop", "while loop", "nested loop", "sequencing", "algorithm", "patterns"],
    blue: ["boolean", "booleans", "binary", "bits", "integer", "float", "type", "cast", "casts", "casting", "modulus", "floor division", "escape sequence", "length"],
    red: ["error", "errors", "entropy", "pauses"],
  };
  function termClass(text) {
    const t = text.toLowerCase();
    for (const [cls, words] of Object.entries(TERMS)) if (words.includes(t)) return "term-" + cls;
    return "term-blue";
  }
  function labelClass(text) {
    if (text.startsWith("✓")) return "label-ok";
    if (/^(hmm|hint|not yet|no hints)/i.test(text)) return "label-warn";
    if (/^(type|now type|next line|next|goal|stuck)/i.test(text)) return "label-type";
    if (/^(yes|ran your|whole program|practice|lesson)/i.test(text)) return "label-win";
    return "";
  }
  // A tiny Python tokenizer for coloring code chips
  const KEYWORDS = /^(for|in|if|elif|else|while|and|or|not|True|False|break|continue|def|return|import)$/;
  const BUILTINS = /^(print|input|int|str|float|len|type|bin|round|abs|max|min|range)$/;
  function tokenize(code) {
    const out = [];
    const re = /("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|(#.*)|([A-Za-z_]\w*)|(\s+)|(.)/g;
    let m;
    while ((m = re.exec(code))) {
      if (m[1]) out.push({ cls: "tok-str", text: m[1] });
      else if (m[2]) out.push({ cls: "tok-num", text: m[2] });
      else if (m[3]) out.push({ cls: "tok-comment", text: m[3] });
      else if (m[4]) out.push({ cls: KEYWORDS.test(m[4]) ? "tok-kw" : BUILTINS.test(m[4]) ? "tok-fn" : "tok-name", text: m[4] });
      else out.push({ cls: "", text: m[5] || m[6] });
    }
    return out;
  }

  function revealTo(spokenPos) {
    while (revealed < chars.length && spokenIndex[revealed] <= spokenPos) {
      chars[revealed].classList.add("on");
      revealed++;
    }
  }

  function tick() {
    if (revealed >= chars.length) return finishTyping();
    const c = chars[revealed++];
    c.classList.add("on");
    // punctuation gets a tiny pause, like real speech
    const pause = /[.!?]/.test(c.textContent) ? Math.round(140 / speed) : CHAR_MS;
    typingTimer = setTimeout(tick, pause);
  }

  // skipped = the learner clicked to skip ahead (then the voice stops too);
  // otherwise the message ended naturally and the voice finishes on its own
  function finishTyping(skipped = true) {
    clearTimeout(typingTimer);
    while (revealed < chars.length) chars[revealed++].classList.add("on");
    speechEl.classList.remove("typing");
    if (skipped) voice.stop();
    // done talking: a one-shot pose can relax now
    if (ONE_SHOT.includes(host.getAttribute("data-state"))) {
      clearTimeout(revertTimer);
      revertTimer = setTimeout(() => set("idle"), 900);
    }
  }

  speechEl.addEventListener("click", () => finishTyping(true));

  // Slide the whole floating group (buddy + bubble) so it sits level with
  // a line in the editor. CSS animates the move.
  function floatTo(y) {
    floatEl.style.setProperty("--y", `${Math.round(y)}px`);
  }

  function onClick(fn) {
    host.addEventListener("click", fn);
  }

  mount(host, "idle");

  return {
    set, say, mount, floatTo, finishTyping, onClick, tokenize, setSpeed,
    get state() { return host.getAttribute("data-state"); },
    get talking() { return speechEl.classList.contains("typing"); },
  };
})();

/* ============================================================
   voice — text-to-speech using the voices installed on the device.
   Free, nothing to download. We pick the most natural one we can
   find (Chrome's "Google US English", Edge's "Natural" voices, Mac's
   Samantha) and let the learner choose another.
   ============================================================ */

const voice = (() => {
  let on = false;
  let chosen = null;      // SpeechSynthesisVoice
  let rate = 1;
  function setRate(r) { rate = r; }
  const PREFERRED = [
    /Google UK English Male/i,
    /Google US English/i,
    /Microsoft (Aria|Jenny|Ana|Emma|Guy).*Natural/i,
    /Samantha/i,
    /Microsoft Zira/i,
    /^en-US/i,
  ];

  function voices() {
    return ("speechSynthesis" in window) ? window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")) : [];
  }

  function pickDefault() {
    const list = voices();
    let saved = null;
    try { saved = localStorage.getItem("codebuddy.voice"); } catch {}
    chosen = list.find((v) => v.name === saved)
      || PREFERRED.map((re) => list.find((v) => re.test(v.name) || re.test(v.lang))).find(Boolean)
      || list[0] || null;
  }
  if ("speechSynthesis" in window) {
    pickDefault();
    window.speechSynthesis.addEventListener("voiceschanged", pickDefault);
  }

  // Returns true if speech actually started (so the bubble can sync to it).
  // The text is split into sentence-sized chunks: Chrome cuts off long
  // utterances with its network voices, and short ones also give us
  // cleaner "end" timing. Boundary events are offset back into the full text.
  // Split after . ! ? : only when followed by a space or the end, so "1.1"
  // and "3.14" stay whole. Each piece remembers where it started.
  function chunk(text) {
    const chunks = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (/[.!?:]/.test(text[i]) && (i === text.length - 1 || /\s/.test(text[i + 1]))) {
        let j = i + 1;
        while (j < text.length && /\s/.test(text[j])) j++;
        if (text.slice(start, j).trim()) chunks.push({ text: text.slice(start, j), offset: start });
        start = j; i = j - 1;
      }
    }
    if (start < text.length && text.slice(start).trim()) chunks.push({ text: text.slice(start), offset: start });
    return chunks;
  }

  let generation = 0;
  function speak(text, { onWord, onEnd } = {}) {
    if (!on || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const gen = ++generation;
    const chunks = chunk(text);
    if (!chunks.length) return false;
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c.text);
      if (chosen) u.voice = chosen;
      u.rate = rate;
      u.pitch = 1.05;
      u.onboundary = (e) => { if (gen === generation && e.name === "word" && onWord) onWord(c.offset + e.charIndex); };
      if (i === chunks.length - 1) {
        u.onend = () => { if (gen === generation && onEnd) onEnd(); };
        u.onerror = (e) => { if (gen === generation && e.error !== "interrupted" && e.error !== "canceled" && onEnd) onEnd(); };
      }
      window.speechSynthesis.speak(u);
    });
    return true;
  }

  function stop() {
    generation++;                       // ignore events from the old utterances
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function toggle() {
    on = !on;
    if (!on) stop();
    return on;
  }

  function choose(name) {
    chosen = voices().find((v) => v.name === name) || chosen;
    try { localStorage.setItem("codebuddy.voice", name); } catch {}
  }

  return { speak, stop, toggle, choose, voices, chunk, setRate, get on() { return on; }, get chosen() { return chosen; } };
})();
