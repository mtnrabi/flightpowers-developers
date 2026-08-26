import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

/**
 * The six consumer blog posts indexed on the OLD flightpowers.com apex move
 * with the consumer product to demo.flightpowers.com. These 301s live here
 * because after the apex swap THIS project serves flightpowers.com.
 * (They are inert until demo. resolves — see README "Apex swap runbook".)
 */
const OLD_CONSUMER_POSTS = [
  'flex-dates-cheaper-flights',
  'google-oauth-king',
  'prompt-kings',
  'custom-flight-scrape-logic',
  'reddit-launch',
  'aws-lambda-good-bad-ugly',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      ...OLD_CONSUMER_POSTS.map((slug) => ({
        source: `/blog/${slug}`,
        destination: `https://demo.flightpowers.com/blog/${slug}`,
        permanent: true,
      })),
      // The integrations hub's MCP entry is the /mcp page.
      { source: '/integrations/mcp', destination: '/mcp', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The site is fully self-contained (self-hosted fonts, no third-party
          // scripts), so the CSP can be tight. 'unsafe-inline' for scripts is
          // required by Next's own bootstrap inline scripts.
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; font-src 'self'; connect-src 'self'; " +
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
});

export default withMDX(nextConfig);
