import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ErrorBoundary from './Components/ErrorBoundary';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Diskominfo Kab. Bogor';

createInertiaApp({
  title: (title) => `${title} - BIMTEK Diskominfo Kab. Bogor`,
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <ErrorBoundary>
        <App {...props} />
      </ErrorBoundary>
    );
  },
  progress: {
    color: '#FFD700',
  },
});
