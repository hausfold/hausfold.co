import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static export, not the OpenNext adapter. The Worker in front of this
  // serves `out/` as assets; nothing here runs at request time. Decided in
  // the rename plan's §5.2 — the install one-liner keeps running on code
  // that is already proven.
  output: 'export',

  // Load-bearing, not cosmetic. Cloudflare's `html_handling` default
  // (`auto-trailing-slash`) is what maps `/desktops` to
  // `desktops/index.html`, and Next only emits that directory-with-index
  // layout when this is on. Turn it off and every docs URL changes shape,
  // which doubles the redirect map from nebelhaus.com for no reason.
  trailingSlash: true,

  // Next mints a random build id per build and embeds it in
  // `_next/static/<id>/`, in every RSC payload and in 404.html — so two
  // builds of identical source differ in dozens of files. Pinning it makes
  // the whole export byte-identical build to build, which is what makes
  // "did this deploy change anything?" an answerable question. The CI job
  // that builds twice and diffs `out/` is the thing that keeps this true
  // across a future Next release; see .github/workflows/docs.yml.
  generateBuildId: () => 'hausfold',

  // `next/image`'s optimizer is a server. There isn't one.
  images: { unoptimized: true },

  reactStrictMode: true,
};

export default withMDX(config);
