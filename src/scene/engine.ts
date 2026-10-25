import type { SectionId } from '../config/site';

/**
 * The visual signature: a living field that re-forms itself as you scroll.
 *
 * Layers (all drawn on one plain 2D canvas, no WebGL, no dependencies):
 *   1. a perspective floor grid sliding toward the viewer
 *   2. orbital rings with tick marks around the focal form
 *   3. a field of points that morphs between five shapes
 *   4. a web of fine links between nearby points, brighter near the cursor
 *
 * Shapes by section:
 *   hero       a slowly turning knot — one line that loops back through itself
 *   quote      a calm ring facing the viewer, like a horizon
 *   about      open dust
 *   projects   a lattice
 *   skills     the lattice loosening
 *   interests  streams with a direction
 *   contact    quiet dust and floor
 *
 * Monochrome on purpose: soft white on near-black.
 */

const KNOT = 0;
const DUST = 1;
const LATTICE = 2;
const FLOW = 3;
const RING = 4;
const SHAPES = 5;

interface Mood {
  weights: readonly [number, number, number, number, number];
  /** brightness of the form particles */
  alpha: number;
  /** 0–1 strength of the web of links */
  links: number;
  /** 0–1 strength of the floor grid */
  grid: number;
  /** 0–1 strength of the orbital rings */
  rings: number;
  /** rotation speed, radians per second */
  spin: number;
  /** horizontal placement as a fraction of the viewport width (wide screens only) */
  offsetX: number;
  zoom: number;
  /** stream speed */
  flow: number;
  /** 0 = free rotation, 1 = turn to face the viewer */
  lock: number;
}

const MOODS: Record<SectionId, Mood> = {
  hero: { weights: [1, 0, 0, 0, 0], alpha: 1, links: 0.9, grid: 0.9, rings: 1, spin: 0.07, offsetX: 0.2, zoom: 1, flow: 0, lock: 0 },
  quote: { weights: [0, 0, 0, 0, 1], alpha: 0.9, links: 0.5, grid: 0.5, rings: 0.85, spin: 0.05, offsetX: 0, zoom: 1, flow: 0, lock: 0.94 },
  about: { weights: [0, 1, 0, 0, 0], alpha: 0.6, links: 0.7, grid: 0.35, rings: 0.3, spin: 0.025, offsetX: 0, zoom: 1, flow: 0, lock: 0 },
  projects: { weights: [0, 0, 1, 0, 0], alpha: 0.8, links: 0.8, grid: 0.7, rings: 0.4, spin: 0.045, offsetX: 0.16, zoom: 0.9, flow: 0, lock: 0 },
  skills: { weights: [0, 0.45, 0.55, 0, 0], alpha: 0.6, links: 0.7, grid: 0.5, rings: 0.3, spin: 0.035, offsetX: 0.1, zoom: 1, flow: 0, lock: 0 },
  interests: { weights: [0, 0, 0, 1, 0], alpha: 0.5, links: 0.35, grid: 0.4, rings: 0.25, spin: 0.012, offsetX: 0, zoom: 1, flow: 0.22, lock: 0 },
  contact: { weights: [0, 0.8, 0, 0, 0.2], alpha: 0.55, links: 0.8, grid: 0.8, rings: 0.5, spin: 0.02, offsetX: 0, zoom: 1, flow: 0, lock: 0 },
};

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** fewer points, no pointer interaction */
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

  private readonly shape: Float32Array; // SHAPES * 3 floats per particle
  private readonly cur: Float32Array; // current blend weights per particle
  private readonly rate: Float32Array;
  private readonly phase: Float32Array;
  private readonly lane: Float32Array;
  private readonly lanePhase: Float32Array;
  private readonly laneSpeed: Float32Array;
  private readonly sx: Float32Array;
  private readonly sy: Float32Array;
  private readonly depth: Float32Array;
  private readonly bright: Float32Array; // per-frame brightness 0–1 (depth + cursor)

  private readonly halo: HTMLCanvasElement;

  // spatial hash for links
  private readonly head: Int32Array;
  private readonly next: Int32Array;
  private readonly deg: Uint8Array;

  private mood: Mood = MOODS.hero;
  private moodId: SectionId = 'hero';
  private curAlpha = MOODS.hero.alpha;
  private curLinks = MOODS.hero.links;
  private curGrid = MOODS.hero.grid;
  private curRings = MOODS.hero.rings;
  private curOffset = MOODS.hero.offsetX;
  private curZoom = MOODS.hero.zoom;
  private curSpin = MOODS.hero.spin;
  private curFlow = MOODS.hero.flow;
  private curLock = MOODS.hero.lock;
  private flowClock = 0;
  private gridClock = 0.3;

  private width = 0;
  private height = 0;
  private dpr = 1;
  private cx = 0;
  private cy = 0;
  private scale = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private yaw = 0.4;
  private px = 0;
  private py = 0;
  private tx = 0;
  private ty = 0;
  private mouseOn = false;
  private mx = -9999;
  private my = -9999;
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

    this.total = opts.compact ? 460 : 1300;
    this.active = this.total;
    this.formCount = Math.floor(this.total * 0.72);
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
    this.bright = new Float32Array(n);
    this.head = new Int32Array(64 * 64);
    this.next = new Int32Array(n);
    this.deg = new Uint8Array(n);

    // Soft glow sprite for the brightest points.
    this.halo = document.createElement('canvas');
    this.halo.width = this.halo.height = 64;
    const hctx = this.halo.getContext('2d');
    if (hctx) {
      const g = hctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.28)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      hctx.fillStyle = g;
      hctx.fillRect(0, 0, 64, 64);
    }

    this.buildShapes();
    this.setMood('hero', true);
    this.resize();
  }

  // ── Shapes ────────────────────────────────────────────────────────────────
  private buildShapes(): void {
    const rand = mulberry32(20260117);
    const n = this.total;
    const nf = this.formCount;
    const put = (i: number, s: number, x: number, y: number, z: number) => {
      const o = (i * SHAPES + s) * 3;
      this.shape[o] = x;
      this.shape[o + 1] = y;
      this.shape[o + 2] = z;
    };
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

    const ky = 7;
    const kz = 8;
    const kx = Math.max(2, Math.ceil(nf / (ky * kz)));
    const lanes = 16;

    for (let i = 0; i < n; i++) {
      const form = i < nf;
      this.rate[i] = 0.55 + rand() * 1.1;
      this.phase[i] = rand() * Math.PI * 2;

      // Dust: a wide, shallow volume. Every particle has a dust position.
      put(i, DUST, (rand() - 0.5) * 9, (rand() - 0.5) * 5, -2.8 + rand() * 5.4);

      if (!form) {
        const o = (i * SHAPES + DUST) * 3;
        for (const s of [KNOT, LATTICE, FLOW, RING]) put(i, s, this.shape[o], this.shape[o + 1], this.shape[o + 2]);
        continue;
      }

      // Knot: a (2,3) torus knot drawn as a fine, slowly twisting thread of points.
      const th = (i / nf) * Math.PI * 2;
      const r = Math.cos(3 * th) + 2;
      let kxp = r * Math.cos(2 * th);
      let kyp = r * Math.sin(2 * th);
      let kzp = -Math.sin(3 * th);
      const twist = th * 9;
      const tube = 0.04 + 0.025 * Math.sin(th * 23 + 1.3);
      kxp += Math.cos(twist) * tube + gauss() * 0.006;
      kyp += Math.sin(twist) * tube + gauss() * 0.006;
      kzp += Math.cos(twist * 0.5) * tube + gauss() * 0.006;
      put(i, KNOT, kxp * 0.5, kyp * 0.5, kzp * 0.5);

      // Lattice
      const ix = i % kx;
      const iy = Math.floor(i / kx) % ky;
      const iz = Math.floor(i / (kx * ky)) % kz;
      put(i, LATTICE, (ix / (kx - 1) - 0.5) * 4.4, (iy / (ky - 1) - 0.5) * 2.4, (iz / (kz - 1) - 0.5) * 3.4);

      // Flow: horizontal lanes; x advances over time in project().
      const lane = i % lanes;
      this.lane[i] = lane;
      this.lanePhase[i] = rand() * 9;
      this.laneSpeed[i] = 0.6 + (lane % 5) * 0.18 + rand() * 0.25;
      put(i, FLOW, 0, (lane / (lanes - 1) - 0.5) * 3, (rand() - 0.5) * 1.4);

      // Ring: a thin halo.
      const a = (i / nf) * Math.PI * 2;
      const rr = 1.55 + gauss() * 0.02;
      put(i, RING, Math.cos(a) * rr, Math.sin(a) * rr, gauss() * 0.03);
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
        for (let s = 0; s < SHAPES; s++) this.cur[i * SHAPES + s] = form ? w[s] : s === DUST ? 1 : 0;
      }
      const m = this.mood;
      this.curAlpha = m.alpha;
      this.curLinks = m.links;
      this.curGrid = m.grid;
      this.curRings = m.rings;
      this.curOffset = m.offsetX;
      this.curZoom = m.zoom;
      this.curSpin = m.spin;
      this.curFlow = m.flow;
      this.curLock = m.lock;
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

  /** Pointer position in the range −1…1 on both axes, or null when it leaves. */
  setPointer(nx: number | null, ny: number | null): void {
    if (this.compact) return;
    if (nx === null || ny === null) {
      this.mouseOn = false;
      return;
    }
    this.tx = nx;
    this.ty = ny;
    this.mouseOn = true;
    this.mx = ((nx + 1) / 2) * this.width;
    this.my = ((ny + 1) / 2) * this.height;
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
    const rawDt = now - this.last;
    const dt = Math.min(0.05, rawDt / 1000);
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
    this.curLinks += (m.links - this.curLinks) * k;
    this.curGrid += (m.grid - this.curGrid) * k;
    this.curRings += (m.rings - this.curRings) * k;
    this.curOffset += (m.offsetX - this.curOffset) * k;
    this.curZoom += (m.zoom - this.curZoom) * k;
    this.curSpin += (m.spin - this.curSpin) * k;
    this.curFlow += (m.flow - this.curFlow) * k;
    this.curLock += (m.lock - this.curLock) * (1 - Math.exp(-dt * 1.4));
    this.flowClock += dt * (0.35 + this.curFlow * 3);
    this.gridClock = (this.gridClock + dt * 0.12) % 1;

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
    this.render();
  }

  private project(): void {
    const { width, height } = this;
    const wide = width > 860 && !this.compact;
    this.scale = Math.min(width, height * 1.35) * (wide ? 0.34 : 0.4) * this.curZoom;
    this.cx = width * (0.5 + (wide ? this.curOffset : 0));
    this.cy = height * (wide ? 0.46 : 0.42);
    const { cx, cy, scale } = this;

    const rawYaw = this.yaw + this.scrollT * 0.9;
    const faceYaw = Math.round(rawYaw / Math.PI) * Math.PI;
    const yaw = rawYaw + (faceYaw - rawYaw) * this.curLock + this.px * 0.35;
    const pitch = 0.22 + this.py * 0.16 - this.scrollT * 0.15;
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const camera = 5.2;
    const t = this.time;
    const driftK = this.compact ? 0.7 : 1;

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
        let sxp = this.shape[o];
        let syp = this.shape[o + 1];
        const szp = this.shape[o + 2];
        if (s === FLOW && form) {
          const span = 9;
          const adv = this.lanePhase[i] + this.flowClock * this.laneSpeed[i];
          sxp = (((adv % span) + span) % span) - span / 2;
          syp += Math.sin(sxp * 1.3 + this.lane[i]) * 0.18;
        }
        x += sxp * wt;
        y += syp * wt;
        z += szp * wt;
      }

      const d = (form ? 0.035 : 0.09) * driftK;
      x += Math.sin(t * 0.31 + this.phase[i]) * d;
      y += Math.cos(t * 0.27 + this.phase[i] * 1.3) * d;
      z += Math.sin(t * 0.22 + this.phase[i] * 0.7) * d;

      const rx = x * cyw + z * syw;
      const rz = -x * syw + z * cyw;
      const ry = y * cp - rz * sp;
      const rz2 = y * sp + rz * cp;

      const f = (scale / Math.max(0.6, camera + rz2)) * 2.6;
      this.sx[i] = cx + rx * f;
      this.sy[i] = cy + ry * f;
      this.depth[i] = rz2;
    }
  }

  private render(): void {
    this.project();
    const { ctx, dpr, width, height } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (this.curGrid > 0.01) this.drawGrid();
    if (this.curRings > 0.01) this.drawRings();

    const n = Math.min(this.active, this.total);

    // Per-point brightness (depth, plus a lift near the cursor).
    const reach = 190;
    const reach2 = reach * reach;
    for (let i = 0; i < n; i++) {
      const near = Math.min(1, Math.max(0, 0.6 - this.depth[i] * 0.11));
      let b = 0.18 + near * 0.82;
      if (this.mouseOn) {
        const dx = this.sx[i] - this.mx;
        const dy = this.sy[i] - this.my;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach2) b = Math.min(1.6, b + (1 - d2 / reach2) * 0.9);
      }
      this.bright[i] = b;
    }

    if (this.curLinks > 0.02) this.drawLinks(n, reach2);
    this.drawPoints(n);
  }

  /** Perspective floor: lines fan out from a vanishing point and slide toward the viewer. */
  private drawGrid(): void {
    const { ctx, width, height } = this;
    const g = this.curGrid;
    const horizon = height * 0.64;
    const vx = width * 0.5;
    const depthH = height - horizon;

    const fade = ctx.createLinearGradient(0, horizon, 0, height);
    fade.addColorStop(0, 'rgba(236,238,241,0)');
    fade.addColorStop(1, `rgba(236,238,241,${(0.2 * g).toFixed(3)})`);
    ctx.strokeStyle = fade;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const spread = width * 0.1;
    for (let k = -14; k <= 14; k++) {
      ctx.moveTo(vx + k * spread * 0.06, horizon);
      ctx.lineTo(vx + k * spread, height);
    }
    ctx.stroke();

    const rows = 11;
    for (let j = 0; j < rows; j++) {
      const u = ((j + this.gridClock) / rows) % 1;
      const y = horizon + depthH * u * u;
      ctx.strokeStyle = `rgba(236,238,241,${(0.17 * g * u).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // A fine horizon line that fades out toward both edges.
    const hz = ctx.createLinearGradient(0, 0, width, 0);
    hz.addColorStop(0, 'rgba(236,238,241,0)');
    hz.addColorStop(0.5, `rgba(236,238,241,${(0.28 * g).toFixed(3)})`);
    hz.addColorStop(1, 'rgba(236,238,241,0)');
    ctx.strokeStyle = hz;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(width, horizon);
    ctx.stroke();
  }

  /** Thin orbital rings with tick marks, tilted to follow the form. */
  private drawRings(): void {
    const { ctx, cx, cy, scale, time } = this;
    const a = this.curRings;
    const tilt = 0.28 + 0.06 * Math.sin(time * 0.2);
    const ratio = tilt + (1 - tilt) * this.curLock; // face-on when locked
    const rot = -0.35 + Math.sin(time * 0.13) * 0.08;
    const specs: Array<{ r: number; w: number; alpha: number; dash: number[]; spin: number }> = [
      { r: 0.98, w: 1, alpha: 0.2, dash: [], spin: 0 },
      { r: 1.3, w: 2, alpha: 0.32, dash: [1.5, 13], spin: 14 },
      { r: 1.68, w: 1, alpha: 0.16, dash: [70, 34, 6, 34], spin: -9 },
    ];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot * (1 - this.curLock));
    for (const s of specs) {
      ctx.strokeStyle = `rgba(236,238,241,${(s.alpha * a).toFixed(3)})`;
      ctx.lineWidth = s.w;
      ctx.setLineDash(s.dash);
      ctx.lineDashOffset = this.reduced ? 0 : -time * s.spin;
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * s.r, scale * s.r * ratio, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.setLineDash([]);
  }

  /** A web of fine lines between nearby points, found with a spatial hash. */
  private drawLinks(n: number, reach2: number): void {
    const { ctx, width, height } = this;
    const L = this.compact ? 64 : 78;
    const cols = Math.min(64, Math.ceil(width / L));
    const rows = Math.min(64, Math.ceil(height / L));
    this.head.fill(-1, 0, cols * rows);
    this.deg.fill(0);

    const limit = Math.min(n, this.formCount + Math.floor((n - this.formCount) * 0.4));
    for (let i = 0; i < limit; i++) {
      const x = this.sx[i];
      const y = this.sy[i];
      if (x < 0 || y < 0 || x >= width || y >= height || this.bright[i] < 0.28) {
        this.next[i] = -2;
        continue;
      }
      const c = Math.floor(x / L) + Math.floor(y / L) * cols;
      this.next[i] = this.head[c];
      this.head[c] = i;
    }

    const L2 = L * L;
    const maxLines = this.compact ? 420 : 1500;
    let count = 0;
    const strong: number[] = [];
    const weak: number[] = [];
    const hot: number[] = [];

    const test = (i: number, j: number) => {
      const dx = this.sx[i] - this.sx[j];
      const dy = this.sy[i] - this.sy[j];
      const d2 = dx * dx + dy * dy;
      if (d2 > L2 || d2 < 4 || this.deg[i] >= 3 || this.deg[j] >= 3) return;
      this.deg[i]++;
      this.deg[j]++;
      let bucket = d2 < L2 * 0.35 ? strong : weak;
      if (this.mouseOn) {
        const mx = (this.sx[i] + this.sx[j]) / 2 - this.mx;
        const my = (this.sy[i] + this.sy[j]) / 2 - this.my;
        if (mx * mx + my * my < reach2) bucket = hot;
      }
      bucket.push(this.sx[i], this.sy[i], this.sx[j], this.sy[j]);
      count++;
    };

    for (let cy = 0; cy < rows && count < maxLines; cy++) {
      for (let cx = 0; cx < cols && count < maxLines; cx++) {
        for (let i = this.head[cx + cy * cols]; i >= 0; i = this.next[i]) {
          for (let j = this.next[i]; j >= 0; j = this.next[j]) test(i, j);
          if (cx + 1 < cols) for (let j = this.head[cx + 1 + cy * cols]; j >= 0; j = this.next[j]) test(i, j);
          if (cy + 1 < rows) {
            for (let j = this.head[cx + (cy + 1) * cols]; j >= 0; j = this.next[j]) test(i, j);
            if (cx > 0) for (let j = this.head[cx - 1 + (cy + 1) * cols]; j >= 0; j = this.next[j]) test(i, j);
            if (cx + 1 < cols) for (let j = this.head[cx + 1 + (cy + 1) * cols]; j >= 0; j = this.next[j]) test(i, j);
          }
        }
      }
    }

    const k = this.curLinks;
    const stroke = (list: number[], alpha: number) => {
      if (list.length === 0) return;
      ctx.strokeStyle = `rgba(236,238,241,${(alpha * k).toFixed(3)})`;
      ctx.beginPath();
      for (let p = 0; p < list.length; p += 4) {
        ctx.moveTo(list[p], list[p + 1]);
        ctx.lineTo(list[p + 2], list[p + 3]);
      }
      ctx.stroke();
    };
    ctx.lineWidth = 1;
    stroke(weak, 0.07);
    stroke(strong, 0.15);
    stroke(hot, 0.4);
  }

  private drawPoints(n: number): void {
    const { ctx, width, height } = this;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ececee';
    for (let i = 0; i < n; i++) {
      const x = this.sx[i];
      const y = this.sy[i];
      if (x < -6 || y < -6 || x > width + 6 || y > height + 6) continue;
      const b = this.bright[i];
      const form = i < this.formCount;
      const a = (form ? this.curAlpha : 0.34) * b;
      if (a < 0.02) continue;

      const size = (this.compact ? 0.95 : 1.05) * (0.7 + Math.min(1, b) * 1.5);
      let streak = 1;
      if (form) {
        let norm = 0;
        for (let s = 0; s < SHAPES; s++) norm += this.cur[i * SHAPES + s];
        streak = 1 + 4.5 * (this.cur[i * SHAPES + FLOW] / (norm || 1));
      }
      const w = size * streak;
      const h = streak > 1.4 ? Math.max(1, size * 0.7) : size;

      // Roughly one point in nine glows.
      if (form && (this.phase[i] * 7) % 1 < 0.11 && b > 0.55) {
        const r = size * 7;
        ctx.globalAlpha = Math.min(0.5, a * 0.5);
        ctx.drawImage(this.halo, x - r, y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
