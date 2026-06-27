/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Codex-style monochrome palette
        ink: {
          DEFAULT: "#0d0d0d",
          50: "#1a1a1a",
          100: "#212121",
          200: "#2a2a2a",
          300: "#333333",
          400: "#444444",
          500: "#666666",
          600: "#888888",
          700: "#aaaaaa",
          800: "#cccccc",
          900: "#e5e5e5",
        },
        // CodeWhale accent
        whale: {
          DEFAULT: "#2563eb",
          dim: "#1e40af",
          glow: "#3b82f6",
          muted: "#1e3a5f",
        },
        // Semantic
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
