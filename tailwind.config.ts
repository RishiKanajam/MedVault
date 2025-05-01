import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"], // Enable class-based dark mode
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
         // Use CSS variables defined in globals.css
        sidebar: 'hsl(var(--sidebar-hsl))',
        'sidebar-foreground': 'hsl(var(--sidebar-foreground-hsl))',
        'sidebar-hover': 'hsl(var(--sidebar-hover-hsl))',
        'sidebar-accent': 'hsl(var(--sidebar-accent-hsl))',
        'sidebar-border': 'hsl(var(--sidebar-border-hsl))',
        'sidebar-submenu-background': 'hsl(var(--sidebar-submenu-background-hsl))',
        'sidebar-submenu-foreground': 'hsl(var(--sidebar-submenu-foreground-hsl))',

        primary: 'hsl(var(--primary-hsl))',
        'primary-foreground': 'hsl(var(--primary-foreground))', // Foreground for primary color
        secondary: 'hsl(var(--secondary-hsl))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))', // Foreground for secondary color

        danger: 'hsl(var(--danger-hsl))',
        'danger-foreground': 'hsl(var(--destructive-foreground))', // Map to destructive foreground for consistency
        warning: 'hsl(var(--warning-hsl))',
        'warning-foreground': 'hsl(var(--secondary-foreground))', // Example: use secondary foreground on warning
        info: 'hsl(var(--info-hsl))',
        'info-foreground': 'hsl(var(--primary-foreground))', // Example: use primary foreground on info

        surface: 'hsl(var(--surface-hsl))', // Main content panels
        'surface-alt': 'hsl(var(--surface-alt-hsl))', // Slightly darker surface for tertiary overlays
        background: 'hsl(var(--background-hsl))', // Main app background
        foreground: 'hsl(var(--foreground-hsl))', // Default text color

        'muted-foreground': 'hsl(var(--muted-foreground-hsl))',

        // Shadcn UI mapping (using CSS vars)
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: { // Shadcn accent might map differently
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: { // Shadcn destructive
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // Chart colors (ensure these CSS vars exist or define them)
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
  		},
  		borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
  		},
      boxShadow: {
         'card': '0 2px 8px rgba(0,0,0,0.05)', // Softer card shadow
         'overlay': '0 4px 16px rgba(0,0,0,0.1)', // Adjusted overlay shadow
         'lg': '0 8px 24px rgba(0,0,0,0.1)', // Larger shadow for modals
         'md': '0 4px 12px rgba(0,0,0,0.08)',
         'sm': '0 1px 4px rgba(0,0,0,0.05)',
      },
  		keyframes: {
        // Shadcn UI keyframes
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
         "collapsible-down": {
           from: { height: "0" },
           to: { height: 'var(--radix-collapsible-content-height)' },
         },
         "collapsible-up": {
           from: { height: 'var(--radix-collapsible-content-height)' },
           to: { height: "0" },
         },
         // Custom animations
         fadeIn: {
           from: { opacity: '0' },
           to: { opacity: '1' },
         },
        slideUp: {
            from: { transform: 'translateY(10px)', opacity: '0' },
            to: { transform: 'translateY(0)', opacity: '1' },
        },
  		},
  		animation: {
        // Shadcn UI animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
        // Custom animations
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
