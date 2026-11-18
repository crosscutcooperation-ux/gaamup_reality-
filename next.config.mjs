/** @type {import('next').NextConfig} */
const backend=process.env.AERO_BACKEND_URL||`http://127.0.0.1:${process.env.AERO_BACKEND_PORT||4000}`;
const nextConfig={
  poweredByHeader:false,
  devIndicators:false,
  experimental:{proxyClientMaxBodySize:'200mb'},
  distDir:process.env.AERO_NEXT_DIST_DIR||'.next',
  async rewrites(){return [{source:'/api/:path*',destination:`${backend}/api/:path*`},{source:'/uploads/:path*',destination:`${backend}/uploads/:path*`},{source:'/scene-assets/:path*',destination:`${backend}/scene-assets/:path*`}];},
};
export default nextConfig;
