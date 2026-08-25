import { Container, Cta } from '@/components/ui';

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-3xl font-semibold">No route for that request</h1>
      <p className="lede mt-4 mx-auto max-w-md">
        The page you asked for is not on this host. The two API references are below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Cta href="/flights-api">Flights API</Cta>
        <Cta href="/hotels-api" variant="ghost">
          Hotels API
        </Cta>
      </div>
    </Container>
  );
}
