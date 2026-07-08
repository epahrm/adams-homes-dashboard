/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/land-acq-pro',
        destination: '/land-acq-pro/index.html',
        permanent: false,
      },
      // Clean, postcard-friendly entry point for the QR code. Keeping the QR
      // pointed at a stable path we control means the printed postcard never
      // breaks even if the seller page moves or the site gets a custom domain.
      {
        source: '/sell',
        destination: '/land-acq-pro/index.html',
        permanent: false,
      },
      // Family travel planner (static app in public/travel).
      {
        source: '/travel',
        destination: '/travel/index.html',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
