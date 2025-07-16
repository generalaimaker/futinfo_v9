// Design System for Web (React/Next.js)

export const DesignSystem = {
  colors: {
    primary: {
      main: '#1E88E5',
      light: '#64B5F6',
      dark: '#1565C0',
    },
    trust: {
      official: '#4CAF50',
      tier1: '#2196F3',
      verified: '#9C27B0',
      reliable: '#00BCD4',
      questionable: '#FF9800',
      unreliable: '#F44336',
    },
    categories: {
      general: '#757575',
      transfer: '#FF9800',
      match: '#2196F3',
      injury: '#9C27B0',
    },
    background: {
      primary: '#FAFAFA',
      secondary: '#F5F5F5',
      card: '#FFFFFF',
      dark: '#121212',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
  
  shadow: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// CSS-in-JS styles
export const styles = {
  card: {
    padding: DesignSystem.spacing[4],
    backgroundColor: DesignSystem.colors.background.card,
    borderRadius: DesignSystem.borderRadius.lg,
    boxShadow: DesignSystem.shadow.md,
  },
  
  button: {
    primary: {
      backgroundColor: DesignSystem.colors.primary.main,
      color: DesignSystem.colors.text.inverse,
      padding: `${DesignSystem.spacing[2]} ${DesignSystem.spacing[6]}`,
      borderRadius: DesignSystem.borderRadius.full,
      border: 'none',
      fontSize: DesignSystem.typography.fontSize.base,
      fontWeight: DesignSystem.typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${DesignSystem.animation.duration.fast} ${DesignSystem.animation.easing.easeInOut}`,
      '&:hover': {
        backgroundColor: DesignSystem.colors.primary.dark,
      },
    },
    secondary: {
      backgroundColor: DesignSystem.colors.background.secondary,
      color: DesignSystem.colors.text.primary,
      padding: `${DesignSystem.spacing[2]} ${DesignSystem.spacing[6]}`,
      borderRadius: DesignSystem.borderRadius.full,
      border: 'none',
      fontSize: DesignSystem.typography.fontSize.base,
      fontWeight: DesignSystem.typography.fontWeight.medium,
      cursor: 'pointer',
      transition: `all ${DesignSystem.animation.duration.fast} ${DesignSystem.animation.easing.easeInOut}`,
    },
  },
  
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${DesignSystem.spacing[1]} ${DesignSystem.spacing[2]}`,
    borderRadius: DesignSystem.borderRadius.sm,
    fontSize: DesignSystem.typography.fontSize.xs,
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
}

// Utility functions
export const getTrustColor = (tier: string): string => {
  const trustColors: Record<string, string> = {
    official: DesignSystem.colors.trust.official,
    tier1: DesignSystem.colors.trust.tier1,
    verified: DesignSystem.colors.trust.verified,
    reliable: DesignSystem.colors.trust.reliable,
    questionable: DesignSystem.colors.trust.questionable,
  }
  return trustColors[tier] || DesignSystem.colors.trust.unreliable
}

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    transfer: DesignSystem.colors.categories.transfer,
    match: DesignSystem.colors.categories.match,
    injury: DesignSystem.colors.categories.injury,
  }
  return categoryColors[category] || DesignSystem.colors.categories.general
}

export const getTrustLabel = (tier: string): string => {
  const labels: Record<string, string> = {
    official: '[OFFICIAL]',
    tier1: '[Tier 1]',
    verified: '[Verified]',
    reliable: '[Reliable]',
    questionable: '[Rumour]',
  }
  return labels[tier] || '[Unverified]'
}