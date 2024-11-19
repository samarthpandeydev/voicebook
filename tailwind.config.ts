import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          dark: '#4338CA',
        },
        secondary: {
          DEFAULT: '#7C3AED',
          dark: '#6D28D9',
        },
        success: '#059669',
        error: '#DC2626',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)'],
      },
    },
  },
  plugins: [],
} satisfies Config;
