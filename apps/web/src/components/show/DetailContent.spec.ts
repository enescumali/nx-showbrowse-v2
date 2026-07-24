// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router';
import { describe, it, expect } from 'vitest';
import ShowDetailContent from './DetailContent.vue';
import type { ShowDetail } from '@show-browse/shows';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/catalog', name: 'Catalog', component: { template: '<div />' } },
  ],
});

const showDetail: ShowDetail = {
  id: 1,
  title: 'Breaking Bad',
  showType: 'Scripted',
  overview: 'A chemistry teacher turns to crime.',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '2008-01-20',
  rating: 9.5,
  genres: ['Drama', 'Crime'],
  runtime: 47,
  cast: [
    {
      id: 1,
      name: 'Bryan Cranston',
      character: 'Walter White',
      profileUrl: '',
    },
  ],
};

function mountContent(show: ShowDetail, showCast?: boolean) {
  return mount(ShowDetailContent, {
    props: showCast === undefined ? { show } : { show, showCast },
    global: { plugins: [router], stubs: { RouterLink } },
  });
}

describe('ShowDetailContent', () => {
  it('renders title, rating, runtime, and genre links', () => {
    const wrapper = mountContent(showDetail);
    expect(wrapper.find('h1').text()).toBe('Breaking Bad');
    expect(wrapper.text()).toContain('9.5');
    expect(wrapper.text()).toContain('47 min');
    const genreLinks = wrapper.findAllComponents(RouterLink);
    expect(genreLinks.map((l) => l.text())).toEqual(['Drama', 'Crime']);
  });

  it('renders the cast list', () => {
    const wrapper = mountContent(showDetail);
    expect(wrapper.text()).toContain('Bryan Cranston');
    expect(wrapper.text()).toContain('Walter White');
  });

  it('does not render a cast section when there is no cast', () => {
    const wrapper = mountContent({ ...showDetail, cast: [] });
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('does not render cast when showCast is false, even with cast data', () => {
    const wrapper = mountContent(showDetail, false);
    expect(wrapper.text()).not.toContain('Bryan Cranston');
    expect(wrapper.find('h2').exists()).toBe(false);
  });
});
