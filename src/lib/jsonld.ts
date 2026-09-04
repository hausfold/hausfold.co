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

const organizationId = 'https://hausfold.co/#organization';

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  // A stable node id, so the other graphs on this site point at THIS
  // organisation rather than repeating a name an engine has to re-resolve.
  // The name is the weak part of the identity ("hausfold" is a word before it
  // is a publisher); an @id, `sameAs` and a back-linked Wikidata item are how
  // a resolver gets from the string to the domain.
  '@id': organizationId,
  name: 'hausfold',
  alternateName: 'hausfold.co',
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

// The `/developers` copy that two files need: the page's own metadata and the
// `TechArticle` below. It was typed twice for one commit and that is exactly
// the drift AGENTS.md warns about, so it lives here.
export const developersPageMeta = {
  name: 'hausfold developers: API, MCP server and OpenAPI spec',
  description:
    'The public machine-facing surface of hausfold.co: the REST API under /v1, the hausfold MCP server, the OpenAPI 3.1 spec, installers, release metadata and docs search. No keys, no accounts.',
};

// /developers, as structured data. It exists for one reason: a search for
// "hausfold API" or "hausfold MCP server" should find the page that documents
// them, and a page whose only machine-readable identity is `WebPage` gives a
// resolver nothing to match those words against. Every node here is a URL this
// Worker answers and a name the page itself uses, so it says nothing the prose
// does not.
//
// `WebAPI` is schema.org's own type for a service documented for developers;
// `documentation` is its property for the prose, which is this page.
export const developersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  '@id': 'https://hausfold.co/developers/#page',
  url: 'https://hausfold.co/developers/',
  ...developersPageMeta,
  inLanguage: 'en',
  isAccessibleForFree: true,
  publisher: { '@id': organizationId },
  about: [
    {
      '@type': 'WebAPI',
      name: 'hausfold REST API',
      url: 'https://hausfold.co/v1/search',
      description:
        'Docs search, desktops, apps, releases, batch and async jobs under /v1. Cursor pagination, RFC 9457 problem+json errors, RateLimit headers, no authentication.',
      documentation: 'https://hausfold.co/developers/',
      provider: { '@id': organizationId },
    },
    {
      '@type': 'WebAPI',
      name: 'hausfold MCP server',
      url: 'https://hausfold.co/mcp',
      description:
        'Model Context Protocol over Streamable HTTP, stateless and unauthenticated. Tools: get_install_command, get_latest_release, search_docs.',
      documentation: 'https://hausfold.co/developers/',
      provider: { '@id': organizationId },
    },
    {
      '@type': 'WebAPI',
      name: 'hausfold OpenAPI spec',
      url: 'https://hausfold.co/openapi.json',
      description:
        'The OpenAPI 3.1 description of everything the hausfold.co Worker answers, kept in step with it by CI.',
      documentation: 'https://hausfold.co/developers/',
      provider: { '@id': organizationId },
    },
  ],
};

// 🚨 What /developers embeds, and it is a two-node graph rather than the
// TechArticle alone. Structured data is parsed per page, so the `@id` stubs
// above (`publisher`, each `provider`) resolve to nothing unless the
// Organization is in the same document: a validator reads a publisher with no
// name, and the edge from "hausfold MCP server" back to the org — the whole
// point of the block — is never drawn where it is being read.
export const developersGraph = [organizationJsonLd, developersJsonLd];
