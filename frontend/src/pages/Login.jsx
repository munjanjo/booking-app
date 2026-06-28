import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await client.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name);
            localStorage.setItem("role", res.data.role);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Pogrešan email ili lozinka");
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Prijava</h1>

                {error && <div className="auth-error">{error}</div>}

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <label>Lozinka</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Prijavi se</button>

                <p className="auth-switch">
                    Nemaš račun? <Link to="/register">Registriraj se</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
