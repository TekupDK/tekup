"use client"
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const root = document.documentElement
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = stored ? stored === 'dark' : prefersDark
    root.classList.toggle('dark', initialDark)
    setDark(initialDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    const root = document.documentElement
    root.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <button
      type="button"
      onClick={toggle}
      className="h-9 px-3 rounded-md border border-border text-sm hover:bg-foreground/5 dark:hover:bg-white/5"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  )
}
