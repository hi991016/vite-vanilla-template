import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { revealTitle } from '@/modules/revealTitle'

// -- parallax: the current page drifts up slowly and darkens, while the next page
// -- slides up from the bottom over it at full speed. the lines of its h1 then slide up
// -- out of a mask, one by one
// -- needs: <include src="transitions/parallax.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/parallax' in style.scss

gsap.registerPlugin(CustomEase)
CustomEase.create('parallax-ease', '0.7, 0.05, 0.13, 1')

const DURATION = 1.2

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export default {
  name: 'parallax',
  // -- both pages are in the DOM at once: the next one slides over the current one
  sync: true,

  beforeEnter({ next }) {
    // -- pin the next page above the dark overlay so it can slide in over the current one
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 })
  },

  leave({ current }) {
    if (reducedMotion.matches) {
      gsap.set(current.container, { autoAlpha: 0 })
      return Promise.resolve()
    }

    return gsap
      .timeline({ defaults: { duration: DURATION, ease: 'parallax-ease' } })
      .fromTo('[data-parallax-dark]', { autoAlpha: 0 }, { autoAlpha: 0.8 }, 0)
      .fromTo(current.container, { y: '0vh' }, { y: '-25vh' }, 0)
      .then()
  },

  enter({ next }) {
    if (reducedMotion.matches) return Promise.resolve()

    const tl = gsap
      .timeline()
      .fromTo(
        next.container,
        { y: '100vh' },
        { y: '0vh', duration: DURATION, ease: 'parallax-ease' }
      )

    return revealTitle(tl, next.container, DURATION * 0.6).then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,zIndex,transform' })
    gsap.set('[data-parallax-dark]', { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
