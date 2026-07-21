import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { SHOWS_USE_CASES_KEY } from '../di/injection-keys';

/**
 * Mounts a composable in a test component with DI for ShowsUseCases.
 * @param useComposable - The composable function to test (e.g. useShowDetail)
 * @param useCases - The mock use cases to provide
 * @param args - Arguments to pass to the composable
 * @returns The composable's return value
 */
export function mountComposable<TArgs extends unknown[], TResult>(
  useComposable: (...args: TArgs) => TResult,
  useCases: unknown,
  ...args: TArgs
): TResult {
  let result!: TResult;
  const TestComponent = defineComponent({
    setup() {
      result = useComposable(...args);
      return {};
    },
    template: '<div/>',
  });
  mount(TestComponent, {
    global: { provide: { [SHOWS_USE_CASES_KEY as symbol]: useCases } },
  });
  return result;
}
