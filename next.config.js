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
      {
        source: '/sales-interview',
        destination: '/sales-interview/index.html',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
