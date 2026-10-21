import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/context/AppContext'
import RootNavigator from './src/navigation/RootNavigator'
import CustomAlertModal from './src/components/modals/CustomAlertModal'
import ErrorBoundary from './src/components/shared/ErrorBoundary'
import './src/utils/customAlert'

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <StatusBar style="light" backgroundColor="#0f172a" />
          <RootNavigator />
          <CustomAlertModal />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
