import {Routes, Route, Navigate, useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import client from "./api/client";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar.jsx";
import "./App.css";
import MySalon from "./pages/MySalon.jsx";
import MyReservations from "./pages/MyReservations.jsx"
import WorkingHours from "./pages/WorkingHours.jsx";
import SalonDetails from "./pages/SalonDetails.jsx";
import SalonReservations from "./pages/SalonReservations.jsx";
import Landing from "./pages/Landing.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function Home() {
    const [salons, setSalons] = useState([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        client
            .get("/salons")
            .then((res) => setSalons(res.data))
            .catch(() => setError("Greška pri dohvaćanju salona"));
    }, []);

    const q = query.trim().toLowerCase();
    const filteredSalons = q
        ? salons.filter(
              (s) =>
                  s.name.toLowerCase().includes(q) ||
                  s.address.toLowerCase().includes(q) ||
                  s.description?.toLowerCase().includes(q)
          )
        : salons;

    return (
        <div>
            <Navbar />
            <div className="page discover-page">
                <div className="discover-hero">
                    <h2>Pronađi salon</h2>
                    <p className="page-subtitle">Rezerviraj termin u par klikova</p>

                    <div className="discover-search">
                        <i className="ti ti-search"></i>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pretraži po imenu ili lokaciji salona..."
                        />
                        {query && (
                            <button
                                type="button"
                                className="discover-search-clear"
                                onClick={() => setQuery("")}
                                aria-label="Očisti pretragu"
                            >
                                <i className="ti ti-x"></i>
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="auth-error">{error}</p>}

                {salons.length === 0 && !error && (
                    <div className="empty-state">
                        <p>Trenutno nema salona za prikaz.</p>
                    </div>
                )}

                {salons.length > 0 && filteredSalons.length === 0 && (
                    <div className="empty-state">
                        <p>Nema salona koji odgovaraju pretrazi "{query}".</p>
                    </div>
                )}

                <div className="salon-grid">
                    {filteredSalons.map((s) => (
                        <div key={s.id} className="salon-tile" onClick={()=>navigate(`/salon/${s.id}`)}>
                            {s.coverImageUrl ? (
                                <div
                                    className="salon-tile-cover"
                                    style={{ backgroundImage: `url(${s.coverImageUrl})` }}
                                ></div>
                            ) : (
                                <div className="salon-tile-cover salon-tile-cover-placeholder">
                                    <i className="ti ti-building-store"></i>
                                </div>
                            )}
                            <div className="salon-tile-body">
                                <h3>{s.name}</h3>
                                <p className="salon-row">
                                    <i className="ti ti-map-pin"></i> {s.address}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PrivateRoute({ children }) {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
}

function RootRoute() {
    const token = localStorage.getItem("token");
    return token ? <Home /> : <Landing />;
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/potvrdi-email" element={<VerifyEmail />} />
            <Route path="/zaboravljena-lozinka" element={<ForgotPassword />} />
            <Route path="/reset-lozinka" element={<ResetPassword />} />
            <Route path="/moj-salon" element={<MySalon />} />
            <Route path="/moje-rezervacije" element={<MyReservations/>} />
            <Route path="/radno-vrijeme/:workerId" element={<WorkingHours/>}/>
            <Route path="/salon/:id" element={<SalonDetails />} />
            <Route path="/rezervacije" element={<SalonReservations />} />
            <Route path="/" element={<RootRoute />} />
        </Routes>
    );
}

export default App;
