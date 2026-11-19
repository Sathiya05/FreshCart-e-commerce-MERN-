import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Every route change should open at the top of the new page. `instant` is
 * intentional: the global CSS smooth scrolling would otherwise animate a long
 * scroll from the bottom of the previous page.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1))
      if (target) {
        target.scrollIntoView({ block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])

  return null
}
