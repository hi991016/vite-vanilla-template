import { scrollToHash } from '@/modules/customLenis'

// -- header nav: it lives outside the barba container, so init once

// -- same origin + path + query, ignoring #hash, index.html and the trailing slash,
// -- so "/about", "/about/" and "/about/index.html" are the same page
export const pageKey = (url) => {
  const { origin, pathname, search } = new URL(url, location.href)
  const path = pathname.replace(/\/index\.html?$/, '/').replace(/(.)\/$/, '$1')
  return origin + path + search
}

// -- mark the links of the page being shown
export const updateCurrentNav = (url) => {
  const here = pageKey(url)
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const current = pageKey(link.href) === here
    link.classList.toggle('is-current', current)
    if (current) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
}

export const initNav = () => {
  updateCurrentNav(location.href)

  // -- a link to the page already shown: no reload, no transition. a #hash link
  // -- smooth scrolls to its section
  window.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[href]')
      if (!link || link.target === '_blank') return
      if (pageKey(link.href) !== pageKey(location.href)) return

      e.preventDefault()
      e.stopPropagation()
      if (scrollToHash(link.hash)) history.replaceState(history.state, '', link.hash)
    },
    true
  )
}
