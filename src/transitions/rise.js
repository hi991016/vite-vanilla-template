import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { revealTitle } from '@/modules/revealTitle'

// -- rise: the next page rises from the bottom as a narrow panel that widens to full screen,
// -- while an overlay darkens the current page, which stays in place underneath. the lines
// -- of its h1 then slide up out of a mask, one by one
// -- needs: <include src="transitions/rise.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/rise' in style.scss

gsap.registerPlugin(CustomEase)
CustomEase.create('rise-ease', '0.7, 0, 0.15, 1')

const DURATION = 1.2

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export default {
  name: 'rise',
  // -- both pages are in the DOM at once: the next one rises over the current one
  sync: true,

  beforeEnter({ next }) {
    // -- pin the next page on top of the viewport, over the scrolled current page
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 })
  },

  leave() {
    if (reducedMotion.matches) return Promise.resolve()

    return gsap
      .fromTo(
        '[data-rise-overlay]',
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: DURATION, ease: 'power2.inOut' }
      )
      .then()
  },

  enter({ next }) {
    if (reducedMotion.matches) return Promise.resolve()

    const tl = gsap
      .timeline()
      .fromTo(
        next.container,
        { y: '100svh', clipPath: 'inset(0% 6% 0% 6%)' },
        { y: '0svh', clipPath: 'inset(0% 0% 0% 0%)', duration: DURATION, ease: 'rise-ease' }
      )

    return revealTitle(tl, next.container, DURATION * 0.7).then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,zIndex,transform,clipPath' })
    gsap.set('[data-rise-overlay]', { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
