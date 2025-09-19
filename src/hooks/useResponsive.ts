import { useEffect, useState, useCallback } from 'react'

// Breakpoint definitions (Tailwind CSS compatible)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints
export type BreakpointValue = typeof breakpoints[Breakpoint]

interface ViewportInfo {
  width: number
  height: number
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isXLarge: boolean
  is2XLarge: boolean
  currentBreakpoint: Breakpoint
  isPortrait: boolean
  isLandscape: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
}

/**
 * Hook for responsive design and viewport information
 */
export function useResponsive(): ViewportInfo {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isSmall: false,
        isMedium: false,
        isLarge: true,
        isXLarge: false,
        is2XLarge: false,
        currentBreakpoint: 'lg' as Breakpoint,
        isPortrait: false,
        isLandscape: true,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouchDevice: false,
      }
    }

    return getViewportInfo()
  })

  const updateViewport = useCallback(() => {
    setViewport(getViewportInfo())
  }, [])

  useEffect(() => {
    // Debounce resize events for better performance
    let timeoutId: NodeJS.Timeout

    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateViewport, 150)
    }

    window.addEventListener('resize', debouncedUpdate)
    window.addEventListener('orientationchange', debouncedUpdate)

    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      window.removeEventListener('orientationchange', debouncedUpdate)
      clearTimeout(timeoutId)
    }
  }, [updateViewport])

  return viewport
}

/**
 * Get current viewport information
 */
function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth
  const height = window.innerHeight
  const isPortrait = height > width
  const isLandscape = width > height

  // Determine current breakpoint
  let currentBreakpoint: Breakpoint = 'sm'
  if (width >= breakpoints['2xl']) currentBreakpoint = '2xl'
  else if (width >= breakpoints.xl) currentBreakpoint = 'xl'
  else if (width >= breakpoints.lg) currentBreakpoint = 'lg'
  else if (width >= breakpoints.md) currentBreakpoint = 'md'
  else if (width >= breakpoints.sm) currentBreakpoint = 'sm'

  // Device type detection
  const isMobile = width < breakpoints.md
  const isTablet = width >= breakpoints.md && width < breakpoints.lg
  const isDesktop = width >= breakpoints.lg

  // Touch device detection
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return {
    width,
    height,
    isSmall: width >= breakpoints.sm && width < breakpoints.md,
    isMedium: width >= breakpoints.md && width < breakpoints.lg,
    isLarge: width >= breakpoints.lg && width < breakpoints.xl,
    isXLarge: width >= breakpoints.xl && width < breakpoints['2xl'],
    is2XLarge: width >= breakpoints['2xl'],
    currentBreakpoint,
    isPortrait,
    isLandscape,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
  }
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    mediaQuery.addEventListener('change', handler)
    setMatches(mediaQuery.matches)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Hook for breakpoint-specific values
 */
export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const { currentBreakpoint } = useResponsive()

  // Find the appropriate value based on current breakpoint
  // Fallback to smaller breakpoints if current one is not defined
  const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  for (let i = currentIndex; i >= 0; i--) {
    const breakpoint = breakpointOrder[i]
    if (values[breakpoint] !== undefined) {
      return values[breakpoint]
    }
  }

  return undefined
}

/**
 * Hook for conditional rendering based on screen size
 */
export function useShowOnBreakpoint(
  breakpoint: Breakpoint,
  direction: 'up' | 'down' | 'only' = 'up'
): boolean {
  const { width, currentBreakpoint } = useResponsive()
  const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl']
  const targetIndex = breakpointOrder.indexOf(breakpoint)
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  switch (direction) {
    case 'up':
      return currentIndex >= targetIndex
    case 'down':
      return currentIndex <= targetIndex
    case 'only':
      return currentIndex === targetIndex
    default:
      return false
  }
}

/**
 * Component wrapper for responsive rendering
 */
interface ResponsiveProps {
  children: React.ReactNode
  show?: Breakpoint
  hide?: Breakpoint
  direction?: 'up' | 'down' | 'only'
}

export function Responsive({ 
  children, 
  show, 
  hide, 
  direction = 'up' 
}: ResponsiveProps) {
  const shouldShow = show ? useShowOnBreakpoint(show, direction) : true
  const shouldHide = hide ? useShowOnBreakpoint(hide, direction) : false

  if (!shouldShow || shouldHide) {
    return null
  }

  return <>{children}</>
}

/**
 * Utility functions for responsive design
 */
export const responsiveUtils = {
  /**
   * Get CSS classes based on breakpoint
   */
  getBreakpointClasses: (
    classes: Partial<Record<Breakpoint, string>>,
    currentBreakpoint: Breakpoint
  ): string => {
    const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint)
    
    let resultClasses = ''
    for (let i = 0; i <= currentIndex; i++) {
      const breakpoint = breakpointOrder[i]
      if (classes[breakpoint]) {
        resultClasses += ` ${classes[breakpoint]}`
      }
    }
    
    return resultClasses.trim()
  },

  /**
   * Check if current screen is mobile
   */
  isMobileScreen: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoints.md
  },

  /**
   * Check if current screen is tablet
   */
  isTabletScreen: (): boolean => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= breakpoints.md && width < breakpoints.lg
  },

  /**
   * Check if current screen is desktop
   */
  isDesktopScreen: (): boolean => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= breakpoints.lg
  },

  /**
   * Get optimal image sizes for responsive images
   */
  getImageSizes: (breakpointSizes: Partial<Record<Breakpoint, string>>): string => {
    const entries = Object.entries(breakpointSizes) as [Breakpoint, string][]
    const sortedEntries = entries.sort(([a], [b]) => {
      const order: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl']
      return order.indexOf(a) - order.indexOf(b)
    })

    return sortedEntries
      .map(([breakpoint, size]) => {
        const minWidth = breakpoints[breakpoint]
        return `(min-width: ${minWidth}px) ${size}`
      })
      .join(', ')
  },

  /**
   * Get responsive container padding
   */
  getContainerPadding: (isMobile: boolean, isTablet: boolean): string => {
    if (isMobile) return 'px-4'
    if (isTablet) return 'px-6'
    return 'px-8'
  },

  /**
   * Get responsive grid columns
   */
  getGridColumns: (
    mobile: number,
    tablet?: number,
    desktop?: number
  ): Record<string, number> => {
    return {
      sm: mobile,
      md: tablet || mobile * 2,
      lg: desktop || tablet || mobile * 3,
    }
  },
}

/**
 * Constants for common responsive patterns
 */
export const responsivePatterns = {
  // Common container sizes
  container: {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md', 
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  },

  // Common grid patterns
  grid: {
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    list: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    hero: 'grid grid-cols-1 lg:grid-cols-2',
    sidebar: 'grid grid-cols-1 lg:grid-cols-4',
  },

  // Common spacing patterns
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    container: 'px-4 sm:px-6 lg:px-8',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },

  // Common text patterns
  text: {
    heading: 'text-2xl sm:text-3xl lg:text-4xl',
    subheading: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
  },
} as const

/**
 * Hook for responsive image loading
 */
export function useResponsiveImage(
  sources: Partial<Record<Breakpoint, string>>,
  alt: string
) {
  const { currentBreakpoint } = useResponsive()
  
  const getSrc = useCallback(() => {
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm']
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint)
    
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const breakpoint = breakpointOrder[i]
      if (sources[breakpoint]) {
        return sources[breakpoint]
      }
    }
    
    return sources.sm || ''
  }, [sources, currentBreakpoint])

  return {
    src: getSrc(),
    alt,
    sizes: responsiveUtils.getImageSizes(
      Object.fromEntries(
        Object.entries(sources).map(([bp, src]) => [bp, '100vw'])
      ) as Partial<Record<Breakpoint, string>>
    ),
  }
}
