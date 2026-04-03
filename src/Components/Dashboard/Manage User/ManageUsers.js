import { useState, useEffect } from "react";
import styled from "styled-components";
import { useGlobalContext } from "../../../context/globalContext";
import axios from "axios";

const BASE_URL = "http://localhost:3000/api/v1/";

function ManageUsers() {
    const { user } = useGlobalContext();

    const [users, setUsers]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [form, setForm]             = useState({ username: "", password: "", role: "staff" });
    const [errors, setErrors]         = useState({});
    const [serverMsg, setServerMsg]   = useState({ type: "", text: "" });
    const [editPasswordId, setEditPasswordId] = useState(null);
    const [newPassword, setNewPassword]       = useState("");

    // Modal state
    const [confirmDeleteId,   setConfirmDeleteId]   = useState(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState("");

    // ── FETCH USERS ──────────────────────────────────────────────────
    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}users`);
            setUsers(res.data);
        } catch (err) {
            showMsg("error", err.response?.data?.message || "Gagal mengambil data user");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // ── HELPERS ──────────────────────────────────────────────────────
    const showMsg = (type, text) => {
        setServerMsg({ type, text });
        setTimeout(() => setServerMsg({ type: "", text: "" }), 3500);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.username.trim())    e.username = "Username wajib diisi";
        if (!form.password)           e.password = "Password wajib diisi";
        if (form.password.length < 4) e.password = "Password minimal 4 karakter";
        return e;
    };

    // ── CREATE USER ───────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        try {
            await axios.post(`${BASE_URL}users`, form);
            setForm({ username: "", password: "", role: "staff" });
            setErrors({});
            showMsg("success", `User "${form.username}" berhasil dibuat`);
            fetchUsers();
        } catch (err) {
            showMsg("error", err.response?.data?.message || "Gagal membuat user");
        }
    };

    // ── UPDATE PASSWORD ───────────────────────────────────────────────
    const handleUpdatePassword = async (id) => {
        if (!newPassword || newPassword.length < 4) {
            showMsg("error", "Password minimal 4 karakter");
            return;
        }
        try {
            await axios.put(`${BASE_URL}users/${id}/password`, { newPassword });
            setEditPasswordId(null);
            setNewPassword("");
            showMsg("success", "Password berhasil diupdate");
        } catch (err) {
            showMsg("error", err.response?.data?.message || "Gagal update password");
        }
    };

    // ── DELETE USER ───────────────────────────────────────────────────
    const openDeleteModal = (id, username) => {
        setConfirmDeleteId(id);
        setConfirmDeleteName(username);
    };

    const cancelDelete = () => {
        setConfirmDeleteId(null);
        setConfirmDeleteName("");
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${BASE_URL}users/${confirmDeleteId}`);
            showMsg("success", "User berhasil dihapus");
            fetchUsers();
        } catch (err) {
            showMsg("error", err.response?.data?.message || "Gagal menghapus user");
        } finally {
            setConfirmDeleteId(null);
            setConfirmDeleteName("");
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit", month: "short", year: "numeric"
    });

    return (
        <Wrapper>
            <div className="page-header">
                <div>
                    <h1>Kelola Pengguna</h1>
                    <p>Tambah dan kelola akun staff sistem</p>
                </div>
                <div className="user-count">
                    <span>{users.length}</span>
                    <small>Total User</small>
                </div>
            </div>

            {serverMsg.text && (
                <div className={`toast ${serverMsg.type}`}>{serverMsg.text}</div>
            )}

            <div className="layout">
                {/* ── FORM TAMBAH USER ── */}
                <FormCard onSubmit={handleCreate}>
                    <h3>➕ Tambah User Baru</h3>

                    <div className="field">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Contoh: staff01"
                            value={form.username}
                            onChange={handleChange}
                            className={errors.username ? "err" : ""}
                            autoComplete="off"
                        />
                        {errors.username && <span className="err-text">{errors.username}</span>}
                    </div>

                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Min. 4 karakter"
                            value={form.password}
                            onChange={handleChange}
                            className={errors.password ? "err" : ""}
                            autoComplete="new-password"
                        />
                        {errors.password && <span className="err-text">{errors.password}</span>}
                    </div>

                    <div className="field">
                        <label>Role</label>
                        <select name="role" value={form.role} onChange={handleChange}>
                            <option value="staff">Staff</option>
                            <option value="owner">Owner</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-create">
                        Buat Akun
                    </button>
                </FormCard>

                {/* ── DAFTAR USER ── */}
                <ListSection>
                    <div className="list-header">
                        <h3>Daftar Pengguna</h3>
                        <span className="badge">{users.length} akun</span>
                    </div>

                    {loading ? (
                        <div className="empty">Memuat data...</div>
                    ) : users.length === 0 ? (
                        <div className="empty">Belum ada user</div>
                    ) : (
                        <div className="user-list">
                            {users.map(u => (
                                <div className={`user-card ${u._id === user?._id ? "is-me" : ""}`} key={u._id}>
                                    {/* INFO */}
                                    <div className="user-info">
                                        <div className="avatar">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="uname">
                                                {u.username}
                                                {u._id === user?._id && <span className="me-tag">Anda</span>}
                                            </span>
                                            <span className="udate">Dibuat {formatDate(u.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* ROLE BADGE */}
                                    <span className={`role-badge ${u.role}`}>
                                        {u.role === "owner" ? "👑 Owner" : "👤 Staff"}
                                    </span>

                                    {/* ACTIONS */}
                                    {u._id !== user?._id && (
                                        <div className="actions">
                                            {/* EDIT PASSWORD */}
                                            {editPasswordId === u._id ? (
                                                <div className="pwd-form">
                                                    <input
                                                        type="password"
                                                        placeholder="Password baru"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        className="btn-save"
                                                        onClick={() => handleUpdatePassword(u._id)}
                                                    >✓</button>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={() => { setEditPasswordId(null); setNewPassword(""); }}
                                                    >✕</button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => setEditPasswordId(u._id)}
                                                    title="Ganti password"
                                                >🔑</button>
                                            )}

                                            {/* DELETE — buka modal */}
                                            <button
                                                className="btn-delete"
                                                onClick={() => openDeleteModal(u._id, u.username)}
                                                title="Hapus user"
                                            >🗑️</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ListSection>
            </div>

            {/* ── MODAL KONFIRMASI HAPUS ── */}
            {confirmDeleteId && (
                <ModalOverlay onClick={cancelDelete}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <div className="modal-icon">🗑️</div>
                        <h4>Hapus User?</h4>
                        <p>
                            Yakin ingin menghapus akun <strong>{confirmDeleteName}</strong>?
                            Tindakan ini tidak bisa dibatalkan.
                        </p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={cancelDelete}>
                                Batal
                            </button>
                            <button className="btn-confirm" onClick={confirmDelete}>
                                Ya, Hapus
                            </button>
                        </div>
                    </ModalBox>
                </ModalOverlay>
            )}
        </Wrapper>
    );
}

export default ManageUsers;

/* ─────────────── STYLED ─────────────── */

const Wrapper = styled.div`
    padding: 1.5rem;
    width: 100%;
    box-sizing: border-box;

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;

        h1 {
            font-size: 1.6rem;
            font-weight: 800;
            color: rgba(34, 34, 96, 1);
        }
        p {
            font-size: .85rem;
            color: rgba(34, 34, 96, 0.45);
            margin-top: .2rem;
        }
    }

    .user-count {
        background: var(--color-accent, #9b59b6);
        color: #fff;
        border-radius: 16px;
        padding: .6rem 1.2rem;
        text-align: center;
        display: flex;
        flex-direction: column;

        span  { font-size: 1.8rem; font-weight: 800; line-height: 1; }
        small { font-size: .7rem; opacity: .8; }
    }

    .toast {
        padding: .75rem 1.2rem;
        border-radius: 12px;
        font-size: .85rem;
        font-weight: 600;
        margin-bottom: 1.2rem;
        animation: fadeIn .3s ease;

        &.success { background: #e6f9f0; color: #1a7a4a; border: 1.5px solid #b2e8ce; }
        &.error   { background: #fff0f0; color: #c0392b; border: 1.5px solid #fcd5d5; }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        align-items: start;

        @media (max-width: 900px) {
            grid-template-columns: 1fr;
        }
    }
`;

const FormCard = styled.form`
    background: #FCF6F9;
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0px 1px 15px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    top: 1rem;

    @media (max-width: 900px) { position: static; }

    h3 {
        font-size: 1rem;
        font-weight: 700;
        color: rgba(34, 34, 96, 1);
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: .3rem;

        label {
            font-size: .72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .05em;
            color: rgba(34, 34, 96, 0.5);
        }
    }

    input, select {
        font-family: inherit;
        font-size: .92rem;
        outline: none;
        border: 2px solid #ede8f5;
        padding: .6rem 1rem;
        border-radius: 10px;
        background: #fff;
        color: rgba(34, 34, 96, 1);
        box-shadow: 0px 1px 6px rgba(0,0,0,0.04);
        transition: border-color .2s;
        width: 100%;
        box-sizing: border-box;

        &:focus { border-color: var(--color-accent, #9b59b6); }
        &.err   { border-color: #e74c3c; }
    }

    select {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23222260' opacity='0.4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        padding-right: 2.5rem;
        cursor: pointer;
    }

    .err-text {
        font-size: .71rem;
        color: #e74c3c;
    }

    .btn-create {
        background: var(--color-accent, #9b59b6);
        color: #fff;
        border: none;
        border-radius: 30px;
        padding: .75rem;
        font-size: .95rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: background .2s;
        margin-top: .25rem;

        &:hover { background: var(--color-green, #42ad00); }
    }
`;

const ListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .list-header {
        display: flex;
        align-items: center;
        gap: .75rem;

        h3 { font-size: 1rem; font-weight: 700; color: rgba(34, 34, 96, 1); }

        .badge {
            background: var(--color-accent, #9b59b6);
            color: #fff;
            font-size: .68rem;
            font-weight: 700;
            padding: .15rem .65rem;
            border-radius: 20px;
        }
    }

    .empty {
        text-align: center;
        padding: 2rem;
        background: #FCF6F9;
        border-radius: 16px;
        color: rgba(34, 34, 96, 0.35);
        font-size: .9rem;
    }

    .user-list {
        display: flex;
        flex-direction: column;
        gap: .65rem;
    }

    .user-card {
        background: #fff;
        border-radius: 14px;
        padding: 1rem 1.2rem;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.05);
        border: 2px solid transparent;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        transition: border-color .2s;

        &:hover { border-color: #ede8f5; }
        &.is-me { border-color: var(--color-accent, #9b59b6); background: #f8f4ff; }
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: .75rem;
        flex: 1;
        min-width: 0;

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--color-accent, #9b59b6);
            color: #fff;
            font-size: 1.1rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .uname {
            font-size: .95rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 1);
            display: flex;
            align-items: center;
            gap: .4rem;
        }

        .me-tag {
            font-size: .65rem;
            font-weight: 700;
            background: var(--color-accent, #9b59b6);
            color: #fff;
            padding: .1rem .45rem;
            border-radius: 20px;
        }

        .udate {
            display: block;
            font-size: .75rem;
            color: rgba(34, 34, 96, 0.4);
            margin-top: .1rem;
        }
    }

    .role-badge {
        font-size: .72rem;
        font-weight: 700;
        padding: .25rem .8rem;
        border-radius: 20px;
        white-space: nowrap;
        flex-shrink: 0;

        &.owner { background: #fff8e0; color: #b8860b; border: 1.5px solid #f0d080; }
        &.staff { background: #e6f9f0; color: #1a7a4a; border: 1.5px solid #b2e8ce; }
    }

    .actions {
        display: flex;
        align-items: center;
        gap: .5rem;
        flex-shrink: 0;
    }

    .btn-edit, .btn-delete {
        background: none;
        border: 1.5px solid #ede8f5;
        border-radius: 8px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        cursor: pointer;
        transition: background .2s, border-color .2s;
    }

    .btn-edit:hover   { background: #ede8f5; border-color: var(--color-accent); }
    .btn-delete:hover { background: #fff0f0; border-color: #e74c3c; }

    /* PASSWORD INLINE FORM */
    .pwd-form {
        display: flex;
        align-items: center;
        gap: .35rem;

        input {
            font-family: inherit;
            font-size: .82rem;
            border: 1.5px solid #ede8f5;
            border-radius: 8px;
            padding: .35rem .65rem;
            outline: none;
            width: 130px;

            &:focus { border-color: var(--color-accent); }
        }

        .btn-save, .btn-cancel {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: .85rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-save   { background: #e6f9f0; color: #1a7a4a; }
        .btn-cancel { background: #fff0f0; color: #c0392b; }
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: overlayIn .2s ease;

    @keyframes overlayIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
`;

const ModalBox = styled.div`
    background: #fff;
    border-radius: 20px;
    padding: 2rem 2rem 1.5rem;
    width: 90%;
    max-width: 360px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .75rem;
    animation: boxIn .25s ease;

    @keyframes boxIn {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
    }

    .modal-icon {
        font-size: 2.5rem;
        line-height: 1;
    }

    h4 {
        font-size: 1.15rem;
        font-weight: 700;
        color: rgba(34, 34, 96, 1);
        margin: 0;
    }

    p {
        font-size: .88rem;
        color: rgba(34, 34, 96, 0.6);
        text-align: center;
        line-height: 1.5;
        margin: 0;

        strong {
            color: rgba(34, 34, 96, 0.9);
        }
    }

    .modal-actions {
        display: flex;
        gap: .75rem;
        margin-top: .5rem;
        width: 100%;

        button {
            flex: 1;
            padding: .65rem 1rem;
            border-radius: 30px;
            font-size: .9rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            font-family: inherit;
            transition: opacity .2s, transform .1s;

            &:active { transform: scale(.97); }
        }

        .btn-cancel {
            background: #f0ecfa;
            color: rgba(34, 34, 96, 0.7);
            &:hover { opacity: .85; }
        }

        .btn-confirm {
            background: #e74c3c;
            color: #fff;
            &:hover { opacity: .88; }
        }
    }
`;