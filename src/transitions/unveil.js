import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

// -- unveil: the next page is unveiled from the bottom of the screen, its top edge sweeping
// -- up while it rises, as the current page shrinks, sinks and dims over the dark body
// -- needs: <include src="transitions/unveil.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/unveil' in style.scss

gsap.registerPlugin(CustomEase)
CustomEase.create('unveil-ease', '0.75, 0, 0.1, 1')

const DURATION = 1.1

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export default {
  name: 'unveil',
  // -- both pages are in the DOM at once: the next one is unveiled over the current one
  sync: true,

  beforeEnter({ next }) {
    // -- pin the next page on top of the viewport, over the scrolled current page
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3 })
  },

  leave({ current }) {
    if (reducedMotion.matches) {
      gsap.set(current.container, { autoAlpha: 0 })
      return Promise.resolve()
    }

    // -- scale from the top of the viewport, not the top of a scrolled page
    gsap.set(current.container, { transformOrigin: `50% ${window.scrollY}px` })

    return gsap
      .to(current.container, {
        scale: 0.9,
        y: '5vw',
        opacity: 0.5,
        duration: DURATION,
        ease: 'unveil-ease'
      })
      .then()
  },

  enter({ next }) {
    if (reducedMotion.matches) return Promise.resolve()

    return gsap
      .fromTo(
        next.container,
        { clipPath: 'inset(85svh 0% 0% 0%)', y: '15svh' },
        { clipPath: 'inset(0svh 0% 0% 0%)', y: '0svh', duration: DURATION, ease: 'unveil-ease' }
      )
      .then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,zIndex,transform,clipPath' })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
