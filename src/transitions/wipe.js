import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { revealTitle } from '@/modules/revealTitle'

// -- wipe: the next page is wiped in from the bottom over the current one, which stays in
// -- place and darkens. the page itself does not move, only its clip edge sweeps up, while
// -- [data-wipe-zoom] elements in it (a hero image) zoom out from 2x to their size. the
// -- lines of its h1 then slide up out of a mask, one by one
// -- needs: <include src="transitions/wipe.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/wipe' in style.scss

gsap.registerPlugin(CustomEase)
CustomEase.create('wipe-ease', '0.72, 0, 0.01, 1')

const DURATION = 1.44
const ZOOM = 2

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export default {
  name: 'wipe',
  // -- both pages are in the DOM at once: the next one is wiped in over the current one
  sync: true,

  beforeEnter({ next }) {
    // -- pin the next page on top of the viewport, over the scrolled current page
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 })
  },

  leave() {
    if (reducedMotion.matches) return Promise.resolve()

    return gsap
      .fromTo(
        '[data-wipe-dark]',
        { autoAlpha: 0 },
        { autoAlpha: 0.8, duration: DURATION, ease: 'wipe-ease' }
      )
      .then()
  },

  enter({ next }) {
    if (reducedMotion.matches) return Promise.resolve()

    const tl = gsap
      .timeline({ defaults: { duration: DURATION, ease: 'wipe-ease' } })
      .fromTo(
        next.container,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)' },
        0
      )
      .fromTo(
        next.container.querySelectorAll('[data-wipe-zoom]'),
        { scale: ZOOM },
        { scale: 1, clearProps: 'transform' },
        0
      )

    // -- the title comes in once the page has been wiped in fully
    return revealTitle(tl, next.container, DURATION).then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,zIndex,clipPath' })
    gsap.set('[data-wipe-dark]', { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
