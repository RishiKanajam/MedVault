import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
        // New Palette
        sidebar: '#1E1E1E', // Charcoal for sidebar background
        primary: '#008080', // Teal for primary actions, highlights
        secondary: '#FFA500', // Orange for secondary actions, accents
        danger: '#E53935', // Red for errors, destructive actions
        warning: '#FBC02D', // Yellow/Orange for warnings (like expiring soon)
        info: '#8E24AA', // Purple for informational elements (like shipments)
        surface: '#FFFFFF', // White for main content panels, cards
        background: '#FAFAFA', // Light gray for the main content area background
        'sidebar-foreground': '#F8F8F8', // Light text/icons on dark sidebar
        'sidebar-hover': '#2A2A2A', // Slightly lighter charcoal for sidebar hover
        'sidebar-accent': '#008080', // Teal accent for active sidebar item
        foreground: '#333333', // Dark text for light backgrounds
        'muted-foreground': '#4F4F4F', // Slightly lighter text

        // Shadcn UI mapping (using new palette)
  			card: {
  				DEFAULT: 'hsl(var(--surface-hsl))', // Use surface color (white)
  				foreground: 'hsl(var(--foreground-hsl))' // Use main foreground
  			},
  			popover: {
          DEFAULT: 'hsl(var(--surface-hsl))', // Use surface for popovers now
  				foreground: 'hsl(var(--foreground-hsl))'
  			},
  			// primary, secondary, destructive, accent mapped directly above
  			muted: { // Keep muted distinct if needed, or map to background/surface variants
          DEFAULT: 'hsl(var(--background-hsl))', // e.g., map muted background to main background
  				foreground: 'hsl(var(--muted-foreground-hsl))'
  			},
  			border: '#E0E0E0', // Specific light gray border
  			input: 'hsl(var(--border-hsl))', // Map input border to general border
  			ring: 'hsl(var(--primary-hsl))', // Use primary teal for focus rings

        // Chart colors (can be customized further)
  			chart: {
  				'1': 'hsl(var(--primary-hsl))', // Teal
          '2': 'hsl(var(--warning-hsl))', // Warning Orange
          '3': 'hsl(var(--danger-hsl))', // Danger Red
          '4': 'hsl(var(--info-hsl))', // Info Purple
          '5': 'hsl(var(--secondary-hsl))', // Secondary Orange
  			},

        // Explicit HSL vars for shadcn compatibility if needed, derived from hex
        '--primary-hsl': '180 100% 25%', // #008080
        '--secondary-hsl': '39 100% 50%', // #FFA500
        '--danger-hsl': '10 78% 46%', // #E53935
        '--warning-hsl': '45 97% 58%', // #FBC02D
        '--info-hsl': '283 63% 40%', // #8E24AA
        '--surface-hsl': '0 0% 100%', // #FFFFFF
        '--background-hsl': '0 0% 98%', // #FAFAFA
        '--foreground-hsl': '0 0% 20%', // #333333
        '--muted-foreground-hsl': '0 0% 31%', // #4F4F4F
        '--border-hsl': '0 0% 88%', // #E0E0E0
        '--sidebar-hsl': '0 0% 12%', // #1E1E1E
        '--sidebar-foreground-hsl': '0 0% 97%', // #F8F8F8
        '--sidebar-hover-hsl': '0 0% 16%', // #2A2A2A
        '--sidebar-accent-hsl': '180 100% 25%', // #008080 (same as primary)

  		},
  		borderRadius: {
  			lg: '8px', // Explicit 8px radius
  			md: '6px',
  			sm: '4px'
  		},
      boxShadow: {
         'card': '0 2px 8px rgba(0,0,0,0.1)', // Custom card shadow
         'overlay': '0 4px 12px rgba(0,0,0,0.2)', // Custom overlay shadow
      },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
              'collapsible-down': {
                 from: { height: '0' },
                 to: { height: 'var(--radix-collapsible-content-height)' },
               },
               'collapsible-up': {
                 from: { height: 'var(--radix-collapsible-content-height)' },
                 to: { height: '0' },
              },
              fadeIn: {
                 from: { opacity: '0' },
                 to: { opacity: '1' },
               },
              slideUp: { // Added slideUp animation
                  from: { transform: 'translateY(10px)', opacity: '0' },
                  to: { transform: 'translateY(0)', opacity: '1' },
              },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
             'collapsible-down': 'collapsible-down 0.2s ease-out',
             'collapsible-up': 'collapsible-up 0.2s ease-out',
             fadeIn: 'fadeIn 0.5s ease-out forwards',
             slideUp: 'slideUp 0.3s ease-out forwards', // Added slideUp animation
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
