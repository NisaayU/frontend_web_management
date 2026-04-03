import React, { useState } from "react";
import styled from "styled-components";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalContext } from "../../../context/globalContext";
import Button from "../../Button/Button";
import { plus } from "../../../utils/Icons";

function ExpenseForm() {
    const { addExpense } = useGlobalContext();

    const [inputState, setInputState] = useState({
        title: '',
        amount: '',
        date: null,
        category: '',
        description: '',
    });

    const [toast, setToast] = useState(null); // { type: 'success' | 'error', msg: string }

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const handleInput = name => e => {
        setInputState({ ...inputState, [name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();

        // Validasi dasar
        if (!inputState.title.trim()) {
            showToast("error", "⚠️ Nama pengeluaran wajib diisi!");
            return;
        }
        if (!inputState.amount || Number(inputState.amount) <= 0) {
            showToast("error", "⚠️ Total pengeluaran harus lebih dari 0!");
            return;
        }
        if (!inputState.date) {
            showToast("error", "⚠️ Tanggal wajib dipilih!");
            return;
        }
        if (!inputState.category) {
            showToast("error", "⚠️ Kategori wajib dipilih!");
            return;
        }

        try {
            const result = await addExpense(inputState);
            if (result?.success === false) {
                showToast("error", `❌ ${result.message || "Gagal menyimpan pengeluaran."}`);
                return;
            }
            showToast("success", "✅ Pengeluaran berhasil disimpan!");
            setInputState({ title: '', amount: '', date: null, category: '', description: '' });
        } catch (err) {
            showToast("error", "❌ Terjadi kesalahan, pengeluaran gagal disimpan.");
        }
    };

    return (
        <ExpenseFormStyled onSubmit={handleSubmit}>
            {/* TOAST */}
            {toast && (
                <div className={`toast toast--${toast.type}`}>
                    {toast.msg}
                </div>
            )}

            <div className="field">
                <label>Nama Pengeluaran</label>
                <input
                    type="text"
                    placeholder="Contoh: Belanja Stok Gula"
                    value={inputState.title}
                    onChange={handleInput('title')}
                />
            </div>

            <div className="field">
                <label>Total Pengeluaran</label>
                <div className="prefix-wrap">
                    <span className="prefix">Rp</span>
                    <input
                        type="number"
                        placeholder="0"
                        value={inputState.amount}
                        onChange={handleInput('amount')}
                    />
                </div>
            </div>

            <div className="row-2">
                <div className="field">
                    <label>Tanggal</label>
                    <DatePicker
                        selected={inputState.date}
                        placeholderText="Pilih tanggal"
                        dateFormat="dd/MM/yyyy"
                        onChange={date => setInputState({ ...inputState, date })}
                    />
                </div>

                <div className="field">
                    <label>Kategori</label>
                    <select value={inputState.category} onChange={handleInput('category')}>
                        <option value="" disabled>Pilih kategori</option>
                        <option value="groceries">Pengantaran Barang</option>
                        <option value="tv">Belanja Stok</option>
                        <option value="other">Lainnya</option>
                    </select>
                </div>
            </div>

            <div className="field">
                <label>Keterangan <span className="optional">(opsional)</span></label>
                <textarea
                    placeholder="Catatan tambahan..."
                    value={inputState.description}
                    onChange={handleInput('description')}
                    rows={3}
                />
            </div>

            <div className="submit-btn">
                <Button
                    name="Tambahkan"
                    icon={plus}
                    bPad=".8rem 1.6rem"
                    bRad="40px"
                    bg="var(--color-accent)"
                    color="#fff"
                />
            </div>
        </ExpenseFormStyled>
    );
}

const ExpenseFormStyled = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 100%;
    width: 100%;

    /* ── TOAST ── */
    .toast {
        padding: .75rem 1rem;
        border-radius: 12px;
        font-size: .88rem;
        font-weight: 600;
        text-align: center;
        animation: slideDown .3s ease;

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

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    /* ── FIELD WRAPPER ── */
    .field {
        display: flex;
        flex-direction: column;
        gap: .3rem;
        width: 100%;

        label {
            font-size: .75rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.55);
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        .optional {
            font-weight: 400;
            text-transform: none;
            letter-spacing: 0;
            color: rgba(34, 34, 96, 0.35);
        }
    }

    /* ── TWO COLUMN ROW ── */
    .row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        @media (max-width: 480px) {
            grid-template-columns: 1fr;
        }
    }

    /* ── PREFIX WRAP (Rp) ── */
    .prefix-wrap {
        display: flex;
        align-items: center;
        background: #fff;
        border: 2px solid #ede8f5;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0px 1px 8px rgba(0,0,0,0.04);
        transition: border-color .2s;

        &:focus-within {
            border-color: var(--color-accent);
        }

        .prefix {
            padding: 0 .75rem;
            font-size: .85rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.4);
            border-right: 1.5px solid #ede8f5;
            white-space: nowrap;
            background: #f7f3fc;
        }

        input {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            flex: 1;
        }
    }

    /* ── BASE INPUT/SELECT/TEXTAREA ── */
    input, textarea, select {
        font-family: inherit;
        font-size: inherit;
        outline: none;
        border: 2px solid #ede8f5;
        padding: .6rem 1rem;
        border-radius: 10px;
        background: #fff;
        resize: none;
        box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.04);
        color: rgba(34, 34, 96, 1);
        width: 100%;
        box-sizing: border-box;
        transition: border-color .2s, box-shadow .2s;

        &::placeholder {
            color: rgba(34, 34, 96, 0.35);
        }

        &:focus {
            border-color: var(--color-accent);
            box-shadow: 0px 1px 15px rgba(0, 0, 0, 0.08);
        }
    }

    .react-datepicker-wrapper {
        width: 100%;
        input { width: 100%; }
    }

    select {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23222260' opacity='0.4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        padding-right: 2.5rem;

        option { color: rgba(34, 34, 96, 1); }
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }

    /* ── SUBMIT ── */
    .submit-btn {
        margin-top: .4rem;

        button {
            width: 100%;
            justify-content: center;
            box-shadow: 0px 1px 15px rgba(0, 0, 0, 0.06);
            transition: background .2s !important;

            &:hover {
                background: var(--color-green) !important;
            }
        }
    }

    @media (max-width: 600px) {
        gap: 1rem;
        input, textarea, select {
            font-size: .95rem;
            padding: .7rem 1rem;
        }
    }
`;

export default ExpenseForm;