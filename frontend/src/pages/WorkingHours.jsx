import { useEffect, useState } from "react";
import client from "../api/client";
import Navbar from "../components/Navbar";

const DAYS = [
    { value: 1, name: "Ponedjeljak" },
    { value: 2, name: "Utorak" },
    { value: 3, name: "Srijeda" },
    { value: 4, name: "Četvrtak" },
    { value: 5, name: "Petak" },
    { value: 6, name: "Subota" },
    { value: 7, name: "Nedjelja" },
];

// sva vremena u koracima od 30 min: "00:00", "00:30", ... "23:30"
const TIMES = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        TIMES.push(`${hh}:${mm}`);
    }
}

export default function WorkingHours() {
    const [salonId, setSalonId] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [savedDay, setSavedDay] = useState(null);
    const [error, setError] = useState("");

    // 1. dohvati salon vlasnika
    useEffect(() => {
        client
            .get("/salons/my")
            .then((res) => setSalonId(res.data[0]?.id))
            .catch(() => setError("Greška pri dohvaćanju salona"));
    }, []);

    // 2. dohvati radno vrijeme; nepostavljeni dani ostaju prazni
    useEffect(() => {
        if (salonId) {
            client
                .get(`/salons/${salonId}/working-hours`)
                .then((res) => {
                    const map = {};
                    DAYS.forEach((d) => {
                        const existing = res.data.find((h) => h.dayOfWeek === d.value);
                        map[d.value] = existing
                            ? {
                                  openTime: existing.openTime.slice(0, 5),
                                  closeTime: existing.closeTime.slice(0, 5),
                              }
                            : { openTime: "", closeTime: "" };
                    });
                    setSchedule(map);
                })
                .catch(() => setError("Greška pri dohvaćanju radnog vremena"));
        }
    }, [salonId]);

    const updateDay = (day, field, value) => {
        setSchedule({
            ...schedule,
            [day]: { ...schedule[day], [field]: value },
        });
        setSavedDay(null);
    };

    const saveDay = async (day) => {
        setError("");
        const { openTime, closeTime } = schedule[day];
        if (!openTime || !closeTime) {
            setError("Odaberi vrijeme otvaranja i zatvaranja");
            return;
        }
        try {
            await client.post(`/salons/${salonId}/working-hours`, {
                dayOfWeek: day,
                openTime,
                closeTime,
                open: true,
            });
            setSavedDay(day);
        } catch {
            setError("Greška pri spremanju radnog vremena");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page">
                <h2>Radno vrijeme</h2>
                <p className="page-subtitle">
                    Postavi sate samo za dane kada salon radi. Dan koji ne postaviš se ne može rezervirati.
                </p>

                {error && <p className="auth-error">{error}</p>}

                <div className="hours-list">
                    {DAYS.map((d) => {
                        const day = schedule[d.value];
                        if (!day) return null;
                        const isSet = day.openTime && day.closeTime;
                        return (
                            <div key={d.value} className="hours-row">
                                <span className="hours-day">{d.name}</span>

                                <select
                                    value={day.openTime}
                                    onChange={(e) =>
                                        updateDay(d.value, "openTime", e.target.value)
                                    }
                                >
                                    <option value="">--:--</option>
                                    {TIMES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>

                                <span className="hours-dash">–</span>

                                <select
                                    value={day.closeTime}
                                    onChange={(e) =>
                                        updateDay(d.value, "closeTime", e.target.value)
                                    }
                                >
                                    <option value="">--:--</option>
                                    {TIMES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>

                                {!isSet && (
                                    <span className="hours-muted">Nije postavljeno</span>
                                )}

                                <button
                                    className="btn-ghost"
                                    onClick={() => saveDay(d.value)}
                                >
                                    {savedDay === d.value ? "Spremljeno ✓" : "Spremi"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
