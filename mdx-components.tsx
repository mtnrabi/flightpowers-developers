import type { MDXComponents } from 'mdx/types';

/**
 * MDX renders to plain server components — no client runtime, no hydration.
 * Styling comes from the `.prose-fp` rules in globals.css.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components };
}
