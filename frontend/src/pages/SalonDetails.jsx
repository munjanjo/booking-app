import { useEffect, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { hr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import client from "../api/client.js";
import Navbar from "../components/Navbar.jsx";

registerLocale("hr", hr);

// Date -> "YYYY-MM-DD" (lokalno, bez timezone pomaka)
const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function SalonDetails() {
    const { id } = useParams();
    const [services, setServices] = useState([]);
    const [salon, setSalon] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        client.get(`/salons/${id}`)
            .then((res) => setSalon(res.data))
            .catch(() => setError("greska pri dohvacanju salona."));
    }, [id]);

    useEffect(() => {
        client.get(`/salons/${id}/services`)
            .then((res) => setServices(res.data))
            .catch(() => setError("Greska pri dohvacanju usluga."));
    }, [id]);
    useEffect(() => {
        if (selectedService && date) {
            client.get(`/appointments/salons/${id}/available-slots`, {
                params: { serviceId: selectedService.id, date },
            })
                .then((res) => setSlots(res.data))
                .catch(() => setError("greska pri dohvacanju termina"));
        }
    }, [date, selectedService]);
    const submitBooking = async () => {
        if (selectedService && date && selectedSlot) {
            setError("");
            try {
                await client.post("/appointments", {
                    salonId: id,
                    serviceId: selectedService.id,
                    startTime: `${date}T${selectedSlot}`,
                });
                navigate("/moje-rezervacije");
            } catch (err) {
                setError(err.response?.data?.error || "Greška pri rezervaciji");
            }
        }
    };
    return (
        <div>
            <Navbar />
            <div className="page booking">
                {error && <p className="auth-error">{error}</p>}

                {salon && (
                    <>
                        <div className="salon-hero">
                            <div className="salon-hero-icon">
                                <i className="ti ti-building-store"></i>
                            </div>
                            <div>
                                <h2>{salon.name}</h2>
                                <div className="salon-hero-meta">
                                    <span><i className="ti ti-map-pin"></i> {salon.address}</span>
                                    {salon.phone && <span><i className="ti ti-phone"></i> {salon.phone}</span>}
                                </div>
                            </div>
                        </div>

                        <section className="booking-step">
                            <div className="step-head">
                                <span className="step-num">1</span>
                                <h3>Odaberi uslugu</h3>
                            </div>
                            <div className="service-list">
                                {services.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`service-card ${selectedService?.id === s.id ? "selected" : ""}`}
                                        onClick={() =>
                                            setSelectedService(selectedService?.id === s.id ? null : s)
                                        }
                                    >
                                        <div className="service-info">
                                            <div className="service-name">{s.name}</div>
                                            <div className="service-meta">
                                                <span><i className="ti ti-clock"></i> {s.durationMinutes} min</span>
                                                <span><i className="ti ti-cash"></i> {s.price} €</span>
                                            </div>
                                        </div>
                                        {selectedService?.id === s.id && (
                                            <i className="ti ti-circle-check" style={{ fontSize: "22px", color: "var(--primary)" }}></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {selectedService && (
                            <section className="booking-step">
                                <div className="step-head">
                                    <span className="step-num">2</span>
                                    <h3>Odaberi datum</h3>
                                </div>
                                <DatePicker
                                    selected={date ? new Date(date) : null}
                                    onChange={(d) => {
                                        setDate(toYMD(d));
                                        setSelectedSlot(null);
                                    }}
                                    minDate={new Date()}
                                    locale="hr"
                                    dateFormat="EEEE, d. MMMM yyyy."
                                    placeholderText="Odaberi datum"
                                />
                            </section>
                        )}

                        {selectedService && date && (
                            <section className="booking-step">
                                <div className="step-head">
                                    <span className="step-num">3</span>
                                    <h3>Odaberi termin</h3>
                                </div>
                                {slots.length > 0 ? (
                                    <div className="slot-grid">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot}
                                                className={`slot ${selectedSlot === slot ? "selected" : ""}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="services-empty">
                                        Nema slobodnih termina za odabrani dan.
                                    </p>
                                )}
                            </section>
                        )}

                        {selectedSlot && (
                            <div className="booking-summary">
                                <div className="booking-summary-info">
                                    <span className="booking-summary-title">{selectedService.name}</span>
                                    <span className="booking-summary-meta">
                                        <i className="ti ti-calendar"></i> {date}
                                        <i className="ti ti-clock"></i> {selectedSlot}
                                        <i className="ti ti-cash"></i> {selectedService.price} €
                                    </span>
                                </div>
                                <button className="btn-primary" onClick={submitBooking}>
                                    Rezerviraj
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
