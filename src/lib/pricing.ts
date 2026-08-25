/**
 * Plan data read from the live RapidAPI listings on 2026-08-25.
 * Nothing here is estimated. If a figure is not on the listing it is not here.
 * Re-read the listings before changing any number, and update READ_ON.
 */
export const READ_ON = '2026-08-25';

export type Plan = {
  name: string;
  price: string;
  requests: string;
  rate: string | null;
  overage: string | null;
  recommended?: boolean;
};

export const FLIGHT_PLANS: Plan[] = [
  { name: 'Basic', price: '$0', requests: '10 / month', rate: null, overage: null },
  { name: 'Pro', price: '$10', requests: '2,500 / month', rate: '150 / minute', overage: '$0.003 per extra request' },
  {
    name: 'Ultra',
    price: '$25',
    requests: '10,000 / month',
    rate: '250 / minute',
    overage: '$0.003 per extra request',
    recommended: true,
  },
  { name: 'Mega', price: '$50', requests: '50,000 / month', rate: '500 / minute', overage: '$0.001 per extra request' },
];

export const HOTEL_PLANS: Plan[] = [
  { name: 'Basic', price: '$0', requests: '10 / month', rate: null, overage: null },
  { name: 'Pro', price: '$10', requests: '2,000 / month', rate: '25 / minute', overage: '$0.006 per extra request' },
  { name: 'Ultra', price: '$20', requests: '6,500 / month', rate: '25 / minute', overage: '$0.003 per extra request' },
  { name: 'Mega', price: '$50', requests: '25,000 / month', rate: '50 / minute', overage: '$0.002 per extra request' },
];
