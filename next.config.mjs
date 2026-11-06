/**
 * Luxe Kanban — Next.js config (static export).
 *
 * - `output: 'export'`  : hasil build berupa situs 100% statis di folder `out/`.
 * - `trailingSlash`     : menghasilkan `beranda/index.html` agar aman di GitHub Pages.
 * - `basePath`          : diatur lewat env `NEXT_PUBLIC_BASE_PATH`.
 *                         GitHub Pages project-site → `NEXT_PUBLIC_BASE_PATH=/<nama-repo>`.
 *                         Custom domain / root → `NEXT_PUBLIC_BASE_PATH=` (kosong).
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath || undefined,
};

export default nextConfig;
