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
        tan: {
          50: "#fbf8f1",
          100: "#f5eddf",
          200: "#ead9be",
          300: "#d5b181",
          400: "#cd9d6a",
          500: "#c2844d",
          600: "#b47042",
          700: "#965938",
          800: "#794933",
          900: "#623d2c",
          950: "#341e16",
        },
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
