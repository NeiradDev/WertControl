const express = require('express');
const path = require('path');
const fs = require('fs');
const registrosRouter = require('./src/registros.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/registros', registrosRouter);
app.use('/api/areas', require('./src/areas.routes'));

// HTTPS si existen los certificados en certs/ (generados con mkcert)
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath  = path.join(__dirname, 'certs', 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const https = require('https');
  https.createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
    .listen(PORT, () => console.log(`Servidor HTTPS en https://localhost:${PORT}`));
} else {
  app.listen(PORT, () => console.log(`Servidor HTTP en http://localhost:${PORT}`));
}
