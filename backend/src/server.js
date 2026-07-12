const app = require('./app');
const env = require('./config/env');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`AssetFlow Backend running on port ${PORT}`);
  console.log(`Environment     : ${env.NODE_ENV}`);
  console.log(`Frontend Origin : ${env.FRONTEND_ORIGIN}`);
  console.log(`Health Check    : http://localhost:${PORT}/health`);
  console.log(`===================================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = server;
