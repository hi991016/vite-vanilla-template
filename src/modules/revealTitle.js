import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(CustomEase, SplitText)
CustomEase.create('reveal-ease', '0.165, 0.84, 0.44, 1')

// -- the first line waits this long after `position`, each next one this much more
const STAGGER = 0.08

// -- splits the h1 of the next page into lines, each in its own overflow mask, and adds the
// -- lines sliding up one by one to a transition's timeline at `position`. the markup is
// -- restored once all lines are in
export const revealTitle = (tl, container, position) => {
  const titles = container.querySelectorAll('h1')
  if (!titles.length) return tl

  const split = SplitText.create(titles, { type: 'lines', mask: 'lines' })

  return tl.from(
    split.lines,
    {
      yPercent: 100,
      duration: 1.44,
      ease: 'reveal-ease',
      stagger: STAGGER,
      onComplete: () => split.revert()
    },
    position + STAGGER
  )
}
