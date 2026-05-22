import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ChatBot />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
