// src/main.jsx (Ensure this is your file structure)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Your Tailwind CSS styles
import { WagmiWrapper } from './Wagmi.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiWrapper>
      <App />
    </WagmiWrapper>
  </React.StrictMode>,
);