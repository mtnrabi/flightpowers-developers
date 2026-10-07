import Script from 'next/script';
import { gaBootstrap, gaMeasurementId } from '@/lib/ga';

/** GA4 tag, mounted once in the root layout. Renders nothing without an id. See src/lib/ga.ts. */
export function GoogleAnalytics() {
  const id = gaMeasurementId();
  if (!id) return null;
  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {gaBootstrap(id)}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}
