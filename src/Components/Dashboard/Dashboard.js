import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { InnerLayout } from "../../styles/Layouts";
import Chart from "../Chart/Chart";
import History from "../../History/History";
import { useGlobalContext } from "../../context/globalContext";

function Dashboard() {
    const {
        incomes, expenses, getIncomes, getExpenses
    } = useGlobalContext();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([getIncomes(), getExpenses()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    const formatRupiah = (num) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(num || 0);

    const now = new Date();
    const todayStr = now.toDateString();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthName = now.toLocaleString("id-ID", { month: "long" });

    // bulan lalu
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthName = lastMonthDate.toLocaleString("id-ID", { month: "long" });

    // helper perbandingan
    const pctChange = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
    };

    // ── HARIAN ──
    const todayIncomes = useMemo(() =>
        incomes.filter(i => new Date(i.date).toDateString() === todayStr), [incomes]);
    const todayExpenses = useMemo(() =>
        expenses.filter(e => new Date(e.date || e.createdAt).toDateString() === todayStr), [expenses]);

    const todayIncome  = todayIncomes.reduce((s, i) => s + (i.total || 0), 0);
    const todayExpense = todayExpenses.reduce((s, e) => s + (e.total || e.amount || 0), 0);
    const todayTxCount = todayIncomes.length + todayExpenses.length;

    // ── BULANAN (bulan ini) ──
    const filterMonth = (arr, key, m, y) =>
        arr.filter(x => {
            const d = new Date(x[key] || x.createdAt);
            return d.getMonth() === m && d.getFullYear() === y;
        });

    const thisMonthIncomes  = useMemo(() => filterMonth(incomes, "date", thisMonth, thisYear), [incomes]);
    const thisMonthExpenses = useMemo(() => filterMonth(expenses, "date", thisMonth, thisYear), [expenses]);
    const lastMonthIncomes  = useMemo(() => filterMonth(incomes, "date", lastMonth, lastMonthYear), [incomes]);
    const lastMonthExpenses = useMemo(() => filterMonth(expenses, "date", lastMonth, lastMonthYear), [expenses]);

    const monthlyIncome   = thisMonthIncomes.reduce((s, i) => s + (i.total || 0), 0);
    const monthlyExpense  = thisMonthExpenses.reduce((s, e) => s + (e.total || e.amount || 0), 0);
    const monthlyBalance  = monthlyIncome - monthlyExpense;
    const monthlyTxCount  = thisMonthIncomes.length + thisMonthExpenses.length;

    const lastMonthIncome  = lastMonthIncomes.reduce((s, i) => s + (i.total || 0), 0);
    const lastMonthExpense = lastMonthExpenses.reduce((s, e) => s + (e.total || e.amount || 0), 0);
    const lastMonthBalance = lastMonthIncome - lastMonthExpense;

    const incomeChange  = pctChange(monthlyIncome, lastMonthIncome);
    const expenseChange = pctChange(monthlyExpense, lastMonthExpense);
    const balanceChange = pctChange(monthlyBalance, lastMonthBalance);

    // rata-rata harian bulan ini
    const daysElapsed = now.getDate();
    const avgDailyIncome  = daysElapsed > 0 ? monthlyIncome  / daysElapsed : 0;
    const avgDailyExpense = daysElapsed > 0 ? monthlyExpense / daysElapsed : 0;

    // ── TAHUNAN ──
    const yearlyIncomes  = useMemo(() => incomes.filter(i => new Date(i.date).getFullYear() === thisYear), [incomes]);
    const yearlyExpenses = useMemo(() => expenses.filter(e => new Date(e.date || e.createdAt).getFullYear() === thisYear), [expenses]);

    const yearlyIncome  = yearlyIncomes.reduce((s, i) => s + (i.total || 0), 0);
    const yearlyExpense = yearlyExpenses.reduce((s, e) => s + (e.total || e.amount || 0), 0);
    const yearlyBalance = yearlyIncome - yearlyExpense;
    const yearlyTxCount = yearlyIncomes.length + yearlyExpenses.length;

    // ── MIN / MAX ──
    const aggregateByDate = (items, valueKey) => {
        const map = {};
        items.forEach(item => {
            const d = new Date(item.date || item.createdAt).toDateString();
            map[d] = (map[d] || 0) + (item[valueKey] || 0);
        });
        return Object.values(map);
    };

    const dailyIncomeArr  = aggregateByDate(incomes, "total");
    const dailyExpenseArr = aggregateByDate(expenses, "amount");

    const minIncome  = dailyIncomeArr.length  ? Math.min(...dailyIncomeArr)  : 0;
    const maxIncome  = dailyIncomeArr.length  ? Math.max(...dailyIncomeArr)  : 0;
    const minExpense = dailyExpenseArr.length ? Math.min(...dailyExpenseArr) : 0;
    const maxExpense = dailyExpenseArr.length ? Math.max(...dailyExpenseArr) : 0;

    // ── HELPERS UI ──
    const Badge = ({ pct, inverse = false }) => {
        const up = pct >= 0;
        const good = inverse ? !up : up;
        return (
            <TrendBadge good={good}>
                {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% vs {lastMonthName}
            </TrendBadge>
        );
    };

    if (loading) return (
        <DashboardStyled>
            <InnerLayout>
                <SkeletonWrap>
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </SkeletonWrap>
                <SkeletonWrap>
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} tall />)}
                </SkeletonWrap>
            </InnerLayout>
        </DashboardStyled>
    );

    const noDataToday = todayTxCount === 0;

    return (
        <DashboardStyled>
            <InnerLayout>
                <div className="dash-header">
                    <h1>Dashboard</h1>
                    <p className="dash-sub">Rekap keuangan toko kamu</p>
                </div>

                {/* ── HARI INI ── */}
                <SectionLabel>📅 Hari Ini</SectionLabel>
                {noDataToday ? (
                    <EmptyState>
                        <span>🗒️</span>
                        <p>Belum ada transaksi hari ini.</p>
                        <small>Tambahkan data baru untuk mulai merekap.</small>
                    </EmptyState>
                ) : (
                    <CardGrid cols={3}>
                        <StatCard color="purple">
                            <div className="card-body">
                                <span className="card-label">Penjualan</span>
                                <span className="card-value">{formatRupiah(todayIncome)}</span>
                                <span className="card-sub">{todayIncomes.length} transaksi masuk</span>
                            </div>
                        </StatCard>
                        <StatCard color="red">
                            <div className="card-body">
                                <span className="card-label">Pengeluaran</span>
                                <span className="card-value">{formatRupiah(todayExpense)}</span>
                                <span className="card-sub">{todayExpenses.length} transaksi keluar</span>
                            </div>
                        </StatCard>
                        <StatCard color={todayIncome - todayExpense >= 0 ? "green" : "red"}>
                            <div className="card-icon">{todayIncome - todayExpense >= 0 ? "📈" : "📉"}</div>
                            <div className="card-body">
                                <span className="card-label">Saldo Hari Ini</span>
                                <span className="card-value">{formatRupiah(todayIncome - todayExpense)}</span>
                                <span className={`card-badge ${todayIncome - todayExpense >= 0 ? "profit" : "loss"}`}>
                                    {todayIncome - todayExpense >= 0 ? "💰 Laba" : "⚠️ Rugi"}
                                </span>
                                <span className="card-sub">{todayTxCount} total transaksi</span>
                            </div>
                        </StatCard>
                    </CardGrid>
                )}

                {/* ── BULANAN ── */}
                <SectionLabel>📆 Bulan {monthName} {thisYear}</SectionLabel>
                <CardGrid cols={3}>
                    <StatCard color="purple">
                        <div className="card-body">
                            <span className="card-label">Total Pemasukan</span>
                            <span className="card-value">{formatRupiah(monthlyIncome)}</span>
                            <span className="card-sub">{thisMonthIncomes.length} transaksi · rata {formatRupiah(avgDailyIncome)}/hari</span>
                            <Badge pct={incomeChange} />
                        </div>
                    </StatCard>
                    <StatCard color="red">
                        <div className="card-body">
                            <span className="card-label">Total Pengeluaran</span>
                            <span className="card-value">{formatRupiah(monthlyExpense)}</span>
                            <span className="card-sub">{thisMonthExpenses.length} transaksi · rata {formatRupiah(avgDailyExpense)}/hari</span>
                            <Badge pct={expenseChange} inverse />
                        </div>
                    </StatCard>
                    <StatCard color={monthlyBalance >= 0 ? "green" : "red"}>
                        <div className="card-icon">{monthlyBalance >= 0 ? "🏦" : "⚠️"}</div>
                        <div className="card-body">
                            <span className="card-label">Saldo Bulan Ini</span>
                            <span className="card-value">{formatRupiah(monthlyBalance)}</span>
                            <span className={`card-badge ${monthlyBalance >= 0 ? "profit" : "loss"}`}>
                                {monthlyBalance >= 0 ? "💰 Laba" : "⚠️ Rugi"}
                            </span>
                            <Badge pct={balanceChange} />
                        </div>
                    </StatCard>
                </CardGrid>

                {/* ── TAHUNAN ── */}
                <SectionLabel>🗓️ Tahun {thisYear}</SectionLabel>
                <CardGrid cols={4}>
                    <StatCard color="indigo">
                        <div className="card-icon">📊</div>
                        <div className="card-body">
                            <span className="card-label">Total Perputaran</span>
                            <span className="card-value sm">{formatRupiah(yearlyIncome + yearlyExpense)}</span>
                            <span className="card-sub">{yearlyTxCount} total transaksi</span>
                        </div>
                    </StatCard>
                    <StatCard color="blue">
                        <div className="card-icon">📈</div>
                        <div className="card-body">
                            <span className="card-label">Total Pemasukan</span>
                            <span className="card-value sm">{formatRupiah(yearlyIncome)}</span>
                            <span className="card-sub">{yearlyIncomes.length} transaksi</span>
                        </div>
                    </StatCard>
                    <StatCard color="red">
                        <div className="card-icon">📉</div>
                        <div className="card-body">
                            <span className="card-label">Total Pengeluaran</span>
                            <span className="card-value sm">{formatRupiah(yearlyExpense)}</span>
                            <span className="card-sub">{yearlyExpenses.length} transaksi</span>
                        </div>
                    </StatCard>
                    <StatCard color={yearlyBalance >= 0 ? "green" : "red"}>
                        <div className="card-icon">{yearlyBalance >= 0 ? "💰" : "⚠️"}</div>
                        <div className="card-body">
                            <span className="card-label">Saldo Bersih</span>
                            <span className="card-value sm">{formatRupiah(yearlyBalance)}</span>
                            <span className={`card-badge ${yearlyBalance >= 0 ? "profit" : "loss"}`}>
                                {yearlyBalance >= 0
                                    ? `Laba ${((yearlyIncome > 0 ? yearlyBalance / yearlyIncome : 0) * 100).toFixed(1)}%`
                                    : `Rugi ${((yearlyExpense > 0 ? Math.abs(yearlyBalance) / yearlyExpense : 0) * 100).toFixed(1)}%`}
                            </span>
                        </div>
                    </StatCard>
                </CardGrid>

                {/* ── CHART + HISTORY ── */}
                <div className="bottom-grid">
                    <div className="chart-wrap">
                        <div className="section-box">
                            <h3 className="box-title">Grafik Transaksi</h3>
                            <Chart />
                            <div className="minmax-row">
                                <div className="minmax-card">
                                    <span className="mm-label">Min Pemasukan</span>
                                    <span className="mm-val income">{formatRupiah(minIncome)}</span>
                                    <span className="mm-hint">per hari</span>
                                </div>
                                <div className="minmax-card">
                                    <span className="mm-label">Max Pemasukan</span>
                                    <span className="mm-val income">{formatRupiah(maxIncome)}</span>
                                    <span className="mm-hint">per hari</span>
                                </div>
                                <div className="minmax-card">
                                    <span className="mm-label">Min Pengeluaran</span>
                                    <span className="mm-val expense">{formatRupiah(minExpense)}</span>
                                    <span className="mm-hint">per hari</span>
                                </div>
                                <div className="minmax-card">
                                    <span className="mm-label">Max Pengeluaran</span>
                                    <span className="mm-val expense">{formatRupiah(maxExpense)}</span>
                                    <span className="mm-hint">per hari</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="history-wrap">
                        <div className="section-box">
                            <h3 className="box-title">Riwayat Transaksi</h3>
                            <History />
                        </div>
                    </div>
                </div>
            </InnerLayout>
        </DashboardStyled>
    );
}

/* ─── ANIMATIONS ─── */
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const SectionLabel = styled.div`
    font-size: .78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: rgba(34, 34, 96, 0.4);
    margin: 1.4rem 0 .6rem 0;
`;

const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(${p => p.cols}, 1fr);
    gap: 1rem;
    animation: ${fadeUp} .4s ease both;

    @media (max-width: 1100px) {
        grid-template-columns: repeat(${p => Math.min(p.cols, 2)}, 1fr);
    }
    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
`;

const colorMap = {
    purple: { bg: '#f5f0ff', border: '#ddd0f8', val: '#7c3aed' },
    red:    { bg: '#fff0f0', border: '#fcd5d5', val: '#e74c3c' },
    green:  { bg: '#e6f9f0', border: '#b2e8ce', val: '#1a7a4a' },
    blue:   { bg: '#eaf6ff', border: '#bde0f8', val: '#2980b9' },
    indigo: { bg: '#eef2ff', border: '#c7d2fe', val: '#4338ca' },
};

const StatCard = styled.div`
    background: ${p => colorMap[p.color]?.bg || '#FCF6F9'};
    border: 2px solid ${p => colorMap[p.color]?.border || '#ede8f5'};
    border-radius: 18px;
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: flex-start;
    gap: .85rem;
    box-shadow: 0px 1px 12px rgba(0,0,0,0.05);
    transition: box-shadow .2s, transform .2s;

    &:hover { box-shadow: 0px 4px 20px rgba(0,0,0,0.09); transform: translateY(-1px); }

    .card-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: .1rem; }
    .card-body { display: flex; flex-direction: column; gap: .18rem; min-width: 0; }

    .card-label {
        font-size: .68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: rgba(34, 34, 96, 0.5);
    }

    .card-value {
        font-size: 1.25rem;
        font-weight: 800;
        color: ${p => colorMap[p.color]?.val || 'rgba(34,34,96,1)'};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        &.sm { font-size: 1rem; }
    }

    .card-sub {
        font-size: .64rem;
        color: rgba(34, 34, 96, 0.38);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-badge {
        display: inline-block;
        font-size: .65rem;
        font-weight: 700;
        padding: .12rem .5rem;
        border-radius: 20px;
        width: fit-content;
        &.profit { background: #d4edda; color: #155724; }
        &.loss   { background: #f8d7da; color: #721c24; }
    }
`;

const TrendBadge = styled.span`
    display: inline-block;
    font-size: .62rem;
    font-weight: 700;
    padding: .1rem .45rem;
    border-radius: 20px;
    width: fit-content;
    margin-top: .05rem;
    background: ${p => p.good ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)"};
    color:      ${p => p.good ? "#065f46" : "#9f1239"};
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    padding: 2rem;
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 18px;
    text-align: center;
    animation: ${fadeUp} .4s ease both;

    span { font-size: 2rem; }

    p {
        font-size: .9rem;
        font-weight: 700;
        color: rgba(34, 34, 96, 0.6);
        margin: 0;
    }

    small {
        font-size: .72rem;
        color: rgba(34, 34, 96, 0.35);
    }
`;

const SkeletonWrap = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;

    @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const skeletonShimmer = keyframes`
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
`;

const SkeletonCard = styled.div`
    height: ${p => p.tall ? "130px" : "90px"};
    border-radius: 18px;
    background: linear-gradient(90deg, #f0f0f5 25%, #e8e8ef 50%, #f0f0f5 75%);
    background-size: 800px 100%;
    animation: ${skeletonShimmer} 1.4s infinite linear;
`;

const DashboardStyled = styled.div`
    .dash-header {
        margin-bottom: .5rem;
        h1 { font-size: 1.5rem; font-weight: 800; color: rgba(34, 34, 96, 1); margin-bottom: .1rem; }
        .dash-sub { font-size: .8rem; color: rgba(34, 34, 96, 0.38); }
    }

    .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 1.25rem;
        margin-top: 1.5rem;

        @media (max-width: 1100px) { grid-template-columns: 1fr; }
    }

    .chart-wrap { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .history-wrap { min-width: 0; }

    .section-box {
        background: #FCF6F9;
        border: 2px solid #FFFFFF;
        box-shadow: 0px 1px 15px rgba(0,0,0,0.06);
        border-radius: 20px;
        padding: 1.25rem 1.5rem;

        .box-title {
            font-size: .78rem;
            font-weight: 700;
            color: rgba(34, 34, 96, 0.55);
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: .06em;
        }
    }

    .minmax-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: .75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1.5px solid rgba(34,34,96,0.07);

        @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
    }

    .minmax-card {
        background: #fff;
        border: 2px solid #f0ebf8;
        border-radius: 14px;
        padding: .75rem 1rem;
        display: flex;
        flex-direction: column;
        gap: .15rem;

        .mm-label {
            font-size: .62rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .05em;
            color: rgba(34, 34, 96, 0.38);
        }

        .mm-val {
            font-size: .88rem;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            &.income  { color: #1a7a4a; }
            &.expense { color: #e74c3c; }
        }

        .mm-hint {
            font-size: .58rem;
            color: rgba(34, 34, 96, 0.28);
            font-style: italic;
        }
    }
`;

export default Dashboard;