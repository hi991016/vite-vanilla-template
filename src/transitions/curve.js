import gsap from 'gsap'
import { revealTitle } from '@/modules/revealTitle'

// -- curve: a dark panel with curved edges sweeps up through the viewport. it rises over
// -- the current page (curved top edge swells), then it keeps rising off the top (curved bottom edge flattens) while the next page comes up behind it
// -- the lines of the next page's h1 then slide up out of a mask, one by one
// -- needs: <include src="transitions/curve.html" /> in src/partials/transition.html
// --        @use 'imports/transitions/curve' in style.scss
// --        ease primary-ease, created in app.js

const DURATION = 1
// -- the next page starts entering just before the panel fully covers the screen
const ENTER_AT = 0.95

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const parts = () => {
  const wrap = document.querySelector('[data-curve]')
  if (!wrap) return null

  return {
    panel: wrap.querySelector('[data-curve-panel]'),
    top: wrap.querySelector('[data-curve-panel-top]'),
    bottom: wrap.querySelector('[data-curve-panel-bottom]')
  }
}

export default {
  name: 'curve',
  // -- both pages are in the DOM at once: the next one waits hidden under the panel
  sync: true,

  beforeEnter({ next }) {
    // -- pin the next page so it can rise in while the current one is still in the flow
    gsap.set(next.container, { position: 'fixed', top: 0, left: 0, right: 0, autoAlpha: 0 })
  },

  leave({ current }) {
    const p = parts()
    if (!p || reducedMotion.matches) {
      gsap.set(current.container, { autoAlpha: 0 })
      return Promise.resolve()
    }

    return gsap
      .timeline({
        defaults: { duration: DURATION, ease: 'primary-ease' },
        // -- current page is covered: drop it so the document height follows the next page
        onComplete: () => current.container.remove()
      })
      .set(p.panel, { autoAlpha: 1, yPercent: 0 }, 0)
      .set(p.top, { scaleY: 0, height: '15vw' }, 0)
      .set(p.bottom, { scaleY: 1, height: '20vw' }, 0)
      .to(p.panel, { yPercent: -100 }, 0)
      .to(p.top, { scaleY: 1 }, 0)
      .to(current.container, { y: '-15dvh' }, 0)
      .then()
  },

  enter({ next }) {
    const p = parts()
    if (!p || reducedMotion.matches) {
      gsap.set(next.container, { autoAlpha: 1 })
      return Promise.resolve()
    }

    const tl = gsap
      .timeline({ defaults: { duration: DURATION, ease: 'primary-ease' } })
      .set(next.container, { autoAlpha: 1 }, ENTER_AT)
      .fromTo(
        p.panel,
        { yPercent: -100 },
        { yPercent: -200, overwrite: 'auto', immediateRender: false },
        ENTER_AT
      )
      .to(p.bottom, { scaleY: 0 }, ENTER_AT)
      .from(next.container, { y: '25dvh', immediateRender: false }, ENTER_AT)

    return revealTitle(tl, next.container, ENTER_AT + DURATION * 0.4).then()
  },

  // -- runs before the global `after` hook, so app.js inits the page with its final layout
  afterEnter({ current, next }) {
    current.container.remove()
    gsap.set(next.container, { clearProps: 'position,top,left,right,transform,opacity,visibility' })

    const p = parts()
    if (p) gsap.set(p.panel, { autoAlpha: 0 })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}
