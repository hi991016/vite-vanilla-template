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

### Vite (`vite.config.ts`)

```ts
export default defineConfig({
  plugins: [
    cssVersionPlugin()  // Appends ?v={timestamp} to all CSS links in HTML after build
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    rollupOptions: {
      input: pages,   // All auto-discovered HTML entry points
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'  // Split vendor chunk
        },
        assetFileNames: (assetInfo) => {
          // CSS files output without hash → assets/main.css (cache-busted via ?v= query)
          if (assetInfo.name?.endsWith('.css')) return 'assets/[name].css'
          // Other assets keep hash in filename
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
```

> **Why no hash on CSS?** The `cssVersionPlugin` appends `?v={timestamp}` to every `<link>` tag at build time, so cache-busting is handled via query string instead of filename hash. This keeps the CSS filename stable (`main.css`) while still preventing browser caching issues.
