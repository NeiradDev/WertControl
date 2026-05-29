import express from 'express'
import cors from 'cors'
import multer from 'multer'
import pg from 'pg'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import 'dotenv/config'

const { Pool } = pg
const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const UPLOADS_DIR = path.resolve('uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR)

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${randomUUID()}${ext}`)
  },
})
const upload = multer({ storage })

app.get('/api/vacantes', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre FROM captura.vacante ORDER BY nombre'
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener vacantes' })
  }
})

app.post('/api/postulantes', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CV requerido' })

    const { nombres, apellidos, cedula, telefono, ciudad, vacante_id } = req.body
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress

    await pool.query(
      `INSERT INTO captura.postulante
        (nombres, apellidos, cedula, telefono, ciudad, vacante_id, cv_bucket, cv_object_key, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::inet)`,
      [nombres, apellidos, cedula, telefono, ciudad, vacante_id, 'uploads', req.file.filename, ip]
    )

    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al guardar postulación' })
  }
})

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Server en http://localhost:${PORT}`))
