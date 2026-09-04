import { renderCard, titleFromCard } from '../card';
import { ogCard } from '../card-url';
import { allCardTitles } from '../titles';

/**
 * The share card: /og/<base64url(title)>.png
 *
 * `force-static` plus `generateStaticParams` is the whole point — see
 * src/app/og/card.tsx and src/app/og/titles.ts for why. Every title the site
 * links is rendered during the BUILD and served as a static object from every
 * region for the life of the deployment, so the steady state is zero function
 * invocations and a deploy no longer restarts a trickle of cold renders.
 * `dynamicParams` keeps a title that was never prerendered working: it renders
 * on first request and joins the cache.
 *
 * Lives under /og (not /api/og) so robots.txt's `Disallow: /api/` never applies.
 */

export const dynamic = 'force-static';
export const dynamicParams = true;

export function generateStaticParams(): { card: string }[] {
  return allCardTitles().map((title) => ({ card: ogCard(title) }));
}

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
