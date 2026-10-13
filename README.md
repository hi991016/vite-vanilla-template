# Vite Vanilla TypeScript Template

A minimal multi-page vanilla TypeScript starter with Vite and SCSS — no frameworks.

---

## Tech Stack

| | Library | Description |
|---|---|---|
| **Build** | Vite 8 | Dev server & bundler |
| **Language** | TypeScript 5.9 | Type safety |
| **Styling** | Sass 1.98 | SCSS support |

---

## Project Structure

```
├── index.html            # Home page
├── about/
│   └── index.html        # About page (add any folder for new pages)
├── public/
│   └── favicon.ico
└── src/
    ├── main.ts           # Entry point — imports main.scss
    ├── assets/
    └── styles/
        ├── main.scss
        └── imports/
            ├── core/
            │   ├── _variables.scss   # CSS variables
            │   ├── _mixins.scss      # Reusable SCSS mixins
            │   ├── _reset.scss       # CSS reset
            │   ├── _layouts.scss     # Base layout & body setup
            │   ├── _utils.scss       # Utility classes
            │   ├── _libs.scss        # 3rd-party style overrides
            │   ├── _components.scss  # Shared components
            │   ├── _header.scss
            │   ├── _menu.scss
            │   └── _footer.scss
            └── pages/
                └── _home.scss        # Page-specific styles
```

---

## Multi-Page Setup

Vite auto-discovers pages by scanning root-level folders for `index.html`. To add a new page, simply create a folder with an `index.html` inside:

```
contact/
└── index.html   ← auto-detected as a new entry point
```

No changes to `vite.config.ts` needed.

---

## Path Alias

`@` maps to `src/` — configured in both `tsconfig.json` and `vite.config.ts`.

```ts
import '@/styles/main.scss'
```

```scss
@use '@/styles/imports/core/mixins' as *;
```

---

## Available SCSS Mixins

```scss
// Flexbox center
@include mid();

// Absolute center
@include mid(false);

// Cover image (absolute + object-fit: cover)
@include midimg();
@include midimg(800px); // with max-width

// Aspect-ratio image wrapper with dominant color placeholder
@include dominantColor(16, 9, #ccc) {
  border-radius: 8px; // optional extra styles
}

// Full text style shorthand
@include text(1.6rem, sans-serif, 1.5, #333, none);

// Clamp text to N lines
@include overtext(2);

// Custom scrollbar
@include customscroll(6px, #f0f0f0, #999);

// Responsive breakpoints
@include maxW(768px) { ... }    // max-width
@include minW(1200px) { ... }   // min-width
```

---

## Utility Classes

| Class | Description |
|---|---|
| `.pc-only` | Hidden on mobile (≤ 1024px) |
| `.sp-only` | Hidden on desktop, visible on mobile |
| `img.lazy` | Fade-in on lazy load — add `.loaded` class via JS |

---

## Page Transition

The layout includes a built-in fade overlay. Add `body.fadeout` via JS to trigger a white overlay before navigating to another page.

```js
document.body.classList.add('fadeout')
```

---

## Getting Started

```bash
# Install dependencies
yarn install

# Start dev server → http://localhost:5173
yarn dev
```

---

## Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start dev server |
| `yarn build` | Type-check + production build → `dist/` |
| `yarn preview` | Preview production build locally |
| `yarn diff` | Compare `dist/` with the server copy in `_server/` |
| `yarn lint` | Lint `src/` with ESLint |

---

## Configuration

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "erasableSyntaxOnly": true,
    "noUncheckedSideEffectImports": true,

    "noEmit": true,
    "skipLibCheck": true
  }
}
```

### Vite (`vite.config.js`)

The build output is meant to be edited by the client directly on the server, so it stays readable and stable:

- **Fixed file names**: `assets/app.js`, `assets/styles.css`, `assets/images/[name][extname]` (no hash).
- **Content-based cache busting**: `?v=<hash>` is appended to every built CSS/JS link. The hash only changes when the file content changes, so an unchanged file keeps the same URL between builds.
- **CSS is not minified**: section comments from the SCSS partials stay in `styles.css`.
- **Single JS bundle**: no vendor chunk, so the `?v=` on `app.js` covers all JS.

---

## Syncing Client Edits From the Server

1. Download the current site from the server into `_server/` (git-ignored).
2. Run `yarn build`, then `yarn diff` (or `yarn diff --stat` for file names only).
3. Port the client's changes back into `src/` and the HTML sources, rebuild, and run `yarn diff` again until only intended changes remain.

`yarn diff` ignores line endings (CRLF/LF) and `?v=` query strings, so only real edits show up. To compare against another folder, pass it as the first argument: `yarn diff path/to/copy`.
