'use client';

import { useEffect } from 'react';
import { claimSessionStart } from '@/lib/attribution';
import { track } from '@/lib/track';

/**
 * Fires exactly one `session_start` beacon per browser tab, carrying the
 * first-touch campaign labels from the URL.
 *
 * This is the denominator. Without it we can count that someone copied a curl
 * snippet but not how many people arrived from the post that sent them, so
 * every rate we could quote would have no bottom half.
 *
 * Mounted once in the root layout. It renders nothing, blocks nothing, and
 * does nothing at all when the URL carries no campaign and there is no
 * referrer worth recording — the beacon still fires, so direct traffic has a
 * count to compare against.
 */
export function SessionBeacon() {
  useEffect(() => {
    const attr = claimSessionStart();
    if (!attr) return; // already counted this tab
    track({ e: 'session_start' });
  }, []);

  return null;
}
