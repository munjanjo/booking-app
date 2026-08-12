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

// sva vremena u koracima od 30 min, uvijek 24h format: "00:00", "00:30", ... "23:30"
const TIMES = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        TIMES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
}

const PRESETS_KEY = "workingHoursShiftPresets";

const DEFAULT_PRESETS = [
    { id: "default-jutarnja", name: "Jutarnja", openTime: "09:00", closeTime: "17:00" },
    { id: "default-popodnevna", name: "Popodnevna", openTime: "12:00", closeTime: "20:00" },
];

function loadPresets() {
    try {
        const raw = localStorage.getItem(PRESETS_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_PRESETS;
    } catch {
        return DEFAULT_PRESETS;
    }
}

function emptySchedule() {
    const map = {};
    DAYS.forEach((d) => (map[d.value] = { open: false, shifts: [] }));
    return map;
}

function cloneSchedule(schedule) {
    const clone = {};
    DAYS.forEach((d) => {
        clone[d.value] = {
            open: schedule[d.value].open,
            shifts: schedule[d.value].shifts.map((s) => ({ ...s })),
        };
    });
    return clone;
}

// Date -> "YYYY-MM-DD"
function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatDateHr(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}.`;
}

// popuni sve datume između from i to (uključivo), format "YYYY-MM-DD"
function dateRange(from, to) {
    const dates = [];
    let cur = new Date(from + "T00:00:00");
    const end = new Date(to + "T00:00:00");
    while (cur <= end) {
        dates.push(toYMD(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
}

export default function WorkingHours() {
    const { workerId } = useParams();
    const location = useLocation();
    const workerName = location.state?.workerName;

    const [schedule, setSchedule] = useState(emptySchedule);
    const [initialSchedule, setInitialSchedule] = useState(emptySchedule);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [openCopyDay, setOpenCopyDay] = useState(null);

    const [presets, setPresets] = useState(loadPresets);
    const [showPresetForm, setShowPresetForm] = useState(false);
    const [presetForm, setPresetForm] = useState({ name: "", openTime: "09:00", closeTime: "17:00" });

    const [exceptions, setExceptions] = useState([]);
    const [showExceptionForm, setShowExceptionForm] = useState(false);
    const [exceptionForm, setExceptionForm] = useState({
        from: "",
        to: "",
        allDayOff: true,
        openTime: "09:00",
        closeTime: "17:00",
        reason: "",
    });

    const loadSchedule = () => {
        client
            .get(`/workers/${workerId}/working-hours`)
            .then((res) => {
                const map = emptySchedule();
                res.data.forEach((wh) => {
                    map[wh.dayOfWeek].open = true;
                    map[wh.dayOfWeek].shifts.push({
                        id: wh.id,
                        open: wh.openTime.slice(0, 5),
                        close: wh.closeTime.slice(0, 5),
                    });
                });
                setSchedule(map);
                setInitialSchedule(cloneSchedule(map));
                setDirty(false);
            })
            .catch(() => setError("Greška pri dohvaćanju radnog vremena"));
    };

    const loadExceptions = () => {
        client
            .get(`/workers/${workerId}/working-hours-exceptions`)
            .then((res) => setExceptions(res.data))
            .catch(() => setError("Greška pri dohvaćanju iznimki"));
    };

    useEffect(() => {
        loadSchedule();
        loadExceptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workerId]);

    const markDirty = () => setDirty(true);

    const toggleDay = (day) => {
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            const wasOpen = next[day].open;
            next[day].open = !wasOpen;
            if (!wasOpen && next[day].shifts.length === 0) {
                next[day].shifts = [{ id: null, open: "09:00", close: "17:00" }];
            }
            if (wasOpen) {
                next[day].shifts = [];
            }
            return next;
        });
        markDirty();
    };

    const addShift = (day) => {
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            next[day].shifts.push({ id: null, open: "13:00", close: "17:00" });
            return next;
        });
        markDirty();
    };

    const removeShift = (day, idx) => {
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            next[day].shifts.splice(idx, 1);
            return next;
        });
        markDirty();
    };

    const updateShiftField = (day, idx, field, value) => {
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            next[day].shifts[idx][field] = value;
            return next;
        });
        markDirty();
    };

    const applyPresetToShift = (day, idx, presetId) => {
        const preset = presets.find((p) => p.id === presetId);
        if (!preset) return;
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            next[day].shifts[idx] = { ...next[day].shifts[idx], open: preset.openTime, close: preset.closeTime };
            return next;
        });
        markDirty();
    };

    const handlePresetFormChange = (field, value) => {
        setPresetForm({ ...presetForm, [field]: value });
    };

    const addPreset = (e) => {
        e.preventDefault();
        if (!presetForm.name || !presetForm.openTime || !presetForm.closeTime) return;
        const next = [...presets, { id: crypto.randomUUID(), ...presetForm }];
        setPresets(next);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
        setPresetForm({ name: "", openTime: "09:00", closeTime: "17:00" });
        setShowPresetForm(false);
    };

    const removePreset = (id) => {
        const next = presets.filter((p) => p.id !== id);
        setPresets(next);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
    };

    const applyCopy = (fromDay, targetDays) => {
        if (targetDays.length === 0) return;
        setSchedule((prev) => {
            const next = cloneSchedule(prev);
            const sourceShifts = next[fromDay].shifts;
            targetDays.forEach((day) => {
                next[day].open = true;
                next[day].shifts = sourceShifts.map((s) => ({ id: null, open: s.open, close: s.close }));
            });
            return next;
        });
        setOpenCopyDay(null);
        markDirty();
    };

    const saveAll = async () => {
        setSaving(true);
        setError("");
        try {
            for (const d of DAYS) {
                const day = d.value;
                const current = schedule[day].shifts;
                const initial = initialSchedule[day].shifts;

                const currentIds = current.map((s) => s.id).filter(Boolean);
                const toDelete = initial.filter((s) => !currentIds.includes(s.id));
                for (const s of toDelete) {
                    await client.delete(`/workers/${workerId}/working-hours/${s.id}`);
                }

                for (const s of current) {
                    const body = { dayOfWeek: day, openTime: s.open, closeTime: s.close, open: true };
                    if (!s.id) {
                        await client.post(`/workers/${workerId}/working-hours`, body);
                    } else {
                        const original = initial.find((o) => o.id === s.id);
                        if (original && (original.open !== s.open || original.close !== s.close)) {
                            await client.put(`/workers/${workerId}/working-hours/${s.id}`, body);
                        }
                    }
                }
            }
            loadSchedule();
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri spremanju radnog vremena");
        } finally {
            setSaving(false);
        }
    };

    const handleExceptionFormChange = (field, value) => {
        setExceptionForm({ ...exceptionForm, [field]: value });
    };

    const submitException = async (e) => {
        e.preventDefault();
        setError("");
        if (!exceptionForm.from) {
            setError("Odaberi barem datum 'Od'");
            return;
        }
        if (!exceptionForm.allDayOff && exceptionForm.openTime >= exceptionForm.closeTime) {
            setError("Vrijeme zatvaranja mora biti nakon vremena otvaranja");
            return;
        }
        const dates = dateRange(exceptionForm.from, exceptionForm.to || exceptionForm.from);
        try {
            for (const date of dates) {
                await client.post(`/workers/${workerId}/working-hours-exceptions`, {
                    date,
                    allDayOff: exceptionForm.allDayOff,
                    openTime: exceptionForm.allDayOff ? null : exceptionForm.openTime,
                    closeTime: exceptionForm.allDayOff ? null : exceptionForm.closeTime,
                    reason: exceptionForm.reason || null,
                });
            }
            loadExceptions();
            setShowExceptionForm(false);
            setExceptionForm({ from: "", to: "", allDayOff: true, openTime: "09:00", closeTime: "17:00", reason: "" });
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri dodavanju iznimke");
        }
    };

    const removeException = async (id) => {
        try {
            await client.delete(`/workers/${workerId}/working-hours-exceptions/${id}`);
            setExceptions(exceptions.filter((ex) => ex.id !== id));
        } catch {
            setError("Greška pri brisanju iznimke");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page wh-page">
                <Link to="/moj-salon" className="btn-ghost wh-back">
                    &larr; Natrag na salon
                </Link>
                <h2>Radno vrijeme{workerName ? ` — ${workerName}` : ""}</h2>
                <p className="page-subtitle">
                    Uključi dane kad radnik radi, postavi vrijeme, i po potrebi dodaj drugu smjenu za pauzu.
                    Ikona kopiranja primjenjuje isto vrijeme na druge dane u jednom potezu.
                </p>

                {error && <p className="auth-error">{error}</p>}

                <div className="wh-presets-bar">
                    {presets.map((p) => (
                        <div key={p.id} className="wh-preset-chip">
                            <span className="wh-preset-chip-name">{p.name}</span>
                            <span className="wh-preset-chip-time">
                                {p.openTime}–{p.closeTime}
                            </span>
                            <button
                                type="button"
                                className="wh-preset-chip-remove"
                                onClick={() => removePreset(p.id)}
                                aria-label={`Obriši predložak ${p.name}`}
                            >
                                <i className="ti ti-x"></i>
                            </button>
                        </div>
                    ))}
                    {!showPresetForm && (
                        <button type="button" className="wh-preset-add" onClick={() => setShowPresetForm(true)}>
                            <i className="ti ti-plus"></i> Novi predložak
                        </button>
                    )}
                </div>

                {showPresetForm && (
                    <form className="wh-preset-form" onSubmit={addPreset}>
                        <input
                            type="text"
                            placeholder="Naziv (npr. Jutarnja)"
                            value={presetForm.name}
                            onChange={(e) => handlePresetFormChange("name", e.target.value)}
                            required
                        />
                        <select
                            value={presetForm.openTime}
                            onChange={(e) => handlePresetFormChange("openTime", e.target.value)}
                            required
                        >
                            {TIMES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <span className="wh-shift-dash">–</span>
                        <select
                            value={presetForm.closeTime}
                            onChange={(e) => handlePresetFormChange("closeTime", e.target.value)}
                            required
                        >
                            {TIMES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <button type="submit" className="btn-primary">Spremi</button>
                        <button type="button" className="btn-ghost" onClick={() => setShowPresetForm(false)}>
                            Odustani
                        </button>
                    </form>
                )}

                <div className="wh-card">
                    {DAYS.map((d) => {
                        const day = schedule[d.value];
                        const canAddMore = day.shifts.length < MAX_SHIFTS_PER_DAY;
                        return (
                            <div key={d.value} className="wh-day-row">
                                <div className="wh-day-left">
                                    <button
                                        type="button"
                                        className={`wh-toggle ${day.open ? "on" : ""}`}
                                        onClick={() => toggleDay(d.value)}
                                        aria-label={`Uključi/isključi ${d.name}`}
                                    />
                                    <span className="wh-day-name">{d.name}</span>
                                </div>

                                <div className="wh-day-shifts">
                                    {day.open ? (
                                        <>
                                            {day.shifts.map((s, idx) => (
                                                <div key={idx} className="wh-shift-range">
                                                    {presets.length > 0 && (
                                                        <select
                                                            className="wh-shift-preset-select"
                                                            value=""
                                                            onChange={(e) => applyPresetToShift(d.value, idx, e.target.value)}
                                                            aria-label="Primijeni predložak"
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
                                                        value={s.open}
                                                        onChange={(e) => updateShiftField(d.value, idx, "open", e.target.value)}
                                                    >
                                                        {TIMES.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <span className="wh-shift-dash">–</span>
                                                    <select
                                                        value={s.close}
                                                        onChange={(e) => updateShiftField(d.value, idx, "close", e.target.value)}
                                                    >
                                                        {TIMES.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        className="wh-shift-remove"
                                                        onClick={() => removeShift(d.value, idx)}
                                                        aria-label="Ukloni smjenu"
                                                    >
                                                        <i className="ti ti-trash"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            {canAddMore && (
                                                <button type="button" className="wh-add-shift" onClick={() => addShift(d.value)}>
                                                    <i className="ti ti-plus"></i> Dodaj smjenu
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="wh-day-off">Ne radi</span>
                                    )}
                                </div>

                                <div className="wh-day-actions">
                                    {day.open && (
                                        <button
                                            type="button"
                                            className={`wh-icon-btn ${openCopyDay === d.value ? "active" : ""}`}
                                            onClick={() => setOpenCopyDay(openCopyDay === d.value ? null : d.value)}
                                            aria-label="Kopiraj na druge dane"
                                        >
                                            <i className="ti ti-copy"></i>
                                        </button>
                                    )}
                                    {openCopyDay === d.value && (
                                        <CopyPopover
                                            day={d.value}
                                            onCancel={() => setOpenCopyDay(null)}
                                            onApply={(targets) => applyCopy(d.value, targets)}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="wh-footer-bar">
                    <span className={`wh-footer-hint ${dirty ? "dirty" : ""}`}>
                        {dirty ? "Imaš nespremljene promjene." : "Sve promjene su lokalne dok ne spremiš."}
                    </span>
                    <button className="btn-primary wh-save-btn" onClick={saveAll} disabled={saving}>
                        <i className="ti ti-check"></i> {saving ? "Spremam…" : "Spremi sve"}
                    </button>
                </div>

                <div className="wh-section">
                    <h3>Iznimke i slobodni dani</h3>
                    <p className="page-subtitle">
                        Za praznik, bolovanje ili poseban raspored samo za određeni datum. Iznimka uvijek ima
                        prednost pred tjednim rasporedom iznad.
                    </p>

                    {exceptions.length === 0 ? (
                        <p className="services-empty">Još nema dodanih iznimki.</p>
                    ) : (
                        <div className="wh-exceptions-list">
                            {exceptions.map((ex) => (
                                <div key={ex.id} className="wh-exception-row">
                                    <span className="wh-exception-date">{formatDateHr(ex.date)}</span>
                                    {ex.allDayOff ? (
                                        <span className="wh-exception-badge off">Slobodno</span>
                                    ) : (
                                        <span className="wh-exception-badge custom">
                                            {ex.openTime?.slice(0, 5)}–{ex.closeTime?.slice(0, 5)}
                                        </span>
                                    )}
                                    <span className="wh-exception-reason">{ex.reason}</span>
                                    <button
                                        type="button"
                                        className="wh-shift-remove"
                                        onClick={() => removeException(ex.id)}
                                        aria-label="Ukloni iznimku"
                                    >
                                        <i className="ti ti-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {showExceptionForm && (
                        <form className="wh-exception-form" onSubmit={submitException}>
                            <div className="wh-form-row">
                                <label className="wh-field">
                                    Od datuma
                                    <input
                                        type="date"
                                        value={exceptionForm.from}
                                        onChange={(e) => handleExceptionFormChange("from", e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="wh-field">
                                    Do datuma
                                    <input
                                        type="date"
                                        value={exceptionForm.to}
                                        min={exceptionForm.from}
                                        onChange={(e) => handleExceptionFormChange("to", e.target.value)}
                                    />
                                </label>
                            </div>

                            <label className="wh-day-off-toggle">
                                <input
                                    type="checkbox"
                                    checked={exceptionForm.allDayOff}
                                    onChange={(e) => handleExceptionFormChange("allDayOff", e.target.checked)}
                                />
                                Cijeli dan slobodno (bez rezervacija)
                            </label>

                            {!exceptionForm.allDayOff && (
                                <div className="wh-form-row">
                                    <label className="wh-field">
                                        Otvara
                                        <select
                                            value={exceptionForm.openTime}
                                            onChange={(e) => handleExceptionFormChange("openTime", e.target.value)}
                                        >
                                            {TIMES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="wh-field">
                                        Zatvara
                                        <select
                                            value={exceptionForm.closeTime}
                                            onChange={(e) => handleExceptionFormChange("closeTime", e.target.value)}
                                        >
                                            {TIMES.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            )}

                            <label className="wh-field">
                                Razlog (opcionalno)
                                <input
                                    type="text"
                                    placeholder="npr. Godišnji odmor"
                                    value={exceptionForm.reason}
                                    onChange={(e) => handleExceptionFormChange("reason", e.target.value)}
                                />
                            </label>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Dodaj iznimku</button>
                                <button type="button" className="btn-ghost" onClick={() => setShowExceptionForm(false)}>
                                    Odustani
                                </button>
                            </div>
                        </form>
                    )}

                    {!showExceptionForm && (
                        <button type="button" className="btn-ghost" onClick={() => setShowExceptionForm(true)}>
                            <i className="ti ti-plus"></i> Dodaj iznimku
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CopyPopover({ day, onCancel, onApply }) {
    const [checked, setChecked] = useState([]);

    const toggle = (value) => {
        setChecked((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

    return (
        <div className="wh-copy-popover">
            <div className="wh-copy-popover-title">Primijeni i na</div>
            {DAYS.filter((o) => o.value !== day).map((o) => (
                <label key={o.value} className="wh-copy-day-option">
                    <input
                        type="checkbox"
                        checked={checked.includes(o.value)}
                        onChange={() => toggle(o.value)}
                    />
                    {o.name}
                </label>
            ))}
            <div className="wh-copy-popover-actions">
                <button type="button" className="btn-ghost" onClick={onCancel}>
                    Odustani
                </button>
                <button type="button" className="btn-primary" onClick={() => onApply(checked)}>
                    Primijeni
                </button>
            </div>
        </div>
    );
}
