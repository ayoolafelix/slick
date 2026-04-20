import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletProviders } from './providers/WalletProviders'
import './index.css'
import App from './App.tsx'
import '@solana/wallet-adapter-react-ui/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProviders>
        <App />
      </WalletProviders>
    </BrowserRouter>
  </StrictMode>,
)
