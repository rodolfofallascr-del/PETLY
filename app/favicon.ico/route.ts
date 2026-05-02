export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="18" fill="#172027"/>
    <text x="32" y="42" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#f4b860">P</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/svg+xml",
    },
  });
}
