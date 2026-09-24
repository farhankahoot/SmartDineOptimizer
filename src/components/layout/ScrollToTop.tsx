import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Every route change starts at the top of the new page.
 *
 * Two scroll surfaces exist: the public pages scroll the window, while the admin
 * and Super Admin consoles scroll an inner element marked `data-scroll-root`
 * (that element survives navigation between console pages, so its offset would
 * otherwise carry over). An in-page anchor such as `#features` is left alone so
 * the landing-page nav still jumps to its section.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    // Stop the browser restoring an old offset on back/forward.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  }, [])

  useLayoutEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      document.querySelectorAll<HTMLElement>('[data-scroll-root]').forEach((el) => {
        el.scrollTop = 0
      })
      return
    }

    /*
     * Arriving with a hash — a shared or bookmarked link like `/#deals`.
     *
     * The browser looks for the anchor while the document is still the empty
     * SPA shell, finds nothing, and gives up; by the time React has rendered
     * the section, nobody is going to scroll to it. Several of those sections
     * also wait on the public config request, so this retries across a short
     * window rather than assuming the target exists on the first frame.
     *
     * `scrollIntoView` is used rather than a manual offset because it honours
     * the section's own `scroll-margin-top`, which is what keeps the heading
     * clear of the sticky header.
     */
    const id = decodeURIComponent(hash.slice(1))
    const deadline = performance.now() + 2000
    let frame = 0

    const settle = () => {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView()
        return
      }
      if (performance.now() < deadline) frame = requestAnimationFrame(settle)
    }

    frame = requestAnimationFrame(settle)
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
