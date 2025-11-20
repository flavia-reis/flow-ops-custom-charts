import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/drag-fix.css'
import App from './App.tsx'

// Removendo StrictMode temporariamente para compatibilidade com react-beautiful-dnd
createRoot(document.getElementById('root')!).render(
  <App />
)