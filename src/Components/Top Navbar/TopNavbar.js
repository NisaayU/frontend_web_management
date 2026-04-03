import { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { useLocation, NavLink } from "react-router-dom";
import { useGlobalContext } from "../../context/globalContext";
import avatar from "../../img/avatar.png";

const PAGE_TITLES = {
    "/dashboard":    "Dashboard",
    "/income":       "Pemasukan",
    "/expenses":     "Pengeluaran",
    "/view-data":    "Lihat Transaksi",
    "/input-item":   "Master Item",
    "/profile":      "Profil",
    "/manage-users": "Kelola Pengguna",
};

function TopNavbar() {
    const { user, logout, incomes, expenses, items } = useGlobalContext();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [readCount, setReadCount] = useState(0); // jumlah notif yang sudah dibaca
    const bellRef    = useRef(null);
    const profileRef = useRef(null);

    const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";
    const today     = new Date().toDateString();

    const notifications = useMemo(() => {
        const notifs = [];

        items.forEach(item => {
            if (item.stock === 0) {
                notifs.push({ id: `out-${item._id}`, type: "danger", icon: "📦", title: "Stok Habis", body: `${item.name} sudah habis` });
            }
        });

        items.forEach(item => {
            if (item.stock > 0 && item.stock <= 5) {
                notifs.push({ id: `low-${item._id}`, type: "warning", icon: "⚠️", title: "Stok Menipis", body: `${item.name} tersisa ${item.stock} pcs` });
            }
        });

        const todayIncomes = incomes.filter(i => new Date(i.date).toDateString() === today);
        if (todayIncomes.length > 0) {
            const total = todayIncomes.reduce((s, i) => s + (i.total || 0), 0);
            notifs.push({ id: "income-today", type: "success", icon: "💰", title: "Pemasukan Hari Ini", body: `${todayIncomes.length} transaksi · ${formatRupiah(total)}` });
        }

        const todayExpenses = expenses.filter(e => new Date(e.date || e.createdAt).toDateString() === today);
        if (todayExpenses.length > 0) {
            const total = todayExpenses.reduce((s, e) => s + (e.amount || e.total || 0), 0);
            notifs.push({ id: "expense-today", type: "info", icon: "💸", title: "Pengeluaran Hari Ini", body: `${todayExpenses.length} transaksi · ${formatRupiah(total)}` });
        }

        return notifs;
    }, [items, incomes, expenses]);

    const totalCount = notifications.length;
    // Badge hanya muncul kalau ada notif baru yang belum dibaca
    const unreadCount = Math.max(0, totalCount - readCount);

    // Saat dropdown dibuka → tandai semua sudah dibaca
    const handleBellClick = () => {
        const willOpen = !open;
        setOpen(willOpen);
        setProfileOpen(false);
        if (willOpen) {
            setReadCount(totalCount); // semua sudah "dibaca"
        }
    };

    // Reset readCount kalau notifikasi baru muncul (misal stok baru habis)
    useEffect(() => {
        if (totalCount > readCount) {
            // ada notif baru, biarkan badge muncul
        }
    }, [totalCount]);

    useEffect(() => {
        const handler = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!user) return null;

    return (
        <NavbarStyled>
            <div className="left">
                <span className="page-title">{pageTitle}</span>
                <span className="date">{new Date().toLocaleDateString("id-ID", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}</span>
            </div>

            <div className="right">
                {/* BELL */}
                <div className="bell-wrap" ref={bellRef}>
                    <button
                        className={`bell-btn ${unreadCount > 0 ? "has-notif" : ""}`}
                        onClick={handleBellClick}
                        title="Notifikasi"
                    >
                        <i className="fa-solid fa-bell"></i>
                        {unreadCount > 0 && (
                            <span className="badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                        )}
                    </button>

                    {open && (
                        <div className="notif-dropdown">
                            <div className="notif-header">
                                <span>Notifikasi</span>
                                <span className="notif-count">{totalCount} total</span>
                            </div>
                            {notifications.length === 0 ? (
                                <div className="notif-empty"><span>🎉</span><p>Semua baik-baik saja!</p></div>
                            ) : (
                                <div className="notif-list">
                                    {notifications.map(n => (
                                        <div className={`notif-item ${n.type}`} key={n.id}>
                                            <span className="notif-icon">{n.icon}</span>
                                            <div className="notif-body">
                                                <strong>{n.title}</strong>
                                                <p>{n.body}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PROFILE */}
                <div className="profile-wrap" ref={profileRef}>
                    <button className="profile-btn" onClick={() => { setProfileOpen(p => !p); setOpen(false); }}>
                        <img src={avatar} alt="avatar" />
                        <div className="profile-info">
                            <span className="profile-name">{user?.username}</span>
                            <span className="profile-role">{user?.role === "owner" ? "👑 Owner" : "👤 Staff"}</span>
                        </div>
                        <i className="fa-solid fa-chevron-down chev"></i>
                    </button>

                    {profileOpen && (
                        <div className="profile-dropdown">
                            <div className="pd-user">
                                <img src={avatar} alt="avatar" />
                                <div>
                                    <strong>{user?.username}</strong>
                                    <span>{user?.role}</span>
                                </div>
                            </div>
                            <div className="pd-divider" />
                            <NavLink to="/profile" className="pd-item" onClick={() => setProfileOpen(false)}>
                                <i className="fa-solid fa-user"></i><span>Lihat Profil</span>
                            </NavLink>
                            {user?.role === "owner" && (
                                <NavLink to="/manage-users" className="pd-item" onClick={() => setProfileOpen(false)}>
                                    <i className="fa-solid fa-users"></i><span>Kelola Pengguna</span>
                                </NavLink>
                            )}
                            <div className="pd-divider" />
                            <button className="pd-item logout" onClick={logout}>
                                <i className="fa-solid fa-right-from-bracket"></i><span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </NavbarStyled>
    );
}

const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num || 0);

const NavbarStyled = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .85rem 2rem;
    background: rgba(252, 246, 249, 0.95);
    backdrop-filter: blur(16px);
    border-bottom: 1.5px solid rgba(237, 232, 245, 0.8);
    border-radius: 0;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 16px rgba(34, 34, 96, 0.06);
    position: sticky;
    top: 0;
    z-index: 100;
    margin: 0;
    margin-top: -1.5rem;
    width: calc(100% + 3rem);

    .left {
        display: flex;
        flex-direction: column;
        gap: .1rem;

        .page-title { font-size: 1.15rem; font-weight: 800; color: rgba(34, 34, 96, 1); letter-spacing: -.01em; }
        .date { font-size: .7rem; color: rgba(34, 34, 96, 0.4); text-transform: capitalize; }
    }

    .right { display: flex; align-items: center; gap: .65rem; }

    /* ── BELL ── */
    .bell-wrap { position: relative; }

    .bell-btn {
        width: 40px; height: 40px;
        border-radius: 11px;
        border: 1.5px solid #ede8f5;
        background: #fff;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        position: relative;
        transition: all .2s;
        color: rgba(34, 34, 96, 0.6);
        font-size: .95rem;

        &:hover { border-color: var(--color-accent); color: var(--color-accent); }
        &.has-notif {
            border-color: var(--color-accent);
            color: var(--color-accent);
            animation: bellShake 2s ease infinite;
        }

        .badge {
            position: absolute;
            top: -5px; right: -5px;
            background: #e74c3c;
            color: #fff;
            font-size: .58rem;
            font-weight: 800;
            width: 17px; height: 17px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid #fff;
        }
    }

    @keyframes bellShake {
        0%, 90%, 100% { transform: rotate(0deg); }
        92% { transform: rotate(-12deg); }
        94% { transform: rotate(12deg); }
        96% { transform: rotate(-6deg); }
        98% { transform: rotate(6deg); }
    }

    .notif-dropdown {
        position: absolute;
        top: calc(100% + 10px); right: 0;
        width: 310px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0px 8px 40px rgba(0,0,0,0.12);
        border: 1.5px solid #ede8f5;
        overflow: hidden;
        animation: dropIn .18s ease;
        z-index: 200;
    }

    @keyframes dropIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .notif-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: .85rem 1.1rem;
        border-bottom: 1.5px solid #f0ebf8;
        font-size: .84rem; font-weight: 700; color: rgba(34, 34, 96, 1);

        .notif-count { font-size: .7rem; background: var(--color-accent); color: #fff; padding: .1rem .5rem; border-radius: 20px; }
    }

    .notif-empty { padding: 1.8rem; text-align: center; color: rgba(34, 34, 96, 0.35); span { font-size: 1.8rem; display: block; margin-bottom: .4rem; } p { font-size: .82rem; } }

    .notif-list { max-height: 320px; overflow-y: auto; padding: .45rem; &::-webkit-scrollbar { width: 3px; } &::-webkit-scrollbar-thumb { background: #d8cff0; border-radius: 3px; } }

    .notif-item {
        display: flex; align-items: flex-start; gap: .7rem;
        padding: .7rem .85rem; border-radius: 11px; margin-bottom: .3rem;
        &:last-child { margin-bottom: 0; }
        &.danger  { background: #fff5f5; border-left: 3px solid #e74c3c; }
        &.warning { background: #fffbf0; border-left: 3px solid #f39c12; }
        &.success { background: #f0fbf5; border-left: 3px solid #27ae60; }
        &.info    { background: #f0f4ff; border-left: 3px solid #3498db; }
        .notif-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: .1rem; }
        .notif-body { strong { font-size: .8rem; font-weight: 700; color: rgba(34,34,96,1); display: block; } p { font-size: .73rem; color: rgba(34,34,96,0.55); margin-top: .08rem; } }
    }

    /* ── PROFILE ── */
    .profile-wrap { position: relative; }

    .profile-btn {
        display: flex; align-items: center; gap: .6rem;
        background: #fff; border: 1.5px solid #ede8f5; border-radius: 12px;
        padding: .4rem .85rem .4rem .45rem; cursor: pointer; transition: all .2s;
        &:hover { border-color: var(--color-accent); }

        img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 2px solid #f0ebff; }

        .profile-info { display: flex; flex-direction: column; align-items: flex-start; gap: .03rem;
            .profile-name { font-size: .8rem; font-weight: 700; color: rgba(34,34,96,1); text-transform: capitalize; }
            .profile-role { font-size: .65rem; color: rgba(34,34,96,0.45); }
        }

        .chev { font-size: .6rem; color: rgba(34,34,96,0.4); margin-left: .15rem; }
    }

    .profile-dropdown {
        position: absolute; top: calc(100% + 10px); right: 0;
        width: 210px; background: #fff; border-radius: 16px;
        box-shadow: 0px 8px 40px rgba(0,0,0,0.12); border: 1.5px solid #ede8f5;
        padding: .55rem; animation: dropIn .18s ease; z-index: 200;
    }

    .pd-user { display: flex; align-items: center; gap: .6rem; padding: .45rem .55rem;
        img { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #f0ebff; }
        strong { font-size: .82rem; font-weight: 700; color: rgba(34,34,96,1); display: block; text-transform: capitalize; }
        span { font-size: .68rem; color: rgba(34,34,96,0.45); text-transform: capitalize; }
    }

    .pd-divider { height: 1px; background: #f0ebf8; margin: .35rem 0; }

    .pd-item {
        display: flex; align-items: center; gap: .65rem; padding: .55rem .75rem;
        border-radius: 9px; font-size: .8rem; font-weight: 600; color: rgba(34,34,96,0.7);
        text-decoration: none; background: none; border: none; width: 100%;
        cursor: pointer; font-family: inherit; transition: background .15s, color .15s;
        i { font-size: .82rem; width: 15px; text-align: center; }
        &:hover { background: #f5f0ff; color: var(--color-accent); }
        &.logout:hover { background: #fff0f0; color: #e74c3c; }
    }

    @media (max-width: 600px) {
        padding: .65rem 1rem;
        margin-left: 0;
        width: calc(100% + 3rem);
        .left .date { display: none; }
        .profile-info { display: none; }
        .profile-btn { padding: .4rem; }
        .notif-dropdown { width: calc(100vw - 2rem); right: -1rem; }
    }
`;

export default TopNavbar;