// @vitest-environment jsdom
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { describe, it, expect, beforeEach } from 'vitest';
import { useQuickView } from './useQuickView';

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div/>' } },
      { path: '/catalog', name: 'Catalog', component: { template: '<div/>' } },
    ],
  });
}

function mountQuickView(router: ReturnType<typeof makeRouter>) {
  let result!: ReturnType<typeof useQuickView>;
  const TestComponent = defineComponent({
    setup() {
      result = useQuickView();
      return {};
    },
    template: '<div/>',
  });
  mount(TestComponent, { global: { plugins: [router] } });
  return result;
}

describe('useQuickView', () => {
  let router: ReturnType<typeof makeRouter>;

  beforeEach(async () => {
    router = makeRouter();
    await router.push({ name: 'Catalog', query: { genre: 'Drama' } });
    await router.isReady();
  });

  it('has no active show when the query has none', () => {
    const { activeShowId } = mountQuickView(router);
    expect(activeShowId.value).toBeNull();
  });

  it('picks up an already-present ?show= query on cold load', async () => {
    await router.push({ name: 'Catalog', query: { show: '42' } });
    const { activeShowId } = mountQuickView(router);
    expect(activeShowId.value).toBe('42');
  });

  it('openShow adds ?show= to the current route without dropping other query params', async () => {
    const { activeShowId, openShow } = mountQuickView(router);

    // Note: createMemoryHistory doesn't touch the real window.history, so
    // the showJson state payload (read via window.history.state in
    // ShowDetail.vue/ShowQuickView.vue) isn't observable here — covered
    // by e2e instead, against a real browser history.
    await openShow(7, JSON.stringify({ id: 7, title: 'Test' }));

    expect(activeShowId.value).toBe('7');
    expect(router.currentRoute.value.query.genre).toBe('Drama');
    expect(router.currentRoute.value.name).toBe('Catalog');
  });

  it('closeShow strips the show query while keeping the rest', async () => {
    const { activeShowId, openShow, closeShow } = mountQuickView(router);

    await openShow(7);
    expect(activeShowId.value).toBe('7');

    await closeShow();
    expect(activeShowId.value).toBeNull();
    expect(router.currentRoute.value.query.genre).toBe('Drama');
  });

  it('closeShow works the same for a panel that was already open on cold load', async () => {
    await router.push({ name: 'Catalog', query: { show: '42' } });
    const { activeShowId, closeShow } = mountQuickView(router);
    expect(activeShowId.value).toBe('42');

    await closeShow();
    expect(activeShowId.value).toBeNull();
  });
});
