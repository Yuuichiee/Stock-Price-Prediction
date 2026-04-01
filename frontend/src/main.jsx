import React, { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = React.lazy(() => import('./App.jsx'));

import ErrorBoundary from './ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div style={{color:'white', padding: '2rem', fontSize: '1.5rem'}}>Decrypting Application Bundle...</div>}>
         <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
)
