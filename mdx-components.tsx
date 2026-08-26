import type { MDXComponents } from 'mdx/types';

/**
 * MDX renders to plain server components — no client runtime, no hydration.
 * Styling comes from the `.prose-fp` rules in globals.css. Tables get a
 * .scroll-x wrapper so wide ones scroll inside their own container on
 * mobile, with the right-edge fade as the affordance.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    table: (props) => (
      <div className="scroll-x">
        <table {...props} />
      </div>
    ),
  };
}
