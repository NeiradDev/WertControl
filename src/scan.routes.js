const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

// Python en venv (Docker) o sistema
const PYTHON = process.env.PYTHON_PATH || 'python3';
const SCRIPT = path.join(__dirname, '..', 'scripts', 'scan_barcode.py');

router.post('/', (req, res) => {
  const { image } = req.body;
  if (!image) return res.json({ value: null });

  const py = spawn(PYTHON, [SCRIPT]);
  let result = '';

  py.stdout.on('data', (d) => { result += d; });
  py.on('close', () => res.json({ value: result.trim() || null }));
  py.on('error', () => res.json({ value: null }));

  py.stdin.write(image);
  py.stdin.end();
});

module.exports = router;
