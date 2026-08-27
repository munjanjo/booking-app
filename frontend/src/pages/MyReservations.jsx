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
    const [ratingTarget, setRatingTarget] = useState(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingError, setRatingError] = useState("");
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

    const openRating = (a) => {
        setRatingTarget(a);
        setRatingValue(0);
        setRatingComment("");
        setRatingError("");
    };

    const submitRating = async () => {
        if (ratingValue < 1) {
            setRatingError("Odaberi ocjenu od 1 do 5 zvjezdica.");
            return;
        }
        try {
            await client.post(`/salons/${ratingTarget.salonId}/reviews`, {
                appointmentId: ratingTarget.id,
                rating: ratingValue,
                comment: ratingComment,
            });
            setAppointments((prev) =>
                prev.map((a) => (a.id === ratingTarget.id ? { ...a, reviewed: true } : a))
            );
            setRatingTarget(null);
        } catch (err) {
            setRatingError(err.response?.data?.error || "Greška pri slanju recenzije");
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
        <div key={a.id} className="reservation-card-block">
            <div className="reservation-card">
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
            {isPast && a.status === "COMPLETED" && !a.reviewed && (
                <div className="prompt-card">
                    <div className="prompt-card-text">
                        <i className="ti ti-star"></i>
                        <span>Kako je prošlo kod {a.salonName}?</span>
                    </div>
                    <button className="btn-primary btn-sm" onClick={() => openRating(a)}>
                        Ocijeni
                    </button>
                </div>
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

            {ratingTarget && (
                <div className="modal-overlay" onClick={() => setRatingTarget(null)}>
                    <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="rating-modal-close" onClick={() => setRatingTarget(null)}>
                            <i className="ti ti-x"></i>
                        </button>
                        <div className="rating-modal-avatar">
                            <i className="ti ti-building-store"></i>
                        </div>
                        <h3>Ocijeni salon</h3>
                        <p className="rating-modal-subject">{ratingTarget.salonName}</p>

                        <div className="rating-stars-input">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <i
                                    key={n}
                                    className={`ti ${n <= ratingValue ? "ti-star-filled" : "ti-star"}`}
                                    onClick={() => setRatingValue(n)}
                                ></i>
                            ))}
                        </div>
                        {ratingValue > 0 && (
                            <p className="rating-modal-label">
                                {["Loše", "Slabo", "U redu", "Dobro", "Odlično"][ratingValue - 1]}
                            </p>
                        )}

                        <textarea
                            className="rating-modal-textarea"
                            rows={3}
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Podijeli svoje iskustvo (nije obavezno)..."
                        />

                        {ratingError && <p className="auth-error" style={{ margin: "0 0 4px" }}>{ratingError}</p>}

                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setRatingTarget(null)}>
                                Odustani
                            </button>
                            <button className="btn-primary" onClick={submitRating}>
                                Pošalji recenziju
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
