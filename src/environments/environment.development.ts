// Desarrollo: backend simulado (core/mocks) hasta que exista la API.
export const environment = {
  production: false,
  useMocks: true,
  apiBaseUrl: '/v1',
  /** Landing pública en desarrollo (Astro, `npm --prefix landing run dev`). */
  landingUrl: 'http://localhost:4321/',
};
