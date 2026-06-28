import { useEffect, useState } from "react";
import client from "../api/client";
import Navbar from "../components/Navbar";

export default function MySalon() {
    const [salon, setSalon] = useState([]);
    const [error, setError] = useState("");
    const [form, setForm]=useState({name:"",description:"",phone:"",address:""});
    const[showForm,setShowForm]=useState(false);
    const [services,setServices]=useState([]);
    const [serviceForm,setServiceForm]=useState({name:"",description:"",durationMinutes:"",price:""});
    const [showServiceForm,setShowServiceForm]=useState(false);
    const [editing,setEditing]=useState(false);
    const mySalon=salon[0];
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

    return (
        <div>
            <Navbar />

            <div className="page">
                <h2>Moj salon</h2>

                {error && <p className="auth-error">{error}</p>}

                {salon.length > 0 && !editing ? (
                        <div className="salon-card">
                            <div className="salon-card-header">
                                <h3>{mySalon.name}</h3>
                                <span className="badge">{mySalon.subscriptionPlan}</span>
                            </div>
                            <p className="salon-row">
                                <i className="ti ti-map-pin"></i> {mySalon.address}
                            </p>
                            <p className="salon-row">
                                <i className="ti ti-phone"></i> {mySalon.phone}
                            </p>
                            {mySalon.description && (
                                <p className="salon-desc">{mySalon.description}</p>
                            )}
                            <button onClick={startEdit}>Uredi salon</button>
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
                            <form className="salon-form" onSubmit={handleServiceSubmit}>
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
                                        onClick={() => setShowServiceForm(false)}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </form>
                        )}

                        {services.length === 0 ? (
                            <p className="services-empty">Još nema usluga.</p>
                        ) : (
                            <div className="service-list">
                                {services.map((s) => (
                                    <div key={s.id} className="service-card">
                                        <div className="service-info">
                                            <div className="service-name">{s.name}</div>
                                            <div className="service-meta">
                                                <span><i className="ti ti-clock"></i> {s.durationMinutes} min</span>
                                                <span><i className="ti ti-cash"></i> {s.price} €</span>
                                            </div>
                                        </div>
                                        <button className="btn-ghost" onClick={()=>handleDelete(mySalon.id,s.id)}>Obriši</button>
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