import React, { useState, useEffect, useCallback, useMemo } from "react";
import storage from "./storage";

/* ---------------------------------------------------------
   NEXUS · ELITE — Torre de Control
   Checklist diaria de agentes con metas de FTD y Bots
--------------------------------------------------------- */

const GOLD = "#B8902B";
const GOLD_DARK = "#8C6B1F";
const GOLD_LIGHT = "#F3E8C9";
const GOLD_PALE = "#FBF6E8";
const INK = "#1C1B19";
const MUTED = "#8A8477";
const BG = "#FAF8F3";
const GREEN = "#3C6E47";
const GREEN_BG = "#EAF2EC";
const RED = "#AE3A2E";
const RED_BG = "#FBEAE8";
const LINE = "#E9E2D0";

const AGENTS = [
  "Maria Lamilla",
  "Sara Carolina Escorcia",
  "Jose Leonardo Angarita Lara",
  "Olga Lucia Sanchez Plazas",
  "Luis Alfredo Muñoz Trujillo",
  "Danna Sofia Osorio",
  "Miguel Antonio Bustos Capera",
  "Seleny Stefany Quintero Mosquera",
  "Laura Daniela Duarte Adamez",
  "Juan Pablo Bermudez Polania",
  "Ana Gonzalez",
  "Juan Guillermo Oviedo Gutierrez",
  "Maria Camila Perdomo Puentes",
  "Geraldine Rojas Gutierrez",
  "Dana Valentina Pérez Vega",
  "Yerly Yamileth Cardoso Arce",
  "Yeisman Rojas Palomares Rojas",
  "Katherin Vanessa Esquibel Falla",
  "Adrian Eduardo Cubillos Franco",
  "Juana Lamilla",
];

const DIRECTOR = { name: "Juana Lamilla", role: "Directora" };

const DEFAULT_STEPS = [
  { id: "1", label: "Lead Connector al día", desc: "Responder prospectos de pauta pendientes" },
  { id: "2", label: "Hablar con activos", desc: "Recordar calendario y actividades del día" },
  { id: "3", label: "Seguimiento WhatsApp", desc: "Bajar prospectos que no responden en Lead Connector" },
  { id: "4", label: "Hacer llamadas", desc: "Máx. 3 intentos, mismo día del clic" },
  { id: "5", label: "Ofrecer el Bot", desc: "A quienes ya tomaron la beca gratuita" },
  { id: "6", label: "Seguimiento al Bot", desc: "Revisar en qué va cada oferta pendiente" },
  { id: "7", label: "Bajar base a WhatsApp", desc: "Mover conversaciones frías al WhatsApp secundario" },
  { id: "8", label: "Seguimiento de ventas", desc: "Clientes calientes con fecha de pago próxima" },
];

function defaultSteps() {
  return DEFAULT_STEPS.map((s) => ({ ...s }));
}

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function todayStr() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(d, 10)} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function defaultDay(steps) {
  const checklist = {};
  (steps || DEFAULT_STEPS).forEach((s) => {
    checklist[s.id] = false;
  });
  return {
    checklist,
    metaFtd: 1,
    logradoFtd: 0,
    metaBots: 1,
    logradoBots: 0,
    tareas: [],
  };
}

let idCounter = 0;
function newId(prefix = "t") {
  idCounter += 1;
  return `${prefix}${Date.now()}${idCounter}`;
}

/* ---------------- Ring progress (signature element) ---------------- */
function Ring({ percent, size = 96, stroke = 9, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  const color = percent >= 100 ? GREEN : percent >= 50 ? GOLD : RED;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={LINE} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color: INK, fontFamily: "Georgia, serif" }}>
          {Math.round(percent)}%
        </span>
        {label && <span style={{ fontSize: 10, color: MUTED, letterSpacing: 0.5 }}>{label}</span>}
      </div>
    </div>
  );
}

/* ---------------- Small UI atoms ---------------- */
function Masthead({ subtitle }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 4,
          color: INK,
        }}
      >
        NEXUS <span style={{ color: GOLD }}>·</span> ELITE
      </div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: MUTED, marginTop: 4, textTransform: "uppercase" }}>
        {subtitle}
      </div>
    </div>
  );
}

function GoalCard({ title, meta, logrado, onMeta, onLogrado, unit }) {
  const pct = meta > 0 ? Math.round((logrado / meta) * 100) : 0;
  const color = pct >= 100 ? GREEN : pct >= 50 ? GOLD_DARK : RED;
  const bg = pct >= 100 ? GREEN_BG : pct >= 50 ? GOLD_PALE : RED_BG;
  return (
    <div
      style={{
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "16px 18px",
        background: "#fff",
        flex: 1,
        minWidth: 220,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 1 }}>
          {title}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color, background: bg, padding: "2px 8px", borderRadius: 999 }}>
          {pct}%
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Logrado hoy</div>
          <input
            type="number"
            min="0"
            value={logrado}
            onChange={(e) => onLogrado(Math.max(0, parseInt(e.target.value || "0", 10)))}
            style={{
              width: "100%",
              fontSize: 22,
              fontWeight: 700,
              color: INK,
              border: "none",
              borderBottom: `2px solid ${GOLD_LIGHT}`,
              padding: "2px 0",
              outline: "none",
              fontFamily: "Georgia, serif",
            }}
          />
        </div>
        <div style={{ fontSize: 20, color: MUTED, paddingTop: 14 }}>/</div>
        <div style={{ width: 70 }}>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 2 }}>Meta {unit}</div>
          <input
            type="number"
            min="0"
            value={meta}
            onChange={(e) => onMeta(Math.max(0, parseInt(e.target.value || "0", 10)))}
            style={{
              width: "100%",
              fontSize: 22,
              fontWeight: 700,
              color: GOLD_DARK,
              border: "none",
              borderBottom: `2px solid ${GOLD_LIGHT}`,
              padding: "2px 0",
              outline: "none",
              fontFamily: "Georgia, serif",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   LOGIN
================================================================== */
function LoginScreen({ onLogin }) {
  const [query, setQuery] = useState("");
  const filtered = AGENTS.filter((a) => a.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Masthead subtitle="Torre de Control · Checklist diaria" />
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 18,
            padding: 24,
            boxShadow: "0 2px 18px rgba(184,144,43,0.08)",
          }}
        >
          <button
            onClick={() => onLogin({ name: DIRECTOR.name, slug: slugify(DIRECTOR.name), isDirector: true })}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: `1.5px solid ${GOLD}`,
              background: "linear-gradient(135deg, #F7D7E3 0%, #F3B7CE 100%)",
              color: GOLD_DARK,
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 20,
              cursor: "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 2px 10px rgba(214,110,150,0.25)",
            }}
          >
            ★ Entrar como {DIRECTOR.name} (Directora)
          </button>

          <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Soy agente
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar mi nombre..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${LINE}`,
              marginBottom: 10,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.map((name) => (
              <button
                key={name}
                onClick={() => onLogin({ name, slug: slugify(name), isDirector: false })}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: INK,
                  fontSize: 14,
                  cursor: "pointer",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = GOLD_PALE)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ fontSize: 13, color: MUTED, padding: "8px 4px" }}>Sin coincidencias.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   AGENT VIEW
================================================================== */
function AgentView({ user, onLogout }) {
  const [date, setDate] = useState(todayStr());
  const [steps, setSteps] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [newTask, setNewTask] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState("");

  const stepsKey = `steps:${user.slug}`;
  const key = `chk:${user.slug}:${date}`;

  // Los pasos del checklist son propios de cada agente y se mantienen entre días.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await storage.get(stepsKey);
        if (!cancelled) setSteps(res ? JSON.parse(res.value) : defaultSteps());
      } catch {
        if (!cancelled) setSteps(defaultSteps());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stepsKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg("");
    (async () => {
      try {
        const res = await storage.get(key);
        if (!cancelled) setData(res ? JSON.parse(res.value) : defaultDay(steps));
      } catch {
        if (!cancelled) setData(defaultDay(steps));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, steps]);

  const persist = useCallback(
    async (next) => {
      setData(next);
      try {
        const res = await storage.set(key, JSON.stringify(next));
        if (!res) setErrorMsg("No se pudo guardar. Los cambios podrían perderse.");
        else setErrorMsg("");
      } catch {
        setErrorMsg("No se pudo guardar. Revisa tu conexión.");
      }
    },
    [key]
  );

  const persistSteps = useCallback(
    async (nextSteps) => {
      setSteps(nextSteps);
      try {
        const res = await storage.set(stepsKey, JSON.stringify(nextSteps));
        if (!res) setErrorMsg("No se pudo guardar el cambio en la checklist.");
        else setErrorMsg("");
      } catch {
        setErrorMsg("No se pudo guardar el cambio en la checklist.");
      }
    },
    [stepsKey]
  );

  const percent = useMemo(() => {
    if (!data || !steps || steps.length === 0) return 0;
    const done = steps.filter((s) => data.checklist[s.id]).length;
    return (done / steps.length) * 100;
  }, [data, steps]);

  if (loading || !data || !steps) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: MUTED, fontSize: 14 }}>Cargando checklist…</div>
      </div>
    );
  }

  const toggleStep = (stepId) => {
    persist({ ...data, checklist: { ...data.checklist, [stepId]: !data.checklist[stepId] } });
  };

  const updateStepField = (stepId, field, value) => {
    persistSteps(steps.map((s) => (s.id === stepId ? { ...s, [field]: value } : s)));
  };

  const deleteStep = (stepId) => {
    persistSteps(steps.filter((s) => s.id !== stepId));
  };

  const addStep = () => {
    const label = newStepLabel.trim();
    if (!label) return;
    const id = newId("s");
    persistSteps([...steps, { id, label, desc: "" }]);
    persist({ ...data, checklist: { ...data.checklist, [id]: false } });
    setNewStepLabel("");
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    persist({ ...data, tareas: [...data.tareas, { id: newId(), text, done: false }] });
    setNewTask("");
  };

  const toggleTask = (id) => {
    persist({ ...data, tareas: data.tareas.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  };

  const deleteTask = (id) => {
    persist({ ...data, tareas: data.tareas.filter((t) => t.id !== id) });
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Header user={user} date={date} setDate={setDate} onLogout={onLogout} />

        {errorMsg && (
          <div style={{ background: RED_BG, color: RED, fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {/* Rendimiento */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${LINE}`,
            borderRadius: 16,
            padding: 20,
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 18,
          }}
        >
          <Ring percent={percent} label="RENDIMIENTO" />
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: INK }}>
              {steps.filter((s) => data.checklist[s.id]).length} de {steps.length} pasos completados
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
              Cada paso que marcas hace avanzar tu rendimiento del día.
            </div>
          </div>
        </div>

        {/* Metas */}
        <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <GoalCard
            title="Meta de FTDs"
            unit="FTD"
            meta={data.metaFtd}
            logrado={data.logradoFtd}
            onMeta={(v) => persist({ ...data, metaFtd: v })}
            onLogrado={(v) => persist({ ...data, logradoFtd: v })}
          />
          <GoalCard
            title="Meta de Bots"
            unit="bots"
            meta={data.metaBots}
            logrado={data.logradoBots}
            onMeta={(v) => persist({ ...data, metaBots: v })}
            onLogrado={(v) => persist({ ...data, logradoBots: v })}
          />
        </div>

        {/* Checklist */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 4px 10px" }}>
          <SectionTitle>Checklist del día</SectionTitle>
          <button
            onClick={() => setEditMode((v) => !v)}
            style={{
              border: `1px solid ${editMode ? GREEN : GOLD}`,
              background: editMode ? GREEN_BG : GOLD_PALE,
              color: editMode ? GREEN : GOLD_DARK,
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {editMode ? "Listo" : "✎ Editar tareas"}
          </button>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, overflow: "hidden", marginBottom: 22 }}>
          {steps.map((step, idx) => {
            const checked = data.checklist[step.id];
            if (editMode) {
              return (
                <div
                  key={step.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 18px",
                    borderBottom: idx < steps.length - 1 ? `1px solid ${LINE}` : "none",
                    background: "#fff",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                      value={step.label}
                      onChange={(e) => updateStepField(step.id, "label", e.target.value)}
                      placeholder="Nombre de la tarea"
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: INK,
                        border: `1px solid ${LINE}`,
                        borderRadius: 8,
                        padding: "6px 10px",
                        outline: "none",
                      }}
                    />
                    <input
                      value={step.desc}
                      onChange={(e) => updateStepField(step.id, "desc", e.target.value)}
                      placeholder="Detalle (opcional)"
                      style={{
                        fontSize: 12,
                        color: MUTED,
                        border: `1px solid ${LINE}`,
                        borderRadius: 8,
                        padding: "5px 10px",
                        outline: "none",
                      }}
                    />
                  </div>
                  <button
                    onClick={() => deleteStep(step.id)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: RED,
                      cursor: "pointer",
                      fontSize: 12,
                      padding: "6px 4px",
                      flexShrink: 0,
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              );
            }
            return (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderBottom: idx < steps.length - 1 ? `1px solid ${LINE}` : "none",
                  cursor: "pointer",
                  background: checked ? GOLD_PALE : "#fff",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: `2px solid ${checked ? GREEN : GOLD_LIGHT}`,
                    background: checked ? GREEN : "#fff",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {checked ? "✓" : ""}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: checked ? GREEN : INK,
                      textDecoration: checked ? "line-through" : "none",
                    }}
                  >
                    {idx + 1}. {step.label}
                  </div>
                  {step.desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{step.desc}</div>}
                </div>
              </div>
            );
          })}
          {steps.length === 0 && !editMode && (
            <div style={{ padding: "16px 18px", fontSize: 13, color: MUTED, textAlign: "center" }}>
              Aún no tienes tareas en tu checklist. Toca "Editar tareas" para crear las tuyas.
            </div>
          )}
          {editMode && (
            <div style={{ display: "flex", gap: 8, padding: "12px 18px", background: GOLD_PALE }}>
              <input
                value={newStepLabel}
                onChange={(e) => setNewStepLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStep()}
                placeholder="Nueva tarea del checklist..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${GOLD_LIGHT}`,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={addStep}
                style={{
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: GOLD,
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Agregar tarea
              </button>
            </div>
          )}
        </div>

        {/* Tareas pendientes */}
        <SectionTitle>Tareas pendientes / extras</SectionTitle>
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Agregar tarea extra a tener en cuenta..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${LINE}`,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={addTask}
              style={{
                padding: "0 18px",
                borderRadius: 10,
                border: "none",
                background: GOLD,
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Agregar
            </button>
          </div>
          {data.tareas.length === 0 && (
            <div style={{ fontSize: 13, color: MUTED, textAlign: "center", padding: "10px 0" }}>
              No hay tareas extra por ahora.
            </div>
          )}
          {data.tareas.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 4px",
                borderBottom: `1px solid ${LINE}`,
              }}
            >
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} style={{ width: 16, height: 16, accentColor: GOLD }} />
              <span
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  color: t.done ? MUTED : INK,
                  textDecoration: t.done ? "line-through" : "none",
                }}
              >
                {t.text}
              </span>
              <button
                onClick={() => deleteTask(t.id)}
                style={{ border: "none", background: "transparent", color: RED, cursor: "pointer", fontSize: 13 }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color: GOLD_DARK, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 10px 4px" }}>
      {children}
    </div>
  );
}

function Header({ user, date, setDate, onLogout }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: INK }}>
          NEXUS <span style={{ color: GOLD }}>·</span> ELITE
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
          {user.isDirector ? "Directora" : "Agente"} · {user.name} · {fmtDate(date)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 13 }}
        />
        <button
          onClick={onLogout}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            border: `1px solid ${LINE}`,
            background: "#fff",
            color: MUTED,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Cambiar usuario
        </button>
      </div>
    </div>
  );
}

/* ==================================================================
   DIRECTOR VIEW
================================================================== */
function DirectorView({ user, onLogout }) {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg("");
    (async () => {
      try {
        const results = await Promise.all(
          AGENTS.map(async (name) => {
            const slug = slugify(name);
            let agentSteps = defaultSteps();
            try {
              const stepsRes = await storage.get(`steps:${slug}`);
              if (stepsRes) agentSteps = JSON.parse(stepsRes.value);
            } catch {
              // sin pasos personalizados aún: se usan los de por defecto
            }
            try {
              const res = await storage.get(`chk:${slug}:${date}`);
              return { name, slug, steps: agentSteps, data: res ? JSON.parse(res.value) : defaultDay(agentSteps) };
            } catch {
              return { name, slug, steps: agentSteps, data: defaultDay(agentSteps) };
            }
          })
        );
        if (!cancelled) setRows(results);
      } catch {
        if (!cancelled) setErrorMsg("No se pudo cargar el panel del equipo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const pa = a.steps.length ? a.steps.filter((s) => a.data.checklist[s.id]).length / a.steps.length : 0;
      const pb = b.steps.length ? b.steps.filter((s) => b.data.checklist[s.id]).length / b.steps.length : 0;
      return pb - pa;
    });
  }, [rows]);

  const totals = useMemo(() => {
    if (!rows) return null;
    const avg =
      rows.reduce((s, r) => s + (r.steps.length ? r.steps.filter((st) => r.data.checklist[st.id]).length / r.steps.length : 0), 0) /
      rows.length;
    const ftd = rows.reduce((s, r) => s + (r.data.logradoFtd || 0), 0);
    const ftdMeta = rows.reduce((s, r) => s + (r.data.metaFtd || 0), 0);
    const bots = rows.reduce((s, r) => s + (r.data.logradoBots || 0), 0);
    const botsMeta = rows.reduce((s, r) => s + (r.data.metaBots || 0), 0);
    const pendientes = rows.reduce((s, r) => s + r.data.tareas.filter((t) => !t.done).length, 0);
    return { avg: avg * 100, ftd, ftdMeta, bots, botsMeta, pendientes };
  }, [rows]);

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <Header user={user} date={date} setDate={setDate} onLogout={onLogout} />

        {errorMsg && (
          <div style={{ background: RED_BG, color: RED, fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        {loading || !totals ? (
          <div style={{ color: MUTED, fontSize: 14, padding: "40px 0", textAlign: "center" }}>Cargando panel del equipo…</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
              <StatPill label="Rendimiento promedio" value={`${Math.round(totals.avg)}%`} />
              <StatPill label="FTDs logrados / meta" value={`${totals.ftd} / ${totals.ftdMeta}`} />
              <StatPill label="Bots logrados / meta" value={`${totals.bots} / ${totals.botsMeta}`} />
              <StatPill label="Tareas pendientes" value={totals.pendientes} accent={totals.pendientes > 0 ? RED : GREEN} />
            </div>

            <SectionTitle>Ranking del día · {fmtDate(date)}</SectionTitle>
            <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, overflow: "hidden" }}>
              {sorted.map((row, i) => {
                const total = row.steps.length;
                const done = row.steps.filter((s) => row.data.checklist[s.id]).length;
                const pct = total ? (done / total) * 100 : 0;
                const pendCount = row.data.tareas.filter((t) => !t.done).length;
                return (
                  <div
                    key={row.slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 18px",
                      borderBottom: i < sorted.length - 1 ? `1px solid ${LINE}` : "none",
                    }}
                  >
                    <div style={{ width: 22, fontFamily: "Georgia, serif", fontWeight: 700, color: GOLD_DARK }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{row.name}</div>
                      <div style={{ fontSize: 11.5, color: MUTED }}>
                        {done}/{total} pasos · FTD {row.data.logradoFtd}/{row.data.metaFtd} · Bots {row.data.logradoBots}/{row.data.metaBots}
                        {pendCount > 0 && <span style={{ color: RED }}> · {pendCount} pendiente{pendCount > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <div style={{ width: 120 }}>
                      <div style={{ height: 8, borderRadius: 999, background: LINE, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: pct >= 100 ? GREEN : pct >= 50 ? GOLD : RED,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 42, textAlign: "right", fontSize: 13, fontWeight: 700, color: INK }}>{Math.round(pct)}%</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 18px", flex: 1, minWidth: 170 }}>
      <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "Georgia, serif", color: accent || INK, marginTop: 2 }}>{value}</div>
    </div>
  );
}

/* ==================================================================
   ROOT
================================================================== */
export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <LoginScreen onLogin={setUser} />;
  if (user.isDirector) return <DirectorView user={user} onLogout={() => setUser(null)} />;
  return <AgentView user={user} onLogout={() => setUser(null)} />;
}
