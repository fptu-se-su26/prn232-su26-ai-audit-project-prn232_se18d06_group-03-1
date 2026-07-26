/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      /*
       * MoveVN design system
       *
       * Keep the familiar Tailwind utility names so existing screens inherit
       * the same readable scale without page-specific overrides.
       */
      fontSize: {
        xs: ["var(--font-size-caption)", { lineHeight: "var(--line-height-body)" }],
        sm: ["var(--font-size-small)", { lineHeight: "var(--line-height-body)" }],
        base: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)" }],
        lg: ["var(--font-size-body-lg)", { lineHeight: "var(--line-height-body)" }],
        xl: ["var(--font-size-section)", { lineHeight: "var(--line-height-heading)" }],
        "2xl": ["var(--font-size-h3)", { lineHeight: "var(--line-height-heading)" }],
        "3xl": ["var(--font-size-h2)", { lineHeight: "var(--line-height-heading)" }],
        "4xl": ["var(--font-size-h1)", { lineHeight: "var(--line-height-heading)" }],
        "5xl": ["var(--font-size-display)", { lineHeight: "var(--line-height-heading)" }],
        "6xl": ["var(--font-size-display)", { lineHeight: "var(--line-height-heading)" }],
        "7xl": ["var(--font-size-display)", { lineHeight: "var(--line-height-heading)" }],
        "8xl": ["var(--font-size-display)", { lineHeight: "var(--line-height-heading)" }],
        "9xl": ["var(--font-size-display)", { lineHeight: "var(--line-height-heading)" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "600",
        extrabold: "700",
        black: "700",
      },
      lineHeight: {
        heading: "var(--line-height-heading)",
        body: "var(--line-height-body)",
        paragraph: "var(--line-height-paragraph)",
      },
      spacing: {
        "ui-1": "var(--space-1)",
        "ui-2": "var(--space-2)",
        "ui-3": "var(--space-3)",
        "ui-4": "var(--space-4)",
        "ui-5": "var(--space-5)",
        "ui-6": "var(--space-6)",
        "ui-8": "var(--space-8)",
        "ui-10": "var(--space-10)",
        "ui-12": "var(--space-12)",
        "ui-16": "var(--space-16)",
        "ui-20": "var(--space-20)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        DEFAULT: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
      zIndex: {
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
      },
      maxWidth: {
        content: "var(--container-content)",
        wide: "var(--container-wide)",
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      fontFamily: {
        sans: ['"Quicksand"', '"Be Vietnam Pro"', 'sans-serif'],
      },
      colors: {
        /*
         * Branded editorial colors used by marketing/auth illustrations.
         * They are named here so page components never carry raw color values.
         */
        app: {
          "page-start": "#faf7ff",
          "page-end": "#f5efff",
          "dark-start": "#0e0720",
          "dark-end": "#05030f",
          purple: "#6b19ff",
          "purple-deep": "#5215a2",
          blue: "#315df4",
          ink: "#101936",
          facebook: "#1877f2",
          "dark-hover": "#2a2236",
          "violet-25": "#faf6ff",
          "violet-50": "#f7f5ff",
          "violet-75": "#f6f2ff",
          "violet-100": "#f5f3ff",
          "violet-125": "#f5f2ff",
          "violet-150": "#f7f2ff",
          "violet-175": "#fbf9ff",
          canvas: "#fafafa",
          "canvas-cool": "#f7f8fc",
          blush: "#ffb6db",
          lavender: "#cfa9ff",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
        },
        surface: {
          base: "var(--color-surface-base)",
          subtle: "var(--color-surface-subtle)",
          card: "var(--color-surface-card)",
          elevated: "var(--color-surface-elevated)",
          modal: "var(--color-surface-modal)",
          hover: "var(--color-surface-hover)",
        },
        "ui-border": {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          subtle: "var(--color-primary-subtle)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)",
          surface: "var(--color-success-surface)",
          border: "var(--color-success-border)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-foreground)",
          surface: "var(--color-warning-surface)",
          border: "var(--color-warning-border)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--color-danger-foreground)",
          surface: "var(--color-danger-surface)",
          border: "var(--color-danger-border)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          foreground: "var(--color-info-foreground)",
          surface: "var(--color-info-surface)",
          border: "var(--color-info-border)",
        },
        brand: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' },
        ink: {
          950: "#101820",
        },
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "dark-card": "var(--shadow-card)",
        "dark-elevated": "var(--shadow-elevated)",
        "dark-modal": "var(--shadow-modal)",
      },
    },
  },
  plugins: [],
};
