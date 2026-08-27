import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import client from "../api/client";

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + second).toUpperCase();
}

export default function Navbar() {
    const name = localStorage.getItem("name");
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [hasSalon, setHasSalon] = useState(false);

    useEffect(() => {
        client
            .get("/salons/my")
            .then((res) => setHasSalon(res.data.length > 0))
            .catch(() => {});
    }, []);

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const linkClass = ({ isActive }) => (isActive ? "active" : undefined);

    const links = (
        <>
            {hasSalon && (
                <>
                    <NavLink to="/moj-salon" className={linkClass} onClick={() => setMenuOpen(false)}>
                        <i className="ti ti-building-store"></i> Moj salon
                    </NavLink>
                    <NavLink to="/rezervacije" className={linkClass} onClick={() => setMenuOpen(false)}>
                        <i className="ti ti-calendar-check"></i> Rezervacije
                    </NavLink>
                </>
            )}

            <NavLink to="/" end className={linkClass} onClick={() => setMenuOpen(false)}>
                <i className="ti ti-search"></i> Saloni
            </NavLink>
            <NavLink to="/moje-rezervacije" className={linkClass} onClick={() => setMenuOpen(false)}>
                <i className="ti ti-calendar-user"></i> Moje rezervacije
            </NavLink>

            {!hasSalon && (
                <NavLink to="/moj-salon" className={linkClass} onClick={() => setMenuOpen(false)}>
                    <i className="ti ti-plus"></i> Dodaj svoj salon
                </NavLink>
            )}
        </>
    );

    return (
        <>
            <header className="home-header">
                <NavLink to="/" className="navbar-logo">
                    <img src="/logo-mark.png" alt="Apunta" className="navbar-logo-mark" />
                    punta
                </NavLink>

                <nav className="navbar-links navbar-links-desktop">
                    {links}

                    <div className="navbar-user">
                        <span className="navbar-avatar">{getInitials(name)}</span>
                        <span className="navbar-name">{name}</span>
                    </div>

                    <button className="navbar-logout" onClick={logout} aria-label="Odjava">
                        <i className="ti ti-logout"></i>
                    </button>
                </nav>

                <button
                    className="navbar-burger"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Izbornik"
                >
                    <i className={`ti ${menuOpen ? "ti-x" : "ti-menu-2"}`}></i>
                </button>
            </header>

            {menuOpen && (
                <div className="navbar-mobile-panel">
                    <nav className="navbar-links-mobile">{links}</nav>
                    <div className="navbar-mobile-footer">
                        <div className="navbar-user">
                            <span className="navbar-avatar">{getInitials(name)}</span>
                            <span className="navbar-name">{name}</span>
                        </div>
                        <button className="navbar-logout" onClick={logout} aria-label="Odjava">
                            <i className="ti ti-logout"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
