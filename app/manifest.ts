import type { MetadataRoute } from "next";

// Lets phones add the site to the home screen and open it like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Album of the Day",
    short_name: "Album of the Day",
    description: "One album a day. Listen start to finish, score it, compare with everyone else.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
