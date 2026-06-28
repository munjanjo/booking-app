import { useNavigate, Link } from "react-router-dom";

export default function Navbar() {
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <header className="home-header">

            <Link to="/" className="navbar-logo">Munja</Link>


            <nav className="navbar-links">
                {role === "CLIENT" && (
                    <>
                        <Link to="/">Saloni</Link>
                        <Link to="/moje-rezervacije">Moje rezervacije</Link>
                    </>
                )}

                {role === "SALON_OWNER" && (
                    <>
                        <Link to="/moj-salon">Moj salon</Link>
                        <Link to="/rezervacije">Rezervacije</Link>
                        <Link to="/radno-vrijeme">Radno vrijeme</Link>
                    </>
                )}

                <span>{name}</span>
                <button onClick={logout}>Odjava</button>
            </nav>
        </header>
    );
}