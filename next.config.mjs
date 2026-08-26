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
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
});

export default withMDX(nextConfig);
