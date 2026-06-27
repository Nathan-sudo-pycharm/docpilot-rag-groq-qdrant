"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

// ReactNode is a type representing "anything React can render" —
// could be a single element, a string, a number, an array of
// elements, or even nothing (null). It's the correct type whenever
// a component just wraps and displays whatever children it's given.
interface Props {
  children: ReactNode
}

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"        // adds a "dark" class to <html> when dark mode is active
      defaultTheme="system"    // defaults to the user's OS preference
      enableSystem              // allows "system" as a valid theme option
    >
      {children}
    </NextThemesProvider>
  )
}