import Link from 'next/link';
import { pageMetadata } from '@/lib/page-meta';
import styles from './privacy.module.css';

// perch's privacy policy, ported from `public/perch/privacy/index.html`.
//
// 🚨 **Linked from the App Store — don't move or rename this URL.** An App
// Store listing needs a policy URL on a domain the publisher owns, and
// hausfold is the publisher; this one is a legal obligation rather than a shop
// window, which is why it outlived `/terms` and `/refunds` when those were
// retired on 2026-08-16. A free app owes a privacy policy exactly as much as a
// paid one.
// The trailing slash is what `/perch/privacy` 307s to, so it is the form
// crawlers and the listing should settle on — `trailingSlash: true` in
// `next.config.mjs` keeps that true of the exported route.
//
// The layout is this page's own; see `privacy.module.css`.
export const metadata = pageMetadata({
  title: 'perch · privacy',
  description:
    "Perch's privacy policy: no account, no analytics, no data collected. Nothing leaves your Mac except to a device you paired yourself.",
  path: '/perch/privacy/',
});

export default function Privacy() {
  return (
    <main className={`sheet ${styles.policy}`}>
      <header className="masthead">
        <div className={styles.eyebrow}>
          <Link href="/">hausfold</Link> / perch
        </div>
        <h1>Privacy</h1>
        <p className="standfirst">
          Perch does not collect data. Not some, not anonymized, not aggregated. None.
        </p>
      </header>

      <section>
        <h2>What Perch is</h2>
        <p>
          Perch is a Mac notch file shelf and its free iPhone/iPad companion. Files move between
          your own devices, over a connection your Mac and your phone negotiate directly with each
          other. There is no server in the middle, no account to create, and nothing to sign in to.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <p>
          <strong>Nothing.</strong> Specifically:
        </p>
        <ul>
          <li>No account, no email, no sign-in of any kind.</li>
          <li>No analytics SDK and no crash reporter.</li>
          <li>
            No network destination other than a device you paired by hand. Perch never talks to a
            server we run, because we don&apos;t run one.
          </li>
          <li>
            No licence check of any kind. Perch is free and MIT, so there is nothing to verify and
            no key to carry your name.
          </li>
        </ul>
      </section>

      <section>
        <h2>What leaves your devices</h2>
        <p>
          Nothing, unless you pair a phone to a Mac yourself. From that point on, files you place on
          the shelf travel directly between that Mac and that phone, encrypted end to end (X25519
          key agreement, ChaCha20-Poly1305). We (hausfold) never see them, never hold a copy, and
          have no way to.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this ever stops being true, because a future version adds a server, an account, or any
          form of collection, this page will say so before that version ships, not after.
        </p>
      </section>

      <footer>
        <p>
          Questions: <a href="mailto:julien@hausfold.co">julien@hausfold.co</a>. Perch itself lives at{' '}
          {/* Moved inward 2026-08-14. It pointed off-site — the last
              outward link on the site to a page that has existed here since
              2026-08-08, which is AGENTS.md's "a link moves inward on the day
              the inward page exists" left unpaid for six days. The port
              carried it across untouched (it changed no copy anywhere), then
              this went in on its own. */}
          <Link href="/perch">hausfold.co/perch</Link>.
        </p>
      </footer>
    </main>
  );
}
