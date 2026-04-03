import React, { useContext, useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:3000/api/v1/";

axios.defaults.headers.common["Content-Type"] = "application/json";

const GlobalContext = React.createContext();

export const GlobalProvider = ({ children }) => {
    const [incomes, setIncomes]   = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [profile, setProfile]   = useState(null);
    const [error, setError]       = useState(null);
    const [items, setItems]       = useState([]);

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const token = localStorage.getItem("token");
    if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    useEffect(() => {
        const t = localStorage.getItem("token");
        if (t) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [user]);

    const login = async (username, password) => {
        try {
            const res = await axios.post(`${BASE_URL}login`, { username, password });
            const userData = {
                _id:      res.data._id,
                username: res.data.username,
                role:     res.data.role,
            };
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(userData));
            axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
            setUser(userData);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Login gagal";
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        setIncomes([]);
        setExpenses([]);
        setProfile(null);
        setItems([]);
    };

    // ================= INCOME =================

    const addIncome = async (income) => {
        try {
            const payload = {
                ...income,
                date: income.date instanceof Date ? income.date.toISOString() : income.date,
            };
            const res = await axios.post(`${BASE_URL}add-income`, payload);
            await getIncomes();
            return { success: true, data: res.data };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal menambahkan transaksi";
            setError(message);
            return { success: false, message };
        }
    };

    const getIncomes = async () => {
        try {
            const res = await axios.get(`${BASE_URL}get-incomes`);
            setIncomes(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengambil data income");
        }
    };

    const updateIncome = async (id, incomeData) => {
        try {
            const payload = {
                ...incomeData,
                date: incomeData.date instanceof Date ? incomeData.date.toISOString() : incomeData.date,
            };
            const res = await axios.put(`${BASE_URL}update-income/${id}`, payload);
            await getIncomes();
            return { success: true, data: res.data };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal update income";
            setError(message);
            return { success: false, message };
        }
    };

    const deleteIncome = async (id) => {
        try {
            await axios.delete(`${BASE_URL}delete-income/${id}`);
            await getIncomes();
        } catch (err) {
            setError(err.response?.data?.message || "Gagal menghapus income");
        }
    };

    const totalIncome = () =>
        incomes.reduce((total, income) => total + (income.total || 0), 0);

    // ================= EXPENSE =================

    const addExpense = async (expense) => {
        try {
            const res = await axios.post(`${BASE_URL}add-expense`, expense);
            await getExpenses();
            return { success: true, data: res.data };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal menambahkan pengeluaran";
            setError(message);
            return { success: false, message };
        }
    };

    const getExpenses = async () => {
        try {
            const res = await axios.get(`${BASE_URL}get-expenses`);
            setExpenses(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengambil data expense");
        }
    };

    // ── FUNGSI BARU ──
    const updateExpense = async (id, expenseData) => {
        try {
            const payload = {
                ...expenseData,
                date: expenseData.date instanceof Date ? expenseData.date.toISOString() : expenseData.date,
            };
            const res = await axios.put(`${BASE_URL}update-expense/${id}`, payload);
            await getExpenses();
            return { success: true, data: res.data };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal update pengeluaran";
            setError(message);
            return { success: false, message };
        }
    };

    const deleteExpense = async (id) => {
        try {
            await axios.delete(`${BASE_URL}delete-expense/${id}`);
            await getExpenses();
        } catch (err) {
            setError(err.response?.data?.message || "Gagal menghapus expense");
        }
    };

    const totalExpenses = () =>
        expenses.reduce((total, e) => total + (e.total || e.amount || 0), 0);

    // ================= BALANCE =================

    const totalBalance = () => totalIncome() - totalExpenses();

    // ================= HISTORY =================

    const transactionHistory = () => {
        const history = [...incomes, ...expenses];
        history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return history;
    };

    // ================= PROFILE =================

    const getProfile = async () => {
        try {
            const res = await axios.get(`${BASE_URL}profile`);
            setProfile(res.data);
        } catch (err) {
            console.error("Get profile error", err);
        }
    };

    // ================= ITEM =================

    const addItem = async (itemData) => {
        try {
            await axios.post(`${BASE_URL}items`, itemData);
            await getItems();
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal menambahkan item";
            setError(message);
            return { success: false, message };
        }
    };

    const getItems = async () => {
        try {
            const res = await axios.get(`${BASE_URL}items`);
            setItems(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Gagal mengambil data item");
        }
    };

    const updateItem = async (id, itemData) => {
        try {
            const res = await axios.put(`${BASE_URL}item/${id}`, itemData); // ✅ singular
            await getItems();
            return { success: true, data: res.data };
        } catch (err) {
            const message = err.response?.data?.message || "Gagal update item";
            setError(message);
            return { success: false, message };
        }
    };
    
    const deleteItem = async (id) => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser?.role !== "owner") {
            return { success: false, message: "Hanya owner yang bisa menghapus item." };
        }
        try {
            await axios.delete(`${BASE_URL}item/${id}`); // ✅ singular
            await getItems();
            return { success: true };
        } catch (err) {
            setError(err.response?.data?.message || "Gagal menghapus item");
            return { success: false };
        }
    };

    // ================= EXPORT =================

    const exportIncomeExcel = async (filters) => {
        try {
            const res = await axios.get(`${BASE_URL}income/export`, {
                params: filters,
                responseType: "blob",
            });
            const url  = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href  = url;
            link.setAttribute("download", "laporan-income.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError("Gagal export data");
        }
    };

    // ================= CLEAR ERROR =================

    const clearError = () => setError(null);

    return (
        <GlobalContext.Provider
            value={{
                user,
                login,
                logout,

                addIncome,
                getIncomes,
                incomes,
                deleteIncome,
                updateIncome,
                totalIncome,

                addExpense,
                getExpenses,
                expenses,
                deleteExpense,
                updateExpense,      // ← tambahan baru
                totalExpenses,

                totalBalance,
                transactionHistory,

                getProfile,
                profile,

                error,
                clearError,

                items,
                addItem,
                getItems,
                updateItem,
                deleteItem,

                exportIncomeExcel,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => useContext(GlobalContext);