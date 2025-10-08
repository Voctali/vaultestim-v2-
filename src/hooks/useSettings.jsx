import { useState, useEffect, createContext, useContext } from 'react'
import { useAuth } from './useAuth'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    shareCollection: false,
    shareStats: false,
    shareWishlist: false,
    shareFavorites: false
  })

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    if (user?.id) {
      const savedSettings = localStorage.getItem(`vaultestim_settings_${user.id}`)
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    }
  }, [user?.id])

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`vaultestim_settings_${user.id}`, JSON.stringify(settings))
    }
  }, [settings, user?.id])

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const value = {
    settings,
    updateSetting,
    updateSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
