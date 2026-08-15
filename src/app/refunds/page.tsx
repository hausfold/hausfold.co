import Link from 'next/link';
import { Colophon, Crumbs } from '@/components/sheet';
import { pageMetadata } from '@/lib/page-meta';

// Ported from `public/refunds/index.html`. Paddle's review wants this URL —
// don't move it.
export const metadata = pageMetadata({
  title: 'Refunds · hausfold',
  description:
    'Fourteen days, no questions asked. How to get a refund on a hausfold licence, and what happens afterwards.',
  path: '/refunds/',
  ogTitle: 'Refunds · hausfold',
  ogDescription: 'Fourteen days, no questions asked. How to ask, and what happens afterwards.',
});

export default function Refunds() {
  return (
    <main className="sheet sheet--inner">
      <Crumbs trail={[{ href: '/', label: 'hausfold' }]} current="refunds" />

      <header className="masthead">
        <h1 className="wordmark">Refunds</h1>
        <p className="standfirst">Fourteen days, no questions asked.</p>
        <div className="lede">
          <p>
            If a <Link href="/terms">hausfold licence</Link> isn&apos;t what you wanted, ask within
            fourteen days of buying it and you get all of your money back.{' '}
            <strong>We won&apos;t ask why</strong>, and you don&apos;t have to explain what went
            wrong. If you do feel like telling us, though, it&apos;s the most useful mail we get.
          </p>
        </div>
      </header>

      <section className="block">
        <h2>How to ask</h2>
        <p>Either way works, and both reach the same place:</p>
        <ul className="plain" role="list">
          <li>
            Reply to your receipt, or use the link on it:{' '}
            <a href="https://www.paddle.com/">Paddle</a> is the merchant of record and can process
            it directly.
          </li>
          <li>
            Or mail <a href="mailto:hi@hausfold.co">hi@hausfold.co</a> with the order number from
            that receipt.
          </li>
        </ul>
        <p className="aside">
          The money goes back the way it came, to the card or account that paid. How quickly it
          lands is your bank&apos;s call: usually a few days, and up to ten for some cards.
        </p>
      </section>

      <section className="block">
        <h2>Afterwards</h2>
        <p>
          A refunded licence is no longer one you may use, so please remove it from the app. In
          Perch that&apos;s Settings ▸ License ▸ Remove. The app itself keeps working: you&apos;re
          back to using it exactly as someone who never bought a licence does, and nothing you made
          or stored with it is touched.
        </p>
      </section>

      <section className="block">
        <h2>After fourteen days</h2>
        <p>
          The window is a floor, not a ceiling. If something is broken, if a release went wrong, or
          if you bought twice by accident, write to us anyway; we&apos;d rather fix it than win it.
          Renewals follow the same policy as first purchases.
        </p>
        <p className="aside">
          One ask: if a payment looks wrong to you, mail us before asking your bank to reverse it. A
          chargeback costs us a fee and costs you the licence, and a reply usually costs neither of
          us anything.
        </p>
      </section>

      <Colophon>
        <Link href="/perch/privacy">privacy</Link>
      </Colophon>
    </main>
  );
}
