import { renderCard, titleFromCard } from '../card';

/**
 * The share card: /og/<base64url(title)>.png
 *
 * `force-static` is the whole point — see src/app/og/card.tsx for why. It makes
 * this a prerendered route rather than a function call, so a card is rendered
 * once and then served as a static object from every region, for as long as the
 * deployment lives. `dynamicParams` keeps a title that was never prerendered
 * working: it renders on first request and joins the cache.
 *
 * Lives under /og (not /api/og) so robots.txt's `Disallow: /api/` never applies.
 */

export const dynamic = 'force-static';
export const dynamicParams = true;

type Props = { params: Promise<{ card: string }> };

export async function GET(_req: Request, { params }: Props) {
  const { card } = await params;
  const title = titleFromCard(card);
  // A segment that is not a title is not a card. Answering it with a default
  // image would let any made-up URL mint a fresh render, which is the cost
  // this route exists to avoid.
  if (!title) return new Response(null, { status: 404 });
  return renderCard(title);
}
