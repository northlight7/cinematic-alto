'use strict'
// Shared behaviour for the inner pages: menu, reveal, press feedback, forms.

const reduce = matchMedia('(prefers-reduced-motion: reduce)')

// Mobile navigation
const menu = document.querySelector('[data-pg-menu]')
const nav = document.querySelector('[data-pg-nav]')
if (menu && nav) {
  const setOpen = (open) => {
    nav.dataset.open = String(open)
    menu.setAttribute('aria-expanded', String(open))
    menu.textContent = open ? 'Close' : 'Menu'
  }
  menu.addEventListener('click', () => setOpen(nav.dataset.open !== 'true'))
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.dataset.open === 'true') setOpen(false) })
}

// Scroll reveal
const reveals = [...document.querySelectorAll('[data-reveal]')]
if (reveals.length) {
  reveals.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(18px)' })
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const el = entry.target
      if (reduce.matches) { el.style.cssText = '' }
      else {
        el.style.transition = 'opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)'
        el.style.opacity = '1'
        el.style.transform = 'none'
      }
      io.unobserve(el)
    }
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' })
  reveals.forEach((el) => io.observe(el))
}

// Press feedback on every button-like control
document.addEventListener('pointerdown', (e) => {
  const target = e.target.closest('.btn, .pg-card, .pg-faq summary')
  if (target) target.classList.add('is-pressed')
}, { passive: true })
for (const evt of ['pointerup', 'pointercancel', 'pointerleave']) {
  document.addEventListener(evt, (e) => {
    const target = e.target.closest('.is-pressed')
    if (target) target.classList.remove('is-pressed')
  }, { passive: true })
}

// Enquiry forms: local confirmation only, nothing is sent anywhere.
for (const form of document.querySelectorAll('[data-pg-form]')) {
  const status = form.querySelector('[data-pg-sent]')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    if (status) {
      status.dataset.on = 'true'
      status.textContent = form.dataset.confirm || 'Thanks. This is a concept site, so nothing was sent.'
    }
    form.reset()
  })
}

// Current year
for (const el of document.querySelectorAll('[data-year]')) el.textContent = String(new Date().getFullYear())
