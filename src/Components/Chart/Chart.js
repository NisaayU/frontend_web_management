import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJs,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import styled, { keyframes } from "styled-components";
import { useGlobalContext } from "../../context/globalContext";
import { dateFormat } from "../../utils/dateFormat";

ChartJs.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

/* ─── ANIMATIONS ─── */
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ─── LEGEND ICONS ─── */
function DotIcon({ color }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="4" fill={color} />
    </svg>
  );
}

function Chart() {
  const { incomes, expenses } = useGlobalContext();
  const chartRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ─── SUMMARY STATS ─── */
  const totalIncome  = incomes.reduce((s, i) => s + (i.total || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netBalance   = totalIncome - totalExpense;

  const formatRupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n || 0);

  /* ─── CHART DATA ─── */
  const labels = incomes.map(({ date }) => dateFormat(date));

  const data = {
    labels,
    datasets: [
      {
        label: "Penjualan",
        data: incomes.map(({ total }) => total),
        borderColor: "#10b981",
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "transparent";
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, "rgba(16,185,129,0.22)");
          grad.addColorStop(1, "rgba(16,185,129,0.00)");
          return grad;
        },
        borderWidth: 2.5,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: isMobile ? 3 : 5,
        pointHoverRadius: isMobile ? 5 : 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: "Pengeluaran",
        data: expenses.map(({ amount }) => amount),
        borderColor: "#f43f5e",
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "transparent";
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, "rgba(244,63,94,0.18)");
          grad.addColorStop(1, "rgba(244,63,94,0.00)");
          return grad;
        },
        borderWidth: 2.5,
        pointBackgroundColor: "#f43f5e",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: isMobile ? 3 : 5,
        pointHoverRadius: isMobile ? 5 : 7,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  /* ─── CHART OPTIONS ─── */
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: { display: false }, // custom legend below
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "rgba(255,255,255,0.55)",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        padding: isMobile ? 10 : 14,
        cornerRadius: 12,
        titleFont: { family: "Sora", size: isMobile ? 10 : 12, weight: "600" },
        bodyFont:  { family: "JetBrains Mono", size: isMobile ? 11 : 13, weight: "600" },
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label;
            const val   = formatRupiah(ctx.raw);
            return `  ${label}: ${val}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "rgba(15,23,42,0.35)",
          font: { family: "Sora", size: isMobile ? 9 : 11, weight: "600" },
          maxTicksLimit: isMobile ? 4 : 8,
          maxRotation: isMobile ? 40 : 0,
        },
      },
      y: {
        position: "left",
        grid: {
          color: "rgba(15,23,42,0.05)",
          drawBorder: false,
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: "rgba(15,23,42,0.35)",
          font: { family: "JetBrains Mono", size: isMobile ? 9 : 11 },
          maxTicksLimit: 5,
          callback: (val) => {
            if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
            if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}rb`;
            return val;
          },
        },
      },
    },
  };

  return (
    <Wrapper>
      {/* ── SUMMARY PILLS ── */}
      <SummaryRow>
        <SummaryPill color="income">
          <PillDot color="#10b981" />
          <div>
            <span className="pill-label">Pemasukan</span>
            <span className="pill-val">{formatRupiah(totalIncome)}</span>
          </div>
        </SummaryPill>

        <SummaryPill color="expense">
          <PillDot color="#f43f5e" />
          <div>
            <span className="pill-label">Pengeluaran</span>
            <span className="pill-val">{formatRupiah(totalExpense)}</span>
          </div>
        </SummaryPill>

        <SummaryPill color={netBalance >= 0 ? "income" : "expense"} accent>
          <PillDot color={netBalance >= 0 ? "#10b981" : "#f43f5e"} />
          <div>
            <span className="pill-label">Saldo Bersih</span>
            <span className="pill-val net" data-positive={netBalance >= 0}>
              {formatRupiah(netBalance)}
            </span>
          </div>
        </SummaryPill>
      </SummaryRow>

      {/* ── CHART AREA ── */}
      <ChartArea>
        <Line ref={chartRef} data={data} options={options} />
      </ChartArea>

      {/* ── CUSTOM LEGEND ── */}
      <LegendRow>
        <LegendItem>
          <DotIcon color="#10b981" />
          <span>Penjualan</span>
          <LegendLine color="#10b981" />
        </LegendItem>
        <LegendItem>
          <DotIcon color="#f43f5e" />
          <span>Pengeluaran</span>
          <LegendLine color="#f43f5e" />
        </LegendItem>
      </LegendRow>
    </Wrapper>
  );
}

/* ─── STYLED COMPONENTS ─── */
const Wrapper = styled.div`
  font-family: 'Sora', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${fadeIn} .5s ease both;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: .6rem;
  flex-wrap: wrap;

  @media (max-width: 500px) {
    gap: .5rem;
  }
`;

const PillDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => p.color};
  flex-shrink: 0;
  margin-top: 4px;
`;

const SummaryPill = styled.div`
  flex: 1;
  min-width: 90px;
  display: flex;
  align-items: flex-start;
  gap: .5rem;
  background: ${p =>
    p.accent
      ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
      : "#f8fafc"};
  border: 1.5px solid ${p =>
    p.accent ? "rgba(16,185,129,0.2)" : "#e8ecf3"};
  border-radius: 14px;
  padding: .75rem .875rem;

  .pill-label {
    display: block;
    font-size: .6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: rgba(15,23,42,0.38);
    margin-bottom: .15rem;
  }

  .pill-val {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: .82rem;
    font-weight: 600;
    color: rgba(15,23,42,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.net[data-positive="true"]  { color: #15803d; }
    &.net[data-positive="false"] { color: #be123c; }
  }

  @media (max-width: 400px) {
    padding: .6rem .7rem;
    .pill-val { font-size: .72rem; }
  }
`;

const ChartArea = styled.div`
  position: relative;
  width: 100%;
  height: 260px;

  @media (max-width: 768px) { height: 210px; }
  @media (max-width: 480px) { height: 175px; }
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .68rem;
  font-weight: 600;
  color: rgba(15,23,42,0.45);
  letter-spacing: .04em;
  text-transform: uppercase;
`;

const LegendLine = styled.div`
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: ${p => p.color};
`;

export default Chart;