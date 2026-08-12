import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import client from "../api/client";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) {
            setError("Lozinke se ne podudaraju");
            return;
        }
        try {
            await client.post("/auth/reset-password", { token, newPassword });
            setDone(true);
            setTimeout(() => navigate("/login"), 1800);
        } catch (err) {
            setError(err.response?.data?.message || "Greška pri resetiranju lozinke.");
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <img src="/logo-mark.png" alt="" />
                        <span>punta<span className="auth-logo-dot">.</span></span>
                    </div>
                    <h1>Neispravan link</h1>
                    <p className="auth-switch">
                        <Link to="/zaboravljena-lozinka">Zatraži novi link</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="auth-logo">
                    <img src="/logo-mark.png" alt="" />
                    <span>punta<span className="auth-logo-dot">.</span></span>
                </div>
                <h1>Nova lozinka</h1>

                {error && <div className="auth-error">{error}</div>}
                {done && <p className="auth-hint">Lozinka promijenjena, preusmjeravamo te na prijavu...</p>}

                <label>Nova lozinka</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                />

                <label>Potvrdi novu lozinku</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                />

                <button type="submit">Spremi novu lozinku</button>
            </form>
        </div>
    );
}

export default ResetPassword;
