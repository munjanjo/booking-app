import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";

function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "CLIENT",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const res = await client.post("/auth/register", form);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("name", res.data.name);
            localStorage.setItem("role", res.data.role);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registracija nije uspjela");
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Registracija</h1>

                {error && <div className="auth-error">{error}</div>}

                <label>Ime</label>
                <input name="name" value={form.name} onChange={handleChange} required />

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

                <label>Telefon</label>
                <input name="phone" value={form.phone} onChange={handleChange} />

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
