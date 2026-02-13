export function useIsSSR() {
  return computed(() => !import.meta.client);
}
