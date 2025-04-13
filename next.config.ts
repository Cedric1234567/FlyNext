// next.config.mjs (or .js)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your existing output setting
  output: 'standalone',

  // Add the images configuration
  images: {
    remotePatterns: [
      // Pattern for images.app.goo.gl (often redirects)
      {
        protocol: 'https',
        hostname: 'images.app.goo.gl',
        // No port needed for standard HTTPS
        // pathname: '/**', // Allow any path, adjust if needed
      },
      // Pattern needed for where goo.gl often redirects
       {
         protocol: 'https',
         hostname: '**.googleusercontent.com', // Allow subdomains
       },
       {
         protocol: 'https',
         hostname: 'lh3.googleusercontent.com', // Specific common host
       },

      // --- ADD ANY OTHER DOMAINS YOU NEED HERE ---
      // Example:
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
        pathname: '/images/**',
      }
    ],
  },

  // Add other configurations if you have them
  // reactStrictMode: true,

};

export default nextConfig;