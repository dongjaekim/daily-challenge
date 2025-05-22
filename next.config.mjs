/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true, // ⚠️ 외부 SVG 허용 (주의 필요)
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cilrbbhmacgmkcajocnt.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/images/posts/**",
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
}

export default nextConfig 