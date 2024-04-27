const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        sax: {
          dark: "#161516",
          tan: "#D9BE91",
        },
      },
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
