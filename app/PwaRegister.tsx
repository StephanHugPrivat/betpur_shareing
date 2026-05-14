'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      // Small delay to not block initial rendering
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.error('Service Worker registration failed: ', err)
        })
      }, 1000)
    } else if ('serviceWorker' in navigator && window.location.hostname === 'localhost') {
        // Also allow on localhost for testing
        setTimeout(() => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
              console.error('Service Worker registration failed: ', err)
            })
          }, 1000)
    }
  }, [])

  return null
}
