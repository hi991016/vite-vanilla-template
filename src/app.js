import LazyLoad from 'vanilla-lazyload'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import barba from '@barba/core'

// modules
import { initLenis, stopScroll, startScroll, scrollToHash } from '@/modules/customLenis'
import { initNav, updateCurrentNav } from '@/modules/nav'

// transitions: import only the ones this site uses, the rest stay out of the bundle
import stack from '@/transitions/stack'

// pages: src/pages/<namespace>.js, each loaded as its own chunk on first visit
const pages = import.meta.glob('./pages/*.js')

// configuration
const mw = 1024
const CONFIG = {
  isMobile: window.matchMedia(`(max-width: ${mw}px)`)
}

// utilities
gsap.registerPlugin(ScrollTrigger, CustomEase)
CustomEase.create('primary-ease', '0.62, 0.05, 0.01, 0.99')
CustomEase.create('primary-ease-out', '0.17, 0.84, 0.44, 1')
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

// pages: start the import early, vite caches the module so later calls reuse it
const pageModule = (namespace) => pages[`./pages/${namespace}.js`]?.()

let _page = null
const startPage = async (container) => {
  const page = { container, module: null }
  _page = page

  const mod = (await pageModule(container.dataset.barbaNamespace))?.default
  // -- the visitor may have left before the module arrived
  if (_page !== page) return

  page.module = mod
  mod?.init?.(container)
  ScrollTrigger.refresh()
}

// -- only the ScrollTriggers created inside the page, global ui keeps its own
const pageTriggers = (container) =>
  ScrollTrigger.getAll().filter((t) => t.trigger && container.contains(t.trigger))

const destroyPage = (container) => {
  _page?.module?.destroy?.()
  _page = null
  pageTriggers(container).forEach((t) => t.kill())
}

// -- ui outside the container keeps the first page's markup: copy the class of every
// -- [data-barba-sync] element from the next page (matched by order), e.g. header.is-home
const syncOutside = (html) => {
  const fresh = new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelectorAll('[data-barba-sync]')
  document.querySelectorAll('[data-barba-sync]').forEach((el, i) => {
    if (fresh[i]) el.className = fresh[i].className
  })
}

// init all scripts
const initScript = (container) => {
  window.scrollTo({ top: 0, behavior: 'instant' })

  _ll?.update()
  initAppHeight()
  initLenis()
  startPage(container)
}

// barba
let _requestedHash = ''
let _hash = ''

// -- barba drops the #hash from next.url and the history entry. every navigation (link,
// -- back/forward, barba.go() from code) goes through barba.go(url), so read it there
const go = barba.go.bind(barba)
barba.go = (url, ...args) => {
  _requestedHash = new URL(url, location.href).hash
  return go(url, ...args)
}

barba.hooks.before(() => {
  _hash = _requestedHash
})

barba.hooks.beforeLeave(({ current }) => {
  stopScroll()
  // -- freeze the old page's scroll-driven work, it is destroyed once fully hidden
  pageTriggers(current.container).forEach((t) => t.disable(false))
})

barba.hooks.beforeEnter(({ next }) => {
  pageModule(next.namespace)
  updateCurrentNav(next.url.href)
  syncOutside(next.html)
})

barba.hooks.afterLeave(({ current }) => destroyPage(current.container))

barba.hooks.after(({ next }) => {
  // -- reset and re-init while lenis is still stopped, then hand scroll back
  initScript(next.container)
  startScroll()

  if (scrollToHash(_hash)) {
    // -- put the hash back in the address bar, keeping barba's history state
    history.replaceState(history.state, '', location.pathname + location.search + _hash)
  }
})

// initialzation
window.addEventListener('DOMContentLoaded', () => {
  history.scrollRestoration = 'manual'

  initNav()
  barba.init({ preventRunning: true, transitions: [stack] })
  initScript(document.querySelector('[data-barba="container"]'))
  scrollToHash(location.hash)
})
window.addEventListener('pageshow', (event) => {
  if (event.persisted) document.body.classList.remove('fadeout')
})
