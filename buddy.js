/* ============================================================
   buddy.js — the mentor buddy
   The character art is five SVG poses in assets/buddy/
   (idle, thinking, happy, pointing, celebrate). This file:
     1. Loads the five pose files once, then mounts them into #buddy
     2. Exposes a tiny API the rest of the app uses:
          buddy.set("happy")       switch pose (+ its animation)
          buddy.set("happy", 1500) switch, then return to idle after 1.5s
          buddy.say("text")        speech bubble, typed out like a typewriter
                                   ("\n" = new line, `code` = code chip)
          buddy.state              the current state name
          buddy.floatTo(y)         slide the floating buddy to y px (in the editor)
          buddy.mount(el)          put a second buddy somewhere (debug strip)

   The current state is a data-state attribute on the host box.
   buddy.css decides which pose is visible and how it moves.
   So JS decides WHAT the buddy feels, CSS decides how that LOOKS.
   ============================================================ */

const BUDDY_STATES = ["idle", "thinking", "happy", "pointing", "celebrate"];

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

  // A message is text with "\n" for new lines and `backticks` for code.
  // We build the bubble with all the text already in place but hidden,
  // then reveal one character at a time. Clicking the bubble reveals it
  // all at once (and stops the voice).
  const CHAR_MS = 16;
  let typingTimer = null;
  let pending = [];   // spans still waiting to be revealed, in order

  function say(message) {
    clearTimeout(typingTimer);
    pending = [];
    speechEl.innerHTML = "";
    speechEl.classList.add("typing");

    for (const lineText of message.split("\n")) {
      const line = document.createElement("div");
      line.className = "speech-line";
      // split "text `code` text" into alternating pieces
      lineText.split(/(`[^`]*`)/).forEach((piece) => {
        if (!piece) return;
        const isCode = piece.startsWith("`");
        const text = isCode ? piece.slice(1, -1) : piece;
        const el = document.createElement(isCode ? "code" : "span");
        if (isCode) el.className = "chip";
        for (const ch of text) {
          const c = document.createElement("span");
          c.className = "ch";
          c.textContent = ch;
          el.appendChild(c);
          pending.push(c);
        }
        line.appendChild(el);
      });
      speechEl.appendChild(line);
    }

    // pop + start typing
    speechEl.classList.remove("pop");
    void speechEl.offsetWidth;
    speechEl.classList.add("pop");
    typeNext();
    voice.speak(message.replace(/`/g, ""));
  }

  function typeNext() {
    if (pending.length === 0) {
      speechEl.classList.remove("typing");
      return;
    }
    const c = pending.shift();
    c.classList.add("on");
    // punctuation gets a tiny pause, like real speech
    const pause = /[.!?]/.test(c.textContent) ? 140 : CHAR_MS;
    typingTimer = setTimeout(typeNext, pause);
  }

  function finishTyping() {
    clearTimeout(typingTimer);
    for (const c of pending) c.classList.add("on");
    pending = [];
    speechEl.classList.remove("typing");
    voice.stop();
  }

  speechEl.addEventListener("click", finishTyping);

  // Slide the whole floating group (buddy + bubble) so it sits level with
  // a line in the editor. CSS animates the move.
  function floatTo(y) {
    floatEl.style.setProperty("--y", `${Math.round(y)}px`);
  }

  mount(host, "idle");

  return {
    set, say, mount, floatTo, finishTyping,
    get state() { return host.getAttribute("data-state"); },
  };
})();

/* ============================================================
   voice — text-to-speech using the browser's built-in voices.
   Free, works offline, nothing to install. Off until the learner
   clicks the speaker button.
   ============================================================ */

const voice = (() => {
  let on = false;

  function speak(text) {
    if (!on || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();              // don't pile up sentences
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.15;                               // a touch higher = friendlier
    window.speechSynthesis.speak(u);
  }

  function stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function toggle() {
    on = !on;
    if (!on) stop();
    return on;
  }

  return { speak, stop, toggle, get on() { return on; } };
})();
