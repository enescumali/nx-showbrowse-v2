// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import NavBar from './NavBar.vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../router/routes';
import { RouterView, RouterLink } from 'vue-router';

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe('NavBar', () => {
  beforeEach(async () => {
    // Reset router to Home with no query before each test
    await router.push({ name: 'Home', query: {} });
    await router.isReady();
  });
  it('mounts and renders', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
        mocks: {
          $route: { query: {} },
        },
        stubs: { RouterView, RouterLink },
      },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('opens and closes the search panel', async () => {
    const wrapper = mount(NavBar, {
      global: { plugins: [router] },
    });

    // Open search
    await wrapper.find('button[aria-label="Open search"]').trigger('click');
    expect(wrapper.find('input[aria-label="Search shows"]').exists()).toBe(
      true,
    );

    // Close search
    await wrapper.find('button[aria-label="Close search"]').trigger('click');
    expect(wrapper.find('input[aria-label="Search shows"]').exists()).toBe(
      false,
    );
  });

  it('syncs input value with route query', async () => {
    await router.push({ name: 'Home', query: { q: 'test' } });

    const wrapper = mount(NavBar, {
      global: { plugins: [router] },
    });

    // Open search (should sync inputValue)
    await wrapper.find('button[aria-label="Open search"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(
      (
        wrapper.find('input[aria-label="Search shows"]')
          .element as HTMLInputElement
      ).value,
    ).toBe('test');
  });

  it('closes search on Escape key', async () => {
    const wrapper = mount(NavBar, {
      global: { plugins: [router] },
    });

    await wrapper.find('button[aria-label="Open search"]').trigger('click');
    const input = wrapper.find('input[aria-label="Search shows"]');
    await input.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('input[aria-label="Search shows"]').exists()).toBe(
      false,
    );
  });

  it('toggles the mobile menu', async () => {
    const wrapper = mount(NavBar, {
      global: { plugins: [router] },
    });

    const menuBtn = wrapper.find('button[aria-label="Toggle menu"]');
    await menuBtn.trigger('click');
    expect(wrapper.find('#mobile-menu').exists()).toBe(true);
    await menuBtn.trigger('click');
    expect(wrapper.find('#mobile-menu').exists()).toBe(false);
  });
});
