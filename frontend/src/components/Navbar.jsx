import { useNavigate, NavLink } from "react-router-dom";

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + second).toUpperCase();
}

export default function Navbar() {
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const linkClass = ({ isActive }) => (isActive ? "active" : undefined);

    return (
        <header className="home-header">
            <NavLink to="/" className="navbar-logo">
                Munja
            </NavLink>

            <nav className="navbar-links">
                {role === "CLIENT" && (
                    <>
                        <NavLink to="/" end className={linkClass}>
                            <i className="ti ti-building-store"></i> Saloni
                        </NavLink>
                        <NavLink to="/moje-rezervacije" className={linkClass}>
                            <i className="ti ti-calendar-check"></i> Moje rezervacije
                        </NavLink>
                    </>
                )}

                {role === "SALON_OWNER" && (
                    <>
                        <NavLink to="/moj-salon" className={linkClass}>
                            <i className="ti ti-building-store"></i> Moj salon
                        </NavLink>
                        <NavLink to="/rezervacije" className={linkClass}>
                            <i className="ti ti-calendar-check"></i> Rezervacije
                        </NavLink>
                    </>
                )}

                <div className="navbar-user">
                    <span className="navbar-avatar">{getInitials(name)}</span>
                    <span className="navbar-name">{name}</span>
                </div>

                <button className="navbar-logout" onClick={logout} aria-label="Odjava">
                    <i className="ti ti-logout"></i>
                </button>
            </nav>
        </header>
    );
}
