# Vite Vanilla Template

A multi-page vanilla JS starter with Vite and SCSS. No framework.

The build output stays readable and stable between builds, so the deployed HTML/CSS can be edited by hand on the server and compared back against the source.

---

## Tech Stack

| | Library |
|---|---|
| **Build** | Vite 8 |
| **Styling** | Sass |
| **Page transitions** | Barba.js + GSAP |
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
    ├── app.js            # JS entry, Barba setup
    ├── modules/          # JS modules (customLenis, nav, ...)
    ├── pages/            # page code, src/pages/<namespace>.js
    ├── transitions/      # one file per page transition (stack, curve, ...)
    ├── partials/         # Shared HTML for <include> (head, header, footer, ...)
    │   ├── transition.html   # includes the markup of the transition in use
    │   └── transitions/      # markup of each transition
    ├── assets/images/
    └── styles/
        ├── style.scss    # SCSS entry
        └── imports/
            ├── core/     # variables, reset, layouts, header, footer, ...
            ├── pages/    # page-specific styles
            └── transitions/  # styles of each transition
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

## Page Transitions

Barba swaps the `<main data-barba="container">` of each page without a full reload. Header, scrollbar and anything else outside the container stay on screen and are initialised once.

| Name | Effect |
|---|---|
| `stack` | The next page slides up from the bottom and stacks over the current one, which shrinks, lifts and dims over a dark background. |
| `curve` | A dark panel with curved edges sweeps up through the screen. It covers the current page, then exits at the top while the next page rises in. |
| `parallax` | The current page drifts up slowly and darkens while the next page slides up over it. |
| `fade` | Fades through the page background: an overlay fades in, the page is swapped under it, then it fades out while the next page rises in. Add `data-fade-reveal` to elements of a page to make them rise in one by one. The color is `--fade-cl`. |

Only the transition imported in `app.js` is bundled. The other files can stay in the repo at no cost.

### Switching the transition

A transition has three parts. Change all three, here from `curve` to `stack`:

**1. JS:** `src/app.js`, the import and the name in `barba.init`

```js
import stack from '@/transitions/stack'
```

```js
barba.init({ preventRunning: true, transitions: [stack] })
```

**2. Markup:** `src/partials/transition.html`

```html
<include src="transitions/stack.html" />
```

**3. Styles:** `src/styles/style.scss`

```scss
// transitions
@use 'imports/transitions/stack';
```

No page needs editing: every page includes `transition.html`.

If one part is missing, the transition still runs but looks broken. Without the markup there is no overlay or panel. Without the styles there is no background behind the leaving page. Remove the old `@use` as well. `stack` styles change the `body` background, so they must not stay loaded under another transition.

### Adding a transition

1. Create `src/transitions/<name>.js`. Export a Barba transition object (`name`, `leave`, `enter`, and other hooks as needed). The `primary-ease` and `primary-ease-out` eases are created in `app.js`.
2. If it needs extra elements (overlay, panel), put them in `src/partials/transitions/<name>.html`.
3. If it needs styles, add `src/styles/imports/transitions/_<name>.scss`.
4. Switch to it as described above.

Rules that keep the rest of the site working:

- **Remove the old container yourself.** Barba keeps it until after `afterEnter`, so remove it in `enter` or `afterEnter` (`current.container.remove()`).
- **Clean up in `afterEnter`.** Clear any inline styles set on the next container (`position: fixed`, transforms), then scroll to the top with `window.scrollTo({ top: 0, behavior: 'instant' })`. The transition's `afterEnter` runs before the global `after` hook, where `app.js` re-inits Lenis, lazyload, ScrollTrigger and the page code. Those need the final layout.
- **Do not start or stop Lenis.** `app.js` stops scroll in `beforeLeave` and starts it again in `after`.
- **Use `sync: true`** when both pages must be visible at the same time, as in `stack` and `curve`.

### Page code

Code for one page goes in `src/pages/<namespace>.js`, where `<namespace>` is the `data-barba-namespace` of its container. It is loaded as its own chunk the first time the page is visited.

```js
export default {
  init(container) {},  // the page is on screen, layout is final
  destroy() {}         // the page has been left: remove what init created
}
```

- Query inside `container`, not `document`. During a transition both pages are in the DOM.
- ScrollTriggers whose trigger is inside the container are killed automatically. Anything else that `init` creates (tweens, listeners, observers, timers) must be removed in `destroy`. A `gsap.context` scoped to the container does this for GSAP, see `src/pages/home.js`.
- Inline `<script>` tags inside the container do not run after a transition.
- Elements outside the container keep the markup of the first page loaded. Add `data-barba-sync` to copy their `class` from each new page, as `header.html` does for `is-home`.

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

