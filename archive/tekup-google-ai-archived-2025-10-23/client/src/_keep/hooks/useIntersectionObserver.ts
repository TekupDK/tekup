import { useState, useEffect, useRef, RefObject } from 'react'

interface IntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  root?: Element | null
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
): [RefObject<HTMLDivElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: options.threshold || 0,
        rootMargin: options.rootMargin || '0px',
        root: options.root || null
      }
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [options.threshold, options.rootMargin, options.root])

  return [targetRef, isIntersecting]
}