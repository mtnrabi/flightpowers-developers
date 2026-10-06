/**
 * Fills in the three fields an article node needs and the guides never typed.
 *
 * Every guide carries its own TechArticle (one HowTo) block in its page.mdx,
 * written before the brand node existed, so all 39 ship
 * `publisher: { '@type': 'Organization', name: 'FlightPowers' }` (a stub that
 * points at nothing), an author with no url, and no image. The three blog
 * posts already carry the right shape by hand. Doing it here, once, means a
 * guide written or rewritten tomorrow gets it too, without touching 39 files.
 *
 * It only ADDS what is missing or swaps the one stub; a node that already has
 * an image, an author url or a publisher @id comes back unchanged. No imports,
 * so `npm test` can run it under plain node.
 */

export type ArticleDefaults = {
  /** `${SITE.url}/#organization`, the @id of the brand node in the root layout. */
  organizationId: string;
  organizationName: string;
  authorName: string;
  authorUrl: string;
  /** Absolute URL of the share card for a title. */
  imageFor: (title: string) => string;
};

const ARTICLE_TYPES = new Set(['Article', 'TechArticle', 'BlogPosting', 'HowTo']);

type Node = Record<string, unknown>;

function isObject(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function completeArticleNode(node: Node, d: ArticleDefaults): Node {
  if (typeof node['@type'] !== 'string' || !ARTICLE_TYPES.has(node['@type'])) return node;
  const out: Node = { ...node };

  const publisher = node.publisher;
  if (
    isObject(publisher) &&
    publisher['@type'] === 'Organization' &&
    publisher.name === d.organizationName &&
    publisher['@id'] === undefined
  ) {
    out.publisher = { '@id': d.organizationId };
  }

  const author = node.author;
  if (isObject(author) && author['@type'] === 'Person' && author.name === d.authorName && author.url === undefined) {
    out.author = { ...author, url: d.authorUrl };
  }

  const title = typeof node.headline === 'string' ? node.headline : typeof node.name === 'string' ? node.name : null;
  if (node.image === undefined && title) out.image = d.imageFor(title);

  return out;
}
