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
    target = 0; carry = 0; lastFrame = 0; cancelAnimationFrame(smoothRaf); smoothRaf = 0;
    speechEl.innerHTML = "";
    speechEl.classList.add("typing");

    for (const raw of message.split("\n")) {
      const isLabel = raw.startsWith("# ");
      const lineText = isLabel ? raw.slice(2) : raw;
      const line = document.createElement("div");
      line.className = isLabel ? "speech-label " + labelClass(lineText) : "speech-line";
      // split into: `code chips`, *vocab terms*, and plain text
      lineText.split(/(`[^`]*`|\*[^*]+\*|\b(?:Enter|Tab|Backspace)\b)/).forEach((piece) => {
        if (!piece) return;
        const isCode = piece.startsWith("`");
        const isTerm = !isCode && piece.startsWith("*") && piece.length > 2;
        const isKey = !isCode && !isTerm && /^(Enter|Tab|Backspace)$/.test(piece);
        const text = isCode || isTerm ? piece.slice(1, -1) : piece;
        let el;
        if (isCode) { el = document.createElement("code"); el.className = "chip"; }
        else if (isTerm) { el = document.createElement("span"); el.className = "term " + termClass(text); }
        else if (isKey) { el = document.createElement("kbd"); el.className = "key"; }
        else el = document.createElement("span");
        // code chips get syntax colors: each token is its own span
        const groups = isCode ? tokenize(text) : [{ cls: "", text }];
        // how each character is SPOKEN: chips say their symbols ("(" ->
        // "open paren"); plain text says empty pairs like ( ) as a word
        const spokenChip = isCode ? speakCode(text) : speakProse(text);
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
              spoken += spokenChip[ci++];
            }
          }
        }
        if (isCode && !isLabel) spoken += " ";
        line.appendChild(el);
      });
      if (isLabel) spoken += spokenLabel(lineText);   // said out loud, not shown
      else spoken += " ";
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
      // (and re-anchor the pacing cursor to the voice's real position)
      onChunk: (from, to) => { revealTo(from); startPacing(from, to); },
      onChunkEnd: (from, to) => { learnSpeed(to - from, performance.now() - pacedStart); revealTo(to); },
      onWord: (charIndex) => { revealTo(charIndex + 18); startPacing(charIndex + 18, pacedLimit); },
      onEnd: () => finishTyping(false),
    });
    if (started) {
      // Some voices (Chrome's Google ones) never send word events, so we
      // also pace the reveal at roughly speaking speed, sentence by
      // sentence: each sentence's start event re-anchors the cursor and the
      // text can't run past that sentence until the next one begins. The
      // voice's own "end" finishes it.
      startPacing(0, 0);       // nothing shows until the voice actually starts
      paced();
    } else {
      tick();
    }
  }

  // The reveal follows a cursor moving through the SPOKEN text at speaking
  // speed, and each visible character appears when the cursor passes its
  // spoken position. Spoken text that has no visible characters (the
  // header lead-ins, "open paren" for a "(") just makes the cursor take
  // longer to reach the next visible character, so the text waits for the
  // voice instead of running ahead of it.
  // Speaking speed is measured from the voice itself: every finished
  // sentence tells us how long it took, and that keeps the estimate honest
  // for whichever voice the learner picked (it starts at ~12 chars/second).
  let msPerChar = 80;              // at rate 1.0
  const LOOKAHEAD = 6;             // show a few characters ahead, like subtitles
  let pacedStart = 0, pacedBase = 0, pacedLimit = Infinity;
  function startPacing(fromSpokenPos = 0, limit = Infinity) { pacedBase = fromSpokenPos; pacedStart = performance.now(); pacedLimit = limit; }
  function learnSpeed(spokenChars, ms) {
    if (spokenChars < 12 || ms < 200) return;
    const measured = (ms * voice.rate) / spokenChars;
    msPerChar = Math.max(40, Math.min(140, msPerChar * 0.5 + measured * 0.5));
  }
  function paced() {
    if (revealed >= chars.length) return;        // wait for the voice to end
    const pos = pacedBase + ((performance.now() - pacedStart) * voice.rate) / msPerChar + LOOKAHEAD;
    // never run past the sentence the voice is on: the next sentence's
    // start event moves the limit forward
    revealTo(Math.min(pos, pacedLimit));
    typingTimer = setTimeout(paced, 40);
  }

  // Letters never pop in as a block. revealTo only moves the TARGET; a
  // frame loop walks the reveal toward it a letter or two at a time, a bit
  // faster when it has further to catch up, so a snap to the end of a
  // sentence looks like quick typing instead of a jump.
  let target = 0, smoothRaf = 0, lastFrame = 0, carry = 0;
  function smooth(now) {
    smoothRaf = 0;
    if (revealed >= chars.length) return;
    const behind = target - revealed;
    if (behind <= 0) { lastFrame = 0; return; }
    const dt = lastFrame ? Math.min(50, now - lastFrame) : 16;
    lastFrame = now;
    // base ~60 letters/s, up to ~200/s when far behind
    const perMs = Math.min(0.2, 0.06 + behind * 0.004);
    carry += dt * perMs;
    let n = Math.floor(carry); carry -= n;
    while (n-- > 0 && revealed < target && revealed < chars.length) chars[revealed++].classList.add("on");
    smoothRaf = requestAnimationFrame(smooth);
  }
  function setTarget(n) {
    target = Math.max(target, Math.min(n, chars.length));
    if (!smoothRaf && target > revealed) smoothRaf = requestAnimationFrame(smooth);
  }

  // Long runs of the same digit ("00000000", "0 0 0 0 0 0 0 0") make the
  // voice stutter. Say them as a count instead: "eight zeros". Works on the
  // per-character spoken pieces, so the typewriter mapping stays exact.
  const DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const COUNT_WORDS = ["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  function collapseRuns(text, pieces) {
    const re = /(?<![\w])(\d)(?:(?: ?)\1){2,}(?![\w])/g;
    let m;
    while ((m = re.exec(text))) {
      const d = m[1], n = m[0].replace(/ /g, "").length;
      pieces[m.index] = ` ${COUNT_WORDS[n] || n} ${DIGIT_WORDS[+d]}s `;
      for (let k = m.index + 1; k < m.index + m[0].length; k++) pieces[k] = "";
    }
    return pieces;
  }

  const KEEP_CAPS = new Set(["CSP", "RLE", "API", "JPEG", "PNG", "URL", "HTML", "CSS"]);

  // How the voice reads code: one spoken piece per character, so the
  // typewriter can stay in sync. Symbols get names; text inside quotes is
  // read naturally; two-character operators are named once.
  // Plain sentences: an empty pair like "( )" or "()" is read as a word
  // ("print( )" -> "print parentheses"). Everything else is read as is.
  const EMPTY_PAIRS = [["(", ")", "parentheses"], ["[", "]", "square brackets"], ["{", "}", "curly braces"], ['"', '"', "quotes"], ["'", "'", "quotes"]];
  function speakProse(text) {
    const out = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const pair = EMPTY_PAIRS.find(([o]) => o === ch);
      if (pair) {
        const close = text[i + 1] === pair[1] ? 1 : text[i + 1] === " " && text[i + 2] === pair[1] ? 2 : 0;
        if (close) {
          const before = text[i - 1] || " ";
          out.push((/\s/.test(before) ? "" : " ") + pair[2] + " ");
          for (let k = 0; k < close; k++) out.push("");
          i += close;
          continue;
        }
      }
      out.push(ch);
    }
    return collapseRuns(text, out);
  }

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
    return collapseRuns(code, out);
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
  // Section labels are shown as short headers ("Goal", "Hint 2 of 3") but
  // spoken as a natural lead-in ("Here's your goal for this practice.").
  const LABEL_SPEECH = [
    [/^✓/, ""],                                   // the "✓ `code`" chip header: the explanation follows
    [/^(type|now type|next|input)$/i, ""],       // the body line already says it
    [/^goal$/i, "Here's your goal for this practice."],
    [/^stuck\?$/i, "If you get stuck,"],
    [/^hint (\d) of 3$/i, (m) => `Here's hint ${m[1]}.`],
    [/^hint$/i, "Here's a hint."],
    [/^no hints left$/i, "No hints left."],
    [/^next line$/i, "Now the next line."],
    [/^whole program typed!$/i, "That's the whole program!"],
    [/^all typed!$/i, "Everything is typed!"],
    [/^ran your code/i, "I ran your code."],
    [/^running$/i, "Running!"],
    [/^infinite loop!$/i, "Uh oh, an infinite loop!"],
    [/^python stopped(.*)$/i, (m) => `Python stopped${m[1]}.`],
    [/^tip$/i, "Here's a tip."],
    [/^line (\d+)$/i, (m) => `Here's line ${m[1]} again.`],
    [/^not yet$/i, "Not yet!"],
    [/^lesson (\S+) · (.+)$/i, (m) => `Lesson ${m[1]}: ${m[2]}.`],
    [/^practice · (.+)$/i, (m) => `Practice time: ${m[1]}.`],
    [/^testing$/i, "Testing!"],
  ];
  function spokenLabel(text) {
    const plain = text.replace(/`[^`]*`/g, "").replace(/[*]/g, "").trim();
    for (const [re, out] of LABEL_SPEECH) {
      const m = plain.match(re);
      if (m) { const t = typeof out === "function" ? out(m) : out; return t ? t + " " : ""; }
    }
    return plain ? plain.replace(/[.!?:]?$/, ".") + " " : "";
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
    let n = target;
    while (n < chars.length && spokenIndex[n] <= spokenPos) n++;
    setTarget(n);
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
    if (skipped) {
      cancelAnimationFrame(smoothRaf); smoothRaf = 0;
      while (revealed < chars.length) chars[revealed++].classList.add("on");
    } else {
      setTarget(chars.length);    // the voice is done: type out whatever is left, quickly
    }
    speechEl.classList.remove("typing");
    if (skipped) voice.stop();
    doneHandlers.forEach((f) => f());
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

  // called whenever a message finishes (voice ended, or the bubble was clicked)
  const doneHandlers = [];
  function onDone(f) { doneHandlers.push(f); }

  return {
    set, say, mount, floatTo, finishTyping, onClick, onDone, tokenize, setSpeed,
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
  try { on = localStorage.getItem("codebuddy.voiceOn") === "on"; } catch {}
  let chosen = null;      // SpeechSynthesisVoice
  let rate = 1;           // what we actually ask the engine for
  let wanted = 1;         // the slider value
  // Browsers refuse to speak until the page has been clicked or typed in.
  // If the first message gets refused, say it again on the first click.
  let blockedText = null;
  document.addEventListener("pointerdown", () => { if (blockedText && on) { const t = blockedText; blockedText = null; speak(t); } }, true);
  // Above ~1.4 the Google voices stop forming words (the local Microsoft
  // and Mac voices hold up a bit longer). Faster slider positions still
  // make the text and pauses quicker; the voice itself eases toward a cap.
  function setRate(r) {
    wanted = r;
    const cap = chosen && !/Google/i.test(chosen.name) ? 1.7 : 1.4;
    rate = r <= 1 ? r : Math.min(cap, 1 + (r - 1) * (cap - 1));
  }
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
    setRate(wanted);
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
  function sentences(text) {
    const out = [];
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (/[.!?:]/.test(text[i]) && (i === text.length - 1 || /\s/.test(text[i + 1]))) {
        let j = i + 1;
        while (j < text.length && /\s/.test(text[j])) j++;
        if (text.slice(start, j).trim()) out.push({ text: text.slice(start, j), offset: start });
        start = j; i = j - 1;
      }
    }
    if (start < text.length && text.slice(start).trim()) out.push({ text: text.slice(start), offset: start });
    return out;
  }
  // The engine pauses noticeably before every utterance it's handed, so
  // sentences are grouped into utterances of up to ~140 characters: few
  // enough pauses to sound fluent, short enough that the text reveal
  // (anchored per utterance) stays close to the voice.
  const UTTERANCE_MAX = 140;
  function chunk(text) {
    const groups = [];
    for (const s of sentences(text)) {
      const last = groups[groups.length - 1];
      if (last && last.text.length + s.text.length <= UTTERANCE_MAX) last.text += s.text;
      else groups.push({ text: s.text, offset: s.offset });
    }
    return groups;
  }

  let generation = 0;
  function speak(text, { onWord, onEnd, onChunk, onChunkEnd } = {}) {
    if (!on || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const gen = ++generation;
    const chunks = chunk(text);
    if (!chunks.length) return false;
    blockedText = null;
    chunks.forEach((c, i) => {
      const u = new SpeechSynthesisUtterance(c.text);
      if (chosen) u.voice = chosen;
      u.rate = rate;
      u.pitch = 1.05;
      // every voice fires start/end per sentence, even the ones that never
      // report word positions: that's what keeps the text in step
      u.onstart = () => { if (gen === generation && onChunk) onChunk(c.offset, c.offset + c.text.length); };
      u.onboundary = (e) => { if (gen === generation && e.name === "word" && onWord) onWord(c.offset + e.charIndex); };
      u.onerror = (e) => {
        if (gen !== generation) return;
        if (e.error === "not-allowed") { blockedText = text; generation++; if (onEnd) onEnd(); return; }
        if (i === chunks.length - 1 && e.error !== "interrupted" && e.error !== "canceled" && onEnd) onEnd();
      };
      u.onend = () => {
        if (gen !== generation) return;
        if (onChunkEnd) onChunkEnd(c.offset, c.offset + c.text.length);
        if (i === chunks.length - 1 && onEnd) onEnd();
      };
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
    try { localStorage.setItem("codebuddy.voiceOn", on ? "on" : "off"); } catch {}
    return on;
  }

  function choose(name) {
    chosen = voices().find((v) => v.name === name) || chosen;
    setRate(wanted);   // the cap depends on which voice
    try { localStorage.setItem("codebuddy.voice", name); } catch {}
  }

  return { speak, stop, toggle, choose, voices, chunk, setRate, get rate() { return rate; }, get on() { return on; }, get chosen() { return chosen; } };
})();
