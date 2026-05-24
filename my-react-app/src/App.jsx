import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'workout-log-exercises-v1'

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio',
  'Full Body',
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function validate({ name, muscleGroup, weight, reps, sets, date }) {
  if (!name) return 'Exercise name is required.'
  if (!muscleGroup) return 'Please select a muscle group.'
  if (Number.isNaN(weight) || weight < 0) return 'Weight must be 0 or greater.'
  if (Number.isNaN(reps) || reps < 1) return 'Reps must be at least 1.'
  if (Number.isNaN(sets) || sets < 1) return 'Sets must be at least 1.'
  if (!date) return 'Please select a date.'
  return null
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function App() {
  const [exercises, setExercises] = useState(() => loadFromStorage())
  const [filterMuscle, setFilterMuscle] = useState('all')
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    weight: '',
    reps: '',
    sets: '',
    date: todayISO(),
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
  }, [exercises])

  const filteredExercises = useMemo(() => {
    if (filterMuscle === 'all') return exercises
    return exercises.filter((ex) => ex.muscleGroup === filterMuscle)
  }, [exercises, filterMuscle])

  const stats = useMemo(() => {
    const total = exercises.length
    const uniqueDays = new Set(exercises.map((ex) => ex.date)).size
    const totalVolume = exercises.reduce(
      (sum, ex) => sum + ex.weight * ex.reps * ex.sets,
      0,
    )

    const muscleCounts = exercises.reduce((acc, ex) => {
      acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + 1
      return acc
    }, {})

    const topMuscle =
      Object.keys(muscleCounts).length > 0
        ? Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0][0]
        : '—'

    return { total, uniqueDays, totalVolume, topMuscle }
  }, [exercises])

  function handleFormChange(event) {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleFormSubmit(event) {
    event.preventDefault()

    const payload = {
      name: formData.name.trim(),
      muscleGroup: formData.muscleGroup,
      weight: parseFloat(formData.weight),
      reps: parseInt(formData.reps, 10),
      sets: parseInt(formData.sets, 10),
      date: formData.date,
    }

    const error = validate(payload)
    if (error) {
      setFormError(error)
      return
    }

    setFormError('')

    const exercise = {
      id: crypto.randomUUID(),
      ...payload,
    }

    setExercises((prev) => [exercise, ...prev])
    setFormData({
      name: '',
      muscleGroup: '',
      weight: '',
      reps: '',
      sets: '',
      date: todayISO(),
    })
  }

  function handleDelete(id) {
    setExercises((prev) => prev.filter((ex) => ex.id !== id))
  }

  return (
    <>
      <header>
        <h1>Workout Logger</h1>
        <p className="subtitle">React Version</p>
      </header>

      <main>
        <section className="card" id="form-section">
          <h2>Add Exercise</h2>
          <form id="workout-form" noValidate onSubmit={handleFormSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="exercise-name">Exercise Name</label>
                <input
                  type="text"
                  id="exercise-name"
                  name="name"
                  placeholder="e.g. Bench Press"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="muscle-group">Muscle Group</label>
                <select
                  id="muscle-group"
                  name="muscleGroup"
                  value={formData.muscleGroup}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select group…</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 80"
                  value={formData.weight}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reps">Reps</label>
                <input
                  type="number"
                  id="reps"
                  name="reps"
                  min="1"
                  placeholder="e.g. 10"
                  value={formData.reps}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="sets">Sets</label>
                <input
                  type="number"
                  id="sets"
                  name="sets"
                  min="1"
                  placeholder="e.g. 3"
                  value={formData.sets}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            {formError ? <div className="form-error">{formError}</div> : null}

            <button type="submit" className="btn btn-primary">
              Add Exercise
            </button>
          </form>
        </section>

        <section className="card" id="stats-section">
          <h2>Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-value" id="stat-total">
                {stats.total}
              </span>
              <span className="stat-label">Total Exercises</span>
            </div>
            <div className="stat-box">
              <span className="stat-value" id="stat-sessions">
                {stats.uniqueDays}
              </span>
              <span className="stat-label">Training Days</span>
            </div>
            <div className="stat-box">
              <span className="stat-value" id="stat-volume">
                {stats.totalVolume.toLocaleString()}
              </span>
              <span className="stat-label">Total Volume (kg)</span>
            </div>
            <div className="stat-box">
              <span className="stat-value" id="stat-top-muscle">
                {stats.topMuscle}
              </span>
              <span className="stat-label">Most Trained</span>
            </div>
          </div>
        </section>

        <section className="card" id="log-section">
          <div className="log-header">
            <h2>Exercise Log</h2>
            <div className="filter-row">
              <label htmlFor="filter-muscle">Filter:</label>
              <select
                id="filter-muscle"
                value={filterMuscle}
                onChange={(event) => setFilterMuscle(event.target.value)}
              >
                <option value="all">All Groups</option>
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div id="workout-list">
            {filteredExercises.length === 0 ? (
              <p className="empty-state" id="empty-state">
                No exercises logged yet. Add your first one above!
              </p>
            ) : (
              filteredExercises.map((ex) => {
                const volume = ex.weight * ex.reps * ex.sets
                return (
                  <article className="exercise-card" key={ex.id} data-id={ex.id}>
                    <div className="exercise-card-info">
                      <span className="exercise-card-title">{ex.name}</span>
                      <span className="muscle-badge">{ex.muscleGroup}</span>
                      <div className="exercise-card-meta">
                        <span>
                          <strong>{ex.sets}</strong> sets
                        </span>
                        <span>
                          <strong>{ex.reps}</strong> reps
                        </span>
                        <span>
                          <strong>{ex.weight} kg</strong> / set
                        </span>
                        <span>
                          Volume: <strong>{volume.toLocaleString()} kg</strong>
                        </span>
                      </div>
                      <span className="exercise-card-date">{formatDate(ex.date)}</span>
                    </div>
                    <button
                      className="btn btn-danger"
                      aria-label={`Delete ${ex.name}`}
                      onClick={() => handleDelete(ex.id)}
                    >
                      Delete
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </main>

      <footer>
        <p>Data is saved locally in your browser via localStorage.</p>
      </footer>
    </>
  )
}

export default App
