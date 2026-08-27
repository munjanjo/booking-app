import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [notVerified, setNotVerified] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setNotVerified(false);
        setResendMessage("");
        try {
            const res = await client.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name);
            navigate("/");
        } catch (err) {
            const message = err.response?.data?.message || "Pogrešan email ili lozinka";
            setError(message);
            if (message.toLowerCase().includes("nije potvrđen")) {
                setNotVerified(true);
            }
        }
    };

    const handleResend = async () => {
        setResendMessage("");
        try {
            const res = await client.post("/auth/resend-verification", { email });
            setResendMessage(res.data.message);
        } catch {
            setResendMessage("Greška pri slanju linka.");
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-logo">
                    <img src="/logo-mark.png" alt="" />
                    <span>punta<span className="auth-logo-dot">.</span></span>
                </div>
                <h1>Prijava</h1>

                {error && <div className="auth-error">{error}</div>}
                {notVerified && (
                    <button type="button" className="auth-inline-link" onClick={handleResend}>
                        Pošalji ponovno link za potvrdu
                    </button>
                )}
                {resendMessage && <p className="auth-hint">{resendMessage}</p>}

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
                    <Link to="/zaboravljena-lozinka">Zaboravio/la si lozinku?</Link>
                </p>
                <p className="auth-switch">
                    Nemaš račun? <Link to="/register">Registriraj se</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
