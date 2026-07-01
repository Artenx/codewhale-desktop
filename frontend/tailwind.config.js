/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          200: "rgb(var(--ink-200) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          400: "rgb(var(--ink-400) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          600: "rgb(var(--ink-600) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
        },
        whale: {
          DEFAULT: "#2563eb",
          dim: "#1e40af",
          glow: "#3b82f6",
          muted: "#1e3a5f",
        },
        ok: "#22c55e",
        warn: "#eab308",
        err: "#ef4444",
        live: "#3b82f6",
      },
      fontFamily: {
        mono: [
          "JetBrains Mono", "SF Mono", "Fira Code", "Cascadia Code",
          "Menlo", "Monaco", "Consolas", "monospace",
        ],
        sans: [
          "-apple-system", "BlinkMacSystemFont", "SF Pro Text",
          "Helvetica Neue", "PingFang SC", "Microsoft YaHei", "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "cursor-blink": "blink 1s step-end infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(4px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
    },
  },
  plugins: [],
};
