import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const [tab, setTab] = useState("upcoming");
    const navigate = useNavigate();

    useEffect(() => {
        client
            .get("/appointments/my")
            .then((res) => setAppointments(res.data))
            .catch(() => setError("Greška pri dohvaćanju rezervacija"));
    }, []);

    const cancelAppointment = async (id) => {
        try {
            await client.delete(`/appointments/${id}`);
            setAppointments(appointments.filter((a) => a.id !== id));
        } catch {
            setError("Greška pri otkazivanju");
        }
    };

    const now = new Date();
    const upcoming = appointments
        .filter((a) => new Date(a.startTime) >= now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const past = appointments
        .filter((a) => new Date(a.startTime) < now)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const renderCard = (a, { isPast }) => (
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
                    <i className="ti ti-user"></i> {a.workerName}
                </p>
                <p className="salon-row">
                    <i className="ti ti-calendar"></i> {formatDate(a.startTime)}
                </p>
            </div>
            {isPast ? (
                <button className="btn-ghost" onClick={() => navigate(`/salon/${a.salonId}`)}>
                    <i className="ti ti-repeat"></i> Rezerviraj ponovno
                </button>
            ) : (
                a.status === "BOOKED" && (
                    <button className="btn-ghost" onClick={() => cancelAppointment(a.id)}>
                        Otkaži
                    </button>
                )
            )}
        </div>
    );

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
                    <>
                        <div className="reservation-tabs">
                            <button
                                type="button"
                                className={`reservation-tab ${tab === "upcoming" ? "active" : ""}`}
                                onClick={() => setTab("upcoming")}
                            >
                                Nadolazeće <span className="reservation-tab-count">{upcoming.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`reservation-tab ${tab === "past" ? "active" : ""}`}
                                onClick={() => setTab("past")}
                            >
                                Prošle <span className="reservation-tab-count">{past.length}</span>
                            </button>
                        </div>

                        {tab === "upcoming" ? (
                            upcoming.length === 0 ? (
                                <div className="empty-state">
                                    <p>Nemaš nadolazećih rezervacija.</p>
                                </div>
                            ) : (
                                <div className="reservation-list">
                                    {upcoming.map((a) => renderCard(a, { isPast: false }))}
                                </div>
                            )
                        ) : past.length === 0 ? (
                            <div className="empty-state">
                                <p>Još nemaš prošlih rezervacija.</p>
                            </div>
                        ) : (
                            <div className="reservation-list">
                                {past.map((a) => renderCard(a, { isPast: true }))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
