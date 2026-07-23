// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router';
import { describe, it, expect } from 'vitest';
import ShowCarousel from './ShowCarousel.vue';
import { setupMockResizeObserver } from '../test-utils/mockResizeObserver';
import { setupMockIntersectionObserver } from '../test-utils/mockIntersectionObserver';

// Setup ResizeObserver and IntersectionObserver mocks for jsdom
setupMockResizeObserver();
setupMockIntersectionObserver();

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    {
      path: '/shows/:id',
      name: 'ShowDetail',
      component: { template: '<div />' },
    },
    { path: '/catalog', name: 'Catalog', component: { template: '<div />' } },
  ],
});

const minimalShows = [
  {
    id: 1,
    title: 'Test Show',
    showType: 'Scripted',
    overview: '',
    posterUrl: '',
    backdropUrl: '',
    releaseDate: '',
    rating: 0,
    genres: [],
  },
];

describe('ShowCarousel', () => {
  it('mounts and renders', () => {
    const wrapper = mount(ShowCarousel, {
      props: { genre: 'Drama', shows: minimalShows },
      global: {
        plugins: [router],
        stubs: { RouterLink },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders the correct genre title', () => {
    const wrapper = mount(ShowCarousel, {
      props: { genre: 'Comedy', shows: minimalShows },
      global: { plugins: [router], stubs: { RouterLink } },
    });

    expect(wrapper.find('h2').text()).toBe('Comedy');
  });

  it('renders all show thumbnails', () => {
    const shows = [
      { ...minimalShows[0], id: 1 },
      { ...minimalShows[0], id: 2, title: 'Another Show' },
    ];
    const wrapper = mount(ShowCarousel, {
      props: { genre: 'Drama', shows },
      global: { plugins: [router], stubs: { RouterLink } },
    });

    expect(wrapper.findAllComponents({ name: 'ShowThumbnail' }).length).toBe(2);
  });

  it('handles empty shows array gracefully', () => {
    const wrapper = mount(ShowCarousel, {
      props: { genre: 'Drama', shows: [] },
      global: { plugins: [router], stubs: { RouterLink } },
    });

    expect(wrapper.findAllComponents({ name: 'ShowThumbnail' }).length).toBe(0);
  });

  it('does not render a "See all" link when seeAllTo is omitted', () => {
    const wrapper = mount(ShowCarousel, {
      props: { genre: 'Drama', shows: minimalShows },
      global: { plugins: [router], stubs: { RouterLink } },
    });

    expect(wrapper.text()).not.toContain('See all');
  });

  it('renders a "See all" link pointing at Catalog when seeAllTo is provided', async () => {
    const wrapper = mount(ShowCarousel, {
      props: {
        genre: 'Drama',
        shows: minimalShows,
        seeAllTo: { name: 'Catalog', query: { genre: 'Drama' } },
      },
      global: { plugins: [router], stubs: { RouterLink } },
    });
    await router.isReady();

    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.text()).toBe('See all ›');
    expect(link.attributes('href')).toBe('/catalog?genre=Drama');
  });
});
