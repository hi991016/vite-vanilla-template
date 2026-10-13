import LazyLoad from 'vanilla-lazyload'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// modules
import { lenis, initLenis, stopScroll, startScroll } from '@/modules/customLenis'

// configuration
const mw = 1024
const CONFIG = {
  isMobile: window.matchMedia(`(max-width: ${mw}px)`)
}

// utilities
gsap.registerPlugin(ScrollTrigger)
let _ll = null
let _resizeRaf = null

// vanilla lazyload
_ll = new LazyLoad({ threshold: 300, elements_selector: '.lazy' })

// init appHeight
const initAppHeight = () => {
  const doc = document.documentElement

  if (CONFIG.isMobile.matches) {
    const menuH = Math.max(doc.clientHeight, window.innerHeight || 0)
    doc.style.setProperty('--app-height', `${doc.clientHeight}px`)
    doc.style.setProperty('--menu-height', `${menuH}px`)
  } else {
    doc.style.removeProperty('--app-height')
    doc.style.removeProperty('--menu-height')
  }
}

window.addEventListener('resize', () => {
  cancelAnimationFrame(_resizeRaf)
  _resizeRaf = requestAnimationFrame(initAppHeight)
})

// init all scripts
const initScript = () => {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  _ll?.update()
  initAppHeight()
  initLenis()
}

// initialzation
window.addEventListener('DOMContentLoaded', initScript)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) document.body.classList.remove('fadeout')
})
