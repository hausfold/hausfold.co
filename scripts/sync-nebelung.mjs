#!/usr/bin/env node
/* sync-nebelung.mjs — vendor nebelung's CSS port into public/hausfold.css, and
 * generate public/favicon.svg's colour fan out of the same port.
 *
 *   node scripts/sync-nebelung.mjs            # rewrite both generated blocks
 *   node scripts/sync-nebelung.mjs --check    # fail if either is stale or hand-edited
 *   node scripts/sync-nebelung.mjs --latest   # has upstream moved since the pin?
 *   node scripts/sync-nebelung.mjs --from result/css   # use a local build
 *
 * (No node on this machine? `nix run nixpkgs#nodejs -- scripts/sync-nebelung.mjs`.)
 *
 * **The flake ref is pinned** (PIN below). CI builds that exact revision, so a
 * PR that touches the stylesheet goes red for its own reasons and never for
 * upstream's — the alternative, building `main`, made every CSS PR hostage to
 * whatever nebelung merged that morning, and a check that goes red for reasons
 * you didn't cause is a check people learn to skip. The cost is that drift is
 * no longer *pushed* at you: run `--latest` to ask, bump PIN, re-run the
 * script, commit the block. Nothing else here notices that upstream exists.
 *
 * Why a generator and not `@import url("nebelung.css")`:
 *
 *   - The site is one stylesheet, served as-is, with no build step. A second
 *     file is a second blocking request in front of the landing page's first
 *     paint, for ~40 custom properties.
 *   - The import would have to be unconditional. hausfold.css defines its dark
 *     values twice — once under `@media (prefers-color-scheme: dark)` and once
 *     under `:root[data-theme="dark"]`, so a viewer's explicit toggle wins in
 *     both directions — and `@import … (prefers-color-scheme: dark)` cannot see
 *     the toggle. A light-scheme visitor who flips to dark would land on
 *     `var(--nebelung-crust)` with nothing defining it: invalid at
 *     computed-value time, and the whole dark block falls over.
 *   - An unconditional import brings upstream's `color-scheme: dark` onto
 *     `:root` in the light theme. Source order happens to save us — hausfold's
 *     own `:root` comes later and wins — but that is a coincidence to rely on,
 *     not a design.
 *
 * So: the port lands *inside* hausfold.css, between the markers below, and the
 * two dark blocks read `var(--nebelung-*)` instead of repeating ten hexes each.
 * It's the same idiom nebelung uses for scripts/gen-ports-doc.mjs, and it keeps
 * the deploy honest — .github/workflows/deploy.yml only fires on `public/**`,
 * and this script's output is a change to a file under `public/`.
 *
 * Only the *dark* theme is generated. Light stays hand-picked: it's a
 * paper-warm mirror, not latte, because nebelung's pastels are built for a dark
 * ground and wash out on paper. That's why `latte/css/nebelung-latte.css` is
 * not vendored here, and why --check refuses a `--nebelung-*` reference
 * anywhere but the two dark blocks.
 *
 * What --check enforces, beyond "the block matches upstream":
 *
 *   - each of the ten tokens below reads the `--nebelung-*` name it should, in
 *     BOTH dark blocks, and each of those names still exists upstream (a rename
 *     is the one failure re-running this script cannot fix — it would leave a
 *     dangling var() and a dark page with no background);
 *   - --ink and --well stay literal, and agree between the two dark blocks;
 *   - every page under public/ HAS a dark `theme-color`, and it equals crust.
 *     That <meta> is a hand-typed copy of the palette, it lives in markup this
 *     script does not generate, and there are ten of them;
 *   - public/favicon.svg's ground is crust, and its fan matches what this
 *     script would write.
 *
 * The last two are why palette.yml's paths filter has to include
 * `public/**.html` and `public/favicon.svg` as well as the stylesheet — a
 * filter on `public/hausfold.css` + `scripts/**` alone let a markup- or
 * icon-only PR skip the check covering it, and a check that can't see the file
 * it checks reports "matches" about a file it never read.
 *
 * ---- the favicon ------------------------------------------------------------
 *
 * The mark on the favicon is swept through all six product accents, which makes
 * it the one place on this site that holds colour with no hover to gate it (see
 * the file's own comment, and AGENTS.md's greyscale-at-rest rule). SVG has no
 * conic gradient, so the sweep is a fan of flat-coloured wedges — and a fan is
 * ninety hardcoded hexes, i.e. exactly the frozen snapshot of the palette this
 * script exists to prevent. Bumping PIN would move the stylesheet and the ten
 * theme-colours and silently leave the icon a release behind.
 *
 * So the fan is generated too, from the same port, between markers in the SVG.
 * The ring below is the same six accents in the same order hausfold.css sweeps
 * them; the geometry is FAN. Only the wedges are generated — the mark's own
 * outline is hand-drawn geometry and stays put.
 *
 * ---- the ico fallback -------------------------------------------------------
 *
 * WebKit doesn't resolve `<link rel="icon" type="image/svg+xml">`; Safari
 * falls back to /favicon.ico, which this site didn't have until 2026-08-12.
 * A rasterized copy of the six-accent sweep would be exactly the frozen
 * palette snapshot this script exists to prevent, so favicon.ico is
 * monochrome instead — the same mark, --ink on --nebelung-crust, which sits
 * outside the accent tokens entirely and so can't go stale when PIN moves.
 *
 * The mark's outline is parsed straight out of favicon.svg's own hand-drawn
 * cover path (the two pentagons under fill-rule="evenodd", below the
 * generated fan) rather than re-declared here, so a hand-edit to the mark's
 * position or weight carries into the ico for free. PNG and ICO are encoded
 * below with node:zlib and a small CRC32 — one binary file, no image
 * library, no new dependency.
 *
 * --check does NOT compare the file's raw bytes. It first tried to — caught
 * live on 2026-08-12, when the file this generator wrote on Node 22.23.1
 * failed CI's check under Node 22.23.2, same pixels, different compressed
 * bytes: zlib.deflateSync's output isn't promised stable across zlib
 * versions for identical input. So --check decodes favicon.ico back into raw
 * RGB (decodeIco, below) and compares *that* against a fresh rasterization.
 * Inflating is lossless regardless of which zlib compressed the file, so
 * pixels are the actual invariant this generator can promise; bytes weren't
 * one, they just happened to hold locally.
 *
 * That file is a real cost, not a free one: it's the first binary under
 * public/, in a repo whose "No og:image" rule (AGENTS.md) drew the line at
 * exactly this kind of asset. Paid deliberately — Safari showing the house
 * mark flat beats Safari showing nothing.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const TARGET = join(PUBLIC, "hausfold.css");
const ICON = join(PUBLIC, "favicon.svg");
const ICO = join(PUBLIC, "favicon.ico");
const FLAKE = "github:hausfold/nebelung";

/* The pinned revision the vendored block was rendered from. Bump it by hand —
 * `--latest` tells you whether there's anything to bump *to*, and the rev is
 * stamped into the block so the CSS says where its values came from. */
const PIN = "49f196de2aad5d6304570a8f0ca19b516fc55b8f";

const BEGIN =
  "/* >>> nebelung — generated by scripts/sync-nebelung.mjs; do not edit by hand <<< */";
const END = "/* >>> end nebelung <<< */";

/* The same markers in XML, for the favicon. An XML comment may not contain two
 * hyphens in a row, which the CSS spelling doesn't have to care about — hence
 * two constants rather than one wrapped both ways. */
const ICON_BEGIN =
  "<!-- >>> nebelung — generated by scripts/sync-nebelung.mjs; do not edit by hand <<< -->";
const ICON_END = "<!-- >>> end nebelung <<< -->";

/* The ten values that ARE nebelung's, and which name each one comes from.
 * --check asserts both dark blocks say exactly this, so an upstream rename
 * (or a hand-edit that puts a literal back) is a red build and not a slow
 * drift nobody notices. */
const FROM_NEBELUNG = {
  "--ground": "crust",
  "--ink-2": "subtext1",
  "--ink-3": "overlay2",
  "--rule": "surface1",
  "--a-nebelhaus": "pink",
  "--a-pounce": "peach",
  "--a-holt": "teal",
  "--a-perch": "green",
  "--a-nebelung": "mauve",
  "--a-trill": "yellow",
};

/* The favicon's sweep: the same six accents, in the order hausfold.css's
 * conic-gradient spends them, by nebelung NAME so the icon follows the port.
 * Reading left to right is reading the mark clockwise from its apex. */
const RING = [
  "mauve", /* nebelung  */
  "teal", /*  holt      */
  "green", /* perch     */
  "yellow", /* trill    */
  "peach", /*  pounce   */
  "pink", /*   nebelhaus */
];

/* The fan's geometry. Everything here is in the SVG's 100x100 user space.
 *
 *   wedges   90, against the wallpaper's 240. The neighbour-to-neighbour step
 *            is invisible at every size a favicon is drawn at; it bands
 *            faintly at 512, which nothing renders. Fewer wedges is a smaller
 *            file in a repo with no build step, and this one is committed.
 *   radius   80, which clears the tile's furthest corner from (cx, cy) — 71.8
 *            — so the fan covers every pixel the cover path later paints back.
 *   overlap  degrees added to each wedge's half-angle. Wedges are opaque and
 *            painted in order; without a sliver of overlap the seam between
 *            two of them anti-aliases against the tile and leaves a hairline.
 *   cx, cy   the centre of the mark's own centreline pentagon (not the tile's
 *            centre, and not the mark's stroked bbox): the sweep has to turn
 *            around the ring it is colouring or the hues bunch to one side.
 */
const FAN = { wedges: 90, radius: 80, overlap: 1.5, cx: 50, cy: 51.56 };

/* The two that are deliberately NOT nebelung's, and must stay literal:
 * --ink is extrapolated one rung above nebelung's #d7d7d7 text, and --well is
 * hand-picked — it is not mantle (#191919). hausfold.css's header says why. */
const STAY_LITERAL = ["--ink", "--well"];

const args = process.argv.slice(2);
const check = args.includes("--check");
const latest = args.includes("--latest");
const fromIdx = args.indexOf("--from");
const from = fromIdx === -1 ? null : args[fromIdx + 1];

/* ---- upstream ---------------------------------------------------------- */

function nix(argv) {
  return execFileSync("nix", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

/* `--from` is a dev escape hatch for a build you already have. It does NOT
 * change the stamp: the block always claims PIN, so a locally-sourced block
 * that differs from the pin fails --check rather than passing quietly. */
function upstreamCss(rev = PIN) {
  if (from) {
    return readFileSync(from.endsWith(".css") ? from : join(from, "nebelung-mocha.css"), "utf8");
  }
  const out = nix(["build", `${FLAKE}/${rev}`, "--no-link", "--print-out-paths"]).split("\n").pop();
  return readFileSync(join(out, "css", "nebelung-mocha.css"), "utf8");
}

function headRevision() {
  return JSON.parse(nix(["flake", "metadata", FLAKE, "--json"])).revision;
}

/* Take upstream's `:root { … }` verbatim — ramp, accents, semantic aliases and
 * its own section comments — minus `color-scheme`, which is upstream's job to
 * declare and ours to decide: hausfold.css sets `light dark` on :root and
 * `dark` only inside the dark blocks. */
function render(css) {
  const m = css.match(/:root\s*\{\n([\s\S]*?)\n\}/);
  if (!m) throw new Error("no :root block in nebelung-mocha.css — did the port's shape change?");
  const body = m[1]
    .split("\n")
    .filter((l) => !/^\s*color-scheme\s*:/.test(l))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");

  return [
    BEGIN,
    "/* nebelung's own CSS port (dist/css/nebelung-mocha.css), verbatim but for",
    " * `color-scheme`. Nothing here paints anything: these are the upstream",
    " * names, and only the two dark blocks below spend any of them. The light",
    " * theme is hand-picked and must not reference them.",
    " *",
    ` * From github:hausfold/nebelung @ ${PIN.slice(0, 12)} — a pin, so nothing`,
    " * here moves until someone moves it. `node scripts/sync-nebelung.mjs",
    " * --latest` says whether there's anything to move to. */",
    ":root {",
    body,
    "}",
    END,
  ].join("\n");
}

/* ---- the favicon's fan -------------------------------------------------- */

/* Four decimals is what the SVG carries; it puts the wedge apex inside a
 * ten-thousandth of a user unit, which at a 16px render is a nanometre's worth
 * of nothing, and it keeps the file diffable. */
const g4 = (n) => String(Number(n.toPrecision(4)));

function hexToRgb(h) {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}

const toHex = (rgb) => "#" + rgb.map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0")).join("");

/* The ring sampled at t in [0,1), wrapping past the last stop back to the
 * first — the same closed loop the masthead's conic-gradient makes by repeating
 * --a-nebelung as its final stop. */
function ringAt(ring, t) {
  const k = ring.length;
  const f = t * k;
  const i = Math.floor(f);
  const m = f - i;
  const a = ring[i % k];
  const b = ring[(i + 1) % k];
  return toHex([0, 1, 2].map((j) => Math.round(a[j] * (1 - m) + b[j] * m)));
}

function renderFan(port) {
  const missing = RING.filter((name) => !(`--nebelung-${name}` in port));
  if (missing.length) {
    throw new Error(`nebelung no longer defines ${missing.map((n) => `--nebelung-${n}`).join(", ")}`);
  }
  const ring = RING.map((name) => hexToRgb(port[`--nebelung-${name}`]));

  const half = ((180 / FAN.wedges + FAN.overlap) * Math.PI) / 180;
  const x = g4(FAN.radius * Math.cos(half));
  const y = g4(FAN.radius * Math.sin(half));
  const d = `M0 0L${x} -${y} L${x} ${y}Z`;

  /* Five to a line: one wedge per line is 90 lines of near-identical noise, and
   * all 90 on one line is a diff nobody can read. */
  const rows = [];
  for (let i = 0; i < FAN.wedges; i += 5) {
    const row = [];
    for (let j = i; j < Math.min(i + 5, FAN.wedges); j++) {
      /* -90° so the ring starts at twelve o'clock and turns clockwise, the way
       * `conic-gradient(from 0deg …)` does on the masthead. */
      const a = g4((360 * j) / FAN.wedges - 90);
      const c = ringAt(ring, (j + 0.5) / FAN.wedges);
      row.push(`<path transform="rotate(${a})" fill="${c}" d="${d}"/>`);
    }
    rows.push("    " + row.join(""));
  }

  return [
    ICON_BEGIN,
    `  <g transform="translate(${FAN.cx} ${FAN.cy})">`,
    ...rows,
    "  </g>",
    "  " + ICON_END,
  ].join("\n");
}

/* ---- the ico fallback ---------------------------------------------------
 *
 * See the module comment above for why this exists and why it's monochrome.
 */

function parseMarkPolygons(svg) {
  const m = svg.match(/<path\s+fill="#[0-9a-f]{3,8}"\s+fill-rule="evenodd"\s+d="([^"]+)"/i);
  if (!m) throw new Error("favicon.svg: no evenodd cover path — did the hand-drawn layer move?");
  const subpaths = m[1].match(/M[^Z]*Z/g);
  if (!subpaths || subpaths.length !== 3) {
    throw new Error("favicon.svg: expected 3 subpaths in the cover path (tile, outer, inner)");
  }
  const toPolygon = (s) => {
    const nums = s.match(/-?[\d.]+/g).map(Number);
    const pts = [];
    for (let i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    return pts;
  };
  return { outer: toPolygon(subpaths[1]), inner: toPolygon(subpaths[2]) };
}

/* Ray-casting point-in-polygon. Both polygons are simple (no self-intersection),
 * so the ordinary inside test doubles as "is this point on the stroke": on the
 * mark iff inside outer and outside inner — the same evenodd logic the SVG
 * itself paints with, just evaluated per pixel instead of by a renderer. */
function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi !== yj && y >= Math.min(yi, yj) && y < Math.max(yi, yj)) {
      if (x < xi + ((y - yi) / (yj - yi)) * (xj - xi)) inside = !inside;
    }
  }
  return inside;
}

/* Supersampled coverage (ss×ss per pixel), blended between ground and ink —
 * plain anti-aliasing, cheap enough at favicon sizes and the only way a
 * 0.15-weight stroke survives being drawn at 16px at all. */
function rasterizeMark(size, outer, inner, inkRgb, groundRgb, ss = 8) {
  const rgb = Buffer.alloc(size * size * 3);
  const unit = 100 / size;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const x = (px + (sx + 0.5) / ss) * unit;
          const y = (py + (sy + 0.5) / ss) * unit;
          if (pointInPolygon([x, y], outer) && !pointInPolygon([x, y], inner)) hits++;
        }
      }
      const t = hits / (ss * ss);
      const o = (py * size + px) * 3;
      for (let c = 0; c < 3; c++) rgb[o + c] = Math.round(groundRgb[c] * (1 - t) + inkRgb[c] * t);
    }
  }
  return rgb;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/* 8-bit truecolor RGB, filter-0 (none) on every scanline, deflated with
 * node:zlib — no palette, no alpha: the tile is opaque everywhere, same as
 * the SVG's own tile. */
function encodePng(size, rgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; /* bit depth */
  ihdr[9] = 2; /* colour type: truecolor */
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3);
    raw[row] = 0; /* filter: none */
    rgb.copy(raw, row + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/* A "PNG-in-ICO": every browser and OS since Vista decodes an ICO entry
 * that's a PNG file rather than a legacy BMP, which is what makes hand-
 * encoding this reasonable at all — one format to get right, not two. */
function encodeIco(pngsBySize) {
  const dir = Buffer.alloc(6 + pngsBySize.length * 16);
  dir.writeUInt16LE(1, 2); /* type: icon */
  dir.writeUInt16LE(pngsBySize.length, 4);
  let offset = dir.length;
  const parts = [dir];
  pngsBySize.forEach(({ size, png }, i) => {
    const e = 6 + i * 16;
    dir[e] = size; /* 0 would mean 256; every size here is under that */
    dir[e + 1] = size;
    dir.writeUInt16LE(1, e + 4); /* colour planes */
    dir.writeUInt16LE(32, e + 6); /* bits per pixel */
    dir.writeUInt32LE(png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += png.length;
    parts.push(png);
  });
  return Buffer.concat(parts);
}

const ICO_SIZES = [16, 32];

function rasterAllSizes(svg, inkHex, groundHex) {
  if (!inkHex || !groundHex) {
    throw new Error(`missing colour — --ink is ${inkHex ?? "missing"}, ground is ${groundHex ?? "missing"}`);
  }
  const { outer, inner } = parseMarkPolygons(svg);
  const ink = hexToRgb(inkHex);
  const ground = hexToRgb(groundHex);
  return ICO_SIZES.map((size) => ({ size, rgb: rasterizeMark(size, outer, inner, ink, ground) }));
}

function renderIco(pixelsBySize) {
  return encodeIco(pixelsBySize.map(({ size, rgb }) => ({ size, png: encodePng(size, rgb) })));
}

/* Read one IHDR + IDAT + IEND PNG back into raw RGB — the inverse of
 * encodePng, and the reason --check compares *pixels* rather than bytes: see
 * decodeIco below for why. */
function decodePng(buf) {
  const sig = buf.subarray(0, 8);
  if (!sig.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error("not a PNG (bad signature)");
  }
  let offset = 8;
  let ihdr = null;
  const idatParts = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") ihdr = data;
    if (type === "IDAT") idatParts.push(data);
    if (type === "IEND") break;
    offset += 8 + len + 4;
  }
  if (!ihdr) throw new Error("no IHDR chunk");
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  if (ihdr[8] !== 8 || ihdr[9] !== 2) throw new Error("expected 8-bit truecolor RGB");
  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    if (raw[row] !== 0) throw new Error(`unsupported PNG filter type ${raw[row]} on row ${y}`);
    raw.copy(rgb, y * width * 3, row + 1, row + 1 + width * 3);
  }
  return { width, height, rgb };
}

/* Read favicon.ico back into {size, rgb} pairs, one per embedded PNG.
 *
 * Comparing *pixels* rather than the ICO's raw bytes is deliberate:
 * zlib.deflateSync's compressed output isn't guaranteed identical across
 * Node/zlib versions for the same input (confirmed 2026-08-12 — the file
 * this generator wrote on Node 22.23.1 didn't match what CI's Node 22.23.2
 * produced, byte for byte, though the picture was the same). Inflating is
 * lossless regardless of which zlib compressed it, so decoding both sides
 * and comparing raw RGB is the actual invariant this generator can promise,
 * where comparing compressed bytes wasn't one — it was a stand-in that
 * happened to work locally. */
function decodeIco(buf) {
  const count = buf.readUInt16LE(4);
  const images = [];
  for (let i = 0; i < count; i++) {
    const e = 6 + i * 16;
    const size = buf[e] === 0 ? 256 : buf[e];
    const dataSize = buf.readUInt32LE(e + 8);
    const offset = buf.readUInt32LE(e + 12);
    images.push({ size, ...decodePng(buf.subarray(offset, offset + dataSize)) });
  }
  return images;
}

/* ---- the target -------------------------------------------------------- */

function region(text) {
  const a = text.indexOf(BEGIN);
  const b = text.indexOf(END);
  if (a === -1 || b === -1) return null;
  return { start: a, end: b + END.length, text: text.slice(a, b + END.length) };
}

function iconRegion(text) {
  const a = text.indexOf(ICON_BEGIN);
  const b = text.indexOf(ICON_END);
  if (a === -1 || b === -1) return null;
  return { start: a, end: b + ICON_END.length, text: text.slice(a, b + ICON_END.length) };
}

/* The tile's ground, which is --ground, which is crust. It is the one palette
 * value in the favicon that is NOT inside the generated block — it belongs to
 * the hand-drawn cover path — so it is checked the way the ten theme-colours
 * are, rather than written. */
function iconGround(text) {
  return text.match(/<path\s+fill="(#[0-9a-f]{3,8})"\s+fill-rule="evenodd"/i)?.[1];
}

/* An XML comment may not contain two hyphens in a row — and the favicon's
 * comment is long, is about a palette whose every token is named `--something`,
 * and mentions this script's own flags. Writing one is a parse error, and the
 * failure is silent in the worst way: no browser reports it, the tab just falls
 * back to a blank page icon and the site looks like it has no favicon at all.
 * Caught it once already, in the commit that added the file. So: after the
 * delimiters are removed, nothing else in there may be `--`. */
function iconDoubleHyphens(text) {
  const bad = [];
  const lines = text.replaceAll("<!--", "    ").replaceAll("-->", "   ").split("\n");
  lines.forEach((line, i) => {
    if (line.includes("--")) bad.push(`${i + 1}: ${line.trim()}`);
  });
  return bad;
}

/* Every block we care about is a flat list of declarations with no nested
 * braces, so "up to the next }" is an honest parse here. */
function bodyAt(text, from) {
  const open = text.indexOf("{", from);
  const close = text.indexOf("}", open);
  if (open === -1 || close === -1) throw new Error("unbalanced block in hausfold.css");
  return { text: text.slice(open + 1, close), start: open + 1, end: close };
}

function darkBlocks(text) {
  const media = text.indexOf("@media (prefers-color-scheme: dark)");
  if (media === -1) throw new Error("no `@media (prefers-color-scheme: dark)` in hausfold.css");
  const toggle = text.indexOf(':root[data-theme="dark"]');
  if (toggle === -1) throw new Error('no `:root[data-theme="dark"]` in hausfold.css');
  return [
    { name: "@media (prefers-color-scheme: dark)", ...bodyAt(text, text.indexOf(":root", media)) },
    { name: ':root[data-theme="dark"]', ...bodyAt(text, toggle) },
  ];
}

function decls(body) {
  const out = {};
  for (const [, k, v] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[k] = v.trim();
  return out;
}

/* Every page's dark `theme-color` is a hand-typed copy of --ground, which is
 * crust. It's the one place the palette still lives outside hausfold.css, and
 * an upstream move that this script fixes in the CSS would otherwise leave
 * ten <meta>s behind — browser chrome a different grey from the page, with
 * the tool reporting "matches". So it's checked here too, though it can't be
 * generated: there is no template, and the head is markup. */
function htmlPages(dir = PUBLIC, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlPages(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function darkThemeColours() {
  const found = [];
  for (const page of htmlPages()) {
    const html = readFileSync(page, "utf8");
    const before = found.length;
    for (const [, tag] of html.matchAll(/<meta\b([^>]*name="theme-color"[^>]*)>/g)) {
      if (!/media="\(prefers-color-scheme:\s*dark\)"/.test(tag)) continue;
      found.push({ page: relative(ROOT, page), value: tag.match(/content="([^"]*)"/)?.[1] });
    }
    /* A page with NO dark <meta> is the case this used to miss entirely: it
     * contributed nothing, so nothing was compared, so it passed. Every page
     * under public/ owes one, and a new page is exactly where it gets
     * forgotten — so record the absence and let the comparison below fail it. */
    if (found.length === before) found.push({ page: relative(ROOT, page), value: undefined });
  }
  return found;
}

function audit(text, block) {
  const problems = [];
  const port = decls(block);

  for (const [token, name] of Object.entries(FROM_NEBELUNG)) {
    if (!(`--nebelung-${name}` in port)) {
      problems.push(
        `nebelung no longer defines --nebelung-${name}, which ${token} reads — the port was ` +
          `renamed upstream, and re-running this script cannot fix that. Re-point ${token} by hand.`,
      );
    }
  }

  const blocks = darkBlocks(text);
  const literals = {};

  for (const block of blocks) {
    const d = decls(block.text);
    for (const [token, name] of Object.entries(FROM_NEBELUNG)) {
      const want = `var(--nebelung-${name})`;
      if (d[token] !== want) {
        problems.push(`${block.name}: ${token} is ${d[token] ?? "missing"}, expected ${want}`);
      }
    }
    for (const token of STAY_LITERAL) {
      if (!/^#[0-9a-f]{3,8}$/i.test(d[token] ?? "")) {
        problems.push(
          `${block.name}: ${token} is ${d[token] ?? "missing"} — it is deliberately not ` +
            `nebelung's and must stay a literal hex (see hausfold.css's header)`,
        );
      }
      (literals[token] ??= []).push(d[token]);
    }
  }

  /* The two dark blocks say the same thing twice — once for the scheme, once
   * for the toggle. The var()s can't drift now; these two still can. */
  for (const [token, values] of Object.entries(literals)) {
    if (new Set(values).size > 1) {
      problems.push(
        `${token} differs between the two dark blocks (${values.join(" vs ")}) — they must agree`,
      );
    }
  }

  const crust = port["--nebelung-crust"];
  for (const { page, value } of darkThemeColours()) {
    if (value?.toLowerCase() !== crust?.toLowerCase()) {
      problems.push(
        `${page}: dark theme-color is ${value ?? "missing"}, but --ground is ${crust} — ` +
          `the <meta> is a hand-typed copy of the palette and nothing generates it`,
      );
    }
  }

  /* Everything except the generated block and the two dark blocks must be free
   * of --nebelung-*: the light theme is hand-picked, and the site is greyscale
   * at rest — a palette in the file must not become a palette on the page. */
  const r = region(text);
  const holes = [[r.start, r.end], ...darkBlocks(text).map((b) => [b.start, b.end])].sort(
    (a, b) => b[0] - a[0],
  );
  let rest = text;
  for (const [s, e] of holes) rest = rest.slice(0, s) + rest.slice(e);
  rest = rest.replace(/\/\*[\s\S]*?\*\//g, ""); /* prose about the port isn't a use of it */
  if (rest.includes("--nebelung-")) {
    problems.push(
      "a --nebelung-* reference appears outside the generated block and the two dark blocks — " +
        "the light theme is hand-picked on purpose",
    );
  }

  return problems;
}

/* ---- go ---------------------------------------------------------------- */

const file = readFileSync(TARGET, "utf8");
const icon = readFileSync(ICON, "utf8");

/* --latest asks the question the pin stops CI from asking: has upstream moved,
 * and would moving with it change any value we spend? It never writes and never
 * fails — a bump is a decision, and this is the thing you read before making
 * it. Values are compared by name, so an accent we don't use changing upstream
 * reads as "nothing we spend", which is the honest answer. */
if (latest) {
  const head = headRevision();
  const port = decls(render(upstreamCss(head)));
  const mine = decls(region(file)?.text ?? "");
  const moved = Object.entries(FROM_NEBELUNG)
    .map(([token, name]) => [token, `--nebelung-${name}`])
    .filter(([, n]) => port[n] !== mine[n])
    .map(([token, n]) => `  ${token} (${n}): ${mine[n] ?? "gone"} → ${port[n] ?? "gone upstream"}`);

  if (head === PIN) {
    console.log(`pinned at ${PIN.slice(0, 12)}, which is nebelung's HEAD. Nothing to bump.`);
  } else {
    console.log(`pinned at ${PIN.slice(0, 12)}; nebelung's HEAD is ${head.slice(0, 12)}.`);
    console.log(
      moved.length
        ? `\n${moved.length} value(s) this site spends would change:\n${moved.join("\n")}`
        : "\nNo value this site spends would change.",
    );
    console.log(`\nTo take it: set PIN to ${head} in this script, re-run it, commit the block.`);
  }
  process.exit(0);
}

const block = render(upstreamCss());
const r = region(file);

if (!r) {
  if (check) {
    console.error(`${TARGET}: no generated block — expected the ${BEGIN.slice(0, 16)}… markers`);
    process.exit(1);
  }
  const at = file.indexOf(":root {");
  if (at === -1) throw new Error("nowhere to insert: hausfold.css has no `:root {`");
  writeFileSync(TARGET, file.slice(0, at) + block + "\n\n" + file.slice(at));
  console.log("inserted the nebelung block into public/hausfold.css");
  process.exit(0);
}

const next = file.slice(0, r.start) + block + file.slice(r.end);
const problems = audit(next, block);

/* The favicon's fan, from the same port. `ir` is null only if someone deleted
 * the markers — there is no "insert it for me" path here the way there is for
 * the stylesheet, because the block has to sit between two hand-drawn layers
 * and this script has no business guessing where. */
const port = decls(block);

/* An upstream rename is the failure audit() already reports, in prose that says
 * how to fix it. Letting renderFan's throw escape would replace that list with
 * a stack trace, so it becomes one more line on the list instead. */
let fan = null;
try {
  fan = renderFan(port);
} catch (e) {
  problems.push(`${relative(ROOT, ICON)}: cannot generate the wedge fan — ${e.message}`);
}

const ir = iconRegion(icon);
const iconNext = ir && fan ? icon.slice(0, ir.start) + fan + icon.slice(ir.end) : icon;

if (!fan) {
  /* nothing to compare against */
} else if (!ir) {
  problems.push(
    `${relative(ROOT, ICON)}: no generated block — expected the ${ICON_BEGIN.slice(0, 20)}… ` +
      `markers around the wedge fan. Put them back; this script won't guess where they go.`,
  );
} else if (ir.text !== fan) {
  problems.push(
    `${relative(ROOT, ICON)}: the wedge fan is stale or hand-edited — the sweep is generated ` +
      `from the same port the stylesheet reads, so a PIN bump has to move it too`,
  );
}

for (const where of iconDoubleHyphens(icon)) {
  problems.push(
    `${relative(ROOT, ICON)}:${where} — two hyphens in a row inside an XML comment. ` +
      `The file will not parse and the favicon silently disappears; spell the token out.`,
  );
}

const ground = iconGround(icon);
const crust = port["--nebelung-crust"];
if (ground?.toLowerCase() !== crust?.toLowerCase()) {
  problems.push(
    `${relative(ROOT, ICON)}: the tile's ground is ${ground ?? "missing"}, but --ground is ` +
      `${crust} — the cover path is hand-drawn and nothing generates that fill`,
  );
}

/* The Safari fallback: same mark, --ink on crust, no accent sweep. See the
 * module comment ("the ico fallback") for why it's monochrome and generated
 * rather than hand-drawn. A generation failure (an upstream rename that took
 * --ink or crust with it) is a real refusal, unlike a merely stale file. */
let icoPixels = null;
try {
  const ink = decls(darkBlocks(next)[0].text)["--ink"];
  icoPixels = rasterAllSizes(iconNext, ink, crust);
} catch (e) {
  problems.push(`${relative(ROOT, ICO)}: cannot generate the fallback icon — ${e.message}`);
}

/* Compared by decoded pixels, not raw bytes — decodeIco's own comment says
 * why. `icoStale` covers both "doesn't exist" and "exists but decodes to
 * different pixels or won't decode at all" (wrong format, truncated, a size
 * missing) under one umbrella, since every one of those wants the same fix:
 * regenerate it. */
let icoStale = true;
if (icoPixels) {
  try {
    const current = decodeIco(readFileSync(ICO));
    icoStale =
      current.length !== icoPixels.length ||
      icoPixels.some((want, i) => current[i]?.size !== want.size || !current[i]?.rgb.equals(want.rgb));
  } catch {
    icoStale = true;
  }
}

if (icoPixels && icoStale) {
  problems.push(
    `${relative(ROOT, ICO)} is stale or missing — run \`node scripts/sync-nebelung.mjs\` to ` +
      `regenerate it from the mark, --ink and crust`,
  );
}

if (check) {
  if (r.text !== block) {
    problems.unshift(
      "the generated block is stale or hand-edited — run `node scripts/sync-nebelung.mjs`",
    );
  }
  if (problems.length) {
    console.error("the site is out of sync with nebelung:\n");
    for (const p of problems) console.error(`  - ${p}`);
    console.error("");
    process.exit(1);
  }
  console.log("public/hausfold.css, public/favicon.svg and public/favicon.ico match nebelung's CSS port.");
  process.exit(0);
}

/* A stale fan or a stale/missing ico are the "problems" writing FIXES, so
 * they must not also refuse the write. Everything else here is a hand-edit
 * this script can't repair. */
const fatal = problems.filter(
  (p) => !p.includes("the wedge fan is stale") && !p.includes("is stale or missing"),
);
if (fatal.length) {
  console.error("refusing to write — the site doesn't spend the port the way it should:\n");
  for (const p of fatal) console.error(`  - ${p}`);
  process.exit(1);
}

const wrote = [];
if (next !== file) {
  writeFileSync(TARGET, next);
  wrote.push("the nebelung block in public/hausfold.css");
}
if (iconNext !== icon) {
  writeFileSync(ICON, iconNext);
  wrote.push("the wedge fan in public/favicon.svg");
}
if (icoPixels && icoStale) {
  writeFileSync(ICO, renderIco(icoPixels));
  wrote.push("the Safari fallback at public/favicon.ico");
}

console.log(
  wrote.length
    ? `updated ${wrote.join(", ")}`
    : "public/hausfold.css, public/favicon.svg and public/favicon.ico already match nebelung's CSS port.",
);
