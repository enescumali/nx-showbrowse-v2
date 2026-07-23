// @vitest-environment jsdom
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { createRouter, createMemoryHistory, RouterLink } from 'vue-router';
import { describe, it, expect, afterEach } from 'vitest';
import ShowQuickView from './ShowQuickView.vue';
import { SHOWS_USE_CASES_KEY } from '../di/injection-keys';
import { makeUseCases, mockDetail } from '../test-utils/makeUseCases';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div />' } },
    { path: '/catalog', name: 'Catalog', component: { template: '<div />' } },
    {
      path: '/shows/:id',
      name: 'ShowDetail',
      component: { template: '<div />' },
    },
  ],
});

let activeWrapper: VueWrapper | null = null;

function mountQuickView(useCases = makeUseCases()) {
  activeWrapper = mount(ShowQuickView, {
    props: { id: '42' },
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: { [SHOWS_USE_CASES_KEY as symbol]: useCases },
      stubs: { RouterLink },
    },
  });
  return activeWrapper;
}

describe('ShowQuickView', () => {
  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
  });

  it('shows a loading state, then the fetched show', async () => {
    const wrapper = mountQuickView();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);

    await flushPromises();

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false);
    expect(wrapper.find('h1').text()).toBe(mockDetail.title);
  });

  it('shows an error state when the fetch fails', async () => {
    const wrapper = mountQuickView(
      makeUseCases({
        getShowDetail: async () => {
          throw new Error('Not found');
        },
      }),
    );
    await flushPromises();

    expect(wrapper.find('[role="alert"]').text()).toBe('Not found');
  });

  it('links to the full detail page for the same show', async () => {
    const wrapper = mountQuickView();
    await flushPromises();

    const fullPageLink = wrapper.findComponent(RouterLink);
    expect(fullPageLink.props('to')).toEqual({
      name: 'ShowDetail',
      params: { id: '42' },
    });
  });

  it('renders as an accessible dialog and moves focus into it', async () => {
    const wrapper = mountQuickView();
    await flushPromises();

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.attributes('aria-modal')).toBe('true');
    expect(dialog.element).toBe(document.activeElement);
  });
});
