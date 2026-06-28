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

function Home() {
    const [salons, setSalons] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        client
            .get("/salons")
            .then((res) => setSalons(res.data))
            .catch(() => setError("Greška pri dohvaćanju salona"));
    }, []);


    return (
        <div>
            <Navbar />
            <div className="page">
                <h2>Pronađi salon</h2>
                <p className="page-subtitle">Rezerviraj termin u par klikova</p>

                {error && <p className="auth-error">{error}</p>}
                {salons.length === 0 && !error && (
                    <div className="empty-state">
                        <p>Trenutno nema salona za prikaz.</p>
                    </div>
                )}

                <div className="salon-grid">
                    {salons.map((s) => (
                        <div key={s.id} className="salon-tile" onClick={()=>navigate(`/salon/${s.id}`)}>
                            <div className="salon-tile-icon">
                                <i className="ti ti-building-store"></i>
                            </div>
                            <h3>{s.name}</h3>
                            <p className="salon-row">
                                <i className="ti ti-map-pin"></i> {s.address}
                            </p>
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

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/moj-salon" element={<MySalon />} />
            <Route path="/moje-rezervacije" element={<MyReservations/>} />
            <Route path="/radno-vrijeme" element={<WorkingHours/>}/>
            <Route path="/salon/:id" element={<SalonDetails />} />
            <Route path="/rezervacije" element={<SalonReservations />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Home />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

export default App;
