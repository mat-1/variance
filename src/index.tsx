import React from 'react';
import { createRoot } from 'react-dom/client';
import './font';
import './index.scss';

import settings from './client/state/settings';

import App from './app/pages/App';

settings.getThemeSettings().applyTheme();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);
root.render(<App />);
