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
    <a
      href={href}
      rel="noopener"
      className={className}
      // Already sends its own `outbound` beacon (with a real `medium`, not
      // `auto`) — opt out of OutboundTracker's delegated handler so the
      // click is not recorded twice.
      data-fp-skip-auto
      onClick={() => track({ e: 'outbound', target, medium })}
    >
      {children}
    </a>
  );
}
