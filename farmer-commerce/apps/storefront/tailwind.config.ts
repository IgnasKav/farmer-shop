import type { Config } from "tailwindcss"

export default <Partial<Config>>{
  content: ["./app/**/*.{vue,js,ts}", "./shared/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf9f6",
        ink: "#26372b",
        green: "#39563c",
        muted: "#74796f",
        line: "#e3e4dc",
        pale: "#edf0e6",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
}
