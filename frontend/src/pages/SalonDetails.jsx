import { useEffect, useRef, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import DatePicker, { registerLocale } from "react-datepicker";
import { hr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import client from "../api/client.js";
import Navbar from "../components/Navbar.jsx";

registerLocale("hr", hr);

const DAY_NAMES = ["Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota", "Nedjelja"];

// Date -> "YYYY-MM-DD" (lokalno, bez timezone pomaka)
const toYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// spaja radno vrijeme svih radnika u jedno "kad je salon otvoren" po danu
const aggregateHours = (allWorkingHours) => {
    const byDay = {};
    for (let d = 1; d <= 7; d++) byDay[d] = { open: false, openTime: null, closeTime: null };

    allWorkingHours.flat().forEach((wh) => {
        if (!wh.open) return;
        const day = byDay[wh.dayOfWeek];
        day.open = true;
        if (!day.openTime || wh.openTime < day.openTime) day.openTime = wh.openTime;
        if (!day.closeTime || wh.closeTime > day.closeTime) day.closeTime = wh.closeTime;
    });
    return byDay;
};

export default function SalonDetails() {
    const { id } = useParams();
    const [services, setServices] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [salon, setSalon] = useState(null);
    const [images, setImages] = useState([]);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [hoursByDay, setHoursByDay] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const bookingRef = useRef(null);
    const priceListRef = useRef(null);

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
        client.get(`/salons/${id}/workers`)
            .then((res) => setWorkers(res.data))
            .catch(() => setError("Greska pri dohvacanju radnika."));
    }, [id]);

    useEffect(() => {
        client.get(`/salons/${id}/images`)
            .then((res) => setImages(res.data))
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        client.get(`/salons/${id}/reviews`)
            .then((res) => setReviews(res.data))
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        client.get(`/salons/${id}/reviews/summary`)
            .then((res) => setReviewSummary(res.data))
            .catch(() => {});
    }, [id]);

    useEffect(() => {
        if (workers.length === 0) return;
        Promise.all(workers.map((w) => client.get(`/workers/${w.id}/working-hours`).then((r) => r.data)))
            .then((all) => setHoursByDay(aggregateHours(all)))
            .catch(() => {});
    }, [workers]);

    useEffect(() => {
        if (selectedService && selectedWorker && date) {
            client.get(`/appointments/salons/${id}/available-slots`, {
                params: { serviceId: selectedService.id, workerId: selectedWorker.id, date },
            })
                .then((res) => setSlots(res.data))
                .catch(() => setError("greska pri dohvacanju termina"));
        }
    }, [date, selectedService, selectedWorker]);

    const scrollToBooking = () => {
        if (selectedService) {
            bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            priceListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const pickService = (s) => {
        setSelectedService(selectedService?.id === s.id ? null : s);
        setSelectedWorker(null);
        setSelectedSlot(null);
    };

    const submitBooking = async () => {
        if (selectedService && selectedWorker && date && selectedSlot) {
            setError("");
            try {
                await client.post("/appointments", {
                    salonId: id,
                    serviceId: selectedService.id,
                    workerId: selectedWorker.id,
                    startTime: `${date}T${selectedSlot}`,
                });
                navigate("/moje-rezervacije");
            } catch (err) {
                setError(err.response?.data?.error || "Greška pri rezervaciji");
            }
        }
    };

    const cover = images[0]?.url;
    const gallery = images.slice(1);

    return (
        <div>
            <Navbar />

            {error && <p className="auth-error page">{error}</p>}

            {salon && (
                <div className="salon-page">
                    <div
                        className={`salon-cover ${!cover ? "salon-cover-placeholder" : ""} ${cover ? "clickable" : ""}`}
                        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
                        onClick={() => cover && setLightboxIndex(0)}
                    >
                        {!cover && <i className="ti ti-building-store"></i>}

                        {cover && (
                            <div className="salon-cover-scrim">
                                <h1>{salon.name}</h1>
                                <div className="salon-page-tags">
                                    <span><i className="ti ti-map-pin"></i> {salon.address}</span>
                                    {salon.phone && <span><i className="ti ti-phone"></i> {salon.phone}</span>}
                                </div>
                                {salon.reviewCount > 0 && (
                                    <div className="salon-rating-pill">
                                        <i className="ti ti-star-filled"></i>
                                        {salon.avgRating.toFixed(1)} · {salon.reviewCount} {salon.reviewCount === 1 ? "recenzija" : "recenzije"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="salon-page-header">
                        {!cover && (
                            <div className="salon-page-header-info">
                                <h1>{salon.name}</h1>
                                <div className="salon-page-tags">
                                    <span><i className="ti ti-map-pin"></i> {salon.address}</span>
                                    {salon.phone && <span><i className="ti ti-phone"></i> {salon.phone}</span>}
                                </div>
                                {salon.reviewCount > 0 && (
                                    <div className="salon-rating-pill salon-rating-pill-light">
                                        <i className="ti ti-star-filled"></i>
                                        {salon.avgRating.toFixed(1)} · {salon.reviewCount} {salon.reviewCount === 1 ? "recenzija" : "recenzije"}
                                    </div>
                                )}
                            </div>
                        )}
                        <button className="btn-primary salon-cta-desktop" onClick={scrollToBooking}>
                            Naruči se
                        </button>
                    </div>

                    {gallery.length > 0 && (
                        <div className="salon-gallery-strip">
                            {gallery.map((img, i) => (
                                <img
                                    key={img.id}
                                    src={img.url}
                                    alt={salon.name}
                                    onClick={() => setLightboxIndex(i + 1)}
                                />
                            ))}
                        </div>
                    )}

                    {lightboxIndex !== null && (
                        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
                            <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
                                <i className="ti ti-x"></i>
                            </button>
                            {images.length > 1 && (
                                <button
                                    className="lightbox-nav lightbox-prev"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
                                    }}
                                >
                                    <i className="ti ti-chevron-left"></i>
                                </button>
                            )}
                            <img
                                className="lightbox-image"
                                src={images[lightboxIndex]?.url}
                                alt={salon.name}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {images.length > 1 && (
                                <button
                                    className="lightbox-nav lightbox-next"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxIndex((lightboxIndex + 1) % images.length);
                                    }}
                                >
                                    <i className="ti ti-chevron-right"></i>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="salon-page-body">
                        <div className="salon-main">
                            <section className="salon-section" ref={priceListRef}>
                                <h3>Cjenik</h3>
                                {services.length === 0 ? (
                                    <p className="services-empty">Salon još nije dodao usluge.</p>
                                ) : (
                                    <div className="price-list">
                                        {services.map((s) => (
                                            <div
                                                key={s.id}
                                                className={`price-row ${selectedService?.id === s.id ? "selected" : ""}`}
                                            >
                                                <div className="price-row-info">
                                                    <div className="price-row-name">{s.name}</div>
                                                    {s.description && (
                                                        <div className="price-row-desc">{s.description}</div>
                                                    )}
                                                    <div className="price-row-meta">
                                                        <i className="ti ti-clock"></i> {s.durationMinutes} min
                                                    </div>
                                                </div>
                                                <div className="price-row-action">
                                                    <span className="price-row-price">{s.price} €</span>
                                                    <button className="btn-ghost" onClick={() => pickService(s)}>
                                                        {selectedService?.id === s.id ? "Odabrano" : "Odaberi"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="salon-section">
                                <h3>Recenzije</h3>
                                {reviewSummary && reviewSummary.reviewCount > 0 && (
                                    <div className="review-summary">
                                        <div className="review-summary-score">
                                            <span className="review-summary-number">
                                                {reviewSummary.avgRating.toFixed(1)}
                                            </span>
                                            <div className="review-stars review-summary-stars">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <i
                                                        key={i}
                                                        className={`ti ${
                                                            i < Math.round(reviewSummary.avgRating)
                                                                ? "ti-star-filled"
                                                                : "ti-star"
                                                        }`}
                                                    ></i>
                                                ))}
                                            </div>
                                            <span className="review-summary-count">
                                                {reviewSummary.reviewCount}{" "}
                                                {reviewSummary.reviewCount === 1 ? "recenzija" : "recenzije"}
                                            </span>
                                        </div>
                                        <div className="review-summary-bars">
                                            {[5, 4, 3, 2, 1].map((star, i) => {
                                                const count = reviewSummary.distribution[i];
                                                const pct = reviewSummary.reviewCount
                                                    ? (count / reviewSummary.reviewCount) * 100
                                                    : 0;
                                                return (
                                                    <div key={star} className="review-summary-bar-row">
                                                        <span className="review-summary-bar-label">{star}★</span>
                                                        <div className="review-summary-bar-track">
                                                            <div
                                                                className="review-summary-bar-fill"
                                                                style={{ width: `${pct}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="review-summary-bar-count">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {reviews.length === 0 ? (
                                    <p className="services-empty">Salon još nema recenzija.</p>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((r) => (
                                            <div key={r.id} className="review-card">
                                                <div className="review-avatar">
                                                    {r.clientName?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="review-body">
                                                    <div className="review-head">
                                                        <span className="review-name">{r.clientName}</span>
                                                        <span className="review-date">
                                                            {new Date(r.createdAt).toLocaleDateString("hr-HR")}
                                                        </span>
                                                    </div>
                                                    <div className="review-stars">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <i
                                                                key={i}
                                                                className={`ti ${i < r.rating ? "ti-star-filled" : "ti-star"}`}
                                                            ></i>
                                                        ))}
                                                    </div>
                                                    {r.comment && <p className="review-comment">{r.comment}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {salon.description && (
                                <section className="salon-section">
                                    <h3>O salonu</h3>
                                    <p className="salon-about-text">{salon.description}</p>
                                </section>
                            )}

                            <section className="salon-section">
                                <h3>Radno vrijeme</h3>
                                {hoursByDay ? (
                                    <div className="hours-table">
                                        {DAY_NAMES.map((name, i) => {
                                            const day = hoursByDay[i + 1];
                                            return (
                                                <div key={name} className="hours-table-row">
                                                    <span>{name}</span>
                                                    <span className={day?.open ? "" : "hours-closed"}>
                                                        {day?.open
                                                            ? `${day.openTime?.slice(0, 5)} – ${day.closeTime?.slice(0, 5)}`
                                                            : "Zatvoreno"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="services-empty">Radno vrijeme trenutno nije dostupno.</p>
                                )}
                            </section>

                            <section className="salon-section">
                                <h3>Lokacija</h3>
                                <div className="salon-map-wrap">
                                    <iframe
                                        title="Lokacija salona"
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(salon.address)}&output=embed`}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </section>

                            <section className="salon-section">
                                <h3>Kontakt</h3>
                                <div className="salon-page-tags">
                                    <span><i className="ti ti-map-pin"></i> {salon.address}</span>
                                    {salon.phone && <span><i className="ti ti-phone"></i> {salon.phone}</span>}
                                </div>
                            </section>
                        </div>

                        <aside className="salon-sidebar" ref={bookingRef}>
                            <div className="booking-widget">
                                <h3>Rezerviraj termin</h3>

                                {!selectedService ? (
                                    <p className="services-empty booking-widget-hint">
                                        Odaberi uslugu iz cjenika da započneš rezervaciju.
                                    </p>
                                ) : (
                                    <div className="booking-selected-service">
                                        <div>
                                            <div className="service-name">{selectedService.name}</div>
                                            <div className="service-meta">
                                                <span><i className="ti ti-clock"></i> {selectedService.durationMinutes} min</span>
                                                <span><i className="ti ti-cash"></i> {selectedService.price} €</span>
                                            </div>
                                        </div>
                                        <button className="btn-ghost" onClick={() => setSelectedService(null)}>
                                            Promijeni
                                        </button>
                                    </div>
                                )}

                                {selectedService && (
                                    <div className="booking-step">
                                        <div className="step-head">
                                            <span className="step-num">1</span>
                                            <h4>Odaberi radnika</h4>
                                        </div>
                                        <div className="service-list">
                                            {workers.map((w) => (
                                                <div
                                                    key={w.id}
                                                    className={`service-card ${selectedWorker?.id === w.id ? "selected" : ""}`}
                                                    onClick={() => {
                                                        setSelectedWorker(selectedWorker?.id === w.id ? null : w);
                                                        setSelectedSlot(null);
                                                    }}
                                                >
                                                    <div className="service-info">
                                                        <div className="service-name">
                                                            <i className="ti ti-user" style={{ marginRight: "6px" }}></i>
                                                            {w.name}
                                                        </div>
                                                    </div>
                                                    {selectedWorker?.id === w.id && (
                                                        <i className="ti ti-circle-check" style={{ fontSize: "20px", color: "var(--primary)" }}></i>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedService && selectedWorker && (
                                    <div className="booking-step">
                                        <div className="step-head">
                                            <span className="step-num">2</span>
                                            <h4>Odaberi datum</h4>
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
                                            portalId="datepicker-portal"
                                        />
                                    </div>
                                )}

                                {selectedService && selectedWorker && date && (
                                    <div className="booking-step">
                                        <div className="step-head">
                                            <span className="step-num">3</span>
                                            <h4>Odaberi termin</h4>
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
                                    </div>
                                )}

                                {selectedSlot && (
                                    <div className="booking-summary booking-summary-sidebar">
                                        <div className="booking-summary-info">
                                            <span className="booking-summary-title">
                                                {selectedService.name} · {selectedWorker.name}
                                            </span>
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
                            </div>
                        </aside>
                    </div>

                    <button className="salon-cta-mobile" onClick={scrollToBooking}>
                        Naruči se
                    </button>
                </div>
            )}
        </div>
    );
}
