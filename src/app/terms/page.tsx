import Link from 'next/link';
import { Colophon, Crumbs } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// Ported from `public/terms/index.html`.
//
// This page exists because Paddle's account review wants policy URLs on the
// seller's own domain, and it described a licence nobody could buy *yet* — a
// gap that was deliberate while a sale was coming.
//
// 🚨 It isn't. perch went back to MIT with no paid tier on 2026-08-15
// (hausfold/perch#67), and perch was the only thing that was ever going to be
// sold — so the seats, renewals and refund sections below describe a licence
// that will never exist. The source section was corrected the next day; the
// rest is untouched because deleting two published policy URLs is the user's
// call, not a cleanup. See AGENTS.md's seller's-surface section.
export const metadata = pageMetadata({
  title: 'Terms · hausfold',
  description:
    "The terms that apply to hausfold software and to a hausfold licence: what a licence grants, how long updates are covered, and what we don't promise.",
  path: '/terms/',
  ogTitle: 'Terms · hausfold',
  ogDescription:
    "What a hausfold licence grants, how long updates are covered, and what we don't promise.",
});

export default function Terms() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs trail={[{ href: '/', label: 'hausfold' }]} current="terms" />

      <header className="masthead">
        <h1 className="wordmark">Terms</h1>
        <p className="standfirst">What you get, and what we don&apos;t promise.</p>
        <div className="lede">
          <p>
            These terms cover hausfold software and any licence bought for it. They&apos;re written
            to be read in one sitting; where a sentence here and a sentence in the software
            disagree, tell us and we&apos;ll fix the wrong one.
          </p>
          <p className="aside">
            <strong>Nothing hausfold publishes is for sale today.</strong> Every app is free and
            open source, so the licence described below is one nobody currently holds. The page
            stays because the URL is published and because this is where the terms will be if that
            ever changes.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>Who you&apos;re dealing with</h2>
        <p>
          hausfold makes and supports the software. Purchases are handled by{' '}
          <a href="https://www.paddle.com/">Paddle</a> as merchant of record: Paddle is the seller
          on your receipt, takes the payment, and handles sales tax and VAT. Paddle&apos;s{' '}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms">buyer terms</a> apply to the
          transaction; these terms apply to the software.
        </p>
      </section>

      <section className="block">
        <h2>What a licence grants</h2>
        <dl className="facts">
          <dt>use</dt>
          <dd>
            a licence lets one named person use the software on the Macs they personally use, for as
            long as they like. A multi-seat licence carries its seat count in the licence file, one
            seat per person.
          </dd>

          <dt>forever</dt>
          <dd>
            a licence does not expire and does not need renewing to keep working. Any build it
            covers keeps running after support ends, after a renewal lapses, and with no network
            available.
          </dd>

          <dt>updates</dt>
          <dd>
            a licence covers every build released in the year following the purchase date. Nothing
            stops you installing a later one; the app simply runs it unlicensed, and says so,
            telling you which builds your licence does cover. Renewing extends that by another year
            and reactivates it.
          </dd>

          <dt>offline</dt>
          <dd>
            licences are files, not accounts. Nothing is activated over the network, and the
            software never contacts us to ask whether you&apos;re still allowed to run it.
          </dd>
        </dl>
        <p className="aside">
          Please don&apos;t publish your licence file or share it beyond its seats: it&apos;s
          signed and it carries your email, which makes a leaked one easy to trace and awkward for
          you.
        </p>
      </section>

      <section className="block">
        <h2>The source</h2>
        <p>
          Perch is <strong>MIT</strong>, and there is nothing to buy: you may read it, modify it,
          build it and ship it. It spent ten days under a fair source licence in August 2026 and was
          relicensed back to MIT, retroactively, for those releases too. Everything else hausfold
          publishes has a licence of its own.{' '}
          <strong>
            Each repository&apos;s <code>LICENSE</code> file is the authority, not this paragraph.
          </strong>
        </p>
      </section>

      <section className="block">
        <h2>Refunds</h2>
        <p>
          Fourteen days, no questions asked. The <Link href="/refunds">refund policy</Link> is its
          own page, because it&apos;s the one people actually need to find.
        </p>
      </section>

      <section className="block">
        <h2>Privacy</h2>
        <p>
          The software collects nothing. There is no analytics, no advertising and no tracking of
          any kind, and it never sends the names or contents of your files anywhere. Perch&apos;s{' '}
          <Link href="/perch/privacy">privacy policy</Link> spells this out. Buying something means
          Paddle handles your payment details; we see an email address and a purchase, and we use
          the email only to send you the licence file and to answer you.
        </p>
      </section>

      <section className="block">
        <h2>What we don&apos;t promise</h2>
        <p>
          The software is provided as it is, without a warranty of any kind: we don&apos;t promise
          it is free of defects, nor that it fits a particular purpose of yours. To the extent the
          law allows, hausfold&apos;s liability for anything arising out of the software or a
          licence is limited to what you paid for that licence. Nothing here limits liability that
          cannot be limited by law, and nothing here takes away a consumer right you have where you
          live.
        </p>
        <p className="aside">
          Perch stages copies and never moves, renames or deletes your originals, deliberately, so
          an interrupted drag can&apos;t lose data. Keep backups anyway. Everyone should.
        </p>
      </section>

      <section className="block">
        <h2>Changes</h2>
        <p>
          If these terms change, the change applies to purchases made after it. A licence you
          already hold keeps the terms it was bought under.
        </p>
      </section>

      <section className="block">
        <h2>Reaching us</h2>
        <p>
          <a href="mailto:hi@hausfold.co">hi@hausfold.co</a>. A person reads it. For anything about
          a payment, quoting the order number from your Paddle receipt gets you an answer fastest.
        </p>
      </section>

      <Colophon>
        <Link href="/perch/privacy">privacy</Link>
      </Colophon>
    </main>
  );
}
