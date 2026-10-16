import gsap from 'gsap'

// -- every page module exports init/destroy; app.js calls them on enter/leave
let ctx = null

export default {
  init(container) {
    // -- animations created inside the context are reverted together in destroy()
    ctx = gsap.context(() => {}, container)
  },
  destroy() {
    ctx?.revert()
    ctx = null
  }
}
