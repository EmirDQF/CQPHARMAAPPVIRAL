import { ImageResponse } from "next/og";
import { ArtikareOgImage } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Artikare — Salud Osteoarticular";

export default function OpengraphImage() {
  return new ImageResponse(<ArtikareOgImage />, size);
}
