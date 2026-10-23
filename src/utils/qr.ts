/**
 * Minimal QR Code generator (ISO/IEC 18004) — byte mode, error-correction level M,
 * versions 1–10 (up to 213 bytes: plenty for a site URL). No dependencies.
 *
 *   const matrix = encodeQr('https://example.com/');  // boolean[][], true = dark module
 */

// Level M: [total codewords, EC codewords per block, blocks in group 1, data cw in g1, blocks in g2, data cw in g2]
const BLOCKS_M: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [26, 10, 1, 16, 0, 0], // v1
  [44, 16, 1, 28, 0, 0], // v2
  [70, 26, 1, 44, 0, 0], // v3
  [100, 18, 2, 32, 0, 0], // v4
  [134, 24, 2, 43, 0, 0], // v5
  [172, 16, 4, 27, 0, 0], // v6
  [196, 18, 4, 31, 0, 0], // v7
  [242, 22, 2, 38, 2, 39], // v8
  [292, 22, 3, 36, 2, 37], // v9
  [346, 26, 4, 43, 1, 44], // v10
];

const ALIGNMENT: ReadonlyArray<readonly number[]> = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// ── Reed–Solomon over GF(256), polynomial 0x11D ─────────────────────────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: readonly number[], degree: number): number[] {
  const gen = rsGenerator(degree);
  const rem = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (rem.shift() as number);
    rem.push(0);
    for (let i = 0; i < degree; i++) rem[i] ^= gfMul(gen[i + 1], factor);
  }
  return rem;
}

// ── Bit helpers ─────────────────────────────────────────────────────────────
function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function bchRemainder(value: number, poly: number, bits: number): number {
  let rem = value << bits;
  const top = 31 - Math.clz32(poly);
  for (let i = 31 - Math.clz32(rem); i >= top; i--) {
    if ((rem >>> i) & 1) rem ^= poly << (i - top);
  }
  return rem;
}

// ── Public API ──────────────────────────────────────────────────────────────
export function encodeQr(text: string): boolean[][] {
  const bytes = utf8Bytes(text);

  // Pick the smallest version that fits.
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const [, , g1, d1, g2, d2] = BLOCKS_M[v - 1];
    const capacityBytes = g1 * d1 + g2 * d2;
    const header = v <= 9 ? 12 : 20; // mode (4) + count (8 or 16) bits
    if (Math.ceil((header + bytes.length * 8) / 8) <= capacityBytes) {
      version = v;
      break;
    }
  }
  if (version === 0) throw new Error('QR: text is too long');

  const size = 17 + 4 * version;
  const [total, ecPerBlock, g1, d1, g2, d2] = BLOCKS_M[version - 1];
  const dataCapacity = g1 * d1 + g2 * d2;

  // 1. Data bits
  const bits: number[] = [];
  const put = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, dataCapacity * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }
  for (let pad = 0xec; data.length < dataCapacity; pad ^= 0xec ^ 0x11) data.push(pad);

  // 2. Split into blocks, add error correction, interleave
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < g1 + g2; i++) {
    const len = i < g1 ? d1 : d2;
    const block = data.slice(offset, offset + len);
    offset += len;
    blocks.push(block);
    ecBlocks.push(rsRemainder(block, ecPerBlock));
  }
  const codewords: number[] = [];
  for (let i = 0; i < Math.max(d1, d2); i++) {
    for (const block of blocks) if (i < block.length) codewords.push(block[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) for (const ec of ecBlocks) codewords.push(ec[i]);
  if (codewords.length !== total) throw new Error('QR: internal size mismatch');

  // 3. Matrix with function patterns
  const modules: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    reserved[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0); // timing
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  const align = ALIGNMENT[version - 1];
  for (const cy of align) {
    for (const cx of align) {
      const onFinder =
        (cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6);
      if (onFinder) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Reserve format areas (real bits are written per mask) and the dark module.
  const drawFormat = (mask: number) => {
    const data5 = (0b00 << 3) | mask; // EC level M = 00, then the 3 mask bits
    const value = (data5 << 10) | bchRemainder(data5, 0x537, 10);
    const bit = (i: number) => ((value ^ 0x5412) >>> i) & 1;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i) === 1);
    setFn(8, 7, bit(6) === 1);
    setFn(8, 8, bit(7) === 1);
    setFn(7, 8, bit(8) === 1);
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i) === 1);
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i) === 1);
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i) === 1);
    setFn(8, size - 8, true); // always-dark module
  };
  drawFormat(0);

  if (version >= 7) {
    const value = (version << 12) | bchRemainder(version, 0x1f25, 12);
    for (let i = 0; i < 18; i++) {
      const dark = ((value >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, dark);
      setFn(b, a, dark);
    }
  }

  // 4. Place data in the zig-zag pattern
  const dataBits: boolean[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) dataBits.push(((cw >>> i) & 1) === 1);
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!reserved[y][x] && bitIndex < dataBits.length) {
          modules[y][x] = dataBits[bitIndex++];
        }
      }
    }
  }

  // 5. Choose the mask with the lowest penalty
  const maskFn = [
    (x: number, y: number) => (x + y) % 2 === 0,
    (_x: number, y: number) => y % 2 === 0,
    (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];

  let best: boolean[][] | null = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    drawFormat(mask);
    const candidate = modules.map((row, y) =>
      row.map((dark, x) => (reserved[y][x] ? dark : dark !== maskFn[mask](x, y))),
    );
    const penalty = penaltyScore(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = candidate;
    }
  }
  return best as boolean[][];
}

function penaltyScore(m: boolean[][]): number {
  const n = m.length;
  let score = 0;

  // Rule 1: runs of 5+ same-colour modules in a row/column
  for (let a = 0; a < n; a++) {
    for (const horizontal of [true, false]) {
      let run = 1;
      for (let b = 1; b < n; b++) {
        const cur = horizontal ? m[a][b] : m[b][a];
        const prev = horizontal ? m[a][b - 1] : m[b - 1][a];
        if (cur === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
        }
      }
    }
  }

  // Rule 2: 2×2 blocks
  for (let y = 0; y < n - 1; y++) {
    for (let x = 0; x < n - 1; x++) {
      const c = m[y][x];
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns with a light border
  const pattern = [true, false, true, true, true, false, true];
  const light4 = [false, false, false, false];
  const matches = (get: (i: number) => boolean, start: number): boolean => {
    for (let i = 0; i < 7; i++) if (get(start + i) !== pattern[i]) return false;
    return true;
  };
  const lightRun = (get: (i: number) => boolean, from: number, to: number): boolean => {
    for (let i = from; i < to; i++) if (i >= 0 && i < n && get(i) !== light4[0]) return false;
    return true;
  };
  for (let a = 0; a < n; a++) {
    for (const horizontal of [true, false]) {
      const get = (i: number) => (horizontal ? m[a][i] : m[i][a]);
      for (let s = 0; s + 7 <= n; s++) {
        if (!matches(get, s)) continue;
        if (lightRun(get, s - 4, s) || lightRun(get, s + 7, s + 11)) score += 40;
      }
    }
  }

  // Rule 4: dark/light balance
  let dark = 0;
  for (const row of m) for (const c of row) if (c) dark++;
  const percent = (dark * 100) / (n * n);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/** Renders a matrix as one SVG path (1×1 rects), with a 4-module quiet zone around it. */
export function qrToSvgPath(matrix: boolean[][], quiet = 4): { path: string; size: number } {
  let path = '';
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end++;
      path += `M${x + quiet} ${y + quiet}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  });
  return { path, size: matrix.length + quiet * 2 };
}
