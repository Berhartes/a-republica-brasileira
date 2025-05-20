import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app';
import '@/shared/styles/index.css';
import './disable-fast-refresh.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
