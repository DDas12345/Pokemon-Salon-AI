import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Salon & Spheal | A softer kind of self-care",
  description: "A thoughtful beauty studio in Celadon City where beloved Pokémon elements meet the art of slowing down.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
