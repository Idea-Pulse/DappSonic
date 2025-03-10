/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        "primary-light": "#4F46E5", // Deep indigo blue
        "primary-dark": "#8B5CF6", // Bright purple
        "secondary-light": "#06B6D4", // Tech cyan
        "secondary-dark": "#3B82F6", // Electric blue
        "accent-light": "#10B981", // Bright emerald green
        "accent-dark": "#14F195", // Neon green
        "neutral-light": "#1E293B", // Deep blue-gray
        "neutral-dark": "#334155", // Medium blue-gray
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "slide-left": "slideLeft 0.5s ease-out",
        "slide-right": "slideRight 0.5s ease-out",
        "scale-up": "scaleUp 0.3s ease-out",
        "bounce-soft": "bounceSoft 2s infinite",
        "pulse-soft": "pulseSoft 2s infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 3s ease-in-out infinite",
        "tech-pulse": "techPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideRight: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(79, 70, 229, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(79, 70, 229, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        techPulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.03)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "tech-grid":
          "linear-gradient(to right, rgba(79, 70, 229, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 70, 229, 0.1) 1px, transparent 1px)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          primary: "#4F46E5", // Deep indigo blue
          secondary: "#06B6D4", // Tech cyan
          accent: "#10B981", // Emerald green
          neutral: "#1E293B", // Deep blue-gray
          "base-100": "#ffffff",
          "base-200": "#F8FAFC",
          "base-300": "#F1F5F9",
          info: "#3B82F6", // Electric blue
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
        dark: {
          primary: "#8B5CF6", // Bright purple
          secondary: "#3B82F6", // Electric blue
          accent: "#14F195", // Neon green
          neutral: "#334155", // Medium blue-gray
          "base-100": "#0F172A", // Deep blue-black
          "base-200": "#1E293B", // Deeper blue-gray
          "base-300": "#334155", // Medium blue-gray
          info: "#60A5FA",
          success: "#34d399",
          warning: "#fbbf24",
          error: "#f87171",
        },
      },
    ],
  },
};
