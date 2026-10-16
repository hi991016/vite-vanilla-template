import gsap from 'gsap'

// -- fade: fades through the page background. a solid overlay fades in over the current
// -- page, the page is swapped underneath, then the overlay fades out while the next page
// -- rises in. elements with [data-fade-reveal] in the next page rise in one by one
// -- needs: <include src="transitions/fade.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/fade' in style.scss

const FADE = 0.4
const RISE = 1

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

export default {
  name: 'fade',
  // -- one page at a time: the swap happens while the overlay hides everything
  sync: false,

  leave({ current }) {
    if (reducedMotion.matches) return Promise.resolve()

    return gsap
      .timeline({ defaults: { duration: FADE, ease: 'power1.inOut' } })
      .fromTo('[data-fade]', { autoAlpha: 0 }, { autoAlpha: 1 }, 0)
      .to(current.container, { y: '-2rem', ease: 'power2.in' }, 0)
      .then()
  },

  enter({ current, next }) {
    // -- barba keeps the old container until after enter, it would push the new one down
    current.container.remove()
    window.scrollTo({ top: 0, behavior: 'instant' })

    if (reducedMotion.matches) return Promise.resolve()

    const reveals = next.container.querySelectorAll('[data-fade-reveal]')

    const tl = gsap
      .timeline({ defaults: { duration: RISE, ease: 'expo.out' } })
      .to('[data-fade]', { autoAlpha: 0, duration: FADE, ease: 'power1.inOut' }, 0.05)
      .from(next.container, { y: '3rem', clearProps: 'transform' }, 0.05)

    if (reveals.length) {
      tl.from(
        reveals,
        { y: '2rem', autoAlpha: 0, stagger: 0.05, clearProps: 'transform,opacity,visibility' },
        0.1
      )
    }

    return tl.then()
  },

  afterEnter() {
    gsap.set('[data-fade]', { autoAlpha: 0 })
  }
}
