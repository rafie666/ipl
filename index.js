import './src/utils/customAlert';
import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

// Abaikan peringatan expo-notifications pada runtime Expo Go / emulator
LogBox.ignoreLogs([
  '[expo-notifications]',
  '`expo-notifications`',
  'PushNotification',
  'ExpoNotificationChannelManager',
  'NotificationsChannelsProvider',
]);

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
