import gsap from 'gsap'

// -- every page module exports init/destroy; app.js calls them on enter/leave
let ctx = null

// -- hero: while the hero scrolls out, its media sinks at half the scroll speed and fades
// -- over the black background, while the title lifts
const initHero = (container) => {
  const hero = container.querySelector('.hero')
  if (!hero) return

  gsap
    .timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true
      }
    })
    .to(hero.querySelector('.hero_media'), { yPercent: 50, opacity: 0.24 }, 0)
    .to(hero.querySelector('.hero_title'), { y: -160 }, 0)
}

export default {
  init(container) {
    // -- animations created inside the context are reverted together in destroy()
    ctx = gsap.context(() => {
      initHero(container)
    }, container)
  },
  destroy() {
    ctx?.revert()
    ctx = null
  }
}
