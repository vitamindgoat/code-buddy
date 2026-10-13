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
  const CHAR_MS = 16;
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
      line.className = isLabel ? "speech-label" : "speech-line";
      // split "text `code` text" into alternating pieces
      lineText.split(/(`[^`]*`)/).forEach((piece) => {
        if (!piece) return;
        const isCode = piece.startsWith("`");
        const text = isCode ? piece.slice(1, -1) : piece;
        const el = document.createElement(isCode ? "code" : "span");
        if (isCode) el.className = "chip";
        if (isLabel) {
          el.textContent = text;            // labels show at once
        } else {
          for (const ch of text) {
            const c = document.createElement("span");
            c.className = "ch";
            c.textContent = ch;
            el.appendChild(c);
            chars.push(c);
            spokenIndex.push(spoken.length);
            spoken += ch;
          }
        }
        line.appendChild(el);
      });
      if (!isLabel) spoken += " ";
      speechEl.appendChild(line);
    }

    // pop + start revealing
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");

    if (state) set(state);   // the pose holds until the bubble finishes

    const started = voice.speak(spoken, {
      // the speech engine tells us where it is; we keep the text in step
      onWord: (charIndex) => revealTo(charIndex + 18),
      onEnd: finishTyping,
    });
    if (started) {
      // safety net: if no word events arrive, fall back to the timer
      typingTimer = setTimeout(() => { if (revealed === 0) tick(); }, 1200);
    } else {
      tick();
    }
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
    const pause = /[.!?]/.test(c.textContent) ? 140 : CHAR_MS;
    typingTimer = setTimeout(tick, pause);
  }

  function finishTyping() {
    clearTimeout(typingTimer);
    while (revealed < chars.length) chars[revealed++].classList.add("on");
    speechEl.classList.remove("typing");
    voice.stop();
    // done talking: a one-shot pose can relax now
    if (ONE_SHOT.includes(host.getAttribute("data-state"))) {
      clearTimeout(revertTimer);
      revertTimer = setTimeout(() => set("idle"), 900);
    }
  }

  speechEl.addEventListener("click", finishTyping);

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
    set, say, mount, floatTo, finishTyping, onClick,
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
  const PREFERRED = [
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

  // Returns true if speech actually started (so the bubble can sync to it)
  function speak(text, { onWord, onEnd } = {}) {
    if (!on || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (chosen) u.voice = chosen;
    u.rate = 1.0;
    u.pitch = 1.1;
    u.onboundary = (e) => { if (e.name === "word" && onWord) onWord(e.charIndex); };
    u.onend = () => onEnd && onEnd();
    u.onerror = () => onEnd && onEnd();
    window.speechSynthesis.speak(u);
    return true;
  }

  function stop() {
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

  return { speak, stop, toggle, choose, voices, get on() { return on; }, get chosen() { return chosen; } };
})();
