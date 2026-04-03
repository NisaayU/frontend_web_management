import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useGlobalContext } from "../../context/globalContext";
import Button from "../Button/Button";
import { plus } from "../../utils/Icons";

function InputItem() {
    const { items, getItems, addItem, updateItem, deleteItem, user } = useGlobalContext();
    const isOwner = user?.role === "owner";

    const [formData, setFormData] = useState({ name: "", price: "", stock: "" });
    const [editId, setEditId]     = useState(null);
    const [errors, setErrors]     = useState({});
    const [serverError, setServerError] = useState("");
    const [successMsg, setSuccessMsg]   = useState("");
    const [confirmId, setConfirmId]     = useState(null);
    const [confirmName, setConfirmName] = useState("");

    useEffect(() => { getItems(); }, []);

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setServerError("");
        setTimeout(() => setSuccessMsg(""), 3000);
    };

    const showError = (msg) => {
        setServerError(msg);
        setSuccessMsg("");
        setTimeout(() => setServerError(""), 3000);
    };

    const handleChange = name => e => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors(prev => ({ ...prev, [name]: "" }));
        setServerError("");
    };

    const validate = () => {
        const e = {};
        if (!formData.name.trim())                               e.name  = "Nama item wajib diisi";
        if (!formData.price || Number(formData.price) <= 0)      e.price = "Harga harus lebih dari 0";
        if (formData.stock === "" || Number(formData.stock) < 0) e.stock = "Stok tidak boleh negatif";
        return e;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            name:  formData.name.trim(),
            price: Number(formData.price),
            stock: Number(formData.stock),
        };

        try {
            let result;
            if (editId) {
                result = await updateItem(editId, payload);
            } else {
                result = await addItem(payload);
            }

            if (result?.success === false) {
                showError(`❌ ${result.message || "Gagal menyimpan item."}`);
                return;
            }

            showSuccess(editId ? "✅ Item berhasil diupdate!" : "✅ Item berhasil ditambahkan!");
            setFormData({ name: "", price: "", stock: "" });
            setEditId(null);
            setErrors({});
        } catch (err) {
            showError("❌ Terjadi kesalahan, item gagal disimpan.");
        }
    };

    const handleEdit = item => {
        setFormData({ name: item.name, price: item.price, stock: item.stock ?? 0 });
        setEditId(item._id);
        setErrors({});
        setServerError("");
        setSuccessMsg("");
    };

    const handleCancelEdit = () => {
        setFormData({ name: "", price: "", stock: "" });
        setEditId(null);
        setErrors({});
        setServerError("");
        setSuccessMsg("");
    };

    // Buka modal konfirmasi
    const handleDelete = (id, name) => {
        setConfirmId(id);
        setConfirmName(name);
    };

    // Eksekusi hapus setelah dikonfirmasi
    const confirmDelete = async () => {
        try {
            const result = await deleteItem(confirmId);
            if (result?.success === false) {
                showError(`❌ ${result.message || "Gagal menghapus item."}`);
            } else {
                showSuccess("🗑️ Item berhasil dihapus!");
            }
        } catch (err) {
            showError("❌ Terjadi kesalahan saat menghapus item.");
        } finally {
            setConfirmId(null);
            setConfirmName("");
        }
    };

    const cancelDelete = () => {
        setConfirmId(null);
        setConfirmName("");
    };

    const formatRupiah = (num) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num);

    return (
        <Wrapper>
            {/* ── FORM ── */}
            <FormCard onSubmit={handleSubmit}>
                <div className="form-header">
                    <h3>{editId ? "✏️ Edit Item" : "➕ Tambah Item"}</h3>
                    {editId && (
                        <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                            Batal
                        </button>
                    )}
                </div>

                {/* TOAST */}
                {serverError && <div className="toast toast--error">{serverError}</div>}
                {successMsg  && <div className="toast toast--success">{successMsg}</div>}

                {/* NAMA */}
                <div className="field">
                    <label>Nama Item</label>
                    <input
                        type="text"
                        placeholder="Contoh: Beras 5kg"
                        value={formData.name}
                        onChange={handleChange("name")}
                        className={errors.name ? "input-error" : ""}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                {/* HARGA + STOK */}
                <div className="field-row">
                    <div className="field">
                        <label>Harga Satuan</label>
                        <div className="input-prefix-wrap">
                            <span className="prefix">Rp</span>
                            <input
                                type="number"
                                placeholder="0"
                                min="1"
                                value={formData.price}
                                onChange={handleChange("price")}
                                className={errors.price ? "input-error" : ""}
                            />
                        </div>
                        {errors.price && <span className="error-text">{errors.price}</span>}
                    </div>

                    <div className="field">
                        <label>Stok Awal</label>
                        <input
                            type="number"
                            placeholder="0"
                            min="0"
                            value={formData.stock}
                            onChange={handleChange("stock")}
                            className={errors.stock ? "input-error" : ""}
                        />
                        {errors.stock && <span className="error-text">{errors.stock}</span>}
                    </div>
                </div>

                <div className="submit-wrap">
                    <Button
                        name={editId ? "Update Item" : "Simpan Item"}
                        icon={plus}
                        bPad=".8rem 1.6rem"
                        bRad="30px"
                        bg="var(--color-accent)"
                        color="#fff"
                    />
                </div>
            </FormCard>

            {/* ── LIST ── */}
            <ListSection>
                <div className="list-header">
                    <h3>Daftar Item</h3>
                    <span className="count-badge">{items.length} item</span>
                </div>

                {items.length === 0 && (
                    <div className="empty">Belum ada item. Tambahkan item pertamamu!</div>
                )}

                <div className="items-list">
                    {items.map(item => (
                        <div className={`item-card ${editId === item._id ? "editing" : ""}`} key={item._id}>
                            <div className="item-info">
                                <span className="item-name">{item.name}</span>
                                <span className="item-price">{formatRupiah(item.price)}</span>
                            </div>

                            <div className="item-stock">
                                <span className={`stock-badge ${
                                    item.stock === 0 ? "out" : item.stock <= 5 ? "low" : "ok"
                                }`}>
                                    Stok: {item.stock ?? 0}
                                </span>
                            </div>

                            <div className="item-actions">
                                <button className="btn-edit" onClick={() => handleEdit(item)} title="Edit item">✏️</button>
                                {isOwner && (
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(item._id, item.name)}
                                        title="Hapus item"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ListSection>

            {/* ── MODAL KONFIRMASI HAPUS ── */}
            {confirmId && (
                <ModalOverlay onClick={cancelDelete}>
                    <ModalBox onClick={e => e.stopPropagation()}>
                        <div className="modal-icon">🗑️</div>
                        <h4>Hapus Item?</h4>
                        <p>
                            Yakin ingin menghapus <strong>{confirmName}</strong>?
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

export default InputItem;

/* ─────────────────── STYLED COMPONENTS ─────────────────── */

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 2rem;
    align-items: start;
    width: 100%;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const FormCard = styled.form`
    background: #FCF6F9;
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0px 1px 15px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    width: 100%;
    box-sizing: border-box;
    position: sticky;
    top: 1rem;

    @media (max-width: 900px) {
        position: static;
    }

    .form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 1);
        }

        .cancel-btn {
            background: none;
            border: 1.5px solid #d0c0e0;
            border-radius: 20px;
            padding: .25rem .9rem;
            font-size: .85rem;
            color: rgba(34, 34, 96, 0.55);
            cursor: pointer;
            transition: all .2s;
            white-space: nowrap;

            &:hover {
                border-color: #e74c3c;
                color: #e74c3c;
            }
        }
    }

    /* ── TOAST ── */
    .toast {
        padding: .65rem 1rem;
        border-radius: 10px;
        font-size: .88rem;
        font-weight: 600;
        text-align: center;
        animation: fadeIn .3s ease;

        &--success {
            background: #e6f9f0;
            color: #1a7a4a;
            border: 1.5px solid #b2e8ce;
        }
        &--error {
            background: #fff0f0;
            color: #c0392b;
            border: 1.5px solid #fcd5d5;
        }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    /* FIELD */
    .field {
        display: flex;
        flex-direction: column;
        gap: .3rem;
        width: 100%;

        label {
            font-size: .75rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 0.55);
            text-transform: uppercase;
            letter-spacing: .05em;
        }
    }

    .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: .75rem;

        @media (max-width: 400px) {
            grid-template-columns: 1fr;
        }
    }

    .input-prefix-wrap {
        display: flex;
        align-items: center;
        background: #fff;
        border: 2px solid #ede8f5;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0px 1px 8px rgba(0,0,0,0.04);
        transition: border-color .2s;

        &:focus-within { border-color: var(--color-accent); }

        .prefix {
            padding: 0 .65rem;
            font-size: .82rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 0.4);
            border-right: 1.5px solid #ede8f5;
            white-space: nowrap;
            background: #f7f3fc;
            align-self: stretch;
            display: flex;
            align-items: center;
        }

        input {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            flex: 1;
            min-width: 0;
        }
    }

    input {
        font-family: inherit;
        font-size: inherit;
        outline: none;
        border: 2px solid #ede8f5;
        padding: .6rem 1rem;
        border-radius: 10px;
        background: #fff;
        color: rgba(34, 34, 96, 1);
        box-shadow: 0px 1px 8px rgba(0,0,0,0.04);
        transition: border-color .2s;
        width: 100%;
        box-sizing: border-box;

        &:focus       { border-color: var(--color-accent); }
        &.input-error { border-color: #e74c3c; }
    }

    .error-text {
        font-size: .71rem;
        color: #e74c3c;
    }

    .submit-wrap {
        button {
            width: 100%;
            justify-content: center;
        }
    }
`;

const ListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    min-width: 0;

    .list-header {
        display: flex;
        align-items: center;
        gap: .75rem;

        h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 1);
        }

        .count-badge {
            background: var(--color-accent);
            color: #fff;
            font-size: .7rem;
            font-weight: 700;
            padding: .15rem .65rem;
            border-radius: 20px;
        }
    }

    .empty {
        text-align: center;
        padding: 2.5rem 1rem;
        background: #FCF6F9;
        border-radius: 16px;
        color: rgba(34, 34, 96, 0.35);
        font-size: .9rem;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: .6rem;
        max-height: 60vh;
        overflow-y: auto;
        padding-right: .25rem;

        @media (max-width: 900px) {
            max-height: none;
        }

        &::-webkit-scrollbar { width: 4px; }
        &::-webkit-scrollbar-thumb {
            background: #d8cff0;
            border-radius: 4px;
        }
    }

    .item-card {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: .75rem;
        background: #fff;
        padding: .9rem 1.2rem;
        border-radius: 14px;
        box-shadow: 0px 1px 10px rgba(0,0,0,0.05);
        border: 2px solid transparent;
        transition: border-color .2s, box-shadow .2s;
        min-width: 0;

        &:hover   { box-shadow: 0px 4px 18px rgba(0,0,0,0.09); }
        &.editing { border-color: var(--color-accent); }

        @media (max-width: 400px) {
            grid-template-columns: 1fr auto;
            grid-template-areas:
                "info  actions"
                "stock stock";

            .item-info    { grid-area: info; }
            .item-stock   { grid-area: stock; }
            .item-actions { grid-area: actions; }
        }
    }

    .item-info {
        display: flex;
        flex-direction: column;
        gap: .15rem;
        min-width: 0;

        .item-name {
            font-size: .95rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 1);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .item-price {
            font-size: .82rem;
            color: var(--color-green);
            font-weight: 600;
        }
    }

    .stock-badge {
        font-size: .72rem;
        font-weight: 700;
        padding: .2rem .7rem;
        border-radius: 20px;
        white-space: nowrap;

        &.ok  { background: #e6f9f0; color: #1a7a4a; }
        &.low { background: #fff8e0; color: #b8860b; }
        &.out { background: #fff0f0; color: #c0392b; }
    }

    .item-actions {
        display: flex;
        gap: .4rem;
        flex-shrink: 0;
    }

    .btn-edit,
    .btn-delete {
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
        flex-shrink: 0;

        @media (max-width: 480px) {
            width: 38px;
            height: 38px;
            font-size: 1.1rem;
        }
    }

    .btn-edit:hover   { background: #ede8f5; border-color: var(--color-accent); }
    .btn-delete:hover { background: #fff0f0; border-color: #e74c3c; }
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