<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Vacante {
  id: string
  nombre: string
}

interface Formulario {
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  ciudad: string
  vacante_id: string
}

const vacantes = ref<Vacante[]>([])
const cvFile = ref<File | null>(null)
const loading = ref(false)
const mensaje = ref<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

const form = ref<Formulario>({
  nombres: '',
  apellidos: '',
  cedula: '',
  telefono: '',
  ciudad: '',
  vacante_id: '',
})

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/vacantes`)
    vacantes.value = await res.json()
  } catch {
    mensaje.value = { tipo: 'error', texto: 'No se pudieron cargar las vacantes.' }
  }
})

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  cvFile.value = input.files?.[0] ?? null
}

function resetForm() {
  form.value = { nombres: '', apellidos: '', cedula: '', telefono: '', ciudad: '', vacante_id: '' }
  cvFile.value = null
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (fileInput) fileInput.value = ''
}

async function submit() {
  if (!cvFile.value) return
  loading.value = true
  mensaje.value = null

  const data = new FormData()
  Object.entries(form.value).forEach(([k, v]) => data.append(k, v))
  data.append('cv', cvFile.value)

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/postulantes`, {
      method: 'POST',
      body: data,
    })
    if (res.ok) {
      mensaje.value = { tipo: 'exito', texto: 'Postulación enviada exitosamente.' }
      resetForm()
    } else {
      const body = await res.json()
      mensaje.value = { tipo: 'error', texto: body.error ?? 'Error al enviar.' }
    }
  } catch {
    mensaje.value = { tipo: 'error', texto: 'No se pudo conectar con el servidor.' }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contenedor">
    <h1>Formulario de Postulación</h1>

    <form @submit.prevent="submit" novalidate>
      <div class="fila">
        <div class="campo">
          <label for="nombres">Nombres</label>
          <input id="nombres" v-model="form.nombres" type="text" placeholder="Juan Carlos" required />
        </div>
        <div class="campo">
          <label for="apellidos">Apellidos</label>
          <input id="apellidos" v-model="form.apellidos" type="text" placeholder="Pérez López" required />
        </div>
      </div>

      <div class="fila">
        <div class="campo">
          <label for="cedula">Cédula</label>
          <input id="cedula" v-model="form.cedula" type="text" placeholder="0912345678" required />
        </div>
        <div class="campo">
          <label for="telefono">Teléfono</label>
          <input id="telefono" v-model="form.telefono" type="tel" placeholder="+593 99 123 4567" required />
        </div>
      </div>

      <div class="fila">
        <div class="campo">
          <label for="ciudad">Ciudad</label>
          <input id="ciudad" v-model="form.ciudad" type="text" placeholder="Guayaquil" required />
        </div>
        <div class="campo">
          <label for="vacante">Vacante</label>
          <select id="vacante" v-model="form.vacante_id" required>
            <option value="" disabled>Seleccionar vacante</option>
            <option v-for="v in vacantes" :key="v.id" :value="v.id">{{ v.nombre }}</option>
          </select>
        </div>
      </div>

      <div class="campo">
        <label for="cv">Curriculum Vitae</label>
        <input id="cv" type="file" accept=".pdf,.doc,.docx" required @change="onFileChange" />
        <span class="hint">Formatos aceptados: PDF, DOC, DOCX</span>
      </div>

      <div v-if="mensaje" :class="['alerta', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar Postulación' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.contenedor {
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  font-family: system-ui, sans-serif;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1a1a2e;
}

.fila {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

input,
select {
  padding: 0.55rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus,
select:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

input[type='file'] {
  padding: 0.4rem;
  cursor: pointer;
}

.hint {
  font-size: 0.75rem;
  color: #6b7280;
}

.alerta {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 1rem 0 0.5rem;
  font-size: 0.9rem;
}

.alerta.exito {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.alerta.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

button {
  margin-top: 1.25rem;
  width: 100%;
  padding: 0.75rem;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #4338ca;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .fila {
    grid-template-columns: 1fr;
  }
}
</style>
