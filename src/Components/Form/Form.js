import React, { useState, useEffect } from "react";
import styled from "styled-components";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useGlobalContext } from "../../context/globalContext";
import Button from "../Button/Button";
import { plus } from "../../utils/Icons";

function Form() {
    const { addIncome, items: itemsMaster, getItems } = useGlobalContext();

    const [formData, setFormData] = useState({
        date: '',
        title: '',
        description: '',
        items: [{ item: '', product: '', quantity: '', price: '' }]
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        getItems();
    }, []);

    const { date, title, description, items } = formData;

    const handleChange = name => e => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleItemChange = (index, field) => e => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: e.target.value };

        if (field === 'product') {
            const selectedItem = itemsMaster.find(i => i.name === e.target.value);
            if (selectedItem) {
                updatedItems[index].item  = selectedItem._id;   // ← ObjectId untuk backend
                updatedItems[index].price = selectedItem.price;
            } else {
                updatedItems[index].item  = '';
                updatedItems[index].price = '';
            }
        }

        setFormData({ ...formData, items: updatedItems });
        setErrors(prev => ({ ...prev, [`item_${index}_${field}`]: '' }));
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...items, { item: '', product: '', quantity: '', price: '' }]
        });
    };

    const removeItem = index => {
        setFormData({
            ...formData,
            items: items.filter((_, i) => i !== index)
        });
    };

    const getSubtotal = (item) => {
        const qty   = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price)    || 0;
        return qty * price;
    };

    const grandTotal = items.reduce((sum, item) => sum + getSubtotal(item), 0);

    const formatRupiah = (num) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num);

    const validate = () => {
        const newErrors = {};
        if (!date)         newErrors.date  = 'Tanggal wajib diisi';
        if (!title.trim()) newErrors.title = 'Nama pembeli wajib diisi';

        items.forEach((item, idx) => {
            if (!item.item)
                newErrors[`item_${idx}_product`]  = 'Pilih barang dari daftar';
            if (!item.quantity || parseFloat(item.quantity) <= 0)
                newErrors[`item_${idx}_quantity`] = 'Jumlah harus > 0';
        });

        return newErrors;
    };

    const handleSubmit = async e => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);

        const payload = {
            date:  date instanceof Date ? date.toISOString() : date,
            title,
            description,
            type: 'income',
            items: items.map(i => ({
                item:     i.item,             // ObjectId dari itemsMaster._id
                quantity: Number(i.quantity), // konversi string → Number
            })),
        };

        const result = await addIncome(payload);
        setSubmitting(false);

        if (result?.success === false) {
            // Tampilkan pesan error dari backend (misal: stok tidak cukup)
            setErrors({ server: result.message });
            return;
        }

        setSuccessMsg('Transaksi berhasil disimpan!');
        setTimeout(() => setSuccessMsg(''), 3000);

        setFormData({
            date: '',
            title: '',
            description: '',
            items: [{ item: '', product: '', quantity: '', price: '' }]
        });
        setErrors({});
    };

    return (
        <FormStyled onSubmit={handleSubmit}>

            {successMsg && <div className="toast success">{successMsg}</div>}
            {errors.server && <div className="toast error-toast">{errors.server}</div>}

            {/* TANGGAL */}
            <div className="input-control">
                <label>Tanggal Transaksi</label>
                <DatePicker
                    placeholderText="Pilih tanggal"
                    selected={date}
                    dateFormat="dd/MM/yyyy"
                    onChange={(d) => {
                        setFormData({ ...formData, date: d });
                        setErrors(prev => ({ ...prev, date: '' }));
                    }}
                />
                {errors.date && <span className="error">{errors.date}</span>}
            </div>

            {/* PEMBELI */}
            <div className="input-control">
                <label>Nama Pembeli / Toko</label>
                <input
                    type="text"
                    placeholder="Contoh: Toko Maju Jaya"
                    value={title}
                    onChange={handleChange('title')}
                    className={errors.title ? 'input-error' : ''}
                />
                {errors.title && <span className="error">{errors.title}</span>}
            </div>

            {/* DATALIST */}
            <datalist id="item-list">
                {itemsMaster.map(master => (
                    <option key={master._id} value={master.name} />
                ))}
            </datalist>

            {/* ITEMS */}
            <div className="items-section">
                <div className="items-header">
                    <span>Detail Barang</span>
                    <span className="item-count">{items.length} item</span>
                </div>

                <div className="item-labels">
                    <span>Nama Barang</span>
                    <span>Jumlah</span>
                    <span>Harga Satuan</span>
                    <span>Subtotal</span>
                    <span />
                </div>

                {items.map((item, index) => (
                    <div className="item-group" key={index}>
                        <div className="item-field">
                            <input
                                list="item-list"
                                placeholder="Pilih / ketik barang"
                                value={item.product || ''}
                                onChange={handleItemChange(index, 'product')}
                                className={errors[`item_${index}_product`] ? 'input-error' : ''}
                            />
                            {errors[`item_${index}_product`] && (
                                <span className="error">{errors[`item_${index}_product`]}</span>
                            )}
                            {/* Tampilkan sisa stok sebagai hint */}
                            {item.item && (() => {
                                const master = itemsMaster.find(m => m._id === item.item);
                                return master
                                    ? <span className="stock-hint">Stok tersedia: {master.stock}</span>
                                    : null;
                            })()}
                        </div>

                        <div className="item-field">
                            <input
                                type="number"
                                placeholder="0"
                                min="1"
                                value={item.quantity}
                                onChange={handleItemChange(index, 'quantity')}
                                className={errors[`item_${index}_quantity`] ? 'input-error' : ''}
                            />
                            {errors[`item_${index}_quantity`] && (
                                <span className="error">{errors[`item_${index}_quantity`]}</span>
                            )}
                        </div>

                        <div className="item-field">
                            <input
                                type="text"
                                value={item.price ? formatRupiah(item.price) : ''}
                                placeholder="Otomatis"
                                readOnly
                                className="readonly"
                            />
                        </div>

                        <div className="item-field">
                            <input
                                type="text"
                                value={getSubtotal(item) > 0 ? formatRupiah(getSubtotal(item)) : ''}
                                placeholder="—"
                                readOnly
                                className="readonly subtotal-field"
                            />
                        </div>

                        <div className="item-field remove-col">
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => removeItem(index)}
                                    title="Hapus baris"
                                >×</button>
                            )}
                        </div>
                    </div>
                ))}

                {grandTotal > 0 && (
                    <div className="grand-total-row">
                        <span>Total Transaksi</span>
                        <span className="grand-total-value">{formatRupiah(grandTotal)}</span>
                    </div>
                )}

                <button type="button" className="add-item-btn" onClick={addItem}>
                    + Tambah Barang
                </button>
            </div>

            {/* KETERANGAN */}
            <div className="input-control">
                <label>Keterangan <span className="optional">(opsional)</span></label>
                <textarea
                    placeholder="Catatan tambahan..."
                    value={description}
                    onChange={handleChange('description')}
                    rows={3}
                />
            </div>

            {/* SUBMIT */}
            <div className="submit-btn">
                <Button
                    name={submitting ? "Menyimpan..." : "Simpan Transaksi"}
                    icon={plus}
                    bPad=".8rem 1.6rem"
                    bRad="30px"
                    bg="var(--color-accent)"
                    color="#fff"
                    disabled={submitting}
                />
            </div>
        </FormStyled>
    );
}

const FormStyled = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;

    .toast {
        padding: .75rem 1rem;
        border-radius: 10px;
        font-size: .875rem;
        font-weight: 600;
        text-align: center;
        animation: fadeIn .3s ease;
        &.error-toast {
            background: #fff0f0;
            color: #c0392b;
            border: 1.5px solid #fcd5d5;
        }
        &.success {
            background: #e6f9f0;
            color: #1a7a4a;
            border: 1.5px solid #b2e8ce;
        }
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .input-control {
        display: flex;
        flex-direction: column;
        gap: .3rem;
        label {
            font-size: .78rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 0.6);
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

    input, textarea, .react-datepicker-wrapper input {
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
        &:focus  { border-color: var(--color-accent); }
        &.input-error { border-color: #e74c3c; }
        &.readonly {
            background: #f7f3fc;
            color: rgba(34, 34, 96, 0.55);
            cursor: default;
        }
        &.subtotal-field {
            font-weight: 700;
            color: var(--color-green);
        }
    }
    textarea { resize: none; }

    .error {
        font-size: .72rem;
        color: #e74c3c;
    }

    .stock-hint {
        font-size: .7rem;
        color: rgba(34, 34, 96, 0.4);
        padding-left: .2rem;
    }

    .items-section {
        display: flex;
        flex-direction: column;
        gap: .6rem;
        background: #faf7ff;
        border: 2px solid #ede8f5;
        border-radius: 14px;
        padding: 1rem;
    }

    .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        span {
            font-size: .78rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.65);
            text-transform: uppercase;
            letter-spacing: .05em;
        }
        .item-count {
            background: var(--color-accent);
            color: #fff;
            padding: .15rem .6rem;
            border-radius: 20px;
            font-size: .7rem;
        }
    }

    .item-labels {
        display: grid;
        grid-template-columns: 2fr 1fr 1.2fr 1.2fr 28px;
        gap: .5rem;
        padding: 0 .2rem;
        span {
            font-size: .68rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 0.4);
            text-transform: uppercase;
            letter-spacing: .04em;
        }
    }

    .item-group {
        display: grid;
        grid-template-columns: 2fr 1fr 1.2fr 1.2fr 28px;
        gap: .5rem;
        align-items: start;
    }

    .item-field {
        display: flex;
        flex-direction: column;
        gap: .2rem;
    }

    .remove-col {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: .4rem;
    }

    .remove-btn {
        background: #ffe0e0;
        border: none;
        color: #e74c3c;
        font-size: 1.1rem;
        font-weight: 700;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .2s;
        flex-shrink: 0;
        &:hover { background: #e74c3c; color: #fff; }
    }

    .grand-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1.5px dashed #d8cff0;
        padding-top: .75rem;
        margin-top: .25rem;
        span {
            font-size: .8rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 0.55);
            text-transform: uppercase;
            letter-spacing: .04em;
        }
        .grand-total-value {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--color-green);
        }
    }

    .add-item-btn {
        background: none;
        border: 1.5px dashed #c0b4e0;
        border-radius: 8px;
        padding: .5rem;
        cursor: pointer;
        color: rgba(34, 34, 96, 0.55);
        font-size: .85rem;
        font-weight: 600;
        transition: background .2s, border-color .2s, color .2s;
        &:hover {
            background: #ede8f5;
            border-color: var(--color-accent);
            color: var(--color-accent);
        }
    }

    .submit-btn {
        button:hover  { background: var(--color-green) !important; }
        button:disabled { opacity: .6; cursor: not-allowed; }
    }
`;

export default Form;