// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router';
import { describe, it, expect } from 'vitest';
import ShowDetailContent from './ShowDetailContent.vue';
import type { Show, ShowDetail } from '@show-browse/shows';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/catalog', name: 'Catalog', component: { template: '<div />' } },
  ],
});

const show: Show = {
  id: 1,
  title: 'Breaking Bad',
  showType: 'Scripted',
  overview: 'A chemistry teacher turns to crime.',
  posterUrl: '',
  backdropUrl: '',
  releaseDate: '2008-01-20',
  rating: 9.5,
  genres: ['Drama', 'Crime'],
};

const showDetail: ShowDetail = {
  ...show,
  runtime: 47,
  cast: [{ id: 1, name: 'Bryan Cranston', character: 'Walter White', profileUrl: '' }],
};

function mountContent(props: { show: Show | ShowDetail; partial?: boolean }) {
  return mount(ShowDetailContent, {
    props,
    global: { plugins: [router], stubs: { RouterLink } },
  });
}

describe('ShowDetailContent', () => {
  it('renders title, rating, and genre links', () => {
    const wrapper = mountContent({ show });
    expect(wrapper.find('h1').text()).toBe('Breaking Bad');
    expect(wrapper.text()).toContain('9.5');
    const genreLinks = wrapper.findAllComponents(RouterLink);
    expect(genreLinks.map((l) => l.text())).toEqual(['Drama', 'Crime']);
  });

  it('renders runtime and cast when given full ShowDetail data', () => {
    const wrapper = mountContent({ show: showDetail });
    expect(wrapper.text()).toContain('47 min');
    expect(wrapper.text()).toContain('Bryan Cranston');
    expect(wrapper.text()).toContain('Walter White');
  });

  it('does not render runtime or a cast section for plain Show data', () => {
    const wrapper = mountContent({ show });
    expect(wrapper.text()).not.toContain('min');
    expect(wrapper.find('h2').exists()).toBe(false);
  });

  it('renders a cast skeleton instead of nothing when partial and cast-less', () => {
    const wrapper = mountContent({ show, partial: true });
    expect(wrapper.findComponent({ name: 'SkeletonBlock' }).exists()).toBe(
      true,
    );
  });
});
