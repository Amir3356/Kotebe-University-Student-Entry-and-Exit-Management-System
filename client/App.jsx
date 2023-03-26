import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './context/StoreProvider'
import AppRoutes from './routes/AppRoutes'
import Toasts from './components/Toasts'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toasts />
    </StoreProvider>
  )
}
