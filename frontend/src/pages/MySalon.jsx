import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Navbar from "../components/Navbar";

// Date -> "YYYY-MM-DD" (lokalno, bez timezone pomaka)
function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfWeek(d) {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // ponedjeljak kao prvi dan tjedna
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    return monday;
}

const ANALYTICS_PRESETS = [
    {
        key: "today",
        label: "Danas",
        range: () => {
            const today = toYMD(new Date());
            return { from: today, to: today };
        },
    },
    {
        key: "week",
        label: "Ovaj tjedan",
        range: () => {
            const monday = startOfWeek(new Date());
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return { from: toYMD(monday), to: toYMD(sunday) };
        },
    },
    {
        key: "month",
        label: "Ovaj mjesec",
        range: () => {
            const now = new Date();
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { from: toYMD(first), to: toYMD(last) };
        },
    },
    {
        key: "lastMonth",
        label: "Prošli mjesec",
        range: () => {
            const now = new Date();
            const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const last = new Date(now.getFullYear(), now.getMonth(), 0);
            return { from: toYMD(first), to: toYMD(last) };
        },
    },
    {
        key: "year",
        label: "Ova godina",
        range: () => {
            const now = new Date();
            const first = new Date(now.getFullYear(), 0, 1);
            const last = new Date(now.getFullYear(), 11, 31);
            return { from: toYMD(first), to: toYMD(last) };
        },
    },
];

export default function MySalon() {
    const navigate = useNavigate();
    const [salon, setSalon] = useState([]);
    const [error, setError] = useState("");
    const [form, setForm]=useState({name:"",description:"",phone:"",address:""});
    const[showForm,setShowForm]=useState(false);
    const [services,setServices]=useState([]);
    const [serviceForm,setServiceForm]=useState({name:"",description:"",durationMinutes:"",price:""});
    const [showServiceForm,setShowServiceForm]=useState(false);
    const [editing,setEditing]=useState(false);
    const [editingService,setEditingService]=useState(null);
    const [workers,setWorkers]=useState([]);
    const [workerForm,setWorkerForm]=useState({name:""});
    const [showWorkerForm,setShowWorkerForm]=useState(false);
    const defaultRange = ANALYTICS_PRESETS.find((p) => p.key === "month").range();
    const [analyticsFrom, setAnalyticsFrom] = useState(defaultRange.from);
    const [analyticsTo, setAnalyticsTo] = useState(defaultRange.to);
    const [analyticsPreset, setAnalyticsPreset] = useState("month");
    const [analytics, setAnalytics] = useState(null);
    const [analyticsError, setAnalyticsError] = useState("");

    const applyPreset = (preset) => {
        const { from, to } = preset.range();
        setAnalyticsFrom(from);
        setAnalyticsTo(to);
        setAnalyticsPreset(preset.key);
    };
    const mySalon=salon[0];
    const startEditService = (s)=>{
        setServiceForm({
            name: s.name,
            description: s.description || "",
            durationMinutes: s.durationMinutes,
            price: s.price,
            });
        setEditingService(s);
        setShowServiceForm(true);
    }
    const handleChange =(e)=>{
        setForm({...form,[e.target.name]:e.target.value});
    };
    const handleServiceChange =(e)=>{
        setServiceForm({...serviceForm,[e.target.name]:e.target.value});
    };
    const handleServiceSubmit = async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await client.post(`/salons/${mySalon.id}/services`, serviceForm);
            setServices([...services, res.data]);
            setServiceForm({name:"",description:"",durationMinutes:"",price:""});
            setShowServiceForm(false);
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri dodavanju usluge");
        }
    };
    useEffect(()=>{
        if(mySalon){
            client.get(`/salons/${mySalon.id}/services`)
                .then((res)=>setServices(res.data))
                .catch(()=>setError("greska pri dohvacanju usluga."));
        }
    },[mySalon]);
    useEffect(()=>{
        if(mySalon){
            client.get(`/salons/${mySalon.id}/workers`)
                .then((res)=>setWorkers(res.data))
                .catch(()=>setError("greska pri dohvacanju radnika."));
        }
    },[mySalon]);
    const handleWorkerChange = (e) => {
        setWorkerForm({ ...workerForm, [e.target.name]: e.target.value });
    };
    const handleWorkerSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await client.post(`/salons/${mySalon.id}/workers`, workerForm);
            setWorkers([...workers, res.data]);
            setWorkerForm({ name: "" });
            setShowWorkerForm(false);
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri dodavanju radnika");
        }
    };
    const handleWorkerDelete = async (workerId) => {
        try {
            await client.delete(`/salons/${mySalon.id}/workers/${workerId}`);
            setWorkers(workers.filter((w) => w.id !== workerId));
        } catch {
            setError("greska pri brisanju radnika");
        }
    };
    const handleSubmit =async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await client.post("/salons",form);
            setSalon([res.data]);
            setShowForm(false);
        }catch (err) {
            setError(err.response?.data?.message || "Greska pri kreiranju salona");
        }
    }
    const handleDelete = async (salonId,serviceId)=>{
        try{
            await client.delete(`/salons/${salonId}/services/${serviceId}`);
            setServices(services.filter((s)=>s.id!==serviceId));
        }catch {
            setError("greska pri brisanju usluge")
        }

    }
    useEffect(() => {
        client
            .get("/salons/my")
            .then((res) => setSalon(res.data))
            .catch(() => setError("Greška pri dohvaćanju salona"));
    }, []);

    useEffect(() => {
        if (!mySalon || !analyticsFrom || !analyticsTo) return;
        setAnalyticsError("");
        client
            .get(`/appointments/salon/${mySalon.id}/analytics`, {
                params: {
                    startTime: `${analyticsFrom}T00:00:00`,
                    endTime: `${analyticsTo}T23:59:59`,
                },
            })
            .then((res) => setAnalytics(res.data))
            .catch(() => setAnalyticsError("Greška pri dohvaćanju analitike"));
    }, [mySalon, analyticsFrom, analyticsTo]);
    const startEdit = ()=>{
        setForm({
            name:mySalon.name,
            description: mySalon.description,
            phone: mySalon.phone,
            address: mySalon.address,
            }
        );
        setEditing(true);
    }
    const handleUpdate = async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await client.put(`/salons/${mySalon.id}`,form);
            setSalon([res.data]);
            setEditing(false);
        }catch (err){
            setError(err.response?.data?.error || "Greška pri uređivanju salona");
        }
    }
    const handleServiceUpdate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await client.put(
                `/salons/${mySalon.id}/services/${editingService.id}`,
                serviceForm
            );
            setServices(services.map((s) => (s.id === editingService.id ? res.data : s)));
            setServiceForm({ name: "", description: "", durationMinutes: "", price: "" });
            setShowServiceForm(false);
            setEditingService(null);
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri uređivanju usluge");
        }
    };

    return (
        <div>
            <Navbar />

            <div className="page">
                <h2>Moj salon</h2>

                {error && <p className="auth-error">{error}</p>}

                {salon.length > 0 && !editing ? (
                        <div className="owner-hero">
                            <div className="owner-hero-top">
                                <div className="owner-hero-icon">
                                    <i className="ti ti-building-store"></i>
                                </div>
                                <div className="owner-hero-info">
                                    <div className="owner-hero-title-row">
                                        <h2>{mySalon.name}</h2>
                                        <span className="badge">{mySalon.subscriptionPlan}</span>
                                    </div>
                                    <div className="owner-hero-meta">
                                        <span><i className="ti ti-map-pin"></i> {mySalon.address}</span>
                                        <span><i className="ti ti-phone"></i> {mySalon.phone}</span>
                                    </div>
                                </div>
                                <button className="btn-ghost" onClick={startEdit}>
                                    <i className="ti ti-pencil"></i> Uredi salon
                                </button>
                            </div>

                            {mySalon.description && (
                                <p className="owner-hero-desc">{mySalon.description}</p>
                            )}

                            <div className="owner-stats">
                                <div className="stat-chip">
                                    <span className="stat-value">{workers.length}</span>
                                    <span className="stat-label">
                                        <i className="ti ti-users"></i> Radnika
                                    </span>
                                </div>
                                <div className="stat-chip">
                                    <span className="stat-value">{services.length}</span>
                                    <span className="stat-label">
                                        <i className="ti ti-list-details"></i> Usluga
                                    </span>
                                </div>
                            </div>
                        </div>
                ) : (showForm||editing) ? (
                    <form className="salon-form" onSubmit={editing?handleUpdate:handleSubmit}>
                        <label>Salon name</label>
                        <input name="name" value={form.name} onChange={handleChange} required />

                        <label>Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={3} />

                        <label>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                        />

                        <label>Address</label>
                        <input name="address" value={form.address} onChange={handleChange} required />
                        <div className="form-actions">
                            {editing ? (
                                <>
                                    <button type="submit">Spremi promjene</button>
                                    <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                                        Odustani
                                    </button>
                                </>
                            ) : (
                                <button type="submit">Kreiraj</button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="empty-state">
                        <p>Još nemaš salon.</p>
                        <button onClick={() => setShowForm(true)}>Kreiraj salon</button>
                    </div>
                )}
                {salon.length > 0 && !editing && (
                    <div className="services-section analytics-section">
                        <div className="services-header">
                            <h3>Analitika</h3>
                        </div>

                        <div className="analytics-toolbar">
                            <div className="analytics-presets">
                                {ANALYTICS_PRESETS.map((preset) => (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        className={`analytics-preset ${analyticsPreset === preset.key ? "active" : ""}`}
                                        onClick={() => applyPreset(preset)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div className="analytics-range">
                                <input
                                    type="date"
                                    value={analyticsFrom}
                                    max={analyticsTo}
                                    onChange={(e) => {
                                        setAnalyticsFrom(e.target.value);
                                        setAnalyticsPreset(null);
                                    }}
                                />
                                <span>–</span>
                                <input
                                    type="date"
                                    value={analyticsTo}
                                    min={analyticsFrom}
                                    onChange={(e) => {
                                        setAnalyticsTo(e.target.value);
                                        setAnalyticsPreset(null);
                                    }}
                                />
                            </div>
                        </div>

                        {analyticsError && <p className="auth-error">{analyticsError}</p>}

                        <div className="analytics-grid">
                            <div className="analytics-card">
                                <span className="analytics-card-value">
                                    {analytics ? analytics.total : "–"}
                                </span>
                                <span className="analytics-card-label">
                                    <i className="ti ti-calendar-stats"></i> Ukupno rezervacija
                                </span>
                            </div>
                            <div className="analytics-card analytics-card-success">
                                <span className="analytics-card-value">
                                    {analytics ? analytics.totalBooked : "–"}
                                </span>
                                <span className="analytics-card-label">
                                    <i className="ti ti-circle-check"></i> Aktivnih
                                </span>
                            </div>
                            <div className="analytics-card analytics-card-danger">
                                <span className="analytics-card-value">
                                    {analytics ? analytics.totalCancelled : "–"}
                                </span>
                                <span className="analytics-card-label">
                                    <i className="ti ti-circle-x"></i> Otkazanih
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {salon.length > 0 && (
                    <div className="services-section">
                        <div className="services-header">
                            <h3>Usluge</h3>
                            {!showServiceForm && (
                                <button
                                    className="btn-ghost"
                                    onClick={() => setShowServiceForm(true)}
                                >
                                    + Dodaj uslugu
                                </button>
                            )}
                        </div>

                        {showServiceForm && (
                            <form className="salon-form" onSubmit={editingService ? handleServiceUpdate : handleServiceSubmit}>
                                <label>Naziv usluge</label>
                                <input
                                    name="name"
                                    value={serviceForm.name}
                                    onChange={handleServiceChange}
                                    required
                                />

                                <label>Opis</label>
                                <textarea
                                    name="description"
                                    value={serviceForm.description}
                                    onChange={handleServiceChange}
                                    rows={2}
                                />

                                <label>Trajanje (min)</label>
                                <input
                                    type="number"
                                    name="durationMinutes"
                                    value={serviceForm.durationMinutes}
                                    onChange={handleServiceChange}
                                    min={5}
                                    max={480}
                                    required
                                />

                                <label>Cijena (€)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={serviceForm.price}
                                    onChange={handleServiceChange}
                                    min={0.01}
                                    step={0.01}
                                    required
                                />

                                <div className="form-actions">
                                    <button type="submit">Spremi</button>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => { setShowServiceForm(false); setEditingService(null); }}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </form>
                        )}

                        {services.length === 0 ? (
                            <p className="services-empty">Još nema usluga.</p>
                        ) : (
                            <div className="manage-grid">
                                {services.map((s) => (
                                    <div key={s.id} className="manage-card">
                                        <div className="manage-card-icon">
                                            <i className="ti ti-scissors"></i>
                                        </div>
                                        <div className="manage-card-body">
                                            <div className="manage-card-name">{s.name}</div>
                                            <div className="manage-card-meta">
                                                <span><i className="ti ti-clock"></i> {s.durationMinutes} min</span>
                                                <span><i className="ti ti-cash"></i> {s.price} €</span>
                                            </div>
                                        </div>
                                        <div className="manage-card-actions">
                                            <button className="btn-ghost" onClick={()=>startEditService(s)}>
                                                <i className="ti ti-pencil"></i>
                                            </button>
                                            <button className="btn-ghost" onClick={()=>handleDelete(mySalon.id,s.id)}>
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {salon.length > 0 && (
                    <div className="services-section">
                        <div className="services-header">
                            <h3>Radnici</h3>
                            {!showWorkerForm && (
                                <button
                                    className="btn-ghost"
                                    onClick={() => setShowWorkerForm(true)}
                                >
                                    + Dodaj radnika
                                </button>
                            )}
                        </div>

                        {showWorkerForm && (
                            <form className="salon-form" onSubmit={handleWorkerSubmit}>
                                <label>Ime radnika</label>
                                <input
                                    name="name"
                                    value={workerForm.name}
                                    onChange={handleWorkerChange}
                                    required
                                />

                                <div className="form-actions">
                                    <button type="submit">Spremi</button>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setShowWorkerForm(false)}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </form>
                        )}

                        {workers.length === 0 ? (
                            <p className="services-empty">Još nema radnika.</p>
                        ) : (
                            <div className="manage-grid">
                                {workers.map((w) => (
                                    <div key={w.id} className="manage-card">
                                        <div className="manage-card-icon">
                                            <i className="ti ti-user"></i>
                                        </div>
                                        <div className="manage-card-body">
                                            <div className="manage-card-name">{w.name}</div>
                                        </div>
                                        <div className="manage-card-actions">
                                            <button
                                                className="btn-ghost"
                                                onClick={() =>
                                                    navigate(`/radno-vrijeme/${w.id}`, { state: { workerName: w.name } })
                                                }
                                            >
                                                <i className="ti ti-clock-hour-4"></i> Radno vrijeme
                                            </button>
                                            <button className="btn-ghost" onClick={() => handleWorkerDelete(w.id)}>
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}