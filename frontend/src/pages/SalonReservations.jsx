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
const MIN_BLOCK_HEIGHT = 58;
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
    const [error, setError] = useState("");
    const [view, setView] = useState("calendar");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [draggedAppointment, setDraggedAppointment] = useState(null);
    const [dragOverWorkerId, setDragOverWorkerId] = useState(null);
    const [workingHoursByWorker, setWorkingHoursByWorker] = useState({});
    const [dragPreview, setDragPreview] = useState(null);
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
        }
    }, [salonId]);

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
            height: Math.max(durationMin * PX_PER_MIN, MIN_BLOCK_HEIGHT),
            valid: withinShift && !overlaps,
        });
    };

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

    const handleBlockClick = (id) => {
        if (justDraggedRef.current) {
            justDraggedRef.current = false;
            return;
        }
        setConfirmId(id);
    };

    return (
        <div>
            <Navbar />
            <div className="page">
                <div className="calendar-toolbar">
                    <h2 style={{ marginBottom: 0 }}>Rezervacije salona</h2>
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
                                        >
                                            {closedSegments.map((seg, i) => (
                                                <div
                                                    key={i}
                                                    className="calendar-closed-segment"
                                                    style={{ top: seg.top, height: seg.height }}
                                                />
                                            ))}

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
                                                const height = Math.max(
                                                    durationMin * PX_PER_MIN,
                                                    MIN_BLOCK_HEIGHT
                                                );
                                                const isPast = isToday && end < new Date();
                                                const isDragging = draggedAppointment?.id === a.id;
                                                const timeLabel = (d) =>
                                                    d.toLocaleTimeString("hr-HR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    });
                                                return (
                                                    <div
                                                        key={a.id}
                                                        className={`calendar-block ${isPast ? "calendar-block-past" : ""} ${isDragging ? "calendar-block-dragging" : ""}`}
                                                        style={{ top, height }}
                                                        draggable={!isPast}
                                                        onDragStart={() => handleDragStart(a)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => handleBlockClick(a.id)}
                                                    >
                                                        <div className="calendar-block-title">
                                                            {a.serviceName}
                                                        </div>
                                                        <div className="calendar-block-meta">
                                                            <i className="ti ti-clock"></i>
                                                            {timeLabel(start)}–{timeLabel(end)}
                                                            {" "}
                                                            <span className="calendar-block-duration">
                                                                ({durationMin} min)
                                                            </span>
                                                        </div>
                                                        <div className="calendar-block-meta">
                                                            <i className="ti ti-user"></i>
                                                            {a.clientName}
                                                        </div>
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
