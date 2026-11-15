module.exports = {
  reactStrictMode: true,
  images: {
    // Artwork lives in the Supabase "art" storage bucket; lib/img.js asks for sized copies of it.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }],
    // Artwork files never change in place (each upload gets a new name), so resized copies can be cached for a month.
    minimumCacheTTL: 2678400,
  },
};
