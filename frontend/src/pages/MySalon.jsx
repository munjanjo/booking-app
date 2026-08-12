import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Navbar from "../components/Navbar";
import useGooglePlacesAutocomplete from "../hooks/useGooglePlacesAutocomplete";

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
    const [form, setForm]=useState({name:"",description:"",phone:"",address:"",maxAdvanceBookingDays:"",minNoticeHours:""});
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
    const [prevAnalytics, setPrevAnalytics] = useState(null);
    const [analyticsError, setAnalyticsError] = useState("");
    const [serviceAnalytics, setServiceAnalytics] = useState([]);
    const [images, setImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [closures, setClosures] = useState([]);
    const [closureForm, setClosureForm] = useState({ date: "", reason: "" });
    const [showClosureForm, setShowClosureForm] = useState(false);
    const [closureError, setClosureError] = useState("");
    const addressInputRef = useRef(null);
    useGooglePlacesAutocomplete(addressInputRef, (address) =>
        setForm((f) => ({ ...f, address }))
    );

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
    useEffect(()=>{
        if(mySalon){
            client.get(`/salons/${mySalon.id}/images`)
                .then((res)=>setImages(res.data))
                .catch(()=>setError("greska pri dohvacanju slika."));
        }
    },[mySalon]);
    useEffect(() => {
        if (mySalon) {
            client.get(`/salons/${mySalon.id}/closures`)
                .then((res) => setClosures(res.data))
                .catch(() => {});
        }
    }, [mySalon]);
    const handleClosureSubmit = async (e) => {
        e.preventDefault();
        setClosureError("");
        try {
            const res = await client.post(`/salons/${mySalon.id}/closures`, closureForm);
            setClosures([...closures, res.data].sort((a, b) => a.date.localeCompare(b.date)));
            setClosureForm({ date: "", reason: "" });
            setShowClosureForm(false);
        } catch (err) {
            setClosureError(err.response?.data?.error || "Greška pri dodavanju slobodnog dana");
        }
    };
    const handleClosureDelete = async (closureId) => {
        try {
            await client.delete(`/salons/${mySalon.id}/closures/${closureId}`);
            setClosures(closures.filter((c) => c.id !== closureId));
        } catch {
            setClosureError("Greška pri brisanju");
        }
    };
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        setError("");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await client.post(`/salons/${mySalon.id}/images`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setImages([...images, res.data]);
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri uploadu slike");
        } finally {
            setUploadingImage(false);
            e.target.value = "";
        }
    };
    const handleImageDelete = async (imageId) => {
        try {
            await client.delete(`/salons/${mySalon.id}/images/${imageId}`);
            setImages(images.filter((img) => img.id !== imageId));
        } catch {
            setError("Greška pri brisanju slike");
        }
    };
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
    const toSalonPayload = (f) => ({
        name: f.name,
        description: f.description,
        phone: f.phone,
        address: f.address,
        maxAdvanceBookingDays: f.maxAdvanceBookingDays === "" ? null : Number(f.maxAdvanceBookingDays),
        minNoticeHours: f.minNoticeHours === "" ? null : Number(f.minNoticeHours),
    });
    const handleSubmit =async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await client.post("/salons",toSalonPayload(form));
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
        client
            .get(`/appointments/salon/${mySalon.id}/analytics/services`, {
                params: {
                    startTime: `${analyticsFrom}T00:00:00`,
                    endTime: `${analyticsTo}T23:59:59`,
                },
            })
            .then((res) => setServiceAnalytics(res.data))
            .catch(() => {});

        // isto trajanje, neposredno prije odabranog perioda - za usporedbu trenda
        const from = new Date(`${analyticsFrom}T00:00:00`);
        const to = new Date(`${analyticsTo}T23:59:59`);
        const durationMs = to - from + 1;
        const prevTo = new Date(from.getTime() - 1);
        const prevFrom = new Date(prevTo.getTime() - durationMs + 1);
        client
            .get(`/appointments/salon/${mySalon.id}/analytics`, {
                params: {
                    startTime: toYMD(prevFrom) + "T00:00:00",
                    endTime: toYMD(prevTo) + "T23:59:59",
                },
            })
            .then((res) => setPrevAnalytics(res.data))
            .catch(() => setPrevAnalytics(null));
    }, [mySalon, analyticsFrom, analyticsTo]);

    const trendPct = (curr, prev) => {
        if (prev === 0) return curr > 0 ? null : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };
    const startEdit = ()=>{
        setForm({
            name:mySalon.name,
            description: mySalon.description,
            phone: mySalon.phone,
            address: mySalon.address,
            maxAdvanceBookingDays: mySalon.maxAdvanceBookingDays ?? "",
            minNoticeHours: mySalon.minNoticeHours ?? "",
            }
        );
        setEditing(true);
    }
    useEffect(() => {
        if (activeTab === "settings" && mySalon) startEdit();
    }, [activeTab, mySalon]);
    const handleUpdate = async (e)=>{
        e.preventDefault();
        setError("");
        try {
            const res = await client.put(`/salons/${mySalon.id}`,toSalonPayload(form));
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

    const TABS = [
        { key: "overview", label: "Pregled", icon: "ti-layout-dashboard" },
        { key: "gallery", label: "Galerija", icon: "ti-photo" },
        { key: "services", label: "Usluge", icon: "ti-list-details" },
        { key: "workers", label: "Radnici", icon: "ti-users" },
        { key: "analytics", label: "Analitika", icon: "ti-chart-bar" },
        { key: "settings", label: "Postavke", icon: "ti-settings" },
    ];

    if (salon.length === 0) {
        return (
            <div>
                <Navbar />
                <div className="page">
                    <h2>Moj salon</h2>
                    {error && <p className="auth-error">{error}</p>}
                    {showForm ? (
                        <form className="salon-form" onSubmit={handleSubmit}>
                            <label>Salon name</label>
                            <input name="name" value={form.name} onChange={handleChange} required />

                            <label>Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />

                            <label>Phone</label>
                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />

                            <label>Address</label>
                            <input ref={addressInputRef} name="address" value={form.address} onChange={handleChange} required autoComplete="off" />

                            <div className="form-actions">
                                <button type="submit">Kreiraj</button>
                            </div>
                        </form>
                    ) : (
                        <div className="empty-state">
                            <p>Još nemaš salon.</p>
                            <button onClick={() => setShowForm(true)}>Kreiraj salon</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />

            <div className="page dashboard-page">
                <div className="dashboard-header">
                    <div>
                        <h2>{mySalon.name}</h2>
                        <p className="page-subtitle">Upravljaj svojim salonom na jednom mjestu</p>
                    </div>
                    <span className="badge">{mySalon.subscriptionPlan}</span>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <div className="dashboard-layout">
                    <nav className="dashboard-nav">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`dashboard-nav-item ${activeTab === tab.key ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <i className={`ti ${tab.icon}`}></i> {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="dashboard-content">
                        {activeTab === "overview" && (
                            <div className="dashboard-panel">
                                <div className="owner-hero">
                                    <div className="owner-hero-top">
                                        <div className="owner-hero-icon">
                                            <i className="ti ti-building-store"></i>
                                        </div>
                                        <div className="owner-hero-info">
                                            <div className="owner-hero-title-row">
                                                <h3>{mySalon.name}</h3>
                                            </div>
                                            <div className="owner-hero-meta">
                                                <span><i className="ti ti-map-pin"></i> {mySalon.address}</span>
                                                <span><i className="ti ti-phone"></i> {mySalon.phone}</span>
                                            </div>
                                        </div>
                                        <button className="btn-ghost" onClick={() => setActiveTab("settings")}>
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
                                        <div className="stat-chip">
                                            <span className="stat-value">{images.length}</span>
                                            <span className="stat-label">
                                                <i className="ti ti-photo"></i> Slika
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "gallery" && (
                    <div className="services-section">
                        <div className="services-header">
                            <h3>Galerija</h3>
                            <span className="salon-form-hint" style={{ margin: 0 }}>
                                {images.length}/10 slika
                            </span>
                        </div>

                        <div className="gallery-grid">
                            {images.map((img) => (
                                <div key={img.id} className="gallery-item">
                                    <img src={img.url} alt={mySalon.name} />
                                    <button
                                        type="button"
                                        className="gallery-item-delete"
                                        onClick={() => handleImageDelete(img.id)}
                                        title="Ukloni sliku"
                                    >
                                        <i className="ti ti-trash"></i>
                                    </button>
                                    {img.sortOrder === 0 && (
                                        <span className="gallery-item-cover">Naslovna</span>
                                    )}
                                </div>
                            ))}

                            {images.length < 10 && (
                                <label className={`gallery-add-tile ${uploadingImage ? "disabled" : ""}`}>
                                    {uploadingImage ? (
                                        <i className="ti ti-loader-2 gallery-spin"></i>
                                    ) : (
                                        <>
                                            <i className="ti ti-plus"></i>
                                            <span>Dodaj sliku</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        hidden
                                    />
                                </label>
                            )}
                        </div>
                        {images.length === 0 && (
                            <p className="services-empty">
                                Dodaj barem naslovnu sliku salona da klijenti dobiju bolji dojam.
                            </p>
                        )}
                    </div>
                        )}

                        {activeTab === "analytics" && (
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
                            {[
                                {
                                    key: "total",
                                    icon: "ti-calendar-stats",
                                    label: "Ukupno rezervacija",
                                    value: analytics?.total,
                                    prev: prevAnalytics?.total,
                                    cls: "",
                                    format: (v) => v,
                                },
                                {
                                    key: "booked",
                                    icon: "ti-circle-check",
                                    label: "Aktivnih",
                                    value: analytics?.totalBooked,
                                    prev: prevAnalytics?.totalBooked,
                                    cls: "analytics-card-success",
                                    format: (v) => v,
                                },
                                {
                                    key: "cancelled",
                                    icon: "ti-circle-x",
                                    label: "Otkazanih",
                                    value: analytics?.totalCancelled,
                                    prev: prevAnalytics?.totalCancelled,
                                    cls: "analytics-card-danger",
                                    format: (v) => v,
                                    invertTrend: true,
                                },
                                {
                                    key: "revenue",
                                    icon: "ti-cash",
                                    label: "Prihod (odrađeno)",
                                    value: analytics?.revenue,
                                    prev: prevAnalytics?.revenue,
                                    cls: "analytics-card-revenue",
                                    format: (v) => `${Number(v).toFixed(2)} €`,
                                },
                            ].map((card) => {
                                const pct =
                                    analytics && prevAnalytics
                                        ? trendPct(Number(card.value ?? 0), Number(card.prev ?? 0))
                                        : undefined;
                                const isGood = card.invertTrend ? pct !== null && pct <= 0 : pct !== null && pct >= 0;
                                return (
                                    <div key={card.key} className={`analytics-card ${card.cls}`}>
                                        <div className="analytics-card-top">
                                            <span className="analytics-card-value">
                                                {analytics ? card.format(card.value ?? 0) : "–"}
                                            </span>
                                            {analytics && prevAnalytics && pct !== undefined && (
                                                <span
                                                    className={`analytics-trend ${
                                                        pct === null || pct === 0
                                                            ? "neutral"
                                                            : isGood
                                                            ? "up"
                                                            : "down"
                                                    }`}
                                                >
                                                    {pct === null ? (
                                                        "novo"
                                                    ) : (
                                                        <>
                                                            <i className={`ti ${pct >= 0 ? "ti-arrow-up-right" : "ti-arrow-down-right"}`}></i>
                                                            {Math.abs(pct)}%
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <span className="analytics-card-label">
                                            <i className={`ti ${card.icon}`}></i> {card.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="analytics-services">
                            <h4>Top usluge</h4>
                            {serviceAnalytics.length === 0 ? (
                                <p className="services-empty">Nema podataka za odabrani period.</p>
                            ) : (
                                <div className="analytics-bar-list">
                                    {serviceAnalytics.slice(0, 6).map((s) => {
                                        const max = Math.max(...serviceAnalytics.map((x) => x.bookedCount));
                                        const pct = max > 0 ? (s.bookedCount / max) * 100 : 0;
                                        return (
                                            <div key={s.serviceId} className="analytics-bar-row">
                                                <span className="analytics-bar-label">{s.serviceName}</span>
                                                <div className="analytics-bar-track">
                                                    <div className="analytics-bar-fill" style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <span className="analytics-bar-value">
                                                    {s.bookedCount} · {Number(s.revenue).toFixed(2)} €
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                        )}

                        {activeTab === "services" && (
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

                        {activeTab === "workers" && (
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

                        {activeTab === "settings" && (
                    <>
                    <form className="salon-form" onSubmit={handleUpdate}>
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
                        <input ref={addressInputRef} name="address" value={form.address} onChange={handleChange} required autoComplete="off" />

                        <div className="salon-form-section-title">Postavke rezervacija</div>
                        <p className="salon-form-hint">
                            Vrijedi za sve radnike ovog salona i online rezervacije klijenata. Ne odnosi se na
                            termine koje ti ručno dodaš.
                        </p>
                        <label>Klijenti mogu rezervirati do</label>
                        <select
                            name="maxAdvanceBookingDays"
                            value={form.maxAdvanceBookingDays}
                            onChange={handleChange}
                        >
                            <option value="">Bez ograničenja</option>
                            <option value="14">14 dana unaprijed</option>
                            <option value="30">30 dana unaprijed</option>
                            <option value="60">60 dana unaprijed</option>
                            <option value="90">90 dana unaprijed</option>
                        </select>

                        <label>Minimalna najava prije termina</label>
                        <select
                            name="minNoticeHours"
                            value={form.minNoticeHours}
                            onChange={handleChange}
                        >
                            <option value="">Bez ograničenja</option>
                            <option value="1">1 sat</option>
                            <option value="24">24 sata</option>
                            <option value="48">48 sati</option>
                        </select>

                        <div className="form-actions">
                            <button type="submit">Spremi promjene</button>
                        </div>
                    </form>

                    <div className="services-section">
                        <div className="services-header">
                            <h3>Slobodni dani</h3>
                            {!showClosureForm && (
                                <button className="btn-ghost" onClick={() => setShowClosureForm(true)}>
                                    + Dodaj slobodan dan
                                </button>
                            )}
                        </div>
                        <p className="salon-form-hint">
                            Dani kad je cijeli salon zatvoren (praznik, godišnji odmor...). Nijedan radnik ne
                            može primati rezervacije tog dana, bez obzira na svoje osobno radno vrijeme.
                        </p>

                        {closureError && <p className="auth-error">{closureError}</p>}

                        {showClosureForm && (
                            <form className="salon-form" onSubmit={handleClosureSubmit}>
                                <label>Datum</label>
                                <input
                                    type="date"
                                    value={closureForm.date}
                                    onChange={(e) => setClosureForm({ ...closureForm, date: e.target.value })}
                                    required
                                />
                                <label>Razlog (opcionalno)</label>
                                <input
                                    value={closureForm.reason}
                                    onChange={(e) => setClosureForm({ ...closureForm, reason: e.target.value })}
                                    placeholder="npr. Božić, godišnji odmor..."
                                />
                                <div className="form-actions">
                                    <button type="submit">Spremi</button>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setShowClosureForm(false)}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </form>
                        )}

                        {closures.length === 0 ? (
                            <p className="services-empty">Nema definiranih slobodnih dana.</p>
                        ) : (
                            <div className="manage-grid">
                                {closures.map((c) => (
                                    <div key={c.id} className="manage-card">
                                        <div className="manage-card-icon">
                                            <i className="ti ti-calendar-off"></i>
                                        </div>
                                        <div className="manage-card-body">
                                            <div className="manage-card-name">
                                                {new Date(c.date + "T00:00:00").toLocaleDateString("hr-HR", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </div>
                                            {c.reason && (
                                                <div className="manage-card-meta">
                                                    <span>{c.reason}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="manage-card-actions">
                                            <button className="btn-ghost" onClick={() => handleClosureDelete(c.id)}>
                                                <i className="ti ti-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}