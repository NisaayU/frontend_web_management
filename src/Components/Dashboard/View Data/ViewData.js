import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useGlobalContext } from '../../../context/globalContext';
import { dateFormat } from '../../../utils/dateFormat';

const BASE_URL = 'http://localhost:3000/api/v1/';

function ViewData() {
    const { transactionHistory, updateIncome, deleteIncome, deleteExpense, updateExpense, items: itemMaster, getItems } = useGlobalContext();

    const [...history] = transactionHistory();
    useEffect(() => { getItems(); }, []);
    const incomeData  = history.filter(item => item.type === 'income');
    const expenseData = history.filter(item => item.type === 'expense');

    const formatRupiah = (num) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

    const toLocalDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };

    // ── GLOBAL TOAST ──
    const [globalToast, setGlobalToast] = useState({ type: '', text: '' });
    const showGlobalToast = (type, text) => {
        setGlobalToast({ type, text });
        setTimeout(() => setGlobalToast({ type: '', text: '' }), 3500);
    };

    // ── CONFIRM DELETE ──
    const [confirmDelete, setConfirmDelete] = useState(null);
    const handleDeleteClick = (id, type, label) => setConfirmDelete({ id, type, label });
    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        try {
            if (confirmDelete.type === 'income') await deleteIncome(confirmDelete.id);
            else await deleteExpense(confirmDelete.id);
            showGlobalToast('success', '🗑️ Data berhasil dihapus!');
        } catch {
            showGlobalToast('error', '❌ Gagal menghapus data.');
        }
        setConfirmDelete(null);
    };

    // ── EDIT INCOME ──
    const [editingIncome, setEditingIncome] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', date: '', items: [] });
    const [incomeError, setIncomeError] = useState('');
    const [incomeSuccess, setIncomeSuccess] = useState('');

    const handleEditIncome = (income) => {
        setIncomeError(''); setIncomeSuccess('');
        setEditingIncome(income);
        setEditForm({
            title: income.title || '',
            date:  income.date ? income.date.slice(0, 10) : '',
            items: (income.items || []).map(i => {
                const master = itemMaster.find(m => m.name === (i.name || i.product));
                return {
                    itemId:   master?._id || i.item || '',
                    name:     i.name || i.product || '',
                    quantity: i.quantity || 1,
                    price:    i.price ?? master?.price ?? 0,
                    subtotal: (i.quantity || 1) * (i.price ?? 0),
                };
            })
        });
    };

    const handleIncomeChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...editForm.items];
        if (field === 'name') {
            const master = itemMaster.find(m => m.name === value);
            updatedItems[index].name   = value;
            updatedItems[index].itemId = master?._id || '';
            updatedItems[index].price  = master?.price ?? updatedItems[index].price;
        } else {
            updatedItems[index][field] = Number(value);
        }
        updatedItems[index].subtotal = updatedItems[index].quantity * updatedItems[index].price;
        setEditForm({ ...editForm, items: updatedItems });
    };

    const addItemRow    = () => setEditForm({ ...editForm, items: [...editForm.items, { itemId: '', name: '', quantity: 1, price: 0, subtotal: 0 }] });
    const removeItemRow = index => setEditForm({ ...editForm, items: editForm.items.filter((_, i) => i !== index) });
    const editTotal     = editForm.items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

    const handleUpdateIncome = async () => {
        if (!editingIncome) return;
        setIncomeError('');
        const result = await updateIncome(editingIncome._id, {
            title: editForm.title,
            date:  new Date(editForm.date).toISOString(),
            type:  'income',
            total: editTotal,
            items: editForm.items.map(i => ({
                item:     i.itemId,
                quantity: Number(i.quantity),
            }))
        });
        if (result?.success === false) { setIncomeError(result.message); return; }
        setIncomeSuccess('✅ Transaksi berhasil diupdate!');
        setTimeout(() => {
            setIncomeSuccess('');
            setEditingIncome(null);
            showGlobalToast('success', '✅ Transaksi penjualan berhasil diupdate!');
        }, 1200);
    };

    // ── EDIT EXPENSE ──
    const [editingExpense, setEditingExpense] = useState(null);
    const [editExpenseForm, setEditExpenseForm] = useState({ title: '', amount: '', date: '', category: '', description: '' });
    const [expenseError, setExpenseError] = useState('');
    const [expenseSuccess, setExpenseSuccess] = useState('');

    const handleEditExpense = (expense) => {
        setExpenseError(''); setExpenseSuccess('');
        setEditingExpense(expense);
        setEditExpenseForm({
            title:       expense.title || '',
            amount:      expense.amount || expense.total || '',
            date:        expense.date ? expense.date.slice(0, 10) : '',
            category:    expense.category || '',
            description: expense.description || '',
        });
    };

    const handleExpenseChange = e => setEditExpenseForm({ ...editExpenseForm, [e.target.name]: e.target.value });

    const handleUpdateExpense = async () => {
        if (!editingExpense) return;
        setExpenseError('');
        if (!editExpenseForm.title.trim())                                  { setExpenseError('Nama pengeluaran wajib diisi.'); return; }
        if (!editExpenseForm.amount || Number(editExpenseForm.amount) <= 0) { setExpenseError('Jumlah harus lebih dari 0.'); return; }
        if (!editExpenseForm.date)                                          { setExpenseError('Tanggal wajib diisi.'); return; }
        const result = await updateExpense(editingExpense._id, {
            ...editExpenseForm,
            amount: Number(editExpenseForm.amount),
            date:   new Date(editExpenseForm.date).toISOString(),
            type:   'expense',
        });
        if (result?.success === false) {
            setExpenseError(result.message || 'Gagal menyimpan perubahan.');
            showGlobalToast('error', `❌ ${result.message || 'Gagal menyimpan perubahan.'}`);
            return;
        }
        setExpenseSuccess('✅ Pengeluaran berhasil diupdate!');
        setTimeout(() => {
            setExpenseSuccess('');
            setEditingExpense(null);
            showGlobalToast('success', '✅ Pengeluaran berhasil diupdate!');
        }, 1200);
    };

    // ── FILTER ──
    const [buyer,   setBuyer]   = useState('');
    const [date,    setDate]    = useState('');
    const [product, setProduct] = useState('');

    const filteredIncome = incomeData.filter(item => {
        const matchBuyer   = !buyer   || item.title?.toLowerCase().includes(buyer.toLowerCase());
        const matchDate    = !date    || toLocalDate(item.date) === date;
        const matchProduct = !product || item.items?.some(i => (i.name || i.product || '').toLowerCase().includes(product.toLowerCase()));
        return matchBuyer && matchDate && matchProduct;
    });

    const filteredExpense = expenseData.filter(item =>
        !date || toLocalDate(item.date || item.createdAt) === date
    );

    const clearFilters = () => { setBuyer(''); setDate(''); setProduct(''); };

    // ── EXPORT ──
    const [exporting, setExporting]   = useState(false);
    const [exportError, setExportError] = useState('');

    const exportExcel = async () => {
        setExporting(true); setExportError('');
        try {
            const res = await axios.get(`${BASE_URL}export`, {
                params: { buyer, date, product },
                responseType: 'arraybuffer',
            });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.setAttribute('download', `laporan-income-${date || 'semua'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setExportError('Gagal export. Pastikan backend berjalan.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <ViewDataStyled>
            <div className="page-heading">
                <h2>Data Transaksi</h2>
                <p className="subtitle">Kelola dan pantau semua transaksi penjualan & pengeluaran</p>
            </div>

            {globalToast.text && <GlobalToast className={globalToast.type}>{globalToast.text}</GlobalToast>}

            {/* ── FILTER BAR ── */}
            <FilterBar>
                <div className="filter-inputs">
                    <div className="filter-field">
                        <label>Pembeli / Toko</label>
                        <input type="text" placeholder="Cari nama pembeli..." value={buyer} onChange={e => setBuyer(e.target.value)} />
                    </div>
                    <div className="filter-field">
                        <label>Tanggal</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="filter-field">
                        <label>Nama Barang</label>
                        <input type="text" placeholder="Cari nama barang..." value={product} onChange={e => setProduct(e.target.value)} />
                    </div>
                </div>
                <div className="filter-actions">
                    {(buyer || date || product) && (
                        <button className="clear-btn" onClick={clearFilters}>✕ Reset Filter</button>
                    )}
                    <button className="export-btn" onClick={exportExcel} disabled={exporting}>
                        {exporting ? '⏳ Mengexport...' : '⬇ Export Excel'}
                    </button>
                </div>
                {exportError && <p className="export-error">{exportError}</p>}
            </FilterBar>

            {/* ── SIDE-BY-SIDE TABLES ── */}
            <TablesRow>

                {/* INCOME */}
                <TableCard>
                    <div className="card-header income-header">
                        <div className="header-left"><span className="dot green" /><h3>Data Penjualan</h3></div>
                        <span className="record-count">{filteredIncome.length} transaksi</span>
                    </div>
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th><th>Pembeli</th><th>Barang</th>
                                    <th className="right">Total</th><th className="center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncome.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-row">
                                        <div className="empty-state"><span>📭</span><p>Belum ada data</p></div>
                                    </td></tr>
                                ) : filteredIncome.map(income => {
                                    const { _id, date, title, items, total } = income;
                                    return (
                                        <tr key={_id}>
                                            <td><span className="date-badge">{dateFormat(date)}</span></td>
                                            <td><strong>{title || '—'}</strong></td>
                                            <td>
                                                {Array.isArray(items) && items.length > 0 ? (
                                                    <div className="items-list">
                                                        {items.map((item, idx) => (
                                                            <div className="item-chip" key={idx}>
                                                                <span className="item-name">{item.name || item.product || '(Barang)'}</span>
                                                                <span className="item-meta">{item.quantity}× {formatRupiah(item.price ?? 0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="right"><span className="amount income">+{formatRupiah(total)}</span></td>
                                            <td className="center">
                                                <div className="action-group">
                                                    <button className="btn-edit"   onClick={() => handleEditIncome(income)}>✏️</button>
                                                    <button className="btn-delete" onClick={() => handleDeleteClick(_id, 'income', title || 'transaksi ini')}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </TableCard>

                {/* EXPENSE */}
                <TableCard>
                    <div className="card-header expense-header">
                        <div className="header-left"><span className="dot red" /><h3>Data Pengeluaran</h3></div>
                        <span className="record-count">{filteredExpense.length} transaksi</span>
                    </div>
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tanggal</th><th>Nama</th><th>Kategori</th>
                                    <th className="right">Jumlah</th><th className="center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpense.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-row">
                                        <div className="empty-state"><span>📭</span><p>Belum ada data</p></div>
                                    </td></tr>
                                ) : filteredExpense.map(expense => {
                                    const { _id, date, title, amount, total, category, description } = expense;
                                    return (
                                        <tr key={_id}>
                                            <td><span className="date-badge">{dateFormat(date)}</span></td>
                                            <td>
                                                <strong>{title || '—'}</strong>
                                                {description && <div className="row-desc">{description}</div>}
                                            </td>
                                            <td>
                                                <span className="category-badge">
                                                    {{ groceries: 'Pengantaran', tv: 'Belanja Stok', other: 'Lainnya' }[category] || category || '—'}
                                                </span>
                                            </td>
                                            <td className="right"><span className="amount expense">-{formatRupiah(amount || total)}</span></td>
                                            <td className="center">
                                                <div className="action-group">
                                                    <button className="btn-edit"   onClick={() => handleEditExpense({ _id, date, title, amount: amount || total, category, description })}>✏️</button>
                                                    <button className="btn-delete" onClick={() => handleDeleteClick(_id, 'expense', title || 'pengeluaran ini')}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </TableCard>

            </TablesRow>

            {/* ── MODAL HAPUS ── */}
            {confirmDelete && (
                <ModalOverlay onClick={() => setConfirmDelete(null)}>
                    <ConfirmBox onClick={e => e.stopPropagation()}>
                        <div className="confirm-icon">🗑️</div>
                        <h3>Hapus Data?</h3>
                        <p>
                            Data <strong>"{confirmDelete.label}"</strong> akan dihapus permanen.
                            {confirmDelete.type === 'income' && (
                                <span className="confirm-note"> Stok barang akan dikembalikan otomatis.</span>
                            )}
                        </p>
                        <div className="confirm-actions">
                            <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Batal</button>
                            <button className="btn-delete-confirm" onClick={handleConfirmDelete}>Ya, Hapus</button>
                        </div>
                    </ConfirmBox>
                </ModalOverlay>
            )}

            {/* ── MODAL EDIT INCOME ── */}
            {editingIncome && (
                <ModalOverlay onClick={e => { if (e.target === e.currentTarget) setEditingIncome(null); }}>
                    <ModalBox>
                        <div className="modal-header">
                            <h3>✏️ Edit Transaksi Penjualan</h3>
                            <button className="modal-close" onClick={() => setEditingIncome(null)}>✕</button>
                        </div>
                        {incomeError   && <div className="modal-toast error">{incomeError}</div>}
                        {incomeSuccess && <div className="modal-toast success">{incomeSuccess}</div>}
                        <div className="modal-fields">
                            <div className="modal-field">
                                <label>Nama Pembeli / Toko</label>
                                <input type="text" name="title" value={editForm.title} onChange={handleIncomeChange} placeholder="Nama pembeli" />
                            </div>
                            <div className="modal-field">
                                <label>Tanggal</label>
                                <input type="date" name="date" value={editForm.date} onChange={handleIncomeChange} />
                            </div>
                        </div>
                        <div className="modal-items-section">
                            <div className="items-section-header">
                                <h4>Detail Barang</h4>
                                <button className="add-row-btn" onClick={addItemRow}>+ Tambah Baris</button>
                            </div>
                            <div className="items-labels">
                                <span>Nama Barang</span><span>Qty</span><span>Harga</span><span>Subtotal</span><span />
                            </div>
                            <div className="items-scroll">
                                {editForm.items.map((item, index) => (
                                    <div className="item-row" key={index}>
                                        <select value={item.name || ''} onChange={e => handleItemChange(index, 'name', e.target.value)}>
                                            <option value="">Pilih barang...</option>
                                            {itemMaster.map(m => (
                                                <option key={m._id} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                        <input type="number" value={item.quantity} min="1" onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                        <input type="number" value={item.price} readOnly style={{ background: '#f7f3fc', color: 'rgba(34,34,96,0.55)' }} />
                                        <div className="subtotal-display">{formatRupiah(item.quantity * item.price)}</div>
                                        <button className="remove-row-btn" onClick={() => removeItemRow(index)}>×</button>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-total">
                                <span>Total</span>
                                <span className="total-value">{formatRupiah(editTotal)}</span>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setEditingIncome(null)}>Batal</button>
                            <button className="btn-save" onClick={handleUpdateIncome}>Simpan Perubahan</button>
                        </div>
                    </ModalBox>
                </ModalOverlay>
            )}

            {/* ── MODAL EDIT EXPENSE ── */}
            {editingExpense && (
                <ModalOverlay onClick={e => { if (e.target === e.currentTarget) setEditingExpense(null); }}>
                    <ModalBox className="narrow">
                        <div className="modal-header">
                            <h3>✏️ Edit Pengeluaran</h3>
                            <button className="modal-close" onClick={() => setEditingExpense(null)}>✕</button>
                        </div>
                        {expenseError   && <div className="modal-toast error">{expenseError}</div>}
                        {expenseSuccess && <div className="modal-toast success">{expenseSuccess}</div>}
                        <div className="modal-fields expense-grid">
                            <div className="modal-field col-full">
                                <label>Nama Pengeluaran</label>
                                <input type="text" name="title" value={editExpenseForm.title} onChange={handleExpenseChange} placeholder="Contoh: Belanja Stok Gula" />
                            </div>
                            <div className="modal-field">
                                <label>Jumlah</label>
                                <div className="prefix-wrap">
                                    <span className="prefix">Rp</span>
                                    <input type="number" name="amount" value={editExpenseForm.amount} onChange={handleExpenseChange} placeholder="0" min="1" />
                                </div>
                            </div>
                            <div className="modal-field">
                                <label>Tanggal</label>
                                <input type="date" name="date" value={editExpenseForm.date} onChange={handleExpenseChange} />
                            </div>
                            <div className="modal-field col-full">
                                <label>Kategori</label>
                                <select name="category" value={editExpenseForm.category} onChange={handleExpenseChange}>
                                    <option value="" disabled>Pilih kategori</option>
                                    <option value="groceries">Pengantaran Barang</option>
                                    <option value="tv">Belanja Stok</option>
                                    <option value="other">Lainnya</option>
                                </select>
                            </div>
                            <div className="modal-field col-full">
                                <label>Keterangan <span className="optional">(opsional)</span></label>
                                <textarea name="description" value={editExpenseForm.description} onChange={handleExpenseChange} placeholder="Catatan tambahan..." rows={3} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setEditingExpense(null)}>Batal</button>
                            <button className="btn-save" onClick={handleUpdateExpense}>Simpan Perubahan</button>
                        </div>
                    </ModalBox>
                </ModalOverlay>
            )}
        </ViewDataStyled>
    );
}

/* ────────────────── STYLES ────────────────── */

const ViewDataStyled = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    .page-heading {
        h2 { font-size: 1.8rem; font-weight: 800; color: rgba(34,34,96,1); margin-bottom: .25rem; }
        .subtitle { font-size: .85rem; color: rgba(34,34,96,0.45); }
    }
`;

const GlobalToast = styled.div`
    position: fixed; top: 1.25rem; left: 50%; transform: translateX(-50%);
    z-index: 2000; padding: .75rem 1.5rem; border-radius: 30px; font-size: .9rem; font-weight: 700;
    white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: toastIn .3s ease, toastOut .4s ease 3.1s forwards; pointer-events: none;
    &.success { background:#e6f9f0; color:#1a7a4a; border:1.5px solid #b2e8ce; }
    &.error   { background:#fff0f0; color:#c0392b; border:1.5px solid #fcd5d5; }
    @keyframes toastIn  { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes toastOut { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(-12px)} }
`;

const FilterBar = styled.div`
    background: #FCF6F9; border-radius: 16px; padding: 1.25rem 1.5rem;
    box-shadow: 0px 1px 15px rgba(0,0,0,.06);
    display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap;
    .filter-inputs { display:flex; gap:1rem; flex-wrap:wrap; flex:1; }
    .filter-field {
        display:flex; flex-direction:column; gap:.3rem; flex:1; min-width:150px;
        label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:rgba(34,34,96,0.5); }
        input { font-family:inherit; font-size:.88rem; padding:.55rem 1rem; border:2px solid #ede8f5; border-radius:10px; background:#fff; color:rgba(34,34,96,1); outline:none; transition:border-color .2s; &:focus{border-color:var(--color-accent);} }
    }
    .filter-actions { display:flex; gap:.75rem; align-items:flex-end; flex-shrink:0; }
    .clear-btn  { background:none; border:1.5px solid #d0c0e0; color:rgba(34,34,96,0.55); padding:.55rem 1rem; border-radius:10px; font-size:.82rem; font-weight:600; cursor:pointer; transition:all .2s; white-space:nowrap; &:hover{border-color:#e74c3c;color:#e74c3c;} }
    .export-btn { background:var(--color-green); color:#fff; border:none; padding:.6rem 1.25rem; border-radius:10px; font-size:.85rem; font-weight:700; cursor:pointer; transition:opacity .2s,transform .15s; white-space:nowrap; &:hover:not(:disabled){opacity:.88;transform:translateY(-1px);} &:disabled{opacity:.6;cursor:not-allowed;} }
    .export-error { width:100%; font-size:.78rem; color:#c0392b; background:#fff0f0; border:1.5px solid #fcd5d5; border-radius:8px; padding:.4rem .8rem; margin-top:.25rem; }
`;

/* ── Side-by-side wrapper ── */
const TablesRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    align-items: start;

    @media (max-width: 1100px) {
        grid-template-columns: 1fr;
    }
`;

const TableCard = styled.div`
    background: #fff; border-radius: 20px; box-shadow: 0px 1px 15px rgba(0,0,0,.07);
    overflow: hidden; display: flex; flex-direction: column;
    /* tinggi maksimal dengan scroll internal */
    max-height: 560px;

    .card-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1.5px solid #f0e8f5; flex-shrink:0; &.income-header{border-left:4px solid var(--color-green);} &.expense-header{border-left:4px solid #e74c3c;} }
    .header-left { display:flex; align-items:center; gap:.5rem; h3{font-size:.95rem;font-weight:700;color:rgba(34,34,96,1);} }
    .dot { width:9px; height:9px; border-radius:50%; &.green{background:var(--color-green);} &.red{background:#e74c3c;} }
    .record-count { font-size:.72rem; font-weight:600; background:#f0e8f5; color:rgba(34,34,96,0.6); padding:.18rem .65rem; border-radius:20px; }

    .table-scroll { overflow-y:auto; overflow-x:auto; flex:1; -webkit-overflow-scrolling:touch; &::-webkit-scrollbar{width:4px;height:4px;} &::-webkit-scrollbar-thumb{background:#d8cff0;border-radius:4px;} }

    table { width:100%; border-collapse:collapse; min-width:400px; }
    thead tr { background:#faf7ff; position:sticky; top:0; z-index:1; }
    th { padding:.65rem .85rem; font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:rgba(34,34,96,0.45); text-align:left; white-space:nowrap; &.right{text-align:right;} &.center{text-align:center;} }
    tbody tr { border-bottom:1px solid #f5f0fc; transition:background .15s; &:hover{background:#fdf8ff;} &:last-child{border-bottom:none;} }
    td { padding:.7rem .85rem; font-size:.82rem; color:rgba(34,34,96,.85); vertical-align:top; &.right{text-align:right;} &.center{text-align:center;vertical-align:middle;} }

    .date-badge     { background:#f0e8f5; color:rgba(34,34,96,0.7); font-size:.7rem; font-weight:600; padding:.2rem .55rem; border-radius:20px; white-space:nowrap; }
    .category-badge { background:#fff8e0; color:#b8860b; font-size:.68rem; font-weight:600; padding:.18rem .55rem; border-radius:20px; white-space:nowrap; }
    .row-desc  { font-size:.68rem; color:rgba(34,34,96,0.4); font-style:italic; margin-top:.15rem; }
    .items-list{ display:flex; flex-direction:column; gap:.25rem; }
    .item-chip { display:flex; flex-direction:column; gap:.02rem; }
    .item-name { font-weight:600; font-size:.78rem; color:rgba(34,34,96,1); }
    .item-meta { font-size:.68rem; color:rgba(34,34,96,0.45); }
    .amount { font-weight:800; font-size:.85rem; white-space:nowrap; &.income{color:var(--color-green);} &.expense{color:#e74c3c;} }
    .action-group { display:flex; gap:.3rem; justify-content:center; align-items:center; }
    .btn-edit   { background:#EBF3FF; color:#0D6EFD; border:1.5px solid #c0d8ff; border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:.85rem; cursor:pointer; transition:background .2s; &:hover{background:#d0e8ff;} }
    .btn-delete { background:#fff0f0; border:1.5px solid #fcd5d5; border-radius:8px; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:.85rem; cursor:pointer; transition:background .2s; &:hover{background:#ffe0e0;border-color:#e74c3c;} }
    .empty-row td { padding:2rem; }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:.4rem; span{font-size:1.6rem;} p{color:rgba(34,34,96,0.35);font-size:.82rem;} }
`;

const ModalOverlay = styled.div`
    position:fixed; inset:0; background:rgba(20,10,40,0.45); backdrop-filter:blur(3px);
    display:flex; justify-content:center; align-items:center; z-index:1000; padding:1rem;
    animation:overlayIn .2s ease;
    @keyframes overlayIn{from{opacity:0}to{opacity:1}}
`;

const ConfirmBox = styled.div`
    background:#fff; border-radius:20px; padding:2rem 1.75rem; width:100%; max-width:380px;
    display:flex; flex-direction:column; align-items:center; gap:.85rem;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:modalIn .25s ease; text-align:center;
    @keyframes modalIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    .confirm-icon{font-size:2.5rem;}
    h3{font-size:1.15rem;font-weight:800;color:rgba(34,34,96,1);margin:0;}
    p{font-size:.85rem;color:rgba(34,34,96,0.55);line-height:1.6;margin:0;
      strong{color:rgba(34,34,96,0.85);font-weight:700;}
      .confirm-note{display:block;margin-top:.4rem;font-size:.78rem;color:#b8860b;background:#fff8e0;border-radius:8px;padding:.3rem .6rem;}
    }
    .confirm-actions{display:flex;gap:.75rem;margin-top:.5rem;width:100%;
      .btn-cancel{flex:1;background:none;border:1.5px solid #d0c0e0;color:rgba(34,34,96,0.55);padding:.7rem;border-radius:12px;font-size:.88rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;&:hover{border-color:var(--color-accent);color:var(--color-accent);}}
      .btn-delete-confirm{flex:1;background:#e74c3c;color:#fff;border:none;padding:.7rem;border-radius:12px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background .2s,transform .15s;box-shadow:0 4px 12px rgba(231,76,60,0.3);&:hover{background:#c0392b;transform:translateY(-1px);}}
    }
`;

const ModalBox = styled.div`
    background:#fff; border-radius:20px; width:100%; max-width:700px; max-height:90vh;
    overflow-y:auto; display:flex; flex-direction:column; gap:1.25rem; padding:1.75rem;
    box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:modalIn .25s ease;
    &.narrow{max-width:520px;}
    @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    &::-webkit-scrollbar{width:4px;} &::-webkit-scrollbar-thumb{background:#d8cff0;border-radius:4px;}
    .modal-header{display:flex;justify-content:space-between;align-items:center;h3{font-size:1.15rem;font-weight:800;color:rgba(34,34,96,1);}.modal-close{background:#f0e8f5;border:none;width:32px;height:32px;border-radius:50%;font-size:.9rem;color:rgba(34,34,96,0.6);cursor:pointer;transition:background .2s;&:hover{background:#e0d0f0;}}}
    .modal-toast{padding:.65rem 1rem;border-radius:10px;font-size:.85rem;font-weight:600;text-align:center;animation:fadeIn .3s ease;&.success{background:#e6f9f0;color:#1a7a4a;border:1.5px solid #b2e8ce;}&.error{background:#fff0f0;color:#c0392b;border:1.5px solid #fcd5d5;}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
    .modal-fields{display:grid;grid-template-columns:1fr 1fr;gap:1rem;@media(max-width:500px){grid-template-columns:1fr;}}
    .expense-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;@media(max-width:480px){grid-template-columns:1fr;}.col-full{grid-column:1/-1;}}
    .modal-field{display:flex;flex-direction:column;gap:.3rem;label{font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(34,34,96,0.5);}.optional{font-weight:400;text-transform:none;letter-spacing:0;color:rgba(34,34,96,0.35);}}
    input,select,textarea{font-family:inherit;font-size:.9rem;padding:.6rem 1rem;border:2px solid #ede8f5;border-radius:10px;outline:none;color:rgba(34,34,96,1);background:#fff;width:100%;box-sizing:border-box;transition:border-color .2s;&:focus{border-color:var(--color-accent);}}
    textarea{resize:none;min-height:75px;}
    select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23222260' opacity='0.4' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 1rem center;padding-right:2.5rem;}
    .prefix-wrap{display:flex;align-items:center;background:#fff;border:2px solid #ede8f5;border-radius:10px;overflow:hidden;transition:border-color .2s;&:focus-within{border-color:var(--color-accent);}.prefix{padding:0 .75rem;font-size:.82rem;font-weight:700;color:rgba(34,34,96,0.4);border-right:1.5px solid #ede8f5;background:#f7f3fc;white-space:nowrap;align-self:stretch;display:flex;align-items:center;}input{border:none !important;border-radius:0 !important;flex:1;}}
    .modal-items-section{background:#faf7ff;border:2px solid #ede8f5;border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.75rem;}
    .items-section-header{display:flex;justify-content:space-between;align-items:center;h4{font-size:.82rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(34,34,96,0.55);}.add-row-btn{background:none;border:1.5px dashed #c0b4e0;border-radius:8px;padding:.25rem .75rem;font-size:.78rem;font-weight:600;color:rgba(34,34,96,0.5);cursor:pointer;transition:all .2s;&:hover{background:#ede8f5;border-color:var(--color-accent);color:var(--color-accent);}}}
    .items-labels{display:grid;grid-template-columns:2fr .8fr 1fr 1fr 28px;gap:.5rem;padding:0 .2rem;span{font-size:.67rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:rgba(34,34,96,0.4);}}
    .items-scroll{display:flex;flex-direction:column;gap:.5rem;max-height:240px;overflow-y:auto;padding-right:.25rem;&::-webkit-scrollbar{width:3px;}&::-webkit-scrollbar-thumb{background:#d8cff0;border-radius:3px;}}
    .item-row{display:grid;grid-template-columns:2fr .8fr 1fr 1fr 28px;gap:.5rem;align-items:center;
      input,select{font-family:inherit;font-size:.82rem;padding:.45rem .7rem;border:2px solid #ede8f5;border-radius:8px;outline:none;background:#fff;color:rgba(34,34,96,1);width:100%;box-sizing:border-box;&:focus{border-color:var(--color-accent);}}
      .subtotal-display{font-size:.78rem;font-weight:700;color:var(--color-green);text-align:right;}
    }
    .remove-row-btn{background:#ffe0e0;border:none;color:#e74c3c;font-weight:700;font-size:1rem;width:26px;height:26px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s;&:hover{background:#e74c3c;color:#fff;}}
    .modal-total{display:flex;justify-content:space-between;align-items:center;border-top:1.5px dashed #d8cff0;padding-top:.75rem;margin-top:.25rem;span{font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:rgba(34,34,96,0.5);}.total-value{font-size:1.1rem;font-weight:800;color:var(--color-green);}}
    .modal-actions{display:flex;justify-content:flex-end;gap:.75rem;
      .btn-cancel{background:none;border:1.5px solid #d0c0e0;color:rgba(34,34,96,0.55);padding:.65rem 1.4rem;border-radius:30px;font-size:.88rem;font-weight:600;cursor:pointer;transition:all .2s;&:hover{border-color:#e74c3c;color:#e74c3c;}}
      .btn-save{background:var(--color-accent);color:#fff;border:none;padding:.65rem 1.6rem;border-radius:30px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;&:hover{background:var(--color-green);transform:translateY(-1px);}}
    }
`;

export default ViewData;