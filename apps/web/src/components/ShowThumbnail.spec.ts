// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import type { Show } from '@show-browse/shows';
import ShowThumbnail from './ShowThumbnail.vue';
import {
  setupMockIntersectionObserver,
  latestCallback,
} from '../test-utils/mockIntersectionObserver';

// Setup the IntersectionObserver mock before tests
setupMockIntersectionObserver();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/shows/:id',
      name: 'ShowDetail',
      component: { template: '<div/>' },
    },
  ],
});

const mockShow: Show = {
  id: 42,
  title: 'Breaking Bad',
  showType: 'Scripted',
  overview: 'A chemistry teacher turns to crime.',
  posterUrl: 'https://example.com/poster.jpg',
  backdropUrl: '',
  releaseDate: '2008-01-20',
  rating: 9.5,
  genres: ['Drama', 'Crime'],
};

function mountComponent(show: Show) {
  return mount(ShowThumbnail, {
    props: { show },
    global: { plugins: [router] },
  });
}

describe('ShowThumbnail', () => {
  beforeEach(async () => {
    await router.push({ name: 'ShowDetail', params: { id: mockShow.id } });
    await router.isReady();
  });

  it('renders the show title', () => {
    const wrapper = mountComponent(mockShow);
    expect(wrapper.find('h3').text()).toBe('Breaking Bad');
  });

  it('renders the rating', () => {
    const wrapper = mountComponent(mockShow);
    expect(wrapper.text()).toContain('9.5');
  });

  it('renders the poster image when posterUrl is provided', async () => {
    const wrapper = mountComponent(mockShow);
    // Simulate intersection
    if (latestCallback) {
      latestCallback([{ isIntersecting: true }]);
      await wrapper.vm.$nextTick();
    }
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/poster.jpg');
    expect(img.attributes('alt')).toBe('Breaking Bad');
  });

  it('renders a fallback when posterUrl is empty', () => {
    const wrapper = mountComponent({ ...mockShow, posterUrl: '' });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('No Image');
  });

  it('links to the show detail route', () => {
    const wrapper = mountComponent(mockShow);
    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('/shows/42');
  });
});
