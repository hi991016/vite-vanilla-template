// ===== CONFIGURATION =====
const mw = 1024
const CONFIG = {
  isMobile: window.matchMedia(`(max-width: ${mw}px)`)
}

// ===== INIT APP HEIGHT =====
const initAppHeight = async () => {
  const doc = document.documentElement
  const menuH = Math.max(doc.clientHeight, window.innerHeight || 0)

  if (CONFIG.isMobile.matches) {
    doc.style.setProperty('--app-height', `${doc.clientHeight}px`)
    doc.style.setProperty('--menu-height', `${menuH}px`)
  } else {
    doc.style.removeProperty('--app-height')
    doc.style.removeProperty('--menu-height')
  }
}

// ===== INIT ALL COMPONENTS =====
const initScript = () => {
  history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)

  initAppHeight()
}

// ===== INITIALIZATION =====
window.addEventListener('resize', initAppHeight)
window.addEventListener('DOMContentLoaded', initScript)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) document.body.classList.remove('fadeout')
})
