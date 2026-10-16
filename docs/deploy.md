# Deployment

The site is static (`build/`) and lives at **https://jocelynrenault.com**, on the OVH free hosting that came with the domain (Apache, 100 MB, SFTP).

## How the site goes online

1. Open a PR into `master`. The **CI** workflow runs the job `checks`: lint, type check, tests, build, size budget, accessibility audit and Lighthouse (performance is shown, not required, in CI). The **Preview** workflow also deploys the PR to its own address (see [PR previews](#pr-previews)).
2. Merge it (only possible when `checks` is green).
3. CI runs again on `master`. When it passes, the **Deploy** workflow builds the same commit, checks the budget, uploads what changed over SFTP (`npm run deploy`), then checks the live site (`npm run smoke`).
4. A red Deploy run means GitHub emails you. The site keeps the previous version for anything not uploaded yet.

**Rollback:** on GitHub, open the merged PR → *Revert* → merge the revert PR. Its merge deploys the previous state.

**By hand:** GitHub → *Actions* → *Deploy* → *Run workflow* (from `master` only; it runs lint, check and tests first). Or from your machine, see [Manual deploy](#manual-deploy).

## One-time OVH setup

In the OVH control panel, *Web Cloud*:

1. **Hébergements → jocelynrenault.com → Multisite:** both `jocelynrenault.com` and `www.jocelynrenault.com` point to the folder `www`, with **SSL** ticked. Add `www` if it is missing.
2. **Hébergements → Informations générales → Certificat SSL:** enable the free Let's Encrypt certificate (it covers the multisite domains with SSL ticked). Wait until it says active (can take a few hours).
3. **Domaines → jocelynrenault.com → Zone DNS:** the `A` (and `AAAA`) records of `jocelynrenault.com` and `www` point to the hosting IP shown in *Hébergements → Informations générales*. OVH sets them when the hosting comes with the domain: just check.
4. **Hébergements → FTP - SSH:** note the FTP server (`ftp.clusterNNN.hosting.ovh.net`) and the login; set a password.
5. Note here anything the free hosting turns out not to offer (an Apache module), found while setting it up.

Found during setup (2026-10-15): the Multisite tab has no SSL column any more; both names already had a Let's Encrypt certificate. The hosting is on `cluster129`: FTP server `ftp.cluster129.hosting.ovh.net`. **FTPS is refused** ("500 This security scheme is not implemented") but **SFTP works** with the same login, so the deploy uses SFTP (port 22). OVH's placeholder `index.html` is a symbolic link to a file outside the account: the deploy removes such a link before uploading a real file in its place. Uploaded files are set to `644` (the server's default is `666`).

## GitHub secrets

In the repo directory (each command asks for the value; it is never shown or stored in the repo):

```bash
gh secret set FTP_HOST      # ftp.cluster129.hosting.ovh.net
gh secret set FTP_USER
gh secret set FTP_PASSWORD
```

The names say FTP because they are the hosting's FTP login, but the deploy connects over **SFTP** (SSH, encrypted). It only sends the password to a server whose host key is one of `OVH_HOST_KEYS` in `scripts/deploy-plan.ts`.

**If the deploy stops with "Host denied (verification failed)":** OVH changed its server keys, or something is between you and OVH. Run `ssh-keyscan ftp.cluster129.hosting.ovh.net | ssh-keygen -lf -`, compare with what the OVH panel or support shows, and only then replace the fingerprints in `OVH_HOST_KEYS`.

## PR previews

Every PR into `master` also gets a **preview** on Cloudflare Pages (workflow **Preview**, `.github/workflows/preview.yml`). It is not production: OVH still only gets what is merged.

- Address: `https://pr-<n>.jocelynrenault-previews.pages.dev` (one per PR, updated on every push). The bot's comment on the PR links `/en/`, `/fr/` and the review page.
- `/_review/` in each preview: the screens (EN/FR × dark/light × 360–1440px, phone sections open, before JavaScript) that differ from where the PR branched from `master`, as before, after and diff. Readable on a phone.
- Not tested by a preview: `.htaccess` (so `/` does not redirect to a language) and OVH's caching and headers. The smoke test after a merge checks those on the live site.
- Every page is served with `X-Robots-Tag: noindex`.
- Not a required check: a failed preview never blocks a merge. Re-run it from the PR's *Checks* tab.
- Without the secrets below the workflow does nothing and says so in its log. A PR from a fork gets no secrets either: its run just shows the jobs as skipped.
- The Cloudflare token is given only to the deploy step, never to the steps that run the PR's code (install, build, captures).
- `wrangler` (Cloudflare's CLI) is not a dependency: the workflow runs an exact version with `npx`, so `npm ci` stays small.

### One-time setup

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. *Workers & Pages* → *Create* → *Pages* → *Use direct upload* (not "Connect to Git"). Project name `jocelynrenault-previews`, then *Create project*. Skip the upload it then offers. In the project's *Settings*, the production branch should be `master` (nothing is ever deployed to it, so the production address stays empty).
   If the dashboard insists on an upload first, create the project from the command line instead: `npx --yes wrangler@4.146.0 login`, then `npx --yes wrangler@4.146.0 pages project create jocelynrenault-previews --production-branch=master`.
3. If the project's address is not `jocelynrenault-previews.pages.dev` (the name may be taken), set it: `gh variable set CLOUDFLARE_PAGES_DOMAIN` and enter the address without `https://`.
4. *My Profile* → *API Tokens* → *Create Token* → *Create Custom Token*. Permissions: *Account* · *Cloudflare Pages* · *Edit*. Account resources: *Include* your account. Create it and copy the token (shown once).
5. Your account ID: on the *Workers & Pages* overview page, right column (*Account ID*).
6. In the repo directory:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN    # the token from step 4
   gh secret set CLOUDFLARE_ACCOUNT_ID   # the ID from step 5
   ```

7. Open any PR (or push to one): the **Preview** run should end with a comment on the PR.

To revoke: delete the token in Cloudflare, then `gh secret delete CLOUDFLARE_API_TOKEN`.

## Manual deploy

Create `.env.deploy` at the repo root (git-ignored, never commit it):

```
FTP_HOST=ftp.cluster129.hosting.ovh.net
FTP_USER=…
FTP_PASSWORD=…
```

Then:

```bash
npm run build
npm run deploy -- --dry-run   # prints what would be uploaded and deleted; changes nothing
npm run deploy
npm run smoke                 # checks the live site
```

The deploy refuses to start while `static/` holds files git ignores (a Windows `*:Zone.Identifier` download marker, a `.DS_Store`): the build copies all of `static/`, so they would be uploaded. Delete them, rebuild, deploy again.

What the deploy does: it compares `build/` with the manifest it left on the server last time (`.deploy-manifest.json`, hidden from visitors) and with the file sizes on the server, removes that manifest, uploads only new and changed files (assets first, then `.htaccess`, then the pages), then writes the new manifest and deletes files that are no longer in `build/`. The previous build's hashed files (`_app/immutable/`) stay for one more deploy, so a visitor with a page open during a deploy can still load its chunks; the deploy after deletes them. A deploy cut off halfway leaves no manifest, so the next one sends everything again. It never deletes `.ovhconfig` (OVH's own config). Optional settings: `FTP_DIR` (default `www`), `FTP_PORT` (default 22), `SFTP_HOST_KEY` (comma-separated fingerprints that replace the pinned ones, for a test server).

## Size budget

The hosting has 100 MB. `npm run budget` fails over **80 MB** and lists the largest files; CI and the deploy both run it. Today the build is about 32 MB, almost all project videos. Near the limit: re-encode the biggest videos (commands in [content-guide.md](content-guide.md#preparing-files-with-ffmpeg)), then consider hosting media elsewhere.

## Branch protection

`master` accepts changes only through a PR whose `checks` job passed; no force-push, no deletion, and it applies to admins too. To re-apply it (it is a repository setting, not a file):

```bash
gh api -X PUT repos/LezardSC/portfolio/branches/master/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["checks"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

## Server config

`static/.htaccess` (copied into `build/`) sets: `http` and `www` → `https://jocelynrenault.com` (301); `/` → `/fr/` or `/en/` from the browser language (302); the 404 page; caching (one year for `_app/immutable/`, revalidate HTML, one week for the rest); compression; security headers. HSTS is not set yet ([#34](https://github.com/LezardSC/portfolio/issues/34)).
