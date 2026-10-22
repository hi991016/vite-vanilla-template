import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { SplitText } from 'gsap/SplitText'

// -- rise: the next page rises from the bottom as a narrow panel that widens to full screen,
// -- while an overlay darkens the current page, which stays in place underneath. lines of
// -- [data-rise-reveal] elements in the next page then slide up out of a mask, one by one
// -- needs: <include src="transitions/rise.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/rise' in style.scss

gsap.registerPlugin(CustomEase, SplitText)
CustomEase.create('rise-ease', '0.7, 0, 0.15, 1')

const DURATION = 1.2
const REVEAL = 1

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

    const reveals = next.container.querySelectorAll('[data-rise-reveal]')
    if (reveals.length) {
      // -- each line gets its own overflow mask, the markup is restored once all are in
      const split = SplitText.create(reveals, { type: 'lines', mask: 'lines' })

      tl.from(
        split.lines,
        {
          yPercent: 100,
          duration: REVEAL,
          ease: 'expo.out',
          stagger: 0.06,
          onComplete: () => split.revert()
        },
        DURATION * 0.7
      )
    }

    return tl.then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,zIndex,transform,clipPath' })
    gsap.set('[data-rise-overlay]', { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
