// Proxy local para desarrollar contra la instancia EC2 real sin abrir CORS.
// Uso: npm run start:live (con useMocks: false en environment.development.ts)
const TARGET = 'https://35-168-228-65.sslip.io';

export default {
  '/v1': {
    target: TARGET,
    secure: true,
    changeOrigin: true,
    cookieDomainRewrite: 'localhost',
    onProxyReq(proxyReq) {
      if (proxyReq.getHeader('origin')) {
        proxyReq.setHeader('origin', TARGET);
      }
    },
  },
};
