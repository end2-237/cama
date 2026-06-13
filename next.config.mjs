/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactive le prerendering statique — toutes les pages sont rendues dynamiquement
  // Nécessaire car Supabase client requiert les env vars au runtime
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
