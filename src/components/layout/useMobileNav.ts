import { createContext, useContext } from 'react'

export interface NavControls {
  /** Opens the drawer on phones / collapses the rail on desktop. */
  toggle: () => void
  collapsed: boolean
}

export const MobileNavContext = createContext<NavControls>({ toggle: () => {}, collapsed: false })

/** Lets any page drive the sidebar from its own header button. */
export const useMobileNav = () => useContext(MobileNavContext)
