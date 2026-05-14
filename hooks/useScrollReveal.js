'use client'
import { useEffect } from 'react'

export function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    function observe(el) {
      if (!el.classList.contains('revealed')) io.observe(el)
    }

    // Observe all existing [data-reveal] elements
    document.querySelectorAll('[data-reveal]').forEach(observe)

    // Watch for new [data-reveal] elements added to the DOM (async data)
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.hasAttribute('data-reveal')) observe(node)
          node.querySelectorAll?.('[data-reveal]').forEach(observe)
        }
      }
    })

    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}
