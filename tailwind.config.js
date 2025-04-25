// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff950e',
        background: '#0a0a0a',
        accent: '#ededed',
        card: '#171717',
        'primary-dark': '#e0850d',
        'primary-light': '#ffb347',
      },
    },
  },
  plugins: [],
}
