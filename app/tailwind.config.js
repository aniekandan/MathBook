/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meridian-bg': '#f8fafc', // slate-50
        'meridian-shell': '#020617', // slate-950
        'meridian-books': '#8b5cf6', // violet
        'meridian-drive': '#06b6d4', // cyan
        'meridian-docs': '#10b981',  // emerald
        'meridian-cpanel': '#f59e0b', // amber
      },
    },
  },
  plugins: [],
}
