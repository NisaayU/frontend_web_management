import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useGlobalContext } from "../context/globalContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useGlobalContext();

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Pakai fungsi login dari context — ini yang update user state
        const result = await login(form.username, form.password);
        if (result.success) {
            navigate("/dashboard");
        } else {
            setError(result.message || "Login gagal");
        }
        setLoading(false);
    };

    return (
        <LoginStyled>
            <div className="login-card">
                <div className="login-header">
                    <h1>Toko Berkah Gypsum</h1>
                    <p>Sistem Pengelolaan Data Penjualan </p>
                </div>

                {error && <div className="error-msg">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Masukkan username"
                            value={form.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Masukkan password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Memproses..." : "Masuk"}
                    </button>
                </form>
            </div>
        </LoginStyled>
    );
}

const LoginStyled = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0ebff 0%, #fce4f3 100%);
    padding: 1rem;

    .login-card {
        background: #fff;
        border-radius: 24px;
        padding: 2.5rem 2rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0px 8px 40px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .login-header {
        text-align: center;

        h1 {
            font-size: 2rem;
            font-weight: 800;
            color: rgba(34, 34, 96, 1);
            letter-spacing: .05em;
        }

        p {
            font-size: .85rem;
            color: rgba(34, 34, 96, 0.45);
            margin-top: .25rem;
        }
    }

    .error-msg {
        background: #fff0f0;
        color: #c0392b;
        border: 1.5px solid #fcd5d5;
        border-radius: 10px;
        padding: .65rem 1rem;
        font-size: .85rem;
        font-weight: 600;
        text-align: center;
        animation: fadeIn .3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: .3rem;

        label {
            font-size: .75rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.55);
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        input {
            font-family: inherit;
            font-size: 1rem;
            outline: none;
            border: 2px solid #ede8f5;
            padding: .7rem 1rem;
            border-radius: 10px;
            background: #fff;
            color: rgba(34, 34, 96, 1);
            box-shadow: 0px 1px 8px rgba(0,0,0,0.04);
            transition: border-color .2s;
            width: 100%;
            box-sizing: border-box;

            &:focus { border-color: var(--color-accent, #9b59b6); }

            &::placeholder { color: rgba(34, 34, 96, 0.3); }
        }
    }

    .login-btn {
        width: 100%;
        padding: .85rem;
        background: var(--color-accent, #9b59b6);
        color: #fff;
        border: none;
        border-radius: 30px;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        margin-top: .5rem;
        transition: background .2s, opacity .2s;
        font-family: inherit;

        &:hover    { background: var(--color-green, #42ad00); }
        &:disabled { opacity: .6; cursor: not-allowed; }
    }
`;

export default Login;