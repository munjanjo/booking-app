import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { hr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import client from "../api/client";
import Navbar from "../components/Navbar";

registerLocale("hr", hr);

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 92;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const TRACK_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const SNAP_MIN = 30;

function formatDate(isoString) {
    return new Date(isoString).toLocaleString("hr-HR", {
        day: "numeric", month: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// Date -> "YYYY-MM-DD" (lokalno, bez timezone pomaka)
function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// Date -> "YYYY-MM-DDTHH:mm:00" (lokalno, format koji backend očekuje)
function toLocalDateTimeString(d) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${mo}-${da}T${h}:${mi}:00`;
}

// pretvara vrijeme dana u vertikalnu poziciju na traci
function minutesFromStart(date) {
    return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

// "HH:mm:ss" -> minute od ponoći
function timeToMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

// JS getDay() (Ned=0..Sub=6) -> backend dayOfWeek (Pon=1..Ned=7)
function toBackendDayOfWeek(date) {
    const d = date.getDay();
    return d === 0 ? 7 : d;
}

export default function SalonReservations() {
    const [salonId, setSalonId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [confirmId, setConfirmId] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [error, setError] = useState("");
    const [view, setView] = useState("calendar");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [draggedAppointment, setDraggedAppointment] = useState(null);
    const [dragOverWorkerId, setDragOverWorkerId] = useState(null);
    const [hoverSlot, setHoverSlot] = useState(null);
    const [workingHoursByWorker, setWorkingHoursByWorker] = useState({});
    const [dragPreview, setDragPreview] = useState(null);
    const [services, setServices] = useState([]);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        serviceId: "",
        workerId: "",
        date: "",
        time: "",
    });
    const [manualError, setManualError] = useState("");
    const [slotLocked, setSlotLocked] = useState(false);
    const [clientQuery, setClientQuery] = useState("");
    const [clientResults, setClientResults] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
    const justDraggedRef = useRef(false);

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
            client.get(`/salons/${salonId}/workers`)
                .then((res) => setWorkers(res.data))
                .catch(() => setError("Greška pri dohvaćanju radnika"));
            client.get(`/salons/${salonId}/services`)
                .then((res) => setServices(res.data))
                .catch(() => setError("Greška pri dohvaćanju usluga"));
        }
    }, [salonId]);

    useEffect(() => {
        if (clientQuery.trim().length < 2) {
            setClientResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            client.get("/appointments/clients/search", { params: { q: clientQuery.trim() } })
                .then((res) => setClientResults(res.data))
                .catch(() => setClientResults([]));
        }, 300);
        return () => clearTimeout(timeout);
    }, [clientQuery]);

    useEffect(() => {
        if (workers.length === 0) return;
        Promise.all(
            workers.map((w) =>
                client.get(`/workers/${w.id}/working-hours`).then((res) => [w.id, res.data])
            )
        )
            .then((entries) => {
                const map = {};
                entries.forEach(([id, data]) => {
                    map[id] = data;
                });
                setWorkingHoursByWorker(map);
            })
            .catch(() => setError("Greška pri dohvaćanju radnog vremena"));
    }, [workers]);

    const selectedYMD = toYMD(selectedDate);
    const isToday = selectedYMD === toYMD(new Date());

    const dayAppointments = useMemo(
        () => appointments.filter((a) => toYMD(new Date(a.startTime)) === selectedYMD),
        [appointments, selectedYMD]
    );

    const hourMarks = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) hourMarks.push(h);

    const dayOfWeek = toBackendDayOfWeek(selectedDate);

    const openShiftsForWorker = (workerId) =>
        (workingHoursByWorker[workerId] || []).filter(
            (wh) => wh.open && wh.dayOfWeek === dayOfWeek
        );

    // vraca segmente (top/height u px) koji su IZVAN radnog vremena, za sivo osjencanje
    const closedSegmentsForWorker = (workerId) => {
        const shifts = openShiftsForWorker(workerId)
            .map((wh) => ({
                start: Math.max(timeToMinutes(wh.openTime), START_HOUR * 60),
                end: Math.min(timeToMinutes(wh.closeTime), END_HOUR * 60),
            }))
            .sort((a, b) => a.start - b.start);

        const segments = [];
        let cursor = START_HOUR * 60;
        for (const shift of shifts) {
            if (shift.start > cursor) {
                segments.push({ start: cursor, end: shift.start });
            }
            cursor = Math.max(cursor, shift.end);
        }
        if (cursor < END_HOUR * 60) {
            segments.push({ start: cursor, end: END_HOUR * 60 });
        }
        return segments.map((s) => ({
            top: (s.start - START_HOUR * 60) * PX_PER_MIN,
            height: (s.end - s.start) * PX_PER_MIN,
        }));
    };

    const handleDragStart = (appointment) => {
        justDraggedRef.current = true;
        setDraggedAppointment(appointment);
    };

    const handleDragEnd = () => {
        setDraggedAppointment(null);
        setDragOverWorkerId(null);
        setDragPreview(null);
    };

    // izracuna prijedlog slota (minute od START_HOUR) na temelju pozicije mousea
    const computeMinutesOffset = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        let minutesOffset = Math.round(offsetY / PX_PER_MIN / SNAP_MIN) * SNAP_MIN;
        return Math.max(0, minutesOffset);
    };

    const handleTrackDragOver = (e, worker) => {
        e.preventDefault();
        setDragOverWorkerId(worker.id);
        if (!draggedAppointment) return;

        const durationMin =
            (new Date(draggedAppointment.endTime) - new Date(draggedAppointment.startTime)) / 60000;
        const minutesOffset = computeMinutesOffset(e);
        const slotStart = START_HOUR * 60 + minutesOffset;
        const slotEnd = slotStart + durationMin;

        const shifts = openShiftsForWorker(worker.id);
        const withinShift = shifts.some(
            (wh) =>
                slotStart >= timeToMinutes(wh.openTime) && slotEnd <= timeToMinutes(wh.closeTime)
        );

        const overlaps = dayAppointments.some((a) => {
            if (a.id === draggedAppointment.id || a.workerId !== worker.id) return false;
            const aStart = minutesFromStart(new Date(a.startTime)) + START_HOUR * 60;
            const aEnd = minutesFromStart(new Date(a.endTime)) + START_HOUR * 60;
            return slotStart < aEnd && slotEnd > aStart;
        });

        setDragPreview({
            workerId: worker.id,
            top: minutesOffset * PX_PER_MIN,
            height: durationMin * PX_PER_MIN,
            valid: withinShift && !overlaps,
        });
    };

    const handleTrackMouseMove = (e, worker) => {
        if (draggedAppointment) return;
        const minutesOffset = computeMinutesOffset(e);
        const slotStart = START_HOUR * 60 + minutesOffset;

        const shifts = openShiftsForWorker(worker.id);
        const withinShift = shifts.some(
            (wh) => slotStart >= timeToMinutes(wh.openTime) && slotStart < timeToMinutes(wh.closeTime)
        );
        if (!withinShift) {
            setHoverSlot(null);
            return;
        }

        setHoverSlot({
            workerId: worker.id,
            top: minutesOffset * PX_PER_MIN,
            height: SNAP_MIN * PX_PER_MIN,
        });
    };

    const clearHoverSlot = () => setHoverSlot(null);

    const handleDrop = async (e, worker) => {
        e.preventDefault();
        setDragOverWorkerId(null);
        setDragPreview(null);
        if (!draggedAppointment) return;

        const minutesOffset = computeMinutesOffset(e);

        const newStart = new Date(selectedDate);
        newStart.setHours(START_HOUR, 0, 0, 0);
        newStart.setMinutes(newStart.getMinutes() + minutesOffset);

        setError("");
        try {
            const res = await client.put(`/appointments/${draggedAppointment.id}/reschedule`, {
                workerId: worker.id,
                startTime: toLocalDateTimeString(newStart),
            });
            setAppointments(appointments.map((a) => (a.id === res.data.id ? res.data : a)));
        } catch (err) {
            setError(err.response?.data?.error || "Greška pri pomicanju termina");
        }
        setDraggedAppointment(null);
    };

    const openManualModal = () => {
        setManualError("");
        setSlotLocked(false);
        setManualForm({
            serviceId: "",
            workerId: "",
            date: toYMD(selectedDate),
            time: "",
        });
        setClientQuery("");
        setClientResults([]);
        setSelectedClient(null);
        setShowNewClientForm(false);
        setNewClient({ name: "", email: "", phone: "" });
        setShowManualModal(true);
    };

    // klik na prazan slot u kalendaru -> otvara modal s vec odabranim radnikom/vremenom
    const openManualModalForSlot = (worker, minutesOffset) => {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(START_HOUR, 0, 0, 0);
        slotTime.setMinutes(slotTime.getMinutes() + minutesOffset);
        const time = `${String(slotTime.getHours()).padStart(2, "0")}:${String(slotTime.getMinutes()).padStart(2, "0")}`;

        setManualError("");
        setSlotLocked(true);
        setManualForm({
            serviceId: "",
            workerId: worker.id,
            date: toYMD(selectedDate),
            time,
        });
        setClientQuery("");
        setClientResults([]);
        setSelectedClient(null);
        setShowNewClientForm(false);
        setNewClient({ name: "", email: "", phone: "" });
        setShowManualModal(true);
    };

    const handleTrackClick = (e, worker) => {
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }
        const minutesOffset = computeMinutesOffset(e);
        const slotStart = START_HOUR * 60 + minutesOffset;
        const shifts = openShiftsForWorker(worker.id);
        const withinShift = shifts.some(
            (wh) => slotStart >= timeToMinutes(wh.openTime) && slotStart < timeToMinutes(wh.closeTime)
        );
        if (!withinShift) return;

        const slotTime = new Date(selectedDate);
        slotTime.setHours(START_HOUR, 0, 0, 0);
        slotTime.setMinutes(slotTime.getMinutes() + minutesOffset);
        if (slotTime < new Date()) {
            setError("Ne možeš rezervirati termin u prošlosti.");
            return;
        }

        openManualModalForSlot(worker, minutesOffset);
    };

    const submitManualAppointment = async (e) => {
        e.preventDefault();
        const { serviceId, workerId, date, time } = manualForm;
        if (!serviceId || !workerId || !date || !time) {
            setManualError("Popuni sva obavezna polja.");
            return;
        }
        if (!selectedClient && !showNewClientForm) {
            setManualError("Odaberi klijenta ili kreiraj novog.");
            return;
        }
        if (showNewClientForm && (!newClient.name.trim() || !newClient.email.trim())) {
            setManualError("Ime i email novog klijenta su obavezni.");
            return;
        }
        if (new Date(`${date}T${time}:00`) < new Date()) {
            setManualError("Ne možeš rezervirati termin u prošlosti.");
            return;
        }
        setManualError("");
        try {
            const res = await client.post("/appointments/manual", {
                salonId,
                serviceId,
                workerId,
                startTime: `${date}T${time}:00`,
                clientId: selectedClient ? selectedClient.id : null,
                newClient: showNewClientForm
                    ? {
                          name: newClient.name.trim(),
                          email: newClient.email.trim(),
                          phone: newClient.phone.trim() || null,
                      }
                    : null,
            });
            setAppointments([...appointments, res.data]);
            setShowManualModal(false);
        } catch (err) {
            setManualError(err.response?.data?.error || "Greška pri kreiranju rezervacije");
        }
    };

    const handleBlockClick = (appointment) => {
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }
        setSelectedAppointment(appointment);
    };

    return (
        <div>
            <Navbar />
            <div className="page">
                <div className="calendar-toolbar">
                    <h2 style={{ marginBottom: 0 }}>Rezervacije salona</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="view-toggle">
                            <span
                                className={view === "calendar" ? "active" : ""}
                                onClick={() => setView("calendar")}
                            >
                                Kalendar
                            </span>
                            <span
                                className={view === "list" ? "active" : ""}
                                onClick={() => setView("list")}
                            >
                                Lista
                            </span>
                        </div>
                        <button className="btn-primary" onClick={openManualModal}>
                            + Nova rezervacija
                        </button>
                    </div>
                </div>

                {error && <p className="auth-error">{error}</p>}

                {view === "calendar" ? (
                    workers.length === 0 ? (
                        <div className="empty-state">
                            <p>Dodaj radnike u "Moj salon" da vidiš raspored.</p>
                        </div>
                    ) : (
                        <>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(d) => setSelectedDate(d)}
                                locale="hr"
                                dateFormat="EEEE, d. MMMM yyyy."
                            />
                            <p className="page-subtitle" style={{ margin: "8px 0 0" }}>
                                Povuci termin da promijeniš vrijeme ili radnika.
                            </p>

                            <div
                                className="calendar-grid"
                                style={{ gridTemplateColumns: `56px repeat(${workers.length}, 1fr)` }}
                            >
                                <div className="calendar-corner"></div>
                                {workers.map((w) => (
                                    <div key={w.id} className="calendar-worker-header">
                                        {w.name}
                                    </div>
                                ))}

                                <div className="calendar-time-col" style={{ height: TRACK_HEIGHT }}>
                                    {hourMarks.map((h) => (
                                        <span
                                            key={h}
                                            className="calendar-time-label"
                                            style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 6 }}
                                        >
                                            {String(h).padStart(2, "0")}:00
                                        </span>
                                    ))}
                                </div>

                                {workers.map((w) => {
                                    const workerAppointments = dayAppointments.filter(
                                        (a) => a.workerId === w.id
                                    );
                                    const closedSegments = closedSegmentsForWorker(w.id);
                                    const preview =
                                        dragPreview && dragPreview.workerId === w.id ? dragPreview : null;
                                    const hover =
                                        !draggedAppointment && hoverSlot && hoverSlot.workerId === w.id
                                            ? hoverSlot
                                            : null;
                                    return (
                                        <div
                                            key={w.id}
                                            className={`calendar-track ${dragOverWorkerId === w.id ? "calendar-track-dragover" : ""}`}
                                            style={{ height: TRACK_HEIGHT }}
                                            onDragOver={(e) => handleTrackDragOver(e, w)}
                                            onDragLeave={() => {
                                                setDragOverWorkerId(null);
                                                setDragPreview(null);
                                            }}
                                            onDrop={(e) => handleDrop(e, w)}
                                            onClick={(e) => handleTrackClick(e, w)}
                                            onMouseMove={(e) => handleTrackMouseMove(e, w)}
                                            onMouseLeave={clearHoverSlot}
                                        >
                                            {closedSegments.map((seg, i) => (
                                                <div
                                                    key={i}
                                                    className="calendar-closed-segment"
                                                    style={{ top: seg.top, height: seg.height }}
                                                />
                                            ))}

                                            {hover && (
                                                <div
                                                    className="calendar-hover-slot"
                                                    style={{ top: hover.top, height: hover.height }}
                                                >
                                                    <i className="ti ti-plus"></i>
                                                </div>
                                            )}

                                            {preview && (
                                                <div
                                                    className={`calendar-drop-preview ${preview.valid ? "valid" : "invalid"}`}
                                                    style={{ top: preview.top, height: preview.height }}
                                                />
                                            )}

                                            {workerAppointments.map((a) => {
                                                const start = new Date(a.startTime);
                                                const end = new Date(a.endTime);
                                                const durationMin = (end - start) / 60000;
                                                const top = minutesFromStart(start) * PX_PER_MIN;
                                                const height = durationMin * PX_PER_MIN;
                                                const isPast = isToday && end < new Date();
                                                const isDragging = draggedAppointment?.id === a.id;
                                                const timeLabel = (d) =>
                                                    d.toLocaleTimeString("hr-HR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    });
                                                const compact = height < 70;
                                                const tiny = height < 60;
                                                return (
                                                    <div
                                                        key={a.id}
                                                        className={`calendar-block ${compact ? "calendar-block-compact" : ""} ${isPast ? "calendar-block-past" : ""} ${isDragging ? "calendar-block-dragging" : ""}`}
                                                        style={{ top, height }}
                                                        draggable={!isPast}
                                                        onDragStart={() => handleDragStart(a)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBlockClick(a);
                                                        }}
                                                    >
                                                        {tiny ? (
                                                            <div className="calendar-block-meta">
                                                                {timeLabel(start)} {a.serviceName} · {a.clientName}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="calendar-block-title">
                                                                    {a.serviceName}
                                                                </div>
                                                                <div className="calendar-block-meta">
                                                                    <i className="ti ti-clock"></i>
                                                                    {timeLabel(start)}–{timeLabel(end)}
                                                                    {!compact && (
                                                                        <span className="calendar-block-duration">
                                                                            {" "}({durationMin} min)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="calendar-block-meta">
                                                                    <i className="ti ti-user"></i>
                                                                    {a.clientName}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )
                ) : appointments.length === 0 ? (
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
                                        <i className="ti ti-briefcase"></i> {a.workerName}
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

            {selectedAppointment && (
                <div className="modal-overlay" onClick={() => setSelectedAppointment(null)}>
                    <div className="modal modal-form appointment-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{selectedAppointment.serviceName}</h3>
                        <span className={`badge badge-${selectedAppointment.status.toLowerCase()}`}>
                            {selectedAppointment.status}
                        </span>

                        <div className="appointment-detail-rows">
                            <div className="appointment-detail-row">
                                <i className="ti ti-user"></i>
                                <div>
                                    <div className="selected-client-name">{selectedAppointment.clientName}</div>
                                    {selectedAppointment.clientPhone && (
                                        <div className="selected-client-meta">{selectedAppointment.clientPhone}</div>
                                    )}
                                </div>
                            </div>
                            <div className="appointment-detail-row">
                                <i className="ti ti-briefcase"></i>
                                {selectedAppointment.workerName}
                            </div>
                            <div className="appointment-detail-row">
                                <i className="ti ti-calendar"></i>
                                {formatDate(selectedAppointment.startTime)} –{" "}
                                {new Date(selectedAppointment.endTime).toLocaleTimeString("hr-HR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-ghost" onClick={() => setSelectedAppointment(null)}>
                                Zatvori
                            </button>
                            <button
                                className="btn-danger"
                                onClick={() => {
                                    setConfirmId(selectedAppointment.id);
                                    setSelectedAppointment(null);
                                }}
                            >
                                Otkaži rezervaciju
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {showManualModal && (
                <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
                    <div className="modal modal-form" onClick={(e) => e.stopPropagation()}>
                        <h3>Nova rezervacija</h3>
                        <p className="page-subtitle">Za klijenta koji je rezervirao telefonski ili osobno.</p>
                        <form className="manual-booking-form" onSubmit={submitManualAppointment}>
                            {manualError && <p className="auth-error">{manualError}</p>}

                            {slotLocked && (
                                <div className="selected-client-card">
                                    <div>
                                        <div className="selected-client-name">
                                            {workers.find((w) => w.id === manualForm.workerId)?.name}
                                        </div>
                                        <div className="selected-client-meta">
                                            {manualForm.date} u {manualForm.time}
                                        </div>
                                    </div>
                                    <button type="button" className="btn-ghost" onClick={() => setSlotLocked(false)}>
                                        Promijeni
                                    </button>
                                </div>
                            )}

                            <label>
                                Usluga
                                <select
                                    value={manualForm.serviceId}
                                    onChange={(e) => setManualForm({ ...manualForm, serviceId: e.target.value })}
                                >
                                    <option value="">Odaberi uslugu</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.durationMinutes} min)
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {!slotLocked && (
                                <>
                                    <label>
                                        Radnik
                                        <select
                                            value={manualForm.workerId}
                                            onChange={(e) => setManualForm({ ...manualForm, workerId: e.target.value })}
                                        >
                                            <option value="">Odaberi radnika</option>
                                            {workers.map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <label style={{ flex: 1 }}>
                                            Datum
                                            <input
                                                type="date"
                                                value={manualForm.date}
                                                min={toYMD(new Date())}
                                                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                            />
                                        </label>
                                        <label style={{ flex: 1 }}>
                                            Vrijeme
                                            <input
                                                type="time"
                                                value={manualForm.time}
                                                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                                            />
                                        </label>
                                    </div>
                                </>
                            )}

                            {selectedClient ? (
                                <div className="selected-client-card">
                                    <div>
                                        <div className="selected-client-name">{selectedClient.name}</div>
                                        <div className="selected-client-meta">
                                            {selectedClient.email}
                                            {selectedClient.phone ? ` · ${selectedClient.phone}` : ""}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setSelectedClient(null)}
                                    >
                                        Promijeni
                                    </button>
                                </div>
                            ) : showNewClientForm ? (
                                <>
                                    <label>
                                        Ime klijenta
                                        <input
                                            type="text"
                                            value={newClient.name}
                                            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                            placeholder="npr. Marko Marić"
                                        />
                                    </label>
                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            value={newClient.email}
                                            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                            placeholder="npr. marko@primjer.com"
                                        />
                                    </label>
                                    <label>
                                        Telefon (opcionalno)
                                        <input
                                            type="text"
                                            value={newClient.phone}
                                            onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                            placeholder="npr. 0911234567"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setShowNewClientForm(false)}
                                    >
                                        ← Natrag na pretragu
                                    </button>
                                </>
                            ) : (
                                <label style={{ position: "relative" }}>
                                    Klijent
                                    <input
                                        type="text"
                                        value={clientQuery}
                                        onChange={(e) => setClientQuery(e.target.value)}
                                        placeholder="Pretraži po imenu, emailu ili telefonu"
                                    />
                                    {clientResults.length > 0 && (
                                        <div className="client-search-results">
                                            {clientResults.map((c) => (
                                                <div
                                                    key={c.id}
                                                    className="client-search-result"
                                                    onClick={() => {
                                                        setSelectedClient(c);
                                                        setClientQuery("");
                                                        setClientResults([]);
                                                    }}
                                                >
                                                    <div className="selected-client-name">{c.name}</div>
                                                    <div className="selected-client-meta">
                                                        {c.email}
                                                        {c.phone ? ` · ${c.phone}` : ""}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{ marginTop: "8px" }}
                                        onClick={() => setShowNewClientForm(true)}
                                    >
                                        + Novi klijent
                                    </button>
                                </label>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => setShowManualModal(false)}
                                >
                                    Odustani
                                </button>
                                <button type="submit" className="btn-primary">
                                    Rezerviraj
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
