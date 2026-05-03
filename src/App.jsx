import { useState, useEffect, useCallback } from “react”;

// ─── Data Model ────────────────────────────────────────────────────────────────

const WORKOUT_TYPES = [
{ id: “legs1”, label: “Legs Day 1”, sub: “Glutes + Posterior”, color: “#E8855A” },
{ id: “legs2”, label: “Legs Day 2”, sub: “Glutes + Quads”, color: “#D4A843” },
{ id: “back”, label: “Back”, sub: “Pull Day”, color: “#5A9BE8” },
{ id: “chest”, label: “Chest & Shoulders”, sub: “Push Day”, color: “#8E5AE8” },
{ id: “mixed”, label: “Mixed”, sub: “Back + Legs”, color: “#5AE8A2” },
{ id: “cardio”, label: “Cardio / Padel”, sub: “Activity”, color: “#E85A8E” },
];

const PREDEFINED_EXERCISES = {
legs1: [
{ name: “Back Extension”, defaultWeight: 0, note: “Warm-up, no weight” },
{ name: “DB Squats”, defaultWeight: 12 },
{ name: “Bulgarian Split Squats”, defaultWeight: 10 },
{ name: “Deadlifts”, defaultWeight: 20 },
{ name: “Abductors”, defaultWeight: 45 },
{ name: “Adductors”, defaultWeight: 45, note: “Optional” },
{ name: “Calves”, defaultWeight: 0, note: “Optional” },
],
legs2: [
{ name: “Back Extension”, defaultWeight: 0, note: “No weight” },
{ name: “Hip Thrust”, defaultWeight: 30 },
{ name: “Walking Lunges”, defaultWeight: 0, note: “Bodyweight or light” },
{ name: “Rear-Foot Elevated Split Squat”, defaultWeight: 5 },
{ name: “Leg Extension”, defaultWeight: 50 },
{ name: “Abductors”, defaultWeight: 30 },
],
back: [
{ name: “Lat Pulldown”, defaultWeight: 27.5 },
{ name: “Seated Cable Row”, defaultWeight: 27.5 },
{ name: “Straight Arm Pulldown”, defaultWeight: 12.5 },
{ name: “Reverse Pec Deck”, defaultWeight: 14.5 },
{ name: “Supported Pull-Ups”, defaultWeight: 35, note: “Support weight” },
{ name: “Bicep Curls”, defaultWeight: 5 },
],
chest: [
{ name: “Chest Press”, defaultWeight: 19 },
{ name: “Incline / ISO Press”, defaultWeight: 15 },
{ name: “Pec Deck”, defaultWeight: 17 },
{ name: “Shoulder Press”, defaultWeight: 15 },
{ name: “Lateral Raises”, defaultWeight: 4 },
{ name: “Triceps”, defaultWeight: 8 },
],
mixed: [
{ name: “Lat Pulldown”, defaultWeight: 27.5 },
{ name: “Seated Cable Row”, defaultWeight: 27.5 },
{ name: “Hip Thrust”, defaultWeight: 30 },
{ name: “Leg Extension”, defaultWeight: 50 },
{ name: “Abductors”, defaultWeight: 45 },
],
cardio: [],
};

const TAGS = [“Strong day”, “Low energy”, “Cycle phase”, “Heavy”, “Light”, “Recovery”];
const INTENSITIES = [“Low”, “Medium”, “High”];

// ─── Storage ────────────────────────────────────────────────────────────────────

function loadWorkouts() {
try {
return JSON.parse(localStorage.getItem(“ft_workouts”) || “[]”);
} catch { return []; }
}
function saveWorkouts(w) {
localStorage.setItem(“ft_workouts”, JSON.stringify(w));
}

// ─── Utils ──────────────────────────────────────────────────────────────────────

function formatDate(iso) {
const d = new Date(iso);
return d.toLocaleDateString(“en-GB”, { weekday: “short”, day: “numeric”, month: “short” });
}
function isoToday() {
return new Date().toISOString().split(“T”)[0];
}
function getWeek(iso) {
const d = new Date(iso);
const day = d.getDay() || 7;
d.setDate(d.getDate() + 4 - day);
const year = new Date(d.getFullYear(), 0, 1);
return `${d.getFullYear()}-W${Math.ceil(((d - year) / 86400000 + 1) / 7).toString().padStart(2, "0")}`;
}
function getWorkoutType(id) {
return WORKOUT_TYPES.find(w => w.id === id) || WORKOUT_TYPES[0];
}

// ─── Micro Components ───────────────────────────────────────────────────────────

const Tag = ({ label, active, onClick, color }) => (
<button
onClick={onClick}
style={{
padding: “4px 10px”,
borderRadius: 20,
border: `1px solid ${active ? (color || "#fff") : "#333"}`,
background: active ? (color || “#fff”) + “22” : “transparent”,
color: active ? (color || “#fff”) : “#666”,
fontSize: 12,
cursor: “pointer”,
transition: “all 0.15s”,
whiteSpace: “nowrap”,
}}

> {label}</button>
> );

const NumInput = ({ value, onChange, step = 0.5, min = 0, label }) => (

  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
    {label && <span style={{ fontSize: 11, color: "#555", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center", background: "#1a1a1a", borderRadius: 8, overflow: "hidden", border: "1px solid #2a2a2a" }}>
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        style={{ padding: "8px 12px", background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>−</button>
      <span style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
      <button onClick={() => onChange(+(value + step).toFixed(2))}
        style={{ padding: "8px 12px", background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>
    </div>
  </div>
);

// ─── Views ──────────────────────────────────────────────────────────────────────

function HomeView({ workouts, onStartWorkout, onViewHistory, onViewProgress }) {
const recent = […workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

// Weekly stats
const thisWeek = getWeek(isoToday());
const weekWorkouts = workouts.filter(w => getWeek(w.date) === thisWeek);
const targetHit = weekWorkouts.length >= 3;

const typeCounts = workouts.reduce((acc, w) => {
acc[w.typeId] = (acc[w.typeId] || 0) + 1;
return acc;
}, {});

return (
<div style={{ padding: “24px 20px 100px” }}>
{/* Header */}
<div style={{ marginBottom: 32 }}>
<p style={{ color: “#555”, fontSize: 13, marginBottom: 4, letterSpacing: “0.08em”, textTransform: “uppercase” }}>
{new Date().toLocaleDateString(“en-GB”, { weekday: “long”, day: “numeric”, month: “long” })}
</p>
<h1 style={{ fontSize: 28, fontFamily: “‘DM Serif Display’, serif”, fontWeight: 400, color: “#fff”, margin: 0 }}>
Let’s train.
</h1>
</div>

```
  {/* This week pill */}
  <div style={{
    display: "flex", alignItems: "center", gap: 12, marginBottom: 28,
    padding: "14px 16px", borderRadius: 12,
    background: targetHit ? "#5AE8A222" : "#1a1a1a",
    border: `1px solid ${targetHit ? "#5AE8A244" : "#2a2a2a"}`,
  }}>
    <span style={{ fontSize: 22 }}>{targetHit ? "🔥" : "⚡"}</span>
    <div>
      <p style={{ margin: 0, fontSize: 13, color: "#fff", fontWeight: 500 }}>
        {weekWorkouts.length} session{weekWorkouts.length !== 1 ? "s" : ""} this week
      </p>
      <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
        {targetHit ? "Goal hit — 3+ sessions ✓" : `${3 - weekWorkouts.length} more to hit weekly goal`}
      </p>
    </div>
    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: i <= weekWorkouts.length ? "#5AE8A2" : "#2a2a2a"
        }} />
      ))}
    </div>
  </div>

  {/* Start workout */}
  <p style={{ fontSize: 12, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Start workout</p>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
    {WORKOUT_TYPES.map(type => (
      <button key={type.id} onClick={() => onStartWorkout(type.id)}
        style={{
          padding: "14px 14px", borderRadius: 12, border: `1px solid #2a2a2a`,
          background: "#111", cursor: "pointer", textAlign: "left",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = type.color + "66"; e.currentTarget.style.background = type.color + "0d"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.background = "#111"; }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: type.color, marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{type.label}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#555", marginTop: 2 }}>{type.sub}</p>
      </button>
    ))}
  </div>

  {/* Recent sessions */}
  {recent.length > 0 && (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Recent</p>
        <button onClick={onViewHistory} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>View all →</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recent.map(w => {
          const type = getWorkoutType(w.typeId);
          return (
            <div key={w.id} style={{ padding: "12px 14px", borderRadius: 10, background: "#111", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: type.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#fff", fontWeight: 500 }}>{type.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#444" }}>{formatDate(w.date)} · {w.exercises?.length || 0} exercises</p>
              </div>
              {w.tags?.length > 0 && <span style={{ fontSize: 11, color: "#444" }}>{w.tags[0]}</span>}
            </div>
          );
        })}
      </div>
    </>
  )}
</div>
```

);
}

// ── Exercise Row ─────────────────────────────────────────────────────────────────

function ExerciseRow({ exercise, onChange, onRemove, typeColor }) {
const [expanded, setExpanded] = useState(false);

return (
<div style={{ borderRadius: 12, border: `1px solid #222`, background: “#0d0d0d”, overflow: “hidden”, marginBottom: 8 }}>
<div
onClick={() => setExpanded(!expanded)}
style={{ padding: “12px 14px”, display: “flex”, alignItems: “center”, gap: 10, cursor: “pointer” }}
>
<div style={{ width: 6, height: 6, borderRadius: “50%”, background: typeColor, flexShrink: 0 }} />
<span style={{ flex: 1, fontSize: 14, color: exercise.name ? “#fff” : “#444”, fontWeight: 500 }}>
{exercise.name || “Exercise name”}
</span>
<span style={{ fontSize: 12, color: “#444” }}>
{exercise.weight > 0 ? `${exercise.weight}kg` : “BW”} · {exercise.sets}×{exercise.reps}
</span>
<span style={{ color: “#444”, fontSize: 14, transform: expanded ? “rotate(180deg)” : “none”, transition: “transform 0.2s” }}>▾</span>
</div>

```
  {expanded && (
    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        value={exercise.name}
        onChange={e => onChange({ ...exercise, name: e.target.value })}
        placeholder="Exercise name"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14, width: "100%", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <NumInput label="Weight (kg)" value={exercise.weight} step={0.5} onChange={v => onChange({ ...exercise, weight: v })} />
        <NumInput label="Sets" value={exercise.sets} step={1} min={1} onChange={v => onChange({ ...exercise, sets: v })} />
        <NumInput label="Reps" value={exercise.reps} step={1} min={1} onChange={v => onChange({ ...exercise, reps: v })} />
      </div>
      <input
        value={exercise.notes || ""}
        onChange={e => onChange({ ...exercise, notes: e.target.value })}
        placeholder="Notes (optional)"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" }}
      />
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#c0392b", fontSize: 12, cursor: "pointer", textAlign: "left", padding: 0 }}>Remove exercise</button>
    </div>
  )}
</div>
```

);
}

// ── Log Workout ──────────────────────────────────────────────────────────────────

function LogWorkout({ typeId, onSave, onBack }) {
const type = getWorkoutType(typeId);
const isCardio = typeId === “cardio”;

const buildExercises = () =>
(PREDEFINED_EXERCISES[typeId] || []).map((e, i) => ({
id: Date.now() + i,
name: e.name,
weight: e.defaultWeight,
sets: 3,
reps: 10,
notes: e.note || “”,
}));

const [date, setDate] = useState(isoToday());
const [exercises, setExercises] = useState(buildExercises);
const [selectedTags, setSelectedTags] = useState([]);
const [energy, setEnergy] = useState(null);
const [cardio, setCardio] = useState({ duration: 45, intensity: “Medium”, notes: “” });

const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : […prev, t]);

const updateExercise = (id, updated) => setExercises(prev => prev.map(e => e.id === id ? updated : e));
const removeExercise = (id) => setExercises(prev => prev.filter(e => e.id !== id));
const addExercise = () => setExercises(prev => […prev, { id: Date.now(), name: “”, weight: 0, sets: 3, reps: 10, notes: “” }]);

const handleSave = () => {
const workout = {
id: Date.now(),
date,
typeId,
exercises: isCardio ? [] : exercises.filter(e => e.name),
cardio: isCardio ? cardio : null,
tags: selectedTags,
energy,
};
onSave(workout);
};

return (
<div style={{ padding: “20px 20px 120px” }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, color: “#555”, cursor: “pointer”, padding: 0, marginBottom: 20, fontSize: 13 }}>← Back</button>

```
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <div style={{ width: 10, height: 10, borderRadius: "50%", background: type.color }} />
    <h2 style={{ margin: 0, fontSize: 22, fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: "#fff" }}>{type.label}</h2>
  </div>
  <p style={{ margin: "0 0 24px", color: "#555", fontSize: 13 }}>{type.sub}</p>

  {/* Date */}
  <div style={{ marginBottom: 24 }}>
    <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Date</p>
    <input type="date" value={date} onChange={e => setDate(e.target.value)}
      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
  </div>

  {/* Cardio */}
  {isCardio ? (
    <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Activity</p>
      <div style={{ display: "flex", gap: 8 }}>
        <NumInput label="Duration (min)" value={cardio.duration} step={5} min={5} onChange={v => setCardio(c => ({ ...c, duration: v }))} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Intensity</p>
        <div style={{ display: "flex", gap: 8 }}>
          {INTENSITIES.map(i => (
            <Tag key={i} label={i} active={cardio.intensity === i} color={type.color} onClick={() => setCardio(c => ({ ...c, intensity: i }))} />
          ))}
        </div>
      </div>
      <input value={cardio.notes} onChange={e => setCardio(c => ({ ...c, notes: e.target.value }))}
        placeholder="Notes (e.g. padel match, outdoor run)"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" }} />
    </div>
  ) : (
    <>
      <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Exercises</p>
      {exercises.map(ex => (
        <ExerciseRow key={ex.id} exercise={ex} typeColor={type.color}
          onChange={updated => updateExercise(ex.id, updated)}
          onRemove={() => removeExercise(ex.id)} />
      ))}
      <button onClick={addExercise}
        style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px dashed #2a2a2a`, background: "none", color: "#555", fontSize: 13, cursor: "pointer", marginBottom: 24, marginTop: 4 }}>
        + Add exercise
      </button>
    </>
  )}

  {/* Energy */}
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Energy level</p>
    <div style={{ display: "flex", gap: 8 }}>
      {["🪫 Low", "⚡ Medium", "🔥 High"].map(e => (
        <Tag key={e} label={e} active={energy === e} color={type.color} onClick={() => setEnergy(energy === e ? null : e)} />
      ))}
    </div>
  </div>

  {/* Tags */}
  <div style={{ marginBottom: 28 }}>
    <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Tags</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {TAGS.map(t => (
        <Tag key={t} label={t} active={selectedTags.includes(t)} color={type.color} onClick={() => toggleTag(t)} />
      ))}
    </div>
  </div>

  <button onClick={handleSave}
    style={{
      width: "100%", padding: "14px", borderRadius: 12,
      background: type.color, border: "none", color: "#000",
      fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em",
    }}>
    Save Workout
  </button>
</div>
```

);
}

// ── History ───────────────────────────────────────────────────────────────────────

function HistoryView({ workouts, onBack }) {
const sorted = […workouts].sort((a, b) => b.date.localeCompare(a.date));
const [expanded, setExpanded] = useState(null);

if (sorted.length === 0) {
return (
<div style={{ padding: “24px 20px” }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, color: “#555”, cursor: “pointer”, padding: 0, marginBottom: 24, fontSize: 13 }}>← Back</button>
<h2 style={{ fontFamily: “‘DM Serif Display’, serif”, fontWeight: 400, color: “#fff”, margin: “0 0 8px” }}>History</h2>
<p style={{ color: “#444”, fontSize: 14 }}>No workouts logged yet.</p>
</div>
);
}

return (
<div style={{ padding: “24px 20px 100px” }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, color: “#555”, cursor: “pointer”, padding: 0, marginBottom: 24, fontSize: 13 }}>← Back</button>
<h2 style={{ fontFamily: “‘DM Serif Display’, serif”, fontWeight: 400, color: “#fff”, margin: “0 0 4px” }}>History</h2>
<p style={{ color: “#444”, fontSize: 13, marginBottom: 24 }}>{sorted.length} sessions logged</p>

```
  {sorted.map(w => {
    const type = getWorkoutType(w.typeId);
    const isExp = expanded === w.id;
    return (
      <div key={w.id} style={{ marginBottom: 8, borderRadius: 12, border: "1px solid #1e1e1e", background: "#0d0d0d", overflow: "hidden" }}>
        <div onClick={() => setExpanded(isExp ? null : w.id)}
          style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: type.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#fff", fontWeight: 500 }}>{type.label}</p>
            <p style={{ margin: 0, fontSize: 12, color: "#444", marginTop: 2 }}>{formatDate(w.date)}</p>
          </div>
          {w.cardio && <span style={{ fontSize: 12, color: "#555" }}>{w.cardio.duration}min</span>}
          {!w.cardio && <span style={{ fontSize: 12, color: "#555" }}>{w.exercises?.length || 0} ex.</span>}
          <span style={{ color: "#333", fontSize: 12 }}>{isExp ? "▲" : "▼"}</span>
        </div>

        {isExp && (
          <div style={{ padding: "0 16px 14px", borderTop: "1px solid #1a1a1a" }}>
            {w.energy && <p style={{ fontSize: 12, color: "#555", marginTop: 10, marginBottom: 8 }}>Energy: {w.energy}</p>}
            {w.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {w.tags.map(t => <span key={t} style={{ padding: "2px 8px", borderRadius: 12, background: "#1a1a1a", color: "#555", fontSize: 11 }}>{t}</span>)}
              </div>
            )}
            {w.cardio && (
              <div style={{ color: "#888", fontSize: 13 }}>
                <p style={{ margin: "0 0 4px" }}>Duration: {w.cardio.duration} min · Intensity: {w.cardio.intensity}</p>
                {w.cardio.notes && <p style={{ margin: 0, color: "#555" }}>{w.cardio.notes}</p>}
              </div>
            )}
            {w.exercises?.map(ex => (
              <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #141414" }}>
                <span style={{ fontSize: 13, color: "#ccc" }}>{ex.name}</span>
                <span style={{ fontSize: 12, color: "#555" }}>
                  {ex.weight > 0 ? `${ex.weight}kg` : "BW"} · {ex.sets}×{ex.reps}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>
```

);
}

// ── Progress ──────────────────────────────────────────────────────────────────────

function ProgressView({ workouts, onBack }) {
const [selectedExercise, setSelectedExercise] = useState(null);

// Build exercise map
const exerciseMap = {};
workouts.forEach(w => {
(w.exercises || []).forEach(ex => {
if (!ex.name) return;
if (!exerciseMap[ex.name]) exerciseMap[ex.name] = [];
exerciseMap[ex.name].push({ date: w.date, weight: ex.weight, sets: ex.sets, reps: ex.reps });
});
});

const exercises = Object.keys(exerciseMap).sort();
const history = selectedExercise ? […exerciseMap[selectedExercise]].sort((a, b) => a.date.localeCompare(b.date)) : [];
const maxWeight = history.reduce((m, h) => Math.max(m, h.weight), 0);
const lastTwo = history.slice(-2);
const improved = lastTwo.length === 2 && lastTwo[1].weight > lastTwo[0].weight;

return (
<div style={{ padding: “24px 20px 100px” }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, color: “#555”, cursor: “pointer”, padding: 0, marginBottom: 24, fontSize: 13 }}>← Back</button>
<h2 style={{ fontFamily: “‘DM Serif Display’, serif”, fontWeight: 400, color: “#fff”, margin: “0 0 4px” }}>Progress</h2>
<p style={{ color: “#444”, fontSize: 13, marginBottom: 24 }}>Track your weights over time</p>

```
  {exercises.length === 0 && <p style={{ color: "#444", fontSize: 14 }}>Log some workouts to see progress.</p>}

  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
    {exercises.map(e => (
      <button key={e} onClick={() => setSelectedExercise(selectedExercise === e ? null : e)}
        style={{
          padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
          border: `1px solid ${selectedExercise === e ? "#5AE8A2" : "#2a2a2a"}`,
          background: selectedExercise === e ? "#5AE8A222" : "#111",
          color: selectedExercise === e ? "#5AE8A2" : "#888",
        }}>
        {e}
      </button>
    ))}
  </div>

  {selectedExercise && history.length > 0 && (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 500 }}>{selectedExercise}</h3>
        {improved && (
          <span style={{ fontSize: 12, color: "#5AE8A2", background: "#5AE8A211", padding: "3px 8px", borderRadius: 12 }}>↑ Improving</span>
        )}
      </div>

      {/* Simple bar chart */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
          {history.slice(-10).map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: "#444" }}>{h.weight}kg</span>
              <div style={{
                width: "100%", borderRadius: "4px 4px 0 0",
                height: maxWeight > 0 ? `${(h.weight / maxWeight) * 52}px` : "4px",
                background: i === history.slice(-10).length - 1 ? "#5AE8A2" : "#2a2a2a",
                minHeight: 4,
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {history.slice(-10).map((h, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 9, color: "#333" }}>
                {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* History list */}
      {history.slice().reverse().map((h, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #141414" }}>
          <span style={{ fontSize: 13, color: "#888" }}>{formatDate(h.date)}</span>
          <span style={{ fontSize: 13, color: "#ccc", fontVariantNumeric: "tabular-nums" }}>
            {h.weight > 0 ? `${h.weight}kg` : "BW"} · {h.sets}×{h.reps}
          </span>
        </div>
      ))}
    </div>
  )}
</div>
```

);
}

// ─── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
const [workouts, setWorkouts] = useState(loadWorkouts);
const [view, setView] = useState(“home”); // home | log | history | progress
const [logTypeId, setLogTypeId] = useState(null);

useEffect(() => { saveWorkouts(workouts); }, [workouts]);

const handleSave = useCallback((workout) => {
setWorkouts(prev => […prev, workout]);
setView(“home”);
}, []);

const startWorkout = (typeId) => { setLogTypeId(typeId); setView(“log”); };

return (
<>
<style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { background: #080808; } input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.3); } ::-webkit-scrollbar { width: 0; }`}</style>

```
  <div style={{
    maxWidth: 420, margin: "0 auto", minHeight: "100vh",
    background: "#080808", color: "#fff",
    fontFamily: "'DM Sans', sans-serif", position: "relative",
  }}>
    {/* Views */}
    {view === "home" && (
      <HomeView workouts={workouts} onStartWorkout={startWorkout}
        onViewHistory={() => setView("history")} onViewProgress={() => setView("progress")} />
    )}
    {view === "log" && logTypeId && (
      <LogWorkout typeId={logTypeId} onSave={handleSave} onBack={() => setView("home")} />
    )}
    {view === "history" && <HistoryView workouts={workouts} onBack={() => setView("home")} />}
    {view === "progress" && <ProgressView workouts={workouts} onBack={() => setView("home")} />}

    {/* Bottom nav */}
    {view === "home" && (
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 420,
        background: "#080808dd", backdropFilter: "blur(12px)",
        borderTop: "1px solid #1a1a1a",
        display: "flex", justifyContent: "space-around", padding: "12px 0 20px",
      }}>
        {[
          { id: "home", icon: "⊡", label: "Today" },
          { id: "history", icon: "◷", label: "Log" },
          { id: "progress", icon: "↗", label: "Progress" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: view === tab.id ? "#fff" : "#444",
            }}>
            <span style={{ fontSize: 18 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, letterSpacing: "0.06em" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    )}
  </div>
</>
```

);
}