import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        try {
            const res = await client.post("/auth/forgot-password", { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Greška, pokušaj ponovno.");
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-logo">
                    <img src="/logo-mark.png" alt="" />
                    <span>punta<span className="auth-logo-dot">.</span></span>
                </div>
                <h1>Zaboravljena lozinka</h1>
                <p className="auth-hint">
                    Upiši email s kojim si registriran/a — poslat ćemo ti link za postavljanje nove
                    lozinke.
                </p>

                {error && <div className="auth-error">{error}</div>}
                {message && <p className="auth-hint">{message}</p>}

                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button type="submit">Pošalji link</button>

                <p className="auth-switch">
                    <Link to="/login">Natrag na prijavu</Link>
                </p>
            </form>
        </div>
    );
}

export default ForgotPassword;
