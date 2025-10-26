"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navigationItems = [
  { href: "/", label: "Hjem", id: "home" },
  { href: "/services", label: "Services", id: "services" },
  { href: "/om-os", label: "Om TekUp", id: "about" },
  { href: "/kontakt", label: "Kontakt", id: "contact" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/20"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg font-display">T</span>
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
              TekUp
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.id}>
                <Link
                  href={item.href}
                  className="relative text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 py-2 px-3 rounded-md group"
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                </Link>
              </div>
            ))}

            {/* CTA Button */}
            <div>
              <Link
                href="/kontakt"
                className="btn-premium text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Book konsultation
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            <div className="w-6 h-6 relative">
              <span className={cn(
                "absolute block w-6 h-0.5 bg-current transition-all duration-300",
                isOpen ? "rotate-45 top-3" : "top-1"
              )} />
              <span className={cn(
                "absolute block w-6 h-0.5 bg-current transition-all duration-300 top-3",
                isOpen ? "opacity-0" : "opacity-100"
              )} />
              <span className={cn(
                "absolute block w-6 h-0.5 bg-current transition-all duration-300",
                isOpen ? "-rotate-45 top-3" : "top-5"
              )} />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200/20 dark:border-gray-800/20 mt-2">
            <div className="py-4 space-y-2">
              {navigationItems.map((item) => (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              <div className="pt-4">
                <Link
                  href="/kontakt"
                  onClick={() => setIsOpen(false)}
                  className="block w-full btn-premium text-white text-center"
                >
                  Book konsultation
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}