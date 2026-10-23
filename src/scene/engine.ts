import type { SectionId } from '../config/site';

/**
 * The visual signature: one field of points that re-forms itself as you scroll.
 *
 *   hero       a slowly turning knot — a single line that loops back through itself
 *   about      open, quiet dust
 *   projects   a lattice — structure appearing, wires between the points
 *   skills     the lattice loosening
 *   interests  streams with a direction
 *   quote      a calm ring, like a horizon
 *   contact    near-empty dust again
 *
 * Plain 2D canvas with a hand-written perspective projection: no WebGL, no
 * dependencies, and if it fails the page simply keeps its CSS atmosphere.
 */

type ShapeId = 0 | 1 | 2 | 3 | 4; // knot, dust, lattice, flow, ring
const KNOT = 0;
const DUST = 1;
const LATTICE = 2;
const FLOW = 3;
const RING = 4;
const SHAPES = 5;

interface Mood {
  weights: readonly [number, number, number, number, number];
  /** overall brightness of the form particles */
  alpha: number;
  /** wire opacity between lattice neighbours */
  wires: number;
  /** opacity of the thin thread that follows the knot */
  thread: number;
  /** 0 = free rotation, 1 = turn to face the viewer (keeps the ring from showing edge-on) */
  lock: number;
  /** share of icy-blue points */
  accent: number;
  /** rotation speed, radians per second */
  spin: number;
  /** horizontal placement as a fraction of the viewport width (wide screens only) */
  offsetX: number;
  /** scale multiplier */
  zoom: number;
  /** stream speed */
  flow: number;
}

const MOODS: Record<SectionId, Mood> = {
  hero: { weights: [1, 0, 0, 0, 0], alpha: 0.95, wires: 0, thread: 0.1, lock: 0, accent: 0.16, spin: 0.07, offsetX: 0.2, zoom: 1, flow: 0 },
  about: { weights: [0, 1, 0, 0, 0], alpha: 0.5, wires: 0, thread: 0, lock: 0, accent: 0.1, spin: 0.025, offsetX: 0, zoom: 1, flow: 0 },
  projects: { weights: [0, 0, 1, 0, 0], alpha: 0.7, wires: 0.1, thread: 0, lock: 0, accent: 0.2, spin: 0.045, offsetX: 0.16, zoom: 0.9, flow: 0 },
  skills: { weights: [0, 0.45, 0.55, 0, 0], alpha: 0.5, wires: 0.04, thread: 0, lock: 0, accent: 0.14, spin: 0.035, offsetX: 0.1, zoom: 1, flow: 0 },
  interests: { weights: [0, 0, 0, 1, 0], alpha: 0.4, wires: 0, thread: 0, lock: 0, accent: 0.3, spin: 0.012, offsetX: 0, zoom: 1, flow: 0.22 },
  quote: { weights: [0, 0, 0, 0, 1], alpha: 0.85, wires: 0, thread: 0, lock: 0.94, accent: 0.18, spin: 0.05, offsetX: 0, zoom: 1, flow: 0 },
  contact: { weights: [0, 0.9, 0, 0, 0.1], alpha: 0.36, wires: 0, thread: 0, lock: 0, accent: 0.1, spin: 0.02, offsetX: 0, zoom: 1, flow: 0 },
};

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** fewer points, no pointer parallax */
  compact: boolean;
  /** draw single static frames instead of animating */
  reducedMotion: boolean;
}

// Deterministic randomness so the scene looks the same on every load.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SceneEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly compact: boolean;
  private reduced: boolean;

  private readonly total: number;
  private readonly formCount: number;
  private active: number;

  // Shape positions: SHAPES * 3 floats per particle.
  private readonly shape: Float32Array;
  private readonly cur: Float32Array; // current blend weights per particle
  private readonly rate: Float32Array; // per-particle morph speed
  private readonly phase: Float32Array;
  private readonly lane: Float32Array;
  private readonly lanePhase: Float32Array;
  private readonly laneSpeed: Float32Array;
  private readonly sx: Float32Array;
  private readonly sy: Float32Array;
  private readonly depth: Float32Array;

  private latticeDims = { kx: 1, ky: 1, kz: 1 };

  private mood: Mood = MOODS.hero;
  private moodId: SectionId = 'hero';
  private accentShare = MOODS.hero.accent;
  private curAlpha = MOODS.hero.alpha;
  private curWires = MOODS.hero.wires;
  private curThread = MOODS.hero.thread;
  private curLock = MOODS.hero.lock;
  private curOffset = MOODS.hero.offsetX;
  private curZoom = MOODS.hero.zoom;
  private curSpin = MOODS.hero.spin;
  private curFlow = MOODS.hero.flow;
  private flowClock = 0;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private yaw = 0.4;
  private px = 0;
  private py = 0;
  private tx = 0;
  private ty = 0;
  private scrollT = 0;
  private slowFrames = 0;
  private running = false;
  private disposed = false;

  constructor(opts: EngineOptions) {
    const ctx = opts.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2D canvas is not available');
    this.canvas = opts.canvas;
    this.ctx = ctx;
    this.compact = opts.compact;
    this.reduced = opts.reducedMotion;

    this.total = opts.compact ? 300 : 820;
    this.active = this.total;
    this.formCount = Math.floor(this.total * 0.78);
    const n = this.total;

    this.shape = new Float32Array(n * SHAPES * 3);
    this.cur = new Float32Array(n * SHAPES);
    this.rate = new Float32Array(n);
    this.phase = new Float32Array(n);
    this.lane = new Float32Array(n);
    this.lanePhase = new Float32Array(n);
    this.laneSpeed = new Float32Array(n);
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.depth = new Float32Array(n);

    this.buildShapes();
    this.setMood('hero', true);
    this.resize();
  }

  // ── Shapes ────────────────────────────────────────────────────────────────
  private buildShapes(): void {
    const rand = mulberry32(20260117);
    const n = this.total;
    const nf = this.formCount;
    const put = (i: number, s: ShapeId, x: number, y: number, z: number) => {
      const o = (i * SHAPES + s) * 3;
      this.shape[o] = x;
      this.shape[o + 1] = y;
      this.shape[o + 2] = z;
    };
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

    // Lattice dimensions for the form particles.
    const ky = 6;
    const kz = 7;
    const kx = Math.max(2, Math.ceil(nf / (ky * kz)));
    this.latticeDims = { kx, ky, kz };

    const lanes = 14;

    for (let i = 0; i < n; i++) {
      const form = i < nf;
      this.rate[i] = 0.55 + rand() * 1.1;
      this.phase[i] = rand() * Math.PI * 2;

      // Dust: a wide, shallow volume. Every particle has a dust position.
      put(i, DUST, (rand() - 0.5) * 8.4, (rand() - 0.5) * 4.6, -2.6 + rand() * 5);

      if (!form) {
        // Ambient particles stay dust in every shape.
        for (const s of [KNOT, LATTICE, FLOW, RING] as ShapeId[]) {
          const o = (i * SHAPES + DUST) * 3;
          put(i, s, this.shape[o], this.shape[o + 1], this.shape[o + 2]);
        }
        this.lane[i] = 0;
        this.lanePhase[i] = 0;
        this.laneSpeed[i] = 0;
        continue;
      }

      // Knot: a (2,3) torus knot drawn as one fine, slowly twisting thread of points.
      const th = (i / nf) * Math.PI * 2;
      const r = Math.cos(3 * th) + 2;
      let kxp = r * Math.cos(2 * th);
      let kyp = r * Math.sin(2 * th);
      let kzp = -Math.sin(3 * th);
      const twist = th * 9;
      const tube = 0.035 + 0.02 * Math.sin(th * 23 + 1.3);
      kxp += Math.cos(twist) * tube + gauss() * 0.004;
      kyp += Math.sin(twist) * tube + gauss() * 0.004;
      kzp += Math.cos(twist * 0.5) * tube + gauss() * 0.004;
      put(i, KNOT, kxp * 0.5, kyp * 0.5, kzp * 0.5);

      // Lattice
      const ix = i % kx;
      const iy = Math.floor(i / kx) % ky;
      const iz = Math.floor(i / (kx * ky)) % kz;
      put(
        i,
        LATTICE,
        (ix / (kx - 1) - 0.5) * 4.2,
        (iy / (ky - 1) - 0.5) * 2.2,
        (iz / (kz - 1) - 0.5) * 3.2,
      );

      // Flow: horizontal lanes. x is advanced over time in project().
      const lane = i % lanes;
      this.lane[i] = lane;
      this.lanePhase[i] = rand() * 7.2;
      this.laneSpeed[i] = 0.6 + (lane % 5) * 0.18 + rand() * 0.25;
      put(i, FLOW, 0, (lane / (lanes - 1) - 0.5) * 2.8, (rand() - 0.5) * 1.4);

      // Ring: a thin halo.
      const a = (i / nf) * Math.PI * 2 + gauss() * 0.01;
      const rr = 1.55 + gauss() * 0.025;
      put(i, RING, Math.cos(a) * rr, Math.sin(a) * rr, gauss() * 0.04);
    }
  }

  // ── Public controls ───────────────────────────────────────────────────────
  setMood(id: SectionId, instant = false): void {
    this.moodId = id;
    this.mood = MOODS[id];
    if (instant || this.reduced) {
      const w = this.mood.weights;
      for (let i = 0; i < this.total; i++) {
        const form = i < this.formCount;
        for (let s = 0; s < SHAPES; s++) {
          this.cur[i * SHAPES + s] = form ? w[s] : s === DUST ? 1 : 0;
        }
      }
      this.curAlpha = this.mood.alpha;
      this.curWires = this.mood.wires;
      this.curThread = this.mood.thread;
      this.curLock = this.mood.lock;
      this.curOffset = this.mood.offsetX;
      this.curZoom = this.mood.zoom;
      this.curSpin = this.mood.spin;
      this.curFlow = this.mood.flow;
      this.accentShare = this.mood.accent;
      if (this.reduced) this.drawStatic();
    }
  }

  setReducedMotion(reduced: boolean): void {
    if (reduced === this.reduced) return;
    this.reduced = reduced;
    this.setMood(this.moodId, true);
    if (reduced) {
      this.stop();
      this.drawStatic();
    } else {
      this.start();
    }
  }

  setPointer(nx: number, ny: number): void {
    if (this.compact) return;
    this.tx = nx;
    this.ty = ny;
  }

  setScroll(progress: number): void {
    this.scrollT = progress;
    if (this.reduced) this.drawStatic();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.compact ? 1.25 : 1.5);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    if (this.reduced) this.drawStatic();
  }

  start(): void {
    if (this.running || this.reduced || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }

  // ── Frame loop ────────────────────────────────────────────────────────────
  private frame = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    const rawDt = now - this.last;
    this.last = now;
    this.step(dt);
    this.render();
    this.adapt(rawDt);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** If the device can't keep up, quietly draw fewer points. */
  private adapt(rawDt: number): void {
    if (rawDt > 30) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);
    if (this.slowFrames > 45 && this.active > this.total * 0.35) {
      this.active = Math.floor(this.active * 0.85);
      this.slowFrames = 0;
    }
  }

  private step(dt: number): void {
    this.time += dt;
    const k = 1 - Math.exp(-dt * 2.2);
    const m = this.mood;

    this.curAlpha += (m.alpha - this.curAlpha) * k;
    this.curWires += (m.wires - this.curWires) * k;
    this.curThread += (m.thread - this.curThread) * k;
    this.curLock += (m.lock - this.curLock) * (1 - Math.exp(-dt * 1.4));
    this.curOffset += (m.offsetX - this.curOffset) * k;
    this.curZoom += (m.zoom - this.curZoom) * k;
    this.curSpin += (m.spin - this.curSpin) * k;
    this.curFlow += (m.flow - this.curFlow) * k;
    this.flowClock += dt * (0.35 + this.curFlow * 3);
    this.accentShare += (m.accent - this.accentShare) * k;

    this.px += (this.tx - this.px) * (1 - Math.exp(-dt * 3));
    this.py += (this.ty - this.py) * (1 - Math.exp(-dt * 3));
    this.yaw += this.curSpin * dt;

    const w = m.weights;
    for (let i = 0; i < this.formCount; i++) {
      const kr = 1 - Math.exp(-dt * this.rate[i] * 1.5);
      for (let s = 0; s < SHAPES; s++) {
        const idx = i * SHAPES + s;
        this.cur[idx] += (w[s] - this.cur[idx]) * kr;
      }
    }
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  private drawStatic(): void {
    if (this.disposed) return;
    this.time = 2.5;
    this.project();
    this.render(true);
  }

  private project(): void {
    const { width, height } = this;
    const wide = width > 860 && !this.compact;
    const scale = Math.min(width, height * 1.35) * (wide ? 0.34 : 0.4) * this.curZoom;
    const cx = width * (0.5 + (wide ? this.curOffset : 0));
    const cy = height * (wide ? 0.5 : 0.46);

    const rawYaw = this.yaw + this.scrollT * 0.9;
    const faceYaw = Math.round(rawYaw / Math.PI) * Math.PI; // ring looks the same from either side
    const yaw = rawYaw + (faceYaw - rawYaw) * this.curLock + this.px * 0.35;
    const pitch = 0.32 + this.py * 0.16 - this.scrollT * 0.2;
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const camera = 5.2;
    const t = this.time;

    for (let i = 0; i < this.total; i++) {
      let x = 0;
      let y = 0;
      let z = 0;
      const base = i * SHAPES;
      const form = i < this.formCount;
      let norm = 0;
      for (let s = 0; s < SHAPES; s++) norm += this.cur[base + s];
      if (norm < 0.0001) norm = 1;

      for (let s = 0; s < SHAPES; s++) {
        const wt = this.cur[base + s] / norm;
        if (wt < 0.0005) continue;
        const o = (base + s) * 3;
        let px = this.shape[o];
        let py = this.shape[o + 1];
        const pz = this.shape[o + 2];
        if (s === FLOW && form) {
          const span = 8.4;
          const adv = this.lanePhase[i] + this.flowClock * this.laneSpeed[i];
          px = (((adv % span) + span) % span) - span / 2;
          py += Math.sin(px * 1.3 + this.lane[i]) * 0.18;
        }
        x += px * wt;
        y += py * wt;
        z += pz * wt;
      }

      // Gentle drift so nothing is ever perfectly still.
      const d = (form ? 0.035 : 0.09) * (this.compact ? 0.7 : 1);
      x += Math.sin(t * 0.31 + this.phase[i]) * d;
      y += Math.cos(t * 0.27 + this.phase[i] * 1.3) * d;
      z += Math.sin(t * 0.22 + this.phase[i] * 0.7) * d;

      // Rotate (yaw around Y, then pitch around X)
      const rx = x * cyw + z * syw;
      const rz = -x * syw + z * cyw;
      const ry = y * cp - rz * sp;
      const rz2 = y * sp + rz * cp;

      const depth = camera + rz2;
      const f = (scale / Math.max(0.6, depth)) * 2.6;
      this.sx[i] = cx + rx * f;
      this.sy[i] = cy + ry * f;
      this.depth[i] = rz2;
    }
  }

  private render(skipProject = false): void {
    if (!skipProject) this.project();
    const { ctx, dpr, width, height } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const n = Math.min(this.active, this.total);

    // Wires between lattice neighbours.
    if (this.curWires > 0.012) {
      const { kx } = this.latticeDims;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(183,211,234,${this.curWires.toFixed(3)})`;
      ctx.beginPath();
      for (let i = 0; i < Math.min(n, this.formCount) - 1; i++) {
        if ((i + 1) % kx === 0) continue;
        ctx.moveTo(this.sx[i], this.sy[i]);
        ctx.lineTo(this.sx[i + 1], this.sy[i + 1]);
      }
      ctx.stroke();
    }

    // A single fine thread following the knot.
    if (this.curThread > 0.012) {
      const count = Math.min(n, this.formCount);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(183,211,234,${this.curThread.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(this.sx[0], this.sy[0]);
      for (let i = 1; i < count; i++) ctx.lineTo(this.sx[i], this.sy[i]);
      ctx.closePath();
      ctx.stroke();
    }

    // Points, in two colour groups.
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass === 0 ? '#eceef1' : '#b7d3ea';
      for (let i = 0; i < n; i++) {
        const accent = this.phase[i] / 6.2832 < this.accentShare;
        if ((pass === 1) !== accent) continue;
        const x = this.sx[i];
        const y = this.sy[i];
        if (x < -4 || y < -4 || x > width + 4 || y > height + 4) continue;
        const near = Math.min(1, Math.max(0, 0.62 - this.depth[i] * 0.2));
        const form = i < this.formCount;
        const a = (form ? this.curAlpha : 0.34) * (0.18 + near * 0.82);
        if (a < 0.015) continue;
        const size = (this.compact ? 0.9 : 1) * (0.7 + near * 1.45);
        ctx.globalAlpha = a;
        // Particles in the flow shape are stretched into short streaks along their direction of travel.
        let streak = 1;
        if (form) {
          let norm = 0;
          for (let s = 0; s < SHAPES; s++) norm += this.cur[i * SHAPES + s];
          streak = 1 + 4.5 * (this.cur[i * SHAPES + FLOW] / (norm || 1));
        }
        const wdt = size * streak;
        ctx.fillRect(x - wdt / 2, y - size / 2, wdt, streak > 1.4 ? Math.max(1, size * 0.7) : size);
      }
    }
    ctx.globalAlpha = 1;
  }
}
