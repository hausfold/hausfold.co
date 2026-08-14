# why this repo starts at one commit

The site's first two months aren't in `git log` here. They're in
**`hausfold/website`**, which is private, stays private, and is not going to be
opened.

The site needed to be public — a docs site wants edit links and contributions —
and the obvious move was to scrub `hausfold/website` and flip it. **That does
not work, and the reason is the useful part.**

Two things in that history had to go: the name register, and a cached Cloudflare
account id predating the split. `git filter-repo` removes both from the branch —
and removes neither from GitHub. That repo had pull requests, **GitHub keeps
`refs/pull/N/head` forever, and a history rewrite does not garbage-collect
them.** Measured on 2026-08-08: every PR ref then in existence still reached both
artifacts after the rewrite. They stay fetchable — on a repo that has just been
made public.

So: **rewriting history on a repo that has ever had a pull request is hygiene,
not removal.** A new repo has no PR refs, no blob, no old revisions, and needs
no support ticket to make that true. The cost was 33 commits of a placeholder
page and its first real week.

*(The specifics stay in the old repo's own README, where the repo is private.
Publishing the exact paths and commits would be handing over the fetch recipe.)*

## two rules fall out, and neither gets a second chance

- **Nothing private is ever committed here.** Not a register, not an account id,
  not a token "just to test CI". This repo is public from its first commit, it
  has no pre-public history to hide a mistake in, and — see above — deleting a
  commit does not delete it. The register lives in
  [`hausfold/ops`](https://github.com/hausfold/ops), private, and stays there.
- **`hausfold/website` is never made public.** Archive it, don't delete it — it's
  the only copy of the site's first two months. Deleting it wouldn't break the
  domain (the `custom_domain` binding lives in Cloudflare, tied to the Worker
  name, and both wrangler configs came over here); it would just lose the
  history.

## before that

The site lived inside
[hausfold/workshop](https://github.com/hausfold/workshop) until 2026-08-06, when
it was split into `hausfold/website`, then moved here on 2026-08-08 — the same
week hausfold stopped being a commercial umbrella and became the platform every
desktop is built on. It's in the `hausfold` org not because it isn't part of the
family, which was the old reasoning, but because that org is where the family
lives.
