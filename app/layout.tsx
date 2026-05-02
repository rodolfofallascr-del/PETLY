import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Petly | Red social para mascotas",
  description: "Petly conecta mascotas, familias, servicios, eventos y adopciones responsables.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
