import { useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | '/'
  | '/sales'
  | '/targets'
  | '/staff'
  | '/incentives'
  | '/analytics'
  | '/inventory'
  | '/reports'
  | '/settings'
  | 'dashboard'
  | 'sales'
  | 'targets'
  | 'staff'
  | 'incentives'
  | 'analytics'
  | 'inventory'
  | 'reports'
  | 'settings';

export type NormalizedRoute =
  | '/'
  | '/sales'
  | '/targets'
  | '/staff'
  | '/incentives'
  | '/analytics'
  | '/inventory'
  | '/reports'
  | '/settings';

const LAST_ROUTE_KEY = 'raya_last_route_v2';

export function normalizeRoute(r: string): NormalizedRoute {
  const clean = r.replace(/^#\/?/, '').replace(/^\//, '').split('?')[0];
  switch (clean) {
    case 'sales':
      return '/sales';
    case 'targets':
      return '/targets';
    case 'staff':
      return '/staff';
    case 'incentives':
      return '/incentives';
    case 'analytics':
      return '/analytics';
    case 'inventory':
      return '/inventory';
    case 'reports':
      return '/reports';
    case 'settings':
      return '/settings';
    case 'dashboard':
    case '':
    default:
      return '/';
  }
}

export function useHashRouter() {
  const [currentRoute, setCurrentRoute] = useState<NormalizedRoute>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) return normalizeRoute(hash);
      const saved = localStorage.getItem(LAST_ROUTE_KEY);
      if (saved) return normalizeRoute(saved);
    }
    return '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const normalized = normalizeRoute(hash);
      setCurrentRoute(normalized);
      try {
        localStorage.setItem(LAST_ROUTE_KEY, normalized);
      } catch {
        // ignore
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = `#${currentRoute}`;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentRoute]);

  const navigate = useCallback((route: AppRoute) => {
    const normalized = normalizeRoute(route);
    window.location.hash = `#${normalized}`;
    setCurrentRoute(normalized);
    try {
      localStorage.setItem(LAST_ROUTE_KEY, normalized);
    } catch {
      // ignore
    }
  }, []);

  return { currentRoute, navigate };
}
