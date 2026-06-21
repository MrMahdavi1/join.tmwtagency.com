/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "kajabi-storefronts-production.kajabi-cdn.com" },
    ],
  },
};

export default nextConfig;
