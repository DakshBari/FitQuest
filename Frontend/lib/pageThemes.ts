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
    primary: 'text-violet-500',
    primaryHover: 'hover:text-violet-400',
    primaryLight: 'bg-violet-500/10',
    primaryDark: 'bg-violet-500/20',
    shadow: 'shadow-violet-500/20',
    gradientFrom: 'from-violet-400',
    gradientTo: 'to-purple-500',
    borderColor: 'border-violet-500/30'
  },
  '/arena': {
    primary: 'text-violet-500',
    primaryHover: 'hover:text-violet-400',
    primaryLight: 'bg-violet-500/10',
    primaryDark: 'bg-violet-500/20',
    shadow: 'shadow-violet-500/20',
    gradientFrom: 'from-violet-400',
    gradientTo: 'to-purple-500',
    borderColor: 'border-violet-500/30'
  },
  '/sanctuary': {
    primary: 'text-[#7F22FE]',
    primaryHover: 'hover:text-[#7F22FE]',
    primaryLight: 'bg-[#7F22FE]/10',
    primaryDark: 'bg-[#7F22FE]/20',
    shadow: 'shadow-[#7F22FE]/20',
    gradientFrom: 'from-[#7F22FE]',
    gradientTo: 'to-[#7F22FE]',
    borderColor: 'border-[#7F22FE]/30'
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
    primary: 'text-violet-500',
    primaryHover: 'hover:text-violet-400',
    primaryLight: 'bg-violet-500/10',
    primaryDark: 'bg-violet-500/20',
    shadow: 'shadow-violet-500/20',
    gradientFrom: 'from-violet-400',
    gradientTo: 'to-purple-500',
    borderColor: 'border-violet-500/30'
  },
  '/guilds': {
    primary: 'text-violet-500',
    primaryHover: 'hover:text-violet-400',
    primaryLight: 'bg-violet-500/10',
    primaryDark: 'bg-violet-500/20',
    shadow: 'shadow-violet-500/20',
    gradientFrom: 'from-violet-400',
    gradientTo: 'to-purple-500',
    borderColor: 'border-violet-500/30'
  },
  '/settings': {
    primary: 'text-[#7F22FE]',
    primaryHover: 'hover:text-[#7F22FE]',
    primaryLight: 'bg-[#7F22FE]/10',
    primaryDark: 'bg-[#7F22FE]/20',
    shadow: 'shadow-[#7F22FE]/20',
    gradientFrom: 'from-[#7F22FE]',
    gradientTo: 'to-[#7F22FE]',
    borderColor: 'border-[#7F22FE]/30'
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
  
  // Special handling for settings and sanctuary pages with custom color #7F22FE
  if (pathname === '/settings' || pathname === '/sanctuary') {
    return {
      // Logo gradient classes with custom settings/sanctuary color
      logoGradient: `bg-gradient-to-br`,
      logoGradientStyle: {
        background: 'linear-gradient(to bottom right, #7F22FE, #a855f7)'
      },
      logoShadow: `shadow-lg`,
      logoShadowStyle: {
        boxShadow: '0 10px 15px -3px rgba(127, 34, 254, 0.2), 0 4px 6px -4px rgba(127, 34, 254, 0.1)'
      },
      
      // Text gradient classes with custom settings/sanctuary color
      textGradient: `bg-clip-text text-transparent`,
      textGradientStyle: {
        background: 'linear-gradient(to right, #7F22FE, #a855f7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      },
      
      // Active item classes
      activeItem: `bg-[#7F22FE]/10 text-[#7F22FE] border border-[#7F22FE]/30`,
      
      // Hover classes
      hoverItem: `text-muted-foreground hover:bg-accent`,
      hoverItemCustom: true,
      hoverColor: '#7F22FE',
      
      // Button classes
      buttonGradient: `text-white`,
      buttonGradientStyle: {
        background: 'linear-gradient(to right, #7F22FE, #a855f7)'
      },
      
      // Shadow classes
      shadow: 'shadow-[#7F22FE]/20',
      
      // Individual theme properties
      theme: {
        primary: 'text-[#7F22FE]',
        primaryHover: 'hover:text-[#7F22FE]',
        primaryLight: 'bg-[#7F22FE]/10',
        primaryDark: 'bg-[#7F22FE]/20',
        shadow: 'shadow-[#7F22FE]/20',
        gradientFrom: 'from-[#7F22FE]',
        gradientTo: 'to-[#7F22FE]',
        borderColor: 'border-[#7F22FE]/30'
      }
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