import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import client from "../api/client";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("error");
            setError("Nedostaje token za potvrdu.");
            return;
        }
        client
            .get("/auth/verify-email", { params: { token } })
            .then((res) => {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("name", res.data.name);
                localStorage.setItem("role", res.data.role);
                setStatus("success");
                setTimeout(() => navigate("/"), 1500);
            })
            .catch((err) => {
                setStatus("error");
                setError(err.response?.data?.message || "Potvrda nije uspjela.");
            });
    }, [searchParams, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/logo-mark.png" alt="" />
                    <span>punta<span className="auth-logo-dot">.</span></span>
                </div>
                {status === "loading" && <h1>Potvrđujemo email...</h1>}
                {status === "success" && (
                    <>
                        <h1>Email potvrđen!</h1>
                        <p className="auth-hint">Prijavljujemo te automatski...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <h1>Nešto nije u redu</h1>
                        <div className="auth-error">{error}</div>
                        <p className="auth-switch">
                            <Link to="/login">Natrag na prijavu</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;
