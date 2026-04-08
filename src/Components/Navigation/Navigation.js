import { useState } from "react";
import styled from "styled-components";
import avatar from "../../img/avatar.png";
import { menuItems } from "../../utils/menuItems";
import { signout } from "../../utils/Icons";
import { useGlobalContext } from "../../context/globalContext";
import { NavLink, useLocation } from "react-router-dom";

function Navigation() {
    const { user, logout } = useGlobalContext();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    if (!user || location.pathname === "/login") return null;

    const ownerAllowed = ["/dashboard", "/view-data", "/manage-users"];

    return (
        <NavStyled collapsed={collapsed}>
            {/* TOGGLE BUTTON */}
            <button className="toggle-btn" onClick={() => setCollapsed(p => !p)} title={collapsed ? "Perluas" : "Perkecil"}>
                <i className={`fa-solid fa-${collapsed ? "angles-right" : "angles-left"}`}></i>
            </button>

            {/* USER */}
            <NavLink to="/profile" className="user-con" title={collapsed ? user?.username : ""}>
                <img src={avatar} alt="avatar" />
                {!collapsed && (
                    <div className="user-info">
                        <h2>{user?.username || "User"}</h2>
                        <p>{user?.role === "owner" ? "👑 Owner" : "👤 Staff"}</p>
                    </div>
                )}
            </NavLink>

            <div className="divider" />

            {/* MENU */}
            <ul className="menu-items">
                {menuItems.map((item) => {
                    if (user?.role === "owner" && !ownerAllowed.includes(item.path)) return null;
                    if (item.path === "/manage-users" && user?.role !== "owner") return null;

                    return (
                        <li key={item.id}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? "active" : ""}
                                title={collapsed ? item.title : ""}
                            >
                                <span className="icon">{item.icon}</span>
                                {!collapsed && <span className="label">{item.title}</span>}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>

            {/* SIGN OUT */}
            <div className="bottom-nav">
                <div className="divider" />
                <button className="signout-btn" onClick={logout} title={collapsed ? "Sign Out" : ""}>
                    {signout}
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </NavStyled>
    );
}

const NavStyled = styled.nav`
    width: ${({ collapsed }) => collapsed ? "64px" : "220px"};
    flex-shrink: 0;
    height: 100%;
    background: rgba(252, 246, 249, 0.78);
    border: 3px solid #FFFFFF;
    backdrop-filter: blur(4.5px);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 1rem .75rem;
    overflow: hidden;
    transition: width .25s cubic-bezier(.4, 0, .2, 1);

    /* ── TOGGLE BUTTON ── */
    .toggle-btn {
        align-self: ${({ collapsed }) => collapsed ? "center" : "flex-end"};
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1.5px solid #ede8f5;
        background: #fff;
        color: rgba(34, 34, 96, 0.45);
        font-size: .7rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all .2s;
        flex-shrink: 0;
        margin-bottom: .5rem;

        &:hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
            background: #f5f0ff;
        }
    }

    /* ── USER ── */
    .user-con {
        display: flex;
        align-items: center;
        gap: .75rem;
        text-decoration: none;
        padding: .35rem .4rem;
        border-radius: 14px;
        transition: background .2s;
        flex-shrink: 0;
        overflow: hidden;
        justify-content: ${({ collapsed }) => collapsed ? "center" : "flex-start"};

        &:hover { background: rgba(255,255,255,0.6); }

        img {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #fff;
            background: #fcf6f9;
            flex-shrink: 0;
            box-shadow: 0px 1px 10px rgba(0,0,0,0.08);
        }

        .user-info {
            min-width: 0;
            h2 { font-size: .8rem; font-weight: 700; color: rgba(34, 34, 96, 1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            p  { font-size: .63rem; color: rgba(34, 34, 96, .55); margin-top: .05rem; }
        }
    }

    /* ── DIVIDER ── */
    .divider { height: 1px; background: rgba(34, 34, 96, 0.07); margin: .6rem 0; flex-shrink: 0; }

    /* ── MENU ITEMS ── */
    .menu-items {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: .15rem;
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        overflow-x: hidden;

        &::-webkit-scrollbar { width: 0; }

        li a {
            display: flex;
            align-items: center;
            gap: .6rem;
            padding: .55rem .6rem;
            border-radius: 12px;
            text-decoration: none;
            color: rgba(34, 34, 96, 0.55);
            font-size: .79rem;
            font-weight: 600;
            transition: all .2s;
            position: relative;
            white-space: nowrap;
            justify-content: ${({ collapsed }) => collapsed ? "center" : "flex-start"};

            .icon { font-size: .95rem; width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; svg, i { width: 17px; height: 17px; font-size: .95rem; } }
            .label { overflow: hidden; text-overflow: ellipsis; }

            &:hover { background: rgba(255,255,255,0.7); color: rgba(34, 34, 96, 0.85); }

            &.active {
                background: rgba(34, 34, 96, 0.08);
                color: rgba(34, 34, 96, 1);
                font-weight: 700;

                &::before { content: ""; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px; background: #222260; border-radius: 0 4px 4px 0; }
            }
        }
    }

    /* ── BOTTOM ── */
    .bottom-nav { flex-shrink: 0; }

    .signout-btn {
        display: flex;
        align-items: center;
        gap: .6rem;
        padding: .55rem .6rem;
        border-radius: 12px;
        width: 100%;
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(34, 34, 96, 0.5);
        font-size: .79rem;
        font-weight: 600;
        font-family: inherit;
        transition: all .2s;
        white-space: nowrap;
        justify-content: ${({ collapsed }) => collapsed ? "center" : "flex-start"};

        svg, i { width: 17px; height: 17px; flex-shrink: 0; }
        &:hover { background: #fff0f0; color: #e74c3c; }
    }

    /* ── RESPONSIVE ── */

    @media (max-width: 1024px) {
        width: ${({ collapsed }) => collapsed ? "64px" : "190px"};
    }

    @media (max-width: 768px) {
        width: 64px;
        padding: 1rem .5rem;

        .toggle-btn { align-self: center; }
        .user-con   { justify-content: center; }
        .user-info  { display: none; }
        li a        { justify-content: center; }
        .label      { display: none; }
        .signout-btn { justify-content: center; span { display: none; } }
    }

    @media (max-width: 480px) {
        position: fixed;
        bottom: .75rem;
        left: .75rem;
        right: .75rem;
        width: 100%;
        left: 0;
        right: 0;
        height: 62px;
        border-radius: 18px;
        flex-direction: row;
        align-items: center;
        padding: 0 .5rem;
        z-index: 500;
        box-shadow: 0 4px 24px rgba(34, 34, 96, 0.12);

        .toggle-btn, .user-con, .divider { display: none; }

        .menu-items {
            flex-direction: row;
            flex: 1;
            gap: 0;
            overflow: visible;
            justify-content: space-around;
            align-items: center;

            li a {
                flex-direction: column;
                gap: .15rem;
                padding: .35rem .45rem;
                border-radius: 12px;
                font-size: .58rem;
                justify-content: center;
                white-space: nowrap;

                .icon { width: auto; font-size: 1.1rem; svg, i { width: 19px; height: 19px; } }
                .label { display: block; font-size: .58rem; }
                &::before { display: none; }
                &.active { background: rgba(34, 34, 96, 0.1); }
            }
        }

        .bottom-nav {
            display: none;
            .signout-btn {
                flex-direction: column;
                gap: .15rem;
                padding: .35rem .45rem;
                border-radius: 12px;
                font-size: .58rem;
                justify-content: center;
                span { display: block; font-size: .58rem; }
                svg, i { width: 19px; height: 19px; }
            }
        }
    }
`;

export default Navigation;