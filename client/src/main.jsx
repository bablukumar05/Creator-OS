import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { border: '1px solid #e4e5e0', borderRadius: 12, fontSize: 13 } }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);