const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Try patch-package if available
const patchPackageBin = path.join(__dirname, '../node_modules/.bin/patch-package');
if (fs.existsSync(patchPackageBin)) {
  try {
    execSync(`"${patchPackageBin}"`, { stdio: 'inherit' });
    process.exit(0);
  } catch (err) {
    console.warn('[apply-patches] patch-package failed, applying manual fallback...', err?.message || err);
  }
}

// 2. Direct patch fallback for expo-notifications TopicSubscriptionModule.android.js
const targetFile = path.join(
  __dirname,
  '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js'
);

if (fs.existsSync(targetFile)) {
  const content = fs.readFileSync(targetFile, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    const patchedContent = `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallback = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

let nativeModule = null;
try {
  nativeModule = typeof requireOptionalNativeModule === 'function'
    ? requireOptionalNativeModule('ExpoTopicSubscriptionModule')
    : null;
} catch (_) {
  nativeModule = null;
}

export default nativeModule || fallback;
//# sourceMappingURL=TopicSubscriptionModule.android.js.map
`;
    fs.writeFileSync(targetFile, patchedContent, 'utf8');
    console.log('[apply-patches] Successfully patched TopicSubscriptionModule.android.js');
  } else {
    console.log('[apply-patches] TopicSubscriptionModule.android.js is already patched.');
  }
}
