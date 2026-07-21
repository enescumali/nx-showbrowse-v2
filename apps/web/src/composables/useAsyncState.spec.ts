// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useAsyncState } from './useAsyncState';

function mountComposable() {
  let result!: ReturnType<typeof useAsyncState>;
  const TestComponent = defineComponent({
    setup() {
      result = useAsyncState();
      return {};
    },
    template: '<div/>',
  });
  mount(TestComponent);
  return result;
}

describe('useAsyncState', () => {
  it('sets loading true while running and false after', async () => {
    const { loading, run } = mountComposable();
    const promise = run(() => Promise.resolve('done'));

    expect(loading.value).toBe(true);
    await promise;
    expect(loading.value).toBe(false);
  });

  it('returns resolved value', async () => {
    const { run } = mountComposable();
    const result = await run(() => Promise.resolve(42));

    expect(result).toBe(42);
  });

  it('sets error and returns null on rejection', async () => {
    const { error, run } = mountComposable();
    const result = await run(() => Promise.reject(new Error('oops')));

    expect(result).toBeNull();
    expect(error.value).toBe('oops');
  });

  it('uses fallback message for non-Error rejections', async () => {
    const { error, run } = mountComposable();

    await run(() => Promise.reject('string error'), 'fallback message');

    expect(error.value).toBe('fallback message');
  });

  it('clears previous error on a subsequent successful run', async () => {
    const { error, run } = mountComposable();

    await run(() => Promise.reject(new Error('first error')));
    expect(error.value).toBe('first error');

    await run(() => Promise.resolve('ok'));
    expect(error.value).toBeNull();
  });

  it('resets loading to false even when the promise rejects', async () => {
    const { loading, run } = mountComposable();

    await run(() => Promise.reject(new Error('fail')));
    expect(loading.value).toBe(false);
  });
});
