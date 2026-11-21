# Portfolio

Source of my portfolio site, served by GitHub Pages at <https://juzulimp.github.io>.

It is a static, prerendered React site: every page is rendered to HTML at
build time, then hydrated in the browser. The Home page has a three.js
particle scene that morphs as you scroll, and the site has a synthesised
ambient score and interface sounds (no audio files).

- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Branches and versions](#branches-and-versions)
- [Day-to-day workflow](#day-to-day-workflow)
- [Releasing a new version](#releasing-a-new-version)
- [Comparing versions](#comparing-versions)
- [Going back to an older design](#going-back-to-an-older-design)
- [Deployment](#deployment)
- [Tuning the sound](#tuning-the-sound)

## Getting started

Needs Node 20 (see `.nvmrc`; CI uses the same).

```bash
npm ci              # install exactly what package-lock.json lists
npm run dev         # dev server at http://localhost:5173
npm test            # unit and component tests (Vitest)
npm run typecheck   # TypeScript, no emit
npm run build       # prerendered site in dist/ (plus dist/404.html)
npx vite preview    # serve dist/ at http://localhost:4173
```

## Project layout

```
app/
  AppRoot.tsx        routes -> pages
  pages/             Home, Work, Project, About, 404
  components/
    home/            hero, chapters, loader; particles/ is the three.js scene
    layout/          header, footer, page shell, sound provider
    work/ project/   work list with cursor preview, case-study pages
    about/           headline, experience timeline, toolkit
    ui/              small shared pieces (links, pills, labels, tags)
  content/           all copy and data, typed (types.ts)
  lib/               routes, sound engine, ambient score, sand sound, helpers
src/                 browser entry (main.tsx) and the prerender entry
styles/              Tailwind v4, theme tokens, global and Home styles
public/              images, icons, manifest, sitemap, robots.txt
scripts/             postbuild step (moves the 404 page into place)
tests/               mirrors app/ (Vitest + Testing Library, jsdom where needed)
```

## Branches and versions

Each major design of the site is kept as its own branch, so any version can
be viewed, compared or put back live at any time.

| Branch | What it is | Rules |
| --- | --- | --- |
| `main` | Whatever is live. Every push deploys. | Changes arrive only through pull requests. |
| `release/v1` | The first design, exactly as it was live. Tag `v1.0.0`. | Frozen. Never delete, never commit to it. |
| `release/v2` | The current design (particles, sound). Cut from `main` when v2 is merged. Tag `v2.0.0`. | Only moved forward when a v2.x release is cut. |
| `feat/…`, `fix/…`, `docs/…` | Work in progress. | Branch from `main`, merge back by pull request, then delete. |
| `gh-pages` | Built output of v1, from before deploys moved to GitHub Actions. | Archive only. No longer deployed once Pages uses Actions. |
| `main-copy` | An earlier Next.js experiment, never merged. To be renamed `archive/nextjs-experiment`. | Archive only. |

```
release/v1 ● (v1.0.0, frozen)
           │
main ──────●──────────────────────────────────────────────●── live
            \                                            /   merge commit
feat/redesign ● cleanup ● tooling ● content ● sound ● ... ● switch ● docs
                                                          │
                                            release/v2 ●  (v2.0.0)
```

Versions follow `MAJOR.MINOR.PATCH`:

- **Major** (`v3.0.0`): a new design. It gets its own `release/vN` branch, and
  the previous release branch is frozen.
- **Minor** (`v2.1.0`): a new page, section or feature in the current design.
- **Patch** (`v2.0.1`): fixes and copy changes.

Tags are the exact, unchangeable snapshots; `release/vN` branches point at
the latest release of each design.

### Reading the history

Merge pull requests with a **merge commit**, not squash, so each change keeps
its own commits. Commit messages use [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `chore:`, `build:`, `test:`, `docs:`, `refactor:`, `style:`).

The v2 redesign is one pull request whose commits go area by area, in an
order where each builds on the last:

1. `chore`: stop tracking `node_modules` and build output
2. `build`: Vite, TypeScript and Vitest tooling
3. `feat(content)`: typed content model, copy and images
4. `feat(sound)`: sound engine, ambient score, sand sound and its placement
5. `feat(ui)`: theme, styles and shared UI pieces
6. `feat(layout)`: header, footer, page shell and routes
7. `feat(particles)`: the particle scene
8. `feat(home)`: the Home page
9. `feat(work)`: work list and case-study pages, with screenshots
10. `feat(about)`: the About page
11. `feat(seo)`: icons, manifest, social image and sitemap
12. `feat`: switch the site to the new design and remove the old one
13. `docs`: this README

Each of these commits typechecks and passes its own tests. The site itself
builds from commit 12 on, because until then the old design is still the
entry point.

## Day-to-day workflow

```bash
git switch main && git pull
git switch -c feat/short-description
# ...work, commit in small steps...
npm test && npm run typecheck && npm run build
git push -u origin feat/short-description
# open a pull request into main; merge with a merge commit once green
```

## Releasing a new version

A minor or patch release of the current design (v2 here):

```bash
git switch main && git pull
git tag -a v2.1.0 -m "v2.1.0: short summary"
git push origin v2.1.0
git switch release/v2 && git merge --ff-only main && git push
```

A new major design (v3):

1. Build it on `feat/redesign-v3` and merge it into `main` by pull request.
2. Tag `v3.0.0` on `main` and create `release/v3` from it:

   ```bash
   git switch main && git pull
   git tag -a v3.0.0 -m "v3.0.0: new design"
   git branch release/v3 v3.0.0
   git push origin v3.0.0 release/v3
   ```

3. Leave `release/v2` where it is: it is now frozen like `release/v1`.

## Comparing versions

- On GitHub: `https://github.com/JuzuliMP/JuzuliMP.github.io/compare/release/v1...release/v2`
  (or any two tags, such as `v1.0.0...v2.0.0`).
- Locally:

  ```bash
  git fetch --all --tags
  git diff --stat release/v1 release/v2     # which files changed
  git diff release/v1 release/v2 -- app/    # the changes in one folder
  git log --oneline release/v1..release/v2  # the commits in between
  ```

- To run an older version, check it out in its own folder so your working
  copy stays as it is:

  ```bash
  git worktree add ../portfolio-v1 release/v1
  cd ../portfolio-v1 && npm ci && npm run dev
  # when done: cd back, then
  git worktree remove ../portfolio-v1
  ```

## Going back to an older design

**For a while (no history change):** in GitHub, open Actions, choose
"Deploy to GitHub Pages", then "Run workflow", and pick `release/v1` as the
branch. That deploys the old design without touching `main`. The next push to
`main` deploys the current design again. One-time setup: in Settings,
Environments, `github-pages`, allow deployments from `release/*` branches as
well as `main`.

**For good:** revert the merge that brought in the newer design, on a branch,
through a pull request:

```bash
git switch main && git pull
git switch -c revert/v2
git revert -m 1 <merge-commit-of-v2>
git push -u origin revert/v2   # then open and merge the pull request
```

History is kept, and the newer design is still on its `release/vN` branch to
bring back later.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main` (and on demand):
`npm ci`, `npm run build`, then publishes `dist/` to GitHub Pages. For this to
be what the site serves, Settings, Pages, Source must be **GitHub Actions**
(not "Deploy from a branch").

## Tuning the sound

Each loudness or strength is one constant:

| What | Where |
| --- | --- |
| Overall level | `MASTER_GAIN` in `app/lib/sound.ts` |
| Background score | `SCORE_GAIN` in `app/lib/ambient.ts` |
| Particle "drifting sand" sound | `SAND_VOLUME` in `app/lib/sand.ts` |
| How far the sand moves left / right | `PAN_RANGE` in `app/lib/sandSpace.ts` |
| Brighter-when-higher effect | `HEIGHT_DB` in `app/lib/sandSpace.ts` |
| Room around the sand | `REVERB_NEAR`, `REVERB_FAR` in `app/lib/sandSpace.ts` |
| How the motion maps to sound | `app/components/home/particles/motionLevel.ts` and `motionSpace.ts` |
