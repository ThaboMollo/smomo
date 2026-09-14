import { router } from 'expo-router';

/**
 * Back navigation that never throws "GO_BACK was not handled". If there's nothing
 * in the history stack (e.g. the screen was reached via replace, deep link, or hot
 * reload), it falls back to a safe route instead of dispatching an unhandled GO_BACK.
 */
export function safeBack(fallback: string = '/(app)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
