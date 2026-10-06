#!/usr/bin/env node
/**
 * completeArticleNode runs inside JsonLd on every page of the site, so a
 * mistake here would rewrite structured data nobody looks at. These cases pin
 * the two promises: it fills only what a guide is missing, and it leaves every
 * other node (and an already complete article) exactly as it came in.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { completeArticleNode } from '../src/lib/jsonld.ts';

const D = {
  organizationId: 'https://flightpowers.com/#organization',
  organizationName: 'FlightPowers',
  authorName: 'Matan Rabi',
  authorUrl: 'https://flightpowers.com/about',
  imageFor: (title) => `https://flightpowers.com/og/${title.length}.png`,
};

test('a guide TechArticle gets the publisher @id, the author url and an image', () => {
  const guide = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Hello',
    author: { '@type': 'Person', name: 'Matan Rabi' },
    publisher: { '@type': 'Organization', name: 'FlightPowers' },
  };
  assert.deepEqual(completeArticleNode(guide, D), {
    ...guide,
    author: { '@type': 'Person', name: 'Matan Rabi', url: 'https://flightpowers.com/about' },
    publisher: { '@id': 'https://flightpowers.com/#organization' },
    image: 'https://flightpowers.com/og/5.png',
  });
});

test('a HowTo uses its name for the image', () => {
  const howTo = { '@type': 'HowTo', name: 'Seven', author: { '@type': 'Person', name: 'Matan Rabi' } };
  assert.equal(completeArticleNode(howTo, D).image, 'https://flightpowers.com/og/5.png');
});

test('a complete blog post comes back equal', () => {
  const post = {
    '@type': 'BlogPosting',
    headline: 'Post',
    author: { '@type': 'Person', name: 'Matan Rabi', url: 'https://flightpowers.com/about' },
    publisher: { '@id': 'https://flightpowers.com/#organization' },
    image: 'https://flightpowers.com/og/x.png',
  };
  assert.deepEqual(completeArticleNode(post, D), post);
});

test('non-article nodes and other names are untouched', () => {
  const faq = { '@type': 'FAQPage', mainEntity: [] };
  assert.equal(completeArticleNode(faq, D), faq);
  const other = {
    '@type': 'TechArticle',
    image: 'x',
    author: { '@type': 'Person', name: 'Someone Else' },
    publisher: { '@type': 'Organization', name: 'Another Co' },
  };
  assert.deepEqual(completeArticleNode(other, D), other);
});
