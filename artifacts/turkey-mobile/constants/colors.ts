/**
 * Semantic design tokens — synced from turkey-travel web app (index.css).
 * Primary: Navy #1A2942 | Accent: Gold #F59E0B | Background: #F0F2F5
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#1A2942',
    tint: '#F59E0B',

    // Core surfaces
    background: '#F0F2F5',
    foreground: '#1A2942',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#1A2942',

    // Primary action color — Navy
    primary: '#1A2942',
    primaryForeground: '#FFFFFF',

    // Secondary
    secondary: '#F4F5F7',
    secondaryForeground: '#1A2942',

    // Muted / subdued elements
    muted: '#F0F2F5',
    mutedForeground: '#637487',

    // Accent — Gold/Amber
    accent: '#F59E0B',
    accentForeground: '#FFFFFF',

    // Destructive
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E5E8ED',
    input: '#E5E8ED',
  },

  dark: {
    text: '#F0F2F5',
    tint: '#F59E0B',

    background: '#111827',
    foreground: '#F0F2F5',

    card: '#1E2A3A',
    cardForeground: '#F0F2F5',

    primary: '#F0F2F5',
    primaryForeground: '#111827',

    secondary: '#1E2A3A',
    secondaryForeground: '#F0F2F5',

    muted: '#1E2A3A',
    mutedForeground: '#6B8399',

    accent: '#F59E0B',
    accentForeground: '#FFFFFF',

    destructive: '#EF4444',
    destructiveForeground: '#F0F2F5',

    border: '#2A3A4F',
    input: '#2A3A4F',
  },

  // Border radius — synced from --radius: 1rem = 16px
  radius: 16,
};

export default colors;
