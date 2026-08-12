import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

function Register() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        role: "CLIENT",
    });
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (form.password !== form.confirmPassword) {
            setError("Lozinke se ne podudaraju");
            return;
        }
        try {
            await client.post("/auth/register", {
                name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
                email: form.email,
                password: form.password,
                phone: form.phone,
                role: form.role,
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || "Registracija nije uspjela");
        }
    };

    if (submitted) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <img src="/logo-mark.png" alt="" />
                        <span>punta<span className="auth-logo-dot">.</span></span>
                    </div>
                    <h1>Provjeri svoj email</h1>
                    <p className="auth-hint">
                        Poslali smo link za potvrdu na <strong>{form.email}</strong>. Klikni na njega da
                        aktiviraš svoj Apunta račun.
                    </p>
                    <p className="auth-switch">
                        Već potvrdio/la? <Link to="/login">Prijavi se</Link>
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
                <h1>Registracija</h1>

                {error && <div className="auth-error">{error}</div>}

                <label>Ime</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required />

                <label>Prezime</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required />

                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />

                <label>Lozinka</label>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                />

                <label>Potvrdi lozinku</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    minLength={6}
                    required
                />

                <label>Telefon</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />

                <label>Tip računa</label>
                <select name="role" value={form.role} onChange={handleChange}>
                    <option value="CLIENT">Klijent</option>
                    <option value="SALON_OWNER">Vlasnik salona</option>
                </select>

                <button type="submit">Registriraj se</button>

                <p className="auth-switch">
                    Već imaš račun? <Link to="/login">Prijavi se</Link>
                </p>
            </form>
        </div>
    );
}

export default Register;
