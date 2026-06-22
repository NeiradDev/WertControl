const express = require('express');
const path = require('path');
const registrosRouter = require('./src/registros.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/registros', registrosRouter);
app.use('/api/areas', require('./src/areas.routes'));

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
