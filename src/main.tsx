import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const { worker } = await import('./mocks/browser')

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and running.
  return worker.start({
    onUnhandledRequest(req, print) {
      // Don't warn about unhandled requests to assets or other pages.
      // This is essential to prevent MSW from interfering with React Router's
      // client-side navigation.
      if (req.url.pathname.startsWith('/api')) {
        print.warning()
      }
    },
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(<App />)
})
