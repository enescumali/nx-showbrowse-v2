// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router';
import { describe, it, expect } from 'vitest';
import HeroBanner from './HeroBanner.vue';

const minimalShow = {
  id: 1,
  title: 'Test Show',
  showType: 'Scripted',
  overview: '',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '',
  rating: 0,
  genres: [],
};

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    {
      path: '/shows/:id',
      name: 'ShowDetail',
      component: { template: '<div />' },
    },
  ],
});

describe('HeroBanner', () => {
  it('mounts and renders', () => {
    const wrapper = mount(HeroBanner, {
      props: { show: minimalShow },
      global: {
        plugins: [router],
        stubs: { RouterLink },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
