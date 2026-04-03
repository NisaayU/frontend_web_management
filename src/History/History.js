import React from 'react';
import styled from 'styled-components';
import { useGlobalContext } from '../context/globalContext';

function History() {
    const { transactionHistory } = useGlobalContext();

    const history = transactionHistory().slice(0, 5);

    const formatRupiah = (num) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num || 0);

    return (
        <HistoryStyled>
            {history.length === 0 ? (
                <div className="empty">Belum ada transaksi</div>
            ) : (
                history.map(({ _id, title, total, amount, type }) => (
                    <div key={_id} className={`history-item ${type}`}>
                        <div className="item-left">
                            <span className="item-dot" />
                            <span className="item-title">{title || '—'}</span>
                        </div>
                        <span className="item-amount">
                            {type === 'expense'
                                ? `-${formatRupiah(amount || 0)}`
                                : `+${formatRupiah(total || 0)}`}
                        </span>
                    </div>
                ))
            )}
        </HistoryStyled>
    );
}

const HistoryStyled = styled.div`
    display: flex;
    flex-direction: column;
    gap: .5rem;

    .empty {
        text-align: center;
        color: rgba(34, 34, 96, 0.35);
        font-size: .85rem;
        padding: 1.5rem 0;
    }

    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: .7rem .9rem;
        border-radius: 12px;
        border: 1.5px solid transparent;
        transition: background .15s;

        &.income  { background: #f0fbf5; border-color: #c8eed8; }
        &.expense { background: #fff5f5; border-color: #fcd5d5; }

        &:hover { filter: brightness(.97); }
    }

    .item-left {
        display: flex;
        align-items: center;
        gap: .6rem;
        min-width: 0;
    }

    .item-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;

        .income &  { background: var(--color-green); }
        .expense & { background: #e74c3c; }
    }

    .history-item.income  .item-dot  { background: var(--color-green); }
    .history-item.expense .item-dot  { background: #e74c3c; }

    .item-title {
        font-size: .82rem;
        font-weight: 600;
        color: rgba(34, 34, 96, 0.85);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
    }

    .item-amount {
        font-size: .82rem;
        font-weight: 800;
        white-space: nowrap;
        flex-shrink: 0;

        .history-item.income &  { color: var(--color-green); }
        .history-item.expense & { color: #e74c3c; }
    }

    .history-item.income  .item-amount { color: var(--color-green); }
    .history-item.expense .item-amount { color: #e74c3c; }
`;

export default History;