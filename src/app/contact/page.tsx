import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// /contact — the one page that says where every kind of message goes. The
// address is julien@hausfold.co, deliberately: it is the one that routes, it
// names nobody's team because there is no team, and AGENTS.md holds that line.
export const metadata = pageMetadata({
  title: 'contact · hausfold',
  description:
    'Where bugs, questions and ideas go: one email address and one GitHub org, both read by a person.',
  path: '/contact/',
});

const REPOS = [
  { name: 'haus', url: 'https://github.com/hausfold/haus/issues' },
  { name: 'pounce', url: 'https://github.com/hausfold/pounce/issues' },
  { name: 'perch', url: 'https://github.com/hausfold/perch/issues' },
  { name: 'scruff', url: 'https://github.com/hausfold/scruff/issues' },
  { name: 'trill', url: 'https://github.com/hausfold/trill/issues' },
];

export default function Contact() {
  return (
    <main className="sheet">
      <header className="masthead">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">hausfold</Link>
          <span className="sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">contact</span>
        </nav>
        <div className="mark" aria-hidden="true">
          ⌂
        </div>
        <h1 className="wordmark">contact</h1>
        <p className="standfirst">A person reads it.</p>
        <div className="lede">
          <p>
            One email address, one GitHub org, both read by the same person: the one who wrote the
            software. No ticket queue, no form on this site to fill in.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Email</h2>
        <p>
          <a href="mailto:julien@hausfold.co">julien@hausfold.co</a>. Questions, ideas, reports
          that don&apos;t fit an issue template, anything privacy-shaped. Replies come from that
          person and take the time they take; there is no SLA and no support desk between you and
          the answer.
        </p>
        <p>
          Security problems: same address, please say in the first line that it is one, and give
          an idea of what a fix costs before the details.
        </p>
      </section>

      <section className="block">
        <h2>GitHub issues</h2>
        <p>
          The fastest way to get a bug fixed. One repository per product, issues open on all of
          them:
        </p>
        <ul className="index" role="list">
          {REPOS.map(({ name, url }) => (
            <li key={name}>
              <a className="index-name" href={url}>
                hausfold/{name}
              </a>
            </li>
          ))}
        </ul>
        <p>
          A repro is worth more than a description: the command you ran, the file you changed,
          what you expected. Agents are welcome to file these.
        </p>
      </section>

      <section className="block">
        <h2>What not to send</h2>
        <p>
          The house sells nothing and buys nothing, so sales mail has nowhere to land. Everything
          else gets read.
        </p>
      </section>

      <Colophon>
        <Link href="/privacy">privacy</Link>
        <GithubMark />
      </Colophon>
    </main>
  );
}
