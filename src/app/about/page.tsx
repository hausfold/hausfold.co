import Link from 'next/link';
import { Colophon, GithubMark } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// /about — who hausfold is, written for a stranger (or an agent) verifying
// that the house is real. House-level facts only: what is made, how it works,
// how it is run. Nothing here argues for a product; that belongs in the docs
// trees, and the links below point at them rather than restate them.
//
// Facts are the homepage's and the docs', in the docs' own words.
export const metadata = pageMetadata({
  title: 'about · hausfold',
  description:
    'One person, a few small programs, no company to upsell you: what hausfold makes and how the house is run.',
  path: '/about/',
});

export default function About() {
  return (
    <main className="sheet">
      <header className="masthead">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">hausfold</Link>
          <span className="sep" aria-hidden="true">
            /
          </span>
          <span aria-current="page">about</span>
        </nav>
        <div className="mark" aria-hidden="true">
          ⌂
        </div>
        <h1 className="wordmark">about</h1>
        <p className="standfirst">One person, a few small programs, no company to upsell you.</p>
        <div className="lede">
          <p>
            hausfold makes Mac software: one layer that rebuilds the whole machine, and the small
            native tools that live inside it. Nothing by hand, and open all the way down.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>What that means</h2>
        <p>
          The layer is called haus. You describe the Mac you want in one plain text file: which
          apps install, how the desktop is arranged, which keys do what.{' '}
          <code>haus rebuild</code> turns the file into a working machine, and{' '}
          <code>haus rollback</code> puts the old Mac back if you didn&apos;t like what you got.
          It exists because the settings you always change by hand are the ones that never stay
          changed.
        </p>
        <p>
          The apps are smaller and work on their own. pounce is a launcher you teach your own
          commands. perch is a shelf that drops out of the notch mid-drag. scruff gives every
          coding agent its own checkout, so parallel agents never collide. trill is younger still and
          sits in the incubator.
        </p>
      </section>

      <section className="block">
        <h2>Free and open source</h2>
        <p>
          All of it is free and open source. There is no account, no subscription, nothing to buy,
          and nothing here that argues otherwise. Source code lives at{' '}
          <a href="https://github.com/hausfold">github.com/hausfold</a>, the docs{' '}
          <Link href="/docs/haus">explain every option</Link> down to its default, and a desktop
          someone shares reads as a plain file before anyone runs it.
        </p>
      </section>

      <section className="block">
        <h2>How the house is run</h2>
        <p>
          hausfold is a one-person house. The mail at{' '}
          <a href="mailto:julien@hausfold.co">julien@hausfold.co</a> is read by the person who
          wrote the software, which is why the address is a name. Where to send what is on the{' '}
          <Link href="/contact/">contact page</Link>, and how this site handles data (it handles
          none) is on <Link href="/privacy/">privacy</Link>.
        </p>
      </section>

      <Colophon>
        <Link href="/privacy">privacy</Link>
        <GithubMark />
      </Colophon>
    </main>
  );
}
