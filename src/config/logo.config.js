/**
 * Logo Configuration - REJLERS RADAI
 * Centralized logo paths and settings for easy maintenance
 * Supports multiple logo variants for different use cases
 */

export const LOGO_CONFIG = {
  // Primary logos
  primary: {
    svg: '/assets/images/rejlers-logo.svg',
    horizontal: '/assets/images/rejlers-logo-horizontal.svg',
    alt: 'Rejlers Engineering Solutions'
  },
  
  // Fallback configuration
  fallback: {
    text: 'REJLERS',
    subtext: 'Engineering Intelligence',
    iconLetter: 'R'
  },
  
  // Responsive sizes
  sizes: {
    nav: {
      mobile: 'h-8 w-auto',
      desktop: 'h-9 w-auto'
    },
    hero: {
      mobile: 'h-12 w-auto',
      desktop: 'h-16 w-auto'
    },
    footer: {
      default: 'h-10 w-auto'
    }
  },
  
  // Animation settings
  animation: {
    hover: {
      scale: 'hover:scale-105',
      duration: 'transition-all duration-300'
    }
  }
}

// Logo component helper
export const getLogoPath = (variant = 'horizontal') => {
  return LOGO_CONFIG.primary[variant] || LOGO_CONFIG.primary.horizontal
}

export const getLogoSize = (location = 'nav', breakpoint = 'desktop') => {
  return LOGO_CONFIG.sizes[location]?.[breakpoint] || LOGO_CONFIG.sizes.nav.desktop
}
