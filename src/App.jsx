import { HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div 
      style={{ 
        transform: 'scale(0.9)',
        transformOrigin: 'top left',
        width: '111.11%', // 100% / 0.9
        height: '111.2vh', // Slightly more to ensure bottom fill
        minHeight: '111.2vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <ErrorBoundary>
        <HashRouter>
          <AppRoutes />
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#14b8a6',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </HashRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;

