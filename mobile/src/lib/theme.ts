// Same colours as the website: black background, white text, hot orange accents.
export const C = {
  orange: "#FF4F12",
  onOrange: "#0A0502",
  bg: "#000000",
  surface: "#111111",
  ink: "#FFFFFF",
  muted: "#9B9B9B",
  line: "#262626",
  soft: "#1F120C",
  vinyl: "#0B0A09",
  warn: "#FF9A6B",
};

// Fixed-weight cuts of Archivo (the website uses the same font at these weights and widths).
export const F = {
  display: "Archivo-Display", // 850 weight, 75% width: album titles and page titles
  heading: "Archivo-Heading", // 800 weight, 80% width: panel headings
  regular: "Archivo-Regular",
  semibold: "Archivo-SemiBold",
  bold: "Archivo-Bold",
  mono: "IBMPlexMono-Regular",
  monoBold: "IBMPlexMono-SemiBold",
};

export const FONT_FILES = {
  [F.display]: require("../../assets/fonts/Archivo-Display.ttf"),
  [F.heading]: require("../../assets/fonts/Archivo-Heading.ttf"),
  [F.regular]: require("../../assets/fonts/Archivo-Regular.ttf"),
  [F.semibold]: require("../../assets/fonts/Archivo-SemiBold.ttf"),
  [F.bold]: require("../../assets/fonts/Archivo-Bold.ttf"),
  [F.mono]: require("../../assets/fonts/IBMPlexMono-Regular.ttf"),
  [F.monoBold]: require("../../assets/fonts/IBMPlexMono-SemiBold.ttf"),
};
