# Vite Vanilla Template

A multi-page vanilla JS starter with Vite and SCSS. No framework.

The build output stays readable and stable between builds, so the deployed HTML/CSS can be edited by hand on the server and compared back against the source.

---

## Tech Stack

| | Library |
|---|---|
| **Build** | Vite 8 |
| **Styling** | Sass |
| **Scroll** | Lenis + GSAP ScrollTrigger |
| **Lazy load** | vanilla-lazyload |
| **Lint / format** | ESLint 10 (flat config) + Prettier |

---

## Project Structure

```
├── index.html            # Home page
├── about/
│   └── index.html        # About page (any root folder with index.html becomes a page)
├── public/               # Copied to dist/ as-is
├── scripts/
│   └── diff.js           # yarn diff
├── _server/              # Server copy for yarn diff (contents are git-ignored)
└── src/
    ├── app.js            # JS entry
    ├── modules/          # JS modules (customLenis, ...)
    ├── partials/         # Shared HTML for <include> (head, header, footer, ...)
    ├── assets/images/
    └── styles/
        ├── style.scss    # SCSS entry
        └── imports/
            ├── core/     # variables, reset, layouts, header, footer, ...
            └── pages/    # page-specific styles
```

---

## Getting Started

```bash
yarn install
yarn dev        # http://localhost:5173
```

## Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn build` | Production build to `dist/` |
| `yarn preview` | Preview the production build |
| `yarn diff` | Compare `dist/` with the server copy in `_server/` |
| `yarn lint` / `yarn lint:fix` | Lint `src/` |
| `yarn format` | Format everything with Prettier |

---

## Adding a Page

Create a root-level folder with an `index.html`. Vite picks it up automatically, no config change needed.

```
contact/
└── index.html
```

Copy an existing page and keep its `<include>` tags. The shared stylesheet and script come from `head.html` and `scripts.html`.

## HTML Partials

`<include>` pulls a file from `src/partials/` into the page, in dev and in build. The built HTML contains only the expanded markup, so the server copy needs nothing extra.

```html
<include src="head.html" title="About Page" />
<include src="header.html" />
```

Attributes become props. A partial passes its props on to any partial it includes. Inside a partial:

| Syntax | Result |
|---|---|
| `{{ title }}` | Prints the prop. Empty if it is not set. |
| `{{#if key}} ... {{/if}}` | Keeps the block if the prop is set and not empty. |
| `{{#if !key}}` | Keeps the block if the prop is not set or is empty. |
| `{{#if key='value'}}` / `{{#if key!='value'}}` | Compares the prop with a value. |
| `{{else}}` | Block used when the condition fails. |

`page` is always set: `home` for the root `index.html`, otherwise the page folder name (`about`, `contact`, ...).

```html
<header class="c-header{{#if page='home'}} is-home{{/if}}">
```

Write the value in single quotes. Double quotes inside `class="..."` make Prettier rewrite the line when it formats on save.

Blocks can nest. A tag on a line of its own removes that line from the output. Editing a partial reloads the page in dev.

## Path Alias

`@` maps to `src/`:

```js
import { initLenis } from '@/modules/customLenis'
```

```scss
@use '@/styles/imports/core/mixins' as *;
```

---

## Build Output

```
dist/
├── index.html
├── about/index.html
└── assets/
    ├── app.js          # all JS (libraries + app code), minified
    ├── styles.css      # all CSS, not minified, section comments kept
    └── images/
```

- **Fixed file names.** No hash in file names, so the same files can be edited and compared across deploys.
- **Content-based cache busting.** HTML references `app.js?v=<hash>` and `styles.css?v=<hash>`. The hash comes from the file content, so it only changes when the file changes. Rebuilding unchanged source gives identical output.
- **Single JS bundle.** There is no separate vendor chunk, so the `?v=` on `app.js` covers all JS.
- **Absolute paths** (`base: '/'`). The site must be served from the domain root.

---

## Syncing Server Edits Back to the Source

If the deployed HTML/CSS was edited directly on the server, merge those edits back into the source before deploying again.

1. Build the version that is currently deployed: `yarn build`. If `src/` or the HTML sources changed since that deploy, check out the deployed commit first. Otherwise the diff mixes your changes with the server edits.
2. Download the site from the server into `_server/`. It must mirror `dist/`, with `_server/index.html` and `_server/assets/...` at the top level.
3. Run `yarn diff --stat` to list changed files, and `yarn diff` to see each change. Lines marked `-` come from your build and lines marked `+` from the server.
4. Port the server edits into the HTML sources and `src/styles/`.
5. Run `yarn build`, then `yarn diff` again. Only your own new changes should remain.
6. Upload `dist/` to the server.

`yarn diff` ignores line endings (CRLF/LF) and `?v=` query strings. To compare another folder, pass its path: `yarn diff path/to/copy`.

Keep `_server/.gitkeep` when clearing `_server/`, or Git drops the folder.

### Tagging Deploys

Tag each deploy so step 1 is easy:

```bash
git tag deploy-2026-10-13
```

Next time the server copy changes:

```bash
git stash                         # if you have uncommitted work
git checkout deploy-2026-10-13
yarn build && yarn diff
git checkout master
git stash pop
```
