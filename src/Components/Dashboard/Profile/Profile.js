import { useEffect } from "react";
import styled from "styled-components";
import { useGlobalContext } from "../../../context/globalContext";
import avatar from "../../../img/avatar.png";

function Profile() {
    const { user, getProfile, profile } = useGlobalContext();

    useEffect(() => {
        getProfile();
    }, []);

    const displayUser = profile || user;

    if (!displayUser) return <p style={{ padding: "2rem" }}>Loading...</p>;

    return (
        <ProfileStyled>
            <div className="profile-card">
                <div className="avatar-wrap">
                    <img src={avatar} alt="avatar" />
                    <span className={`role-badge ${displayUser.role}`}>
                        {displayUser.role === "owner" ? "👑 Owner" : "👤 Staff"}
                    </span>
                </div>

                <div className="profile-info">
                    <h2>{displayUser.username}</h2>
                    <p className="role-text">
                        {displayUser.role === "owner"
                            ? "Anda memiliki akses penuh ke semua fitur"
                            : "Anda memiliki akses ke fitur transaksi dan laporan"}
                    </p>
                </div>

                <div className="info-list">
                    <div className="info-item">
                        <span className="info-label">Username</span>
                        <span className="info-value">{displayUser.username}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Role</span>
                        <span className="info-value">{displayUser.role}</span>
                    </div>
                </div>

                <div className="note">
                    <p>💡 Untuk mengganti password, hubungi Owner.</p>
                </div>
            </div>
        </ProfileStyled>
    );
}

const ProfileStyled = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 2rem;

    .profile-card {
        background: #FCF6F9;
        border-radius: 24px;
        padding: 2rem;
        width: 100%;
        max-width: 480px;
        box-shadow: 0px 1px 15px rgba(0,0,0,0.06);
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .avatar-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: .75rem;

        img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #fff;
            box-shadow: 0px 1px 17px rgba(0,0,0,0.08);
        }

        .role-badge {
            font-size: .78rem;
            font-weight: 700;
            padding: .3rem .9rem;
            border-radius: 20px;

            &.owner {
                background: #fff8e0;
                color: #b8860b;
                border: 1.5px solid #f0d080;
            }
            &.staff {
                background: #e6f9f0;
                color: #1a7a4a;
                border: 1.5px solid #b2e8ce;
            }
        }
    }

    .profile-info {
        text-align: center;

        h2 {
            font-size: 1.5rem;
            font-weight: 800;
            color: rgba(34, 34, 96, 1);
            text-transform: capitalize;
        }

        .role-text {
            font-size: .82rem;
            color: rgba(34, 34, 96, 0.45);
            margin-top: .3rem;
        }
    }

    .info-list {
        display: flex;
        flex-direction: column;
        gap: .75rem;
        background: #fff;
        border-radius: 14px;
        padding: 1rem 1.2rem;
        border: 2px solid #ede8f5;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .info-label {
            font-size: .78rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.45);
            text-transform: uppercase;
            letter-spacing: .05em;
        }

        .info-value {
            font-size: .92rem;
            font-weight: 600;
            color: rgba(34, 34, 96, 1);
            text-transform: capitalize;
        }
    }

    .note {
        background: #f0ebff;
        border-radius: 10px;
        padding: .75rem 1rem;
        border: 1.5px solid #d8cff0;

        p {
            font-size: .8rem;
            color: rgba(34, 34, 96, 0.55);
            text-align: center;
        }
    }
`;

export default Profile;