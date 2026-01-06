// Page-specific theme configuration
export interface PageTheme {
  primary: string
  primaryHover: string
  primaryLight: string
  primaryDark: string
  shadow: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
}

export const pageThemes: Record<string, PageTheme> = {
  '/kitchen': {
    primary: 'text-green-500',
    primaryHover: 'hover:text-green-400',
    primaryLight: 'bg-green-500/10',
    primaryDark: 'bg-green-500/20',
    shadow: 'shadow-green-500/20',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-emerald-500',
    borderColor: 'border-green-500/30'
  },
  '/arena': {
    primary: 'text-red-500',
    primaryHover: 'hover:text-red-400',
    primaryLight: 'bg-red-500/10',
    primaryDark: 'bg-red-500/20',
    shadow: 'shadow-red-500/20',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-orange-500',
    borderColor: 'border-red-500/30'
  },
  '/sanctuary': {
    primary: 'text-sanctuary',
    primaryHover: 'hover:text-sanctuary-light',
    primaryLight: 'bg-sanctuary/10',
    primaryDark: 'bg-sanctuary/20',
    shadow: 'shadow-sanctuary/20',
    gradientFrom: 'from-sanctuary-light',
    gradientTo: 'to-sanctuary',
    borderColor: 'border-sanctuary/30'
  },
  '/ai-coach': {
    primary: 'text-purple-500',
    primaryHover: 'hover:text-purple-400',
    primaryLight: 'bg-purple-500/10',
    primaryDark: 'bg-purple-500/20',
    shadow: 'shadow-purple-500/20',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
    borderColor: 'border-purple-500/30'
  },
  '/world-map': {
    primary: 'text-[#2B7FFF]',
    primaryHover: 'hover:text-[#4A90FF]',
    primaryLight: 'bg-[#2B7FFF]/10',
    primaryDark: 'bg-[#2B7FFF]/20',
    shadow: 'shadow-[#2B7FFF]/20',
    gradientFrom: 'from-[#2B7FFF]',
    gradientTo: 'to-[#4A90FF]',
    borderColor: 'border-[#2B7FFF]/30'
  },
  '/guilds': {
    primary: 'text-teal-500',
    primaryHover: 'hover:text-teal-400',
    primaryLight: 'bg-teal-500/10',
    primaryDark: 'bg-teal-500/20',
    shadow: 'shadow-teal-500/20',
    gradientFrom: 'from-teal-400',
    gradientTo: 'to-teal-600',
    borderColor: 'border-teal-500/30'
  },
  // Default theme for dashboard, settings, etc.
  'default': {
    primary: 'text-primary', /* Uses global #9583FF */
    primaryHover: 'hover:text-primary',
    primaryLight: 'bg-primary/10',
    primaryDark: 'bg-primary/20',
    shadow: 'shadow-primary/20',
    gradientFrom: 'from-primary',
    gradientTo: 'to-purple-500',
    borderColor: 'border-primary/30'
  }
}

export function getPageTheme(pathname: string): PageTheme {
  return pageThemes[pathname] || pageThemes.default
}

export function getThemeClasses(pathname: string) {
  const theme = getPageTheme(pathname)
  
  // Special handling for sanctuary page with custom color
  if (pathname === '/sanctuary') {
    return {
      // Logo gradient classes with custom sanctuary color
      logoGradient: `bg-gradient-to-br`,
      logoGradientStyle: {
        background: 'linear-gradient(to bottom right, #D9AAFF, #CD96FF)'
      },
      logoShadow: `shadow-lg`,
      logoShadowStyle: {
        boxShadow: '0 10px 15px -3px rgba(205, 150, 255, 0.2), 0 4px 6px -4px rgba(205, 150, 255, 0.1)'
      },
      
      // Text gradient classes with custom sanctuary color
      textGradient: `bg-clip-text text-transparent`,
      textGradientStyle: {
        background: 'linear-gradient(to right, #D9AAFF, #CD96FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      },
      
      // Active item classes
      activeItem: `${theme.primaryLight} ${theme.primary} border ${theme.borderColor}`,
      
      // Hover classes with custom sanctuary hover color #9583FF
      hoverItem: `text-muted-foreground hover:bg-accent`,
      hoverItemCustom: true,
      hoverColor: '#9583FF',
      
      // Button classes
      buttonGradient: `text-white`,
      buttonGradientStyle: {
        background: 'linear-gradient(to right, #D9AAFF, #CD96FF)'
      },
      
      // Shadow classes
      shadow: theme.shadow,
      
      // Individual theme properties
      theme
    }
  }
  
  // Default handling for other pages
  return {
    // Logo gradient classes
    logoGradient: `bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo}`,
    logoShadow: `shadow-lg ${theme.shadow}`,
    
    // Text gradient classes
    textGradient: `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} bg-clip-text text-transparent`,
    
    // Active item classes
    activeItem: `${theme.primaryLight} ${theme.primary} border ${theme.borderColor}`,
    
    // Hover classes
    hoverItem: `${theme.primaryHover} bg-accent`,
    
    // Button classes
    buttonGradient: `bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} text-white`,
    
    // Shadow classes
    shadow: theme.shadow,
    
    // Individual theme properties
    theme
  }
}