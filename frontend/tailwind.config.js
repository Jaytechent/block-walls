/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#0A0B0C",
        charcoal: "#141517",
        border: "#26282C",
        ink: "#F5F5F3",
        muted: "#8A8D93",
        signal: "#00D26A", // restrained Robinhood-Chain-inspired green, accent only
        amber: "#F5A623",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular"],
      },
      borderRadius: {
        none: "0px",
        sm: "1px", // deliberately near-zero: sharp four-corner system, not rounded
      },
    },
  },
  plugins: [],
};
