/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["horizon-testnet.stellar.org"],
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["@stellar/stellar-sdk"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    config.externals = config.externals || [];
    if (isServer) config.externals.push("@stellar/freighter-api");
    return config;
  },
};

export default nextConfig;
