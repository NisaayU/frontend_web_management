import { dashboard, expenses, transactions, trend, add } from "./Icons"

export const menuItems = [
    {
        id: 1,
        title: 'Beranda',
        icon: dashboard,
        path: '/dashboard'
    }, 
    {
        id: 2,
        title: "Lihat Semua Data",
        icon: transactions,
        path: "/view-data"
    },
    {
        id: 3,
        title: "Penjualan",
        icon: trend,
        path: "/income"
    },
    {
        id: 4,
        title: "Pengeluaran",
        icon: expenses,
        path: "/expenses"
    }, 
    {
        id: 5,
        title: "Kelola Barang",
        icon: add,
        path: "/input-item"
    },
    {
        id: 6,
        title: "Kelola Pengguna",
        icon: <i className="fa-solid fa-users"></i>,
        path: "/manage-users"
    }
]