import { useState, useEffect, useCallback } from "react";

// En prod Netlify → /api/pmu-proxy  |  En dev local → proxy Vite
const API_PROXY = "/api/pmu-proxy";

const DISCIPLINE_COLORS = {
  PLAT:    { bg: "#0d2e1a", text: "#4ade80",  label: "PLAT"    },
  ATTELE:  { bg: "#0d1e3a", text: "#60a5fa",  label: "ATTELÉ"  },
  MONTE:   { bg: "#2e0d0d", text: "#f87171",  label: "MONTÉ"   },
  HAIES:   { bg: "#1e0d2e", text: "#c084fc",  label: "HAIES"   },
  STEEPLE: { bg: "#2e1e0d", text: "#fb923c",  label: "STEEPLE" },
  CROSS:   { bg: "#0d1e2e", text: "#22d3ee",  label: "CROSS"   },
};

const getDisciplineStyle = (disc) => {
  const key = (disc || "").toUpperCase().replace(/[-\s]/g, "");
  for (const [k, v] of Object.entries(DISCIPLINE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return { bg: "#1a1a1a", text: "#888", label: disc || "—" };
};

const formatDate = (date) => {
  const d = date || new Date();
  return `${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${d.getFullYear()}`;
};

const formatHeure = (ts) => {
  if (!ts) return "--:--";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,"0")}h${String(d.getMinutes()).padStart(2,"0")}`;
};

const getStatus = (heureDepart) => {
  const diff = heureDepart - Date.now();
  if (diff < 0 && diff > -3600000) return "live";
  if (diff < 0) return "done";
  if (diff < 1800000) return "soon";
  return "upcoming";
};

const STATUS_CONFIG = {
  live:     { label: "EN COURS",  bg: "#dc2626", color: "#fff" },
  done:     { label: "TERMINÉE", bg: "#1f1f1f", color: "#555" },
  soon:     { label: "BIENTÔT",  bg: "#f59e0b", color: "#000" },
  upcoming: { label: "À VENIR",  bg: "#052e16", color: "#4ade80" },
};

/* ─── CARD COURSE ─────────────────────────────────────────── */
function CourseCard({ course, rNum, isQuinte }) {
  const [open, setOpen] = useState(false);
  const [partants, setPartants] = useState(course.participants || null);
  const [loadingP, setLoadingP] = useState(false);
  const disc = getDisciplineStyle(course.discipline);
  const status = getStatus(course.heureDepart);
  const sc = STATUS_CONFIG[status];

  const loadPartants = async () => {
    if (partants || loadingP) return;
    setLoadingP(true);
    try {
      const dateStr = formatDate(new Date());
      const res = await fetch(`${API_PROXY}?date=${dateStr}&reunion=${rNum}&course=${course.numOrdre}`);
      const json = await res.json();
      setPartants(json.participants || json.partants || []);
    } catch { setPartants([]); }
    finally { setLoadingP(false); }
  };

  const toggle = () => {
    setOpen(v => !v);
    if (!open) loadPartants();
  };

  return (
    <div
      onClick={toggle}
      style={{
        background: isQuinte
          ? "linear-gradient(135deg,#1a0800,#2a1200)"
          : "#0f0f0f",
        border: `1px solid ${isQuinte ? "#f59e0b44" : "#1c1c1c"}`,
        borderRadius: 10, padding: "14px 16px",
        cursor: "pointer", position: "relative",
        transition: "border-color 0.2s",
      }}
    >
      {isQuinte && (
        <div style={{
          position:"absolute", top:0, right:0,
          background:"#f59e0b", color:"#000",
          fontSize:10, fontWeight:900,
          padding:"3px 10px", borderBottomLeftRadius:8,
          letterSpacing:1,
        }}>QUINTÉ+</div>
      )}

      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        {/* Badge R/C */}
        <div style={{
          background:"#141414", border:"1px solid #2a2a2a",
          borderRadius:6, padding:"4px 10px",
          fontFamily:"monospace", fontWeight:700,
          fontSize:13, color:"#ddd", whiteSpace:"nowrap",
        }}>R{rNum}C{course.numOrdre}</div>

        {/* Discipline */}
        <div style={{
          background: disc.bg, borderRadius:5,
          padding:"3px 8px", fontSize:11,
          fontWeight:700, color: disc.text,
        }}>{disc.label}</div>

        {/* Nom course */}
        <div style={{ flex:1, minWidth:100 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#eee", lineHeight:1.2 }}>
            {course.libelle || `Course ${course.numOrdre}`}
          </div>
          <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
            {course.distance ? `${course.distance}m` : ""}
            {course.nombreDeclaresPartants ? ` · ${course.nombreDeclaresPartants} partants` : ""}
            {course.montantPrix ? ` · ${Number(course.montantPrix).toLocaleString("fr-FR")}€` : ""}
          </div>
        </div>

        {/* Heure + Status */}
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#e0e0e0", fontFamily:"monospace" }}>
            {formatHeure(course.heureDepart)}
          </div>
          <div style={{
            marginTop:4, display:"inline-block",
            background: sc.bg, color: sc.color,
            borderRadius:4, padding:"2px 8px",
            fontSize:10, fontWeight:700, letterSpacing:0.5,
          }}>{sc.label}</div>
        </div>
      </div>

      {/* Partants */}
      {open && (
        <div style={{ marginTop:14, borderTop:"1px solid #1a1a1a", paddingTop:12 }}>
          {loadingP && (
            <div style={{ color:"#444", fontSize:12, textAlign:"center", padding:"10px 0" }}>
              Chargement des partants…
            </div>
          )}
          {!loadingP && partants && partants.length > 0 && (
            <>
              <div style={{ fontSize:10, color:"#444", letterSpacing:1, fontWeight:600, marginBottom:8 }}>
                PARTANTS ({partants.length})
              </div>
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill, minmax(155px,1fr))",
                gap:6,
              }}>
                {partants.map((p) => (
                  <div key={p.numPmu} style={{
                    background:"#0a0a0a", border:"1px solid #1a1a1a",
                    borderRadius:7, padding:"7px 10px",
                    display:"flex", gap:8, alignItems:"flex-start",
                  }}>
                    <span style={{
                      width:22, height:22, borderRadius:"50%",
                      background:"#1a1a1a", border:"1px solid #2a2a2a",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:700, color:"#999",
                      flexShrink:0, fontFamily:"monospace",
                    }}>{p.numPmu}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:12, fontWeight:600, color:"#d0d0d0",
                        lineHeight:1.2, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>
                        {(p.nom||"").toLowerCase().replace(/\b\w/g,l=>l.toUpperCase())}
                      </div>
                      {(p.driver||p.jockey) && (
                        <div style={{ fontSize:10, color:"#555", marginTop:1 }}>
                          {((p.driver||p.jockey)||"").toLowerCase().replace(/\b\w/g,l=>l.toUpperCase())}
                        </div>
                      )}
                      {p.coteInitiale && (
                        <div style={{ fontSize:11, color:"#f59e0b", fontWeight:700, marginTop:2 }}>
                          {p.coteInitiale}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!loadingP && partants && partants.length === 0 && (
            <div style={{ color:"#333", fontSize:12, fontStyle:"italic" }}>Partants non disponibles</div>
          )}
        </div>
      )}

      <div style={{ position:"absolute", bottom:8, right:12, fontSize:9, color:"#2a2a2a" }}>
        {open ? "▲" : "▼"}
      </div>
    </div>
  );
}

/* ─── SECTION REUNION ─────────────────────────────────────── */
function ReunionSection({ reunion }) {
  const [open, setOpen] = useState(true);
  const courses = reunion.courses || [];
  const hippo = reunion.hippodrome?.libelleCourt || reunion.hippodrome?.libelleLong || "?";
  const pays = reunion.pays?.libelle || "";

  return (
    <div style={{ marginBottom:20 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 16px",
          background:"#0a0a0a", border:"1px solid #161616",
          borderRadius:10, cursor:"pointer",
          marginBottom: open ? 8 : 0,
        }}
      >
        <div style={{
          background:"#141414", border:"1px solid #2a2a2a",
          borderRadius:6, padding:"4px 12px",
          fontFamily:"monospace", fontWeight:800,
          fontSize:14, color:"#fff", flexShrink:0,
        }}>R{reunion.numOfficiel}</div>

        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{hippo}</div>
          <div style={{ fontSize:11, color:"#444", marginTop:1 }}>
            {pays}{pays && courses.length ? " · " : ""}{courses.length} course{courses.length>1?"s":""}
          </div>
        </div>

        <div style={{ fontSize:10, color:"#333" }}>{open ? "▲" : "▼"}</div>
      </div>

      {open && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {courses.map(c => (
            <CourseCard
              key={c.numOrdre}
              course={c}
              rNum={reunion.numOfficiel}
              isQuinte={c.categorieParticularite==="QUINTE_PLUS" || c.hasQuintePlus}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── APP PRINCIPALE ──────────────────────────────────────── */
export default function App() {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [date,        setDate]        = useState(new Date());
  const [filter,      setFilter]      = useState("TOUTES");
  const [lastUpdate,  setLastUpdate]  = useState(null);

  const fetchData = useCallback(async (d) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_PROXY}?date=${formatDate(d)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);
  useEffect(() => {
    const t = setInterval(() => fetchData(date), 120000);
    return () => clearInterval(t);
  }, [date, fetchData]);

  const changeDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  };

  const reunions = data?.programme?.reunions || [];

  const disciplines = ["TOUTES", ...new Set(
    reunions.flatMap(r => (r.courses||[]).map(c => getDisciplineStyle(c.discipline).label))
  )];

  const filtered = reunions
    .map(r => ({
      ...r,
      courses: (r.courses||[]).filter(c =>
        filter === "TOUTES" || getDisciplineStyle(c.discipline).label === filter
      ),
    }))
    .filter(r => r.courses.length > 0);

  const totalCourses  = reunions.reduce((s,r) => s + (r.courses?.length||0), 0);
  const totalPartants = reunions.reduce((s,r) =>
    s + (r.courses?.reduce((cs,c) => cs + (c.nombreDeclaresPartants||0), 0)||0), 0);

  const dateLabel = date.toLocaleDateString("fr-FR", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });

  return (
    <div style={{
      minHeight:"100vh",
      background:"#080808",
      color:"#e0e0e0",
      fontFamily:"'Segoe UI', system-ui, sans-serif",
      paddingBottom:40,
    }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px }
        ::-webkit-scrollbar-track { background:#0a0a0a }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:3px }
        button:hover { opacity:0.85 }
      `}</style>

      {/* ── HEADER STICKY ── */}
      <div style={{
        background:"#0a0a0a",
        borderBottom:"1px solid #161616",
        padding:"16px 16px 12px",
        position:"sticky", top:0, zIndex:100,
      }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>

          {/* Titre */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{
              fontSize:28, lineHeight:1,
              filter:"drop-shadow(0 0 8px #f59e0b55)",
            }}>🏇</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:17, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>
                PMU Dashboard
              </div>
              <div style={{ fontSize:10, color:"#333", letterSpacing:0.5 }}>
                COURSES DU JOUR · AUTO-REFRESH 2MIN
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {loading && (
                <div style={{
                  width:16, height:16,
                  border:"2px solid #222",
                  borderTop:"2px solid #dc2626",
                  borderRadius:"50%",
                  animation:"spin 0.7s linear infinite",
                }}/>
              )}
              <button
                onClick={() => fetchData(date)}
                style={{
                  background:"#141414", border:"1px solid #222",
                  color:"#555", borderRadius:7,
                  padding:"6px 12px", cursor:"pointer",
                  fontSize:12, fontWeight:600,
                }}
              >↺</button>
            </div>
          </div>

          {/* Nav date */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <button onClick={() => changeDate(-1)} style={{
              background:"#141414", border:"1px solid #1f1f1f",
              color:"#777", borderRadius:7,
              width:32, height:32, cursor:"pointer",
              fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center",
            }}>‹</button>
            <div style={{
              flex:1, textAlign:"center",
              fontSize:13, fontWeight:600, color:"#bbb",
              textTransform:"capitalize",
            }}>{dateLabel}</div>
            <button onClick={() => changeDate(1)} style={{
              background:"#141414", border:"1px solid #1f1f1f",
              color:"#777", borderRadius:7,
              width:32, height:32, cursor:"pointer",
              fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center",
            }}>›</button>
          </div>

          {/* Stats */}
          {!loading && !error && reunions.length > 0 && (
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[
                { label:"Réunions", val:reunions.length, color:"#60a5fa" },
                { label:"Courses",  val:totalCourses,    color:"#4ade80" },
                { label:"Partants", val:totalPartants,   color:"#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{
                  flex:1, background:"#0d0d0d",
                  border:"1px solid #161616",
                  borderRadius:8, padding:"8px 10px",
                  textAlign:"center",
                }}>
                  <div style={{
                    fontSize:20, fontWeight:800,
                    color:s.color, fontFamily:"monospace",
                  }}>{s.val}</div>
                  <div style={{ fontSize:9, color:"#333", letterSpacing:0.8 }}>
                    {s.label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filtres */}
          {disciplines.length > 2 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {disciplines.map(d => (
                <button key={d} onClick={() => setFilter(d)} style={{
                  background: filter===d ? "#dc2626" : "#0d0d0d",
                  border:`1px solid ${filter===d ? "#dc2626" : "#1c1c1c"}`,
                  color: filter===d ? "#fff" : "#444",
                  borderRadius:5, padding:"4px 10px",
                  cursor:"pointer", fontSize:11, fontWeight:600,
                  transition:"all 0.15s",
                }}>{d}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div style={{
        maxWidth:800, margin:"0 auto",
        padding:"20px 14px",
        animation:"fadeUp 0.3s ease",
      }}>

        {error && (
          <div style={{
            background:"#140000", border:"1px solid #3a0000",
            borderRadius:10, padding:24, textAlign:"center",
          }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚠️</div>
            <div style={{ fontSize:14, color:"#f87171", marginBottom:8 }}>Erreur : {error}</div>
            <div style={{ fontSize:12, color:"#444" }}>
              Vérifie que la Netlify Function est bien déployée.<br/>
              En dev local, lance <code style={{color:"#60a5fa"}}>netlify dev</code>
            </div>
          </div>
        )}

        {loading && !data && (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{
              width:36, height:36,
              border:"3px solid #1a1a1a",
              borderTop:"3px solid #dc2626",
              borderRadius:"50%",
              animation:"spin 0.8s linear infinite",
              margin:"0 auto 14px",
            }}/>
            <div style={{ color:"#333", fontSize:13 }}>Chargement des courses…</div>
          </div>
        )}

        {!loading && !error && data && filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
            <div style={{ color:"#444" }}>Aucune course pour cette sélection.</div>
          </div>
        )}

        {filtered.map(r => (
          <ReunionSection key={r.numOfficiel} reunion={r} />
        ))}

        {lastUpdate && (
          <div style={{
            textAlign:"center", fontSize:10,
            color:"#222", marginTop:8,
          }}>
            Mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
          </div>
        )}
      </div>
    </div>
  );
}
