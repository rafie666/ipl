import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/context/AppContext'
import RootNavigator from './src/navigation/RootNavigator'
import CustomAlertModal from './src/components/CustomAlertModal'
import './src/utils/customAlert'

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" backgroundColor="#0f172a" />
        <RootNavigator />
        <CustomAlertModal />
      </AppProvider>
    </SafeAreaProvider>
  )
}
