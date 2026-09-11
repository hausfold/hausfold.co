# why this repo starts at one commit

The site's first two months are in **`hausfold/website`**, which is private,
stays private, and is not going to be opened. Two things in that history had to
go: the name register, and a cached Cloudflare account id. `git filter-repo`
removes both from the branch — and removes neither from GitHub.

That repo had pull requests, **GitHub keeps `refs/pull/N/head` forever, and a
history rewrite does not garbage-collect them.** Measured on 2026-08-08: every PR
ref then in existence still reached both artifacts after the rewrite, and they
stay fetchable on a repo that has just been made public. So **rewriting history
on a repo that has ever had a pull request is hygiene, not removal.** A new repo
has no PR refs, no blob and no old revisions, and needs no support ticket to make
that true. The cost was 33 commits of a placeholder page.

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
