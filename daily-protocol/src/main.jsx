import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeDefaults } from './db'

initializeDefaults();

// Request persistent storage so browser won't evict IndexedDB data
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
