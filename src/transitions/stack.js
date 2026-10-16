import gsap from 'gsap'

// -- stack: the next page slides up from the bottom and stacks over the current one,
// -- which shrinks, lifts and dims over the dark body behind it
// -- needs: <include src="transitions/stack.html" /> on every page (overlay)
// --        @use 'imports/transitions/stack' in style.scss
// --        eases primary-ease / primary-ease-out, created in app.js

const DURATION = 1.25

export default {
  name: 'stack',
  // -- both pages are in the DOM at once: the old one animates out under the new one
  sync: true,

  leave({ current }) {
    // -- scale from the top of the viewport, not the top of a scrolled page
    gsap.set(current.container, { transformOrigin: `50% ${window.scrollY}px` })

    return gsap
      .timeline({ defaults: { duration: DURATION, ease: 'primary-ease' } })
      .to(current.container, { opacity: 0.1, y: '-20svh', scale: 0.94 })
      .to('[data-stack-overlay]', { autoAlpha: 0.5 }, 0)
      .then()
  },

  enter({ next }) {
    // -- pin the incoming page on top so it can slide over the leaving one
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 3 })

    return gsap
      .from(next.container, { y: '100svh', duration: DURATION, ease: 'primary-ease' })
      .then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,width,zIndex,transform' })
    gsap.set('[data-stack-overlay]', { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
