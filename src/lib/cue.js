// Web Audio "cue" sounds, replicating the synthesized presets from
// cuelume-site.pages.dev (chime / toggle / error). No audio files -- each cue
// is built from oscillator/noise layers with an attack-decay envelope.

const PRESETS = {
  chime: {
    masterGain: 0.5,
    layers: [
      { kind: "tone", waveform: "sine", frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
      { kind: "tone", waveform: "sine", frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
    ],
  },
  toggle: {
    masterGain: 0.4,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: "noise", filterType: "bandpass", filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 },
    ],
  },
  error: {
    masterGain: 0.42,
    layers: [
      { kind: "noise", filterType: "bandpass", filterFrequency: 850, filterQ: 1.1, attack: 0.001, decay: 0.035, peak: 0.13 },
      { kind: "tone", waveform: "triangle", frequency: 440, offset: 0.025, attack: 0.004, decay: 0.09, peak: 0.045 },
      { kind: "tone", waveform: "triangle", frequency: 349.23, offset: 0.1, attack: 0.004, decay: 0.14, peak: 0.04 },
    ],
  },
};

let ctx = null;
let noiseBuffer = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getNoise(ac) {
  if (!noiseBuffer) {
    const len = Math.floor(ac.sampleRate * 0.4);
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export function playCue(name) {
  const preset = PRESETS[name];
  const ac = getCtx();
  if (!preset || !ac) return;

  const master = ac.createGain();
  master.gain.value = preset.masterGain;
  master.connect(ac.destination);

  const now = ac.currentTime;
  for (const l of preset.layers) {
    const start = now + (l.offset || 0);
    const end = start + l.attack + l.decay;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(l.peak, start + l.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    let source;
    if (l.kind === "tone") {
      source = ac.createOscillator();
      source.type = l.waveform;
      source.frequency.value = l.frequency;
      source.connect(gain);
    } else {
      source = ac.createBufferSource();
      source.buffer = getNoise(ac);
      const filter = ac.createBiquadFilter();
      filter.type = l.filterType;
      filter.frequency.value = l.filterFrequency;
      filter.Q.value = l.filterQ;
      source.connect(filter);
      filter.connect(gain);
    }
    source.start(start);
    source.stop(end + 0.03);
  }
}
