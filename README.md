# Portfolio

Personal portfolio - SvelteKit (Svelte 5), fully static, EN/FR. Live at https://jocelynrenault.com.

- `npm run dev` - dev server
- `npm test` - unit tests
- `npm run check` - type check
- `npm run build` - static site in `build/`
- `npm run screens` - screenshot baseline; `npm run screens -- --compare` after a change
- `npm run audit` - accessibility and Lighthouse checks
- `npm run budget` - build size budget (80 MB)
- `npm run deploy` - FTP deploy (normally done by CI on merge to `master`)
- `npm run smoke` - checks the live site

Publishing, OVH and GitHub setup: [docs/deploy.md](docs/deploy.md).

Editing content (projects, media, skills, experience, About): see [docs/content-guide.md](docs/content-guide.md).

Design: `docs/superpowers/specs/2026-09-23-portfolio-design.md`

Known issues not fixed yet: [docs/backlog.md](docs/backlog.md).
