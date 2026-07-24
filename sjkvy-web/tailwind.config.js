/** SJKVY design system — extracted verbatim from the Stitch export (do not alter values).
 *  darkMode, colors, borderRadius, spacing and fontFamily are byte-faithful to Stitch so
 *  every generated class resolves identically. Undefined typography utilities Stitch emitted
 *  (e.g. text-display-md) remain no-ops here exactly as they were under the Tailwind CDN. */
import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
              "on-error": "#ffffff",
              "secondary-container": "#fed488",
              "inverse-surface": "#303030",
              "tertiary-container": "#707173",
              "inverse-on-surface": "#f3f0ef",
              "secondary": "#775a19",
              "surface-tint": "#376847",
              "secondary-fixed-dim": "#e9c176",
              "tertiary-fixed-dim": "#c6c6c9",
              "on-secondary-fixed-variant": "#5d4201",
              "secondary-fixed": "#ffdea5",
              "surface-dim": "#dcd9d8",
              "on-tertiary-fixed-variant": "#454749",
              "outline-variant": "#c1c9bf",
              "on-primary-fixed-variant": "#1e5031",
              "primary": "#316342",
              "on-primary-fixed": "#00210e",
              "on-primary-container": "#e1ffe5",
              "surface-container": "#f0edec",
              "surface-variant": "#e4e2e1",
              "on-secondary": "#ffffff",
              "on-tertiary-fixed": "#1a1c1e",
              "on-tertiary-container": "#f7f7f9",
              "inverse-primary": "#9dd3aa",
              "primary-fixed-dim": "#9dd3aa",
              "on-background": "#1b1c1b",
              "surface-container-high": "#eae7e7",
              "surface": "#fcf9f8",
              "tertiary": "#57595b",
              "background": "#fcf9f8",
              "surface-container-highest": "#e4e2e1",
              "surface-container-lowest": "#ffffff",
              "tertiary-fixed": "#e2e2e5",
              "primary-container": "#4a7c59",
              "on-error-container": "#93000a",
              "on-surface-variant": "#414942",
              "error-container": "#ffdad6",
              "error": "#ba1a1a",
              "surface-container-low": "#f6f3f2",
              "on-secondary-fixed": "#261900",
              "outline": "#717971",
              "on-surface": "#1b1c1b",
              "primary-fixed": "#b9efc5",
              "surface-bright": "#fcf9f8",
              "on-tertiary": "#ffffff",
              "on-secondary-container": "#785a1a",
              "on-primary": "#ffffff"
      },
      borderRadius: {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
      },
      spacing: {
              "sidebar-width": "280px",
              "margin-desktop": "48px",
              "base": "8px",
              "gutter": "24px",
              "topbar-height": "72px",
              "margin-mobile": "16px",
              "max-width": "1440px"
      },
      fontFamily: {
              "display": [
                      "Playfair Display",
                      "serif"
              ],
              "body": [
                      "Inter",
                      "sans-serif"
              ]
      },
    },
  },
  // Same plugins Stitch loaded via the CDN query (?plugins=forms,container-queries).
  plugins: [forms, containerQueries],
};
