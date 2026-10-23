/* ============================================================
   sfx.js — sound effects
   Every sound is synthesized with the Web Audio API: no audio files,
   nothing copied from anywhere. Each one is a few oscillators with a
   quick volume envelope (fade in, fade out), which is how most "UI
   blip" sounds are made.

     sfx.tick()      a piece of the line finished (soft blip)
     sfx.success()   a right answer (two-note chime)
     sfx.lineDone()  a whole line of code finished: one of eight little
                     jingles, never the same one twice in a row
     sfx.levelUp()   lesson complete (rising arpeggio)
     sfx.error()     a wrong character appeared (soft low bonk)
     sfx.badge()     a badge was earned (bright fanfare)
     sfx.click()     any button
     sfx.run()       Run pressed (whoosh)
     sfx.pop()       bubble / tour card appears
     sfx.toggle()    turn sound on/off (saved)

   Browsers only allow sound after the user interacts with the page, so
   the AudioContext is created lazily on the first click or keypress.
   ============================================================ */

const sfx = (() => {
  let ctx = null;
  let on = true;
  try { on = localStorage.getItem("codebuddy.sound") !== "off"; } catch {}

  function ready() {
    if (!on) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Phones (iOS especially) only let a page make sound if the audio context
  // was created or resumed INSIDE a touch or key handler. The first tap or
  // keypress anywhere unlocks it, with a silent blip so iOS counts it as
  // "played"; after that, sounds fired from timers work too.
  let unlocked = false;
  function unlock() {
    const c = ready(); if (!c) return;
    if (c.state === "suspended") c.resume();
    if (unlocked) return;
    unlocked = true;
    try {
      const buf = c.createBuffer(1, 1, c.sampleRate);
      const src = c.createBufferSource(); src.buffer = buf; src.connect(c.destination); src.start(0);
    } catch {}
  }
  for (const ev of ["touchend", "pointerdown", "keydown"]) document.addEventListener(ev, unlock, { capture: true, passive: true });

  // One note: `type` is the waveform, freq in Hz, timing in seconds.
  // The gain envelope goes 0 -> vol quickly, then decays to silence.
  function note({ type = "sine", freq = 440, start = 0, dur = 0.12, vol = 0.18, slideTo = null }) {
    const c = ready(); if (!c) return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // A burst of filtered noise: used for the "whoosh"
  function whoosh() {
    const c = ready(); if (!c) return;
    const dur = 0.35;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource(); src.buffer = buf;
    const filter = c.createBiquadFilter(); filter.type = "bandpass"; filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, c.currentTime + dur);
    const gain = c.createGain(); gain.gain.value = 0.25;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  const tick = () => note({ type: "sine", freq: 880, dur: 0.08, vol: 0.12 });
  const success = () => { note({ freq: 523.25, dur: 0.14 }); note({ freq: 659.25, start: 0.09, dur: 0.18 }); };
  // Finishing a line: eight different jingles so it doesn't get old. They
  // play in a shuffled order and reshuffle once all eight have been heard.
  const LINE_JINGLES = [
    () => { note({ freq: 523.25, dur: 0.14 }); note({ freq: 659.25, start: 0.09, dur: 0.18 }); },                                   // C E  (the classic)
    () => { note({ freq: 659.25, dur: 0.12 }); note({ freq: 783.99, start: 0.08, dur: 0.12 }); note({ freq: 1046.5, start: 0.16, dur: 0.2 }); },   // E G C  rising
    () => { note({ type: "triangle", freq: 783.99, dur: 0.1, vol: 0.16 }); note({ type: "triangle", freq: 587.33, start: 0.08, dur: 0.2, vol: 0.16 }); },  // G D  down-up bounce
    () => { note({ freq: 440, slideTo: 880, dur: 0.16, vol: 0.14 }); note({ freq: 1174.7, start: 0.14, dur: 0.14, vol: 0.12 }); },   // swoop up + ping
    () => { [523.25, 659.25, 783.99].forEach((f, i) => note({ type: "triangle", freq: f, start: i * 0.05, dur: 0.14, vol: 0.14 })); },  // quick C major strum
    () => { note({ type: "sine", freq: 987.77, dur: 0.07, vol: 0.14 }); note({ type: "sine", freq: 987.77, start: 0.1, dur: 0.07, vol: 0.14 }); note({ type: "sine", freq: 1318.5, start: 0.2, dur: 0.18, vol: 0.14 }); },  // B B E  double tap + high
    () => { note({ type: "triangle", freq: 392, dur: 0.1, vol: 0.16 }); note({ type: "triangle", freq: 523.25, start: 0.07, dur: 0.1, vol: 0.16 }); note({ type: "triangle", freq: 659.25, start: 0.14, dur: 0.1, vol: 0.16 }); note({ type: "triangle", freq: 783.99, start: 0.21, dur: 0.22, vol: 0.16 }); },  // G C E G  fanfare
    () => { note({ type: "sine", freq: 880, slideTo: 1760, dur: 0.1, vol: 0.12 }); note({ type: "sine", freq: 1318.5, start: 0.12, dur: 0.1, vol: 0.1 }); note({ type: "sine", freq: 1760, start: 0.2, dur: 0.16, vol: 0.1 }); },  // zip + sparkle
  ];
  let bag = [], lastJingle = -1;
  const lineDone = () => {
    if (!bag.length) {
      bag = LINE_JINGLES.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag[bag.length - 1] === lastJingle) bag.unshift(bag.pop());   // a fresh bag never repeats the last one
    }
    lastJingle = bag.pop();
    LINE_JINGLES[lastJingle]();
  };
  const levelUp = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note({ type: "triangle", freq: f, start: i * 0.09, dur: 0.22, vol: 0.2 }));
  const error = () => note({ type: "triangle", freq: 220, slideTo: 160, dur: 0.16, vol: 0.14 });
  // badge earned: a bright little three-note fanfare with a shimmer on top
  const badge = () => { [659.25, 880, 1318.5].forEach((f, i) => note({ type: "triangle", freq: f, start: i * 0.07, dur: 0.2, vol: 0.16 })); note({ type: "sine", freq: 2637, start: 0.22, dur: 0.25, vol: 0.06 }); };
  const click = () => note({ type: "square", freq: 1200, dur: 0.035, vol: 0.05 });
  const pop = () => note({ type: "sine", freq: 600, slideTo: 900, dur: 0.07, vol: 0.1 });
  const run = () => { whoosh(); note({ type: "triangle", freq: 440, slideTo: 880, dur: 0.25, vol: 0.1 }); };

  function toggle() {
    on = !on;
    try { localStorage.setItem("codebuddy.sound", on ? "on" : "off"); } catch {}
    if (on) success();
    return on;
  }

  return { tick, success, lineDone, levelUp, error, badge, click, pop, run, toggle, get on() { return on; } };
})();
