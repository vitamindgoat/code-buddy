/* ============================================================
   sfx.js — sound effects
   Every sound is synthesized with the Web Audio API: no audio files,
   nothing copied from anywhere. Each one is a few oscillators with a
   quick volume envelope (fade in, fade out), which is how most "UI
   blip" sounds are made.

     sfx.tick()      a piece of the line finished (soft blip)
     sfx.success()   a whole line finished (two-note chime)
     sfx.levelUp()   lesson complete (rising arpeggio)
     sfx.error()     a wrong character appeared (soft low bonk)
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
  const levelUp = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note({ type: "triangle", freq: f, start: i * 0.09, dur: 0.22, vol: 0.2 }));
  const error = () => note({ type: "triangle", freq: 220, slideTo: 160, dur: 0.16, vol: 0.14 });
  const click = () => note({ type: "square", freq: 1200, dur: 0.035, vol: 0.05 });
  const pop = () => note({ type: "sine", freq: 600, slideTo: 900, dur: 0.07, vol: 0.1 });
  const run = () => { whoosh(); note({ type: "triangle", freq: 440, slideTo: 880, dur: 0.25, vol: 0.1 }); };

  function toggle() {
    on = !on;
    try { localStorage.setItem("codebuddy.sound", on ? "on" : "off"); } catch {}
    if (on) success();
    return on;
  }

  return { tick, success, levelUp, error, click, pop, run, toggle, get on() { return on; } };
})();
