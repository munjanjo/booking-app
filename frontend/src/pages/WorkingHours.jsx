import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import client from "../api/client";
import Navbar from "../components/Navbar";

const DAYS = [
    { value: 1, name: "Ponedjeljak" },
    { value: 2, name: "Utorak" },
    { value: 3, name: "Srijeda" },
    { value: 4, name: "Četvrtak" },
    { value: 5, name: "Petak" },
    { value: 6, name: "Subota" },
    { value: 7, name: "Nedjelja" },
];

const MAX_SHIFTS_PER_DAY = 2;

// sva vremena u koracima od 30 min: "00:00", "00:30", ... "23:30"
const TIMES = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        TIMES.push(`${hh}:${mm}`);
    }
}

const SHIFTS_KEY = "workingHoursShiftPresets";

function loadPresets() {
    try {
        const raw = localStorage.getItem(SHIFTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function emptySchedule() {
    const map = {};
    DAYS.forEach((d) => (map[d.value] = []));
    return map;
}

export default function WorkingHours() {
    const { workerId } = useParams();
    const location = useLocation();
    const workerName = location.state?.workerName;

    const [schedule, setSchedule] = useState(emptySchedule);
    const [savedShiftId, setSavedShiftId] = useState(null);
    const [error, setError] = useState("");

    const [presets, setPresets] = useState(loadPresets);
    const [showPresetForm, setShowPresetForm] = useState(false);
    const [presetForm, setPresetForm] = useState({ name: "", openTime: "", closeTime: "" });

    useEffect(() => {
        client
            .get(`/workers/${workerId}/working-hours`)
            .then((res) => {
                const map = emptySchedule();
                res.data.forEach((wh) => {
                    map[wh.dayOfWeek].push({
                        id: wh.id,
                        openTime: wh.openTime.slice(0, 5),
                        closeTime: wh.closeTime.slice(0, 5),
                        isNew: false,
                    });
                });
                setSchedule(map);
            })
            .catch(() => setError("Greška pri dohvaćanju radnog vremena"));
    }, [workerId]);

    const addShiftRow = (day) => {
        setSchedule({
            ...schedule,
            [day]: [
                ...schedule[day],
                { id: `new-${Date.now()}`, openTime: "", closeTime: "", isNew: true },
            ],
        });
    };

    const removeShiftRow = async (day, shift) => {
        if (!shift.isNew) {
            try {
                await client.delete(`/workers/${workerId}/working-hours/${shift.id}`);
            } catch {
                setError("Greška pri brisanju smjene");
                return;
            }
        }
        setSchedule({
            ...schedule,
            [day]: schedule[day].filter((s) => s.id !== shift.id),
        });
    };

    const updateShiftField = (day, shiftId, field, value) => {
        setSchedule({
            ...schedule,
            [day]: schedule[day].map((s) =>
                s.id === shiftId ? { ...s, [field]: value } : s
            ),
        });
        setSavedShiftId(null);
    };

    const applyPreset = (day, shiftId, presetId) => {
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) return;
        setSchedule({
            ...schedule,
            [day]: schedule[day].map((s) =>
                s.id === shiftId
                    ? { ...s, openTime: preset.openTime, closeTime: preset.closeTime }
                    : s
            ),
        });
        setSavedShiftId(null);
    };

    const saveShift = async (day, shift) => {
        setError("");
        if (!shift.openTime || !shift.closeTime) {
            setError("Odaberi vrijeme otvaranja i zatvaranja");
            return;
        }
        if (shift.openTime >= shift.closeTime) {
            setError("Vrijeme zatvaranja mora biti nakon vremena otvaranja");
            return;
        }
        const body = {
            dayOfWeek: day,
            openTime: shift.openTime,
            closeTime: shift.closeTime,
            open: true,
        };
        try {
            if (shift.isNew) {
                const res = await client.post(`/workers/${workerId}/working-hours`, body);
                setSchedule({
                    ...schedule,
                    [day]: schedule[day].map((s) =>
                        s.id === shift.id
                            ? { id: res.data.id, openTime: shift.openTime, closeTime: shift.closeTime, isNew: false }
                            : s
                    ),
                });
                setSavedShiftId(res.data.id);
            } else {
                await client.put(`/workers/${workerId}/working-hours/${shift.id}`, body);
                setSavedShiftId(shift.id);
            }
        } catch {
            setError("Greška pri spremanju radnog vremena");
        }
    };

    const handlePresetFormChange = (e) => {
        setPresetForm({ ...presetForm, [e.target.name]: e.target.value });
    };

    const addPreset = (e) => {
        e.preventDefault();
        if (!presetForm.name || !presetForm.openTime || !presetForm.closeTime) return;
        const next = [...presets, { id: crypto.randomUUID(), ...presetForm }];
        setPresets(next);
        localStorage.setItem(SHIFTS_KEY, JSON.stringify(next));
        setPresetForm({ name: "", openTime: "", closeTime: "" });
        setShowPresetForm(false);
    };

    const removePreset = (id) => {
        const next = presets.filter((p) => p.id !== id);
        setPresets(next);
        localStorage.setItem(SHIFTS_KEY, JSON.stringify(next));
    };

    return (
        <div>
            <Navbar />
            <div className="page">
                <Link to="/moj-salon" className="btn-ghost" style={{ display: "inline-block", marginBottom: "16px" }}>
                    &larr; Natrag na salon
                </Link>
                <h2>Radno vrijeme{workerName ? ` — ${workerName}` : ""}</h2>
                <p className="page-subtitle">
                    Dodaj jednu ili dvije smjene po danu (npr. jutro i popodne s pauzom između).
                    Dan bez ijedne smjene se ne može rezervirati.
                </p>

                {error && <p className="auth-error">{error}</p>}

                <div className="shifts-card">
                    <div className="shifts-header">
                        <div>
                            <h3>Predlošci smjena</h3>
                            <p className="shifts-subtitle">
                                Spremi česte kombinacije sati pa ih primijeni jednim klikom.
                            </p>
                        </div>
                        {!showPresetForm && (
                            <button className="btn-ghost" onClick={() => setShowPresetForm(true)}>
                                + Novi predložak
                            </button>
                        )}
                    </div>

                    {showPresetForm && (
                        <form className="shift-form" onSubmit={addPreset}>
                            <input
                                name="name"
                                placeholder="Naziv (npr. Jutarnja)"
                                value={presetForm.name}
                                onChange={handlePresetFormChange}
                                required
                            />
                            <select
                                name="openTime"
                                value={presetForm.openTime}
                                onChange={handlePresetFormChange}
                                required
                            >
                                <option value="">Od</option>
                                {TIMES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <span className="hours-dash">–</span>
                            <select
                                name="closeTime"
                                value={presetForm.closeTime}
                                onChange={handlePresetFormChange}
                                required
                            >
                                <option value="">Do</option>
                                {TIMES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button type="submit" className="btn-primary">Spremi</button>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => setShowPresetForm(false)}
                            >
                                Odustani
                            </button>
                        </form>
                    )}

                    {presets.length === 0 && !showPresetForm ? (
                        <p className="shifts-empty">Još nemaš spremljenih predložaka.</p>
                    ) : (
                        <div className="shift-chip-list">
                            {presets.map((p) => (
                                <div key={p.id} className="shift-chip">
                                    <span className="shift-chip-name">{p.name}</span>
                                    <span className="shift-chip-time">
                                        {p.openTime}–{p.closeTime}
                                    </span>
                                    <button
                                        type="button"
                                        className="shift-chip-remove"
                                        onClick={() => removePreset(p.id)}
                                        aria-label={`Obriši predložak ${p.name}`}
                                    >
                                        <i className="ti ti-x"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="day-card-list">
                    {DAYS.map((d) => {
                        const dayShifts = schedule[d.value] || [];
                        const canAddMore = dayShifts.length < MAX_SHIFTS_PER_DAY;
                        return (
                            <div key={d.value} className="day-card">
                                <div className="day-card-header">
                                    <span className="day-card-name">{d.name}</span>
                                    {dayShifts.length === 0 && (
                                        <span className="day-card-off">Ne radi</span>
                                    )}
                                    {canAddMore && (
                                        <button
                                            className="btn-ghost day-card-add"
                                            onClick={() => addShiftRow(d.value)}
                                        >
                                            {dayShifts.length === 0
                                                ? "+ Dodaj smjenu"
                                                : "+ Dodaj drugu smjenu"}
                                        </button>
                                    )}
                                </div>

                                {dayShifts.length > 0 && (
                                    <div className="shift-row-list">
                                        {dayShifts.map((shift) => (
                                            <div key={shift.id} className="shift-row">
                                                {presets.length > 0 && (
                                                    <select
                                                        className="shift-row-preset"
                                                        value=""
                                                        onChange={(e) =>
                                                            applyPreset(d.value, shift.id, e.target.value)
                                                        }
                                                    >
                                                        <option value="">Predložak…</option>
                                                        {presets.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.openTime}–{p.closeTime})
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                <select
                                                    value={shift.openTime}
                                                    onChange={(e) =>
                                                        updateShiftField(d.value, shift.id, "openTime", e.target.value)
                                                    }
                                                >
                                                    <option value="">--:--</option>
                                                    {TIMES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>

                                                <span className="hours-dash">–</span>

                                                <select
                                                    value={shift.closeTime}
                                                    onChange={(e) =>
                                                        updateShiftField(d.value, shift.id, "closeTime", e.target.value)
                                                    }
                                                >
                                                    <option value="">--:--</option>
                                                    {TIMES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    className="btn-ghost"
                                                    onClick={() => saveShift(d.value, shift)}
                                                >
                                                    {savedShiftId === shift.id ? "Spremljeno ✓" : "Spremi"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="shift-row-remove"
                                                    onClick={() => removeShiftRow(d.value, shift)}
                                                    aria-label="Obriši smjenu"
                                                >
                                                    <i className="ti ti-trash"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
