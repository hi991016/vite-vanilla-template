import gsap from 'gsap'

// -- placeholder transition: old page fades out, new page fades in
export default {
  name: 'fade',
  leave: ({ current }) => gsap.to(current.container, { autoAlpha: 0, duration: 0.4 }),
  enter: ({ current, next }) => {
    // -- barba keeps the old container until after enter, it would push the new one down
    current.container.remove()
    return gsap.from(next.container, { autoAlpha: 0, duration: 0.4 })
  }
}
