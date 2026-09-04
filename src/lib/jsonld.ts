// JSON-LD for the homepage, and the single source it lives in.
//
// The same graph is embedded in the page's HTML (src/app/page.tsx) and served
// as a structured-data endpoint at /index.jsonld, and both appear as objects
// in the /schema.jsonl feed — so it is written once here. Editing a fact means
// editing this file, not three copies of it.
//
// The facts are the site's own, in its own words. No address, no phone, no
// ratings: nothing invented to fill a schema field.

const contactEmail = 'julien@hausfold.co';

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'hausfold',
  url: 'https://hausfold.co/',
  description:
    'hausfold makes Mac software: one layer that rebuilds the whole machine, and the small native tools that live inside it.',
  email: contactEmail,
  contactPoint: {
    '@type': 'ContactPoint',
    email: contactEmail,
    contactType: 'customer support',
  },
  // Two identity edges, and both are permanent: the GitHub org, where
  // everything ships from, and the Wikidata item — not a page anyone reads
  // but the node an answer engine resolves the *name* against. The claim goes
  // both ways or it is worth little: Q141271432 carries `official website`
  // back to https://hausfold.co/. Change one and change the other. (#244)
  sameAs: ['https://github.com/hausfold', 'https://www.wikidata.org/wiki/Q141271432'],
};

export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Is hausfold's software free?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Everything hausfold publishes is free and open source: no account, no subscription, nothing to buy.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is haus?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'haus is a macOS layer. You describe the Mac you want in one plain text file, and one command makes the Mac match it. Every rebuild is reversible.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I install it?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'curl -fsSL https://hausfold.co/hacker.sh | bash installs the hacker desktop. Replace hacker with everyday or minimal, or use haus.sh to be asked.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can an AI agent set it up?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The docs exist as plain text (llms.txt and a markdown twin of every page), and haus ships agent skills that carry a rebuild from prompt to rollback.',
      },
    },
  ],
};

export const homepageGraph = [organizationJsonLd, faqJsonLd];
