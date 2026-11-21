import type { CapacitorConfig } from '@capacitor/cli'

// iOS app settings – the web app (dist/) is packed into a native app
const config: CapacitorConfig = {
  appId: 'at.fhv.pantryx',   // Bundle ID – must match the app in App Store Connect
  appName: 'PantryX',
  webDir: 'dist',
  ios: {
    contentInset: 'never',    // the app handles the notch / home bar itself (safe-area CSS)
    backgroundColor: '#faf9f4',
  },
}

export default config
