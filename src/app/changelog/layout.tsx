import type { Metadata } from 'next';
import { Container, Breadcrumbs } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'Dated notes on changes to the FlightPowers flight and hotel APIs and to this developer site.',
  alternates: { canonical: '/changelog' },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-14 sm:py-20">
      <Breadcrumbs trail={[{ href: '/', label: 'developers' }, { href: '/changelog', label: 'changelog' }]} />
      <article className="prose-fp mt-6 max-w-3xl">{children}</article>
    </Container>
  );
}
