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
    if (hash) return

    window.scrollTo(0, 0)
    document
      .querySelectorAll<HTMLElement>('[data-scroll-root]')
      .forEach((el) => {
        el.scrollTop = 0
      })
  }, [pathname, hash])

  return null
}
