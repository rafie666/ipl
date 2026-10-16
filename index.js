import './src/utils/customAlert';
import { registerRootComponent } from 'expo';

// Ignore non-app errors from third-party Chrome extensions (e.g. chrome-extension://...)
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener(
    'error',
    (event) => {
      if (
        event?.filename &&
        (event.filename.startsWith('chrome-extension:') ||
          event.filename.startsWith('moz-extension:'))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

import App from './App';

registerRootComponent(App);
