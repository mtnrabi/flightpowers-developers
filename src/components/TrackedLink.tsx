'use client';

import type { ReactNode } from 'react';
import { track } from '@/lib/track';

/** Outbound <a> that records the click in first-party analytics. */
export function TrackedLink({
  href,
  target,
  medium,
  className,
  children,
}: {
  href: string;
  target: string;
  medium: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} rel="noopener" className={className} onClick={() => track({ e: 'outbound', target, medium })}>
      {children}
    </a>
  );
}
