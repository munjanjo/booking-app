import { useEffect, useState } from "react";
import client from "../api/client";
import Navbar from "../components/Navbar";
function formatDate(isoString) {
    return new Date(isoString).toLocaleString("hr-HR", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
export default function MojeRezervacije() {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        client
            .get("/appointments/my")
            .then((res) => setAppointments(res.data))
            .catch(() => setError("Greška pri dohvaćanju rezervacija"));
    }, []);
    const cancelAppointment = async (id)=>{
        try{
            await client.delete(`/appointments/${id}`);
            setAppointments(appointments.filter((a) => a.id !== id));
            } catch {
            setError("Greška pri otkazivanju");
        }
            


    }

    return (
        <div>
            <Navbar />
            <div className="page">
                <h2>Moje rezervacije</h2>
                {error && <p className="auth-error">{error}</p>}

                {appointments.length === 0 ? (
                    <div className="empty-state">
                        <p>Još nemaš rezervacija.</p>
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
                                        <i className="ti ti-building-store"></i> {a.salonName}
                                    </p>
                                    <p className="salon-row">
                                        <i className="ti ti-calendar"></i> {formatDate(a.startTime)}
                                    </p>
                                </div>
                                <button
                                    className="btn-ghost"
                                    onClick={() => cancelAppointment(a.id)}
                                >
                                    Otkaži
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}