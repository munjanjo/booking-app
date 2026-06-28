import { useEffect, useState } from "react";
import client from "../api/client";
import Navbar from "../components/Navbar";

function formatDate(isoString) {
    return new Date(isoString).toLocaleString("hr-HR", {
        day: "numeric", month: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function SalonReservations() {
    const [salonId, setSalonId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [confirmId, setConfirmId] = useState(null);
    const [error, setError] = useState("");

    const submitCancel = async (id) => {
        setError("");
        try {
            await client.delete(`/appointments/${id}`);
            setAppointments(appointments.filter((a) => a.id !== id));
        } catch {
            setError("Greška prilikom otkazivanja rezervacije.");
        }
        setConfirmId(null);
    };

    useEffect(() => {
        client.get("/salons/my")
            .then((res) => setSalonId(res.data[0]?.id))
            .catch(() => setError("Greška pri dohvaćanju salona"));
    }, []);

    useEffect(() => {
        if (salonId) {
            client.get(`/appointments/salon/${salonId}`)
                .then((res) => setAppointments(res.data))
                .catch(() => setError("Greška pri dohvaćanju rezervacija"));
        }
    }, [salonId]);

    return (
        <div>
            <Navbar />
            <div className="page">
                <h2>Rezervacije salona</h2>
                {error && <p className="auth-error">{error}</p>}

                {appointments.length === 0 ? (
                    <div className="empty-state">
                        <p>Još nema rezervacija.</p>
                    </div>
                ) : (
                    <div className="reservation-list">
                        {appointments.map((a) => (
                            <div key={a.id} className="reservation-card">
                                <div className="reservation-info">
                                    <div className="reservation-title">
                                        {a.serviceName}
                                        <span className={`badge badge-${a.status.toLowerCase()}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <p className="salon-row">
                                        <i className="ti ti-user"></i> {a.clientName}
                                    </p>
                                    <p className="salon-row">
                                        <i className="ti ti-calendar"></i> {formatDate(a.startTime)}
                                    </p>
                                </div>
                                <button
                                    className="btn-danger"
                                    onClick={() => setConfirmId(a.id)}
                                >
                                    Otkaži
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {confirmId && (
                <div className="modal-overlay" onClick={() => setConfirmId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon">
                            <i className="ti ti-alert-triangle"></i>
                        </div>
                        <h3>Otkazati rezervaciju?</h3>
                        <p>Ova radnja se ne može poništiti.</p>
                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setConfirmId(null)}>
                                Odustani
                            </button>
                            <button className="btn-danger" onClick={() => submitCancel(confirmId)}>
                                Otkaži termin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
