"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/ui/summary-card";
import Spinner from "@/components/ui/Spinner";
import {
  Calendar,
  Download,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
} from "lucide-react";
import { useCollections } from "@/hooks/use-collections";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { CollectionReport } from "@/hooks/use-collections";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function CollectionReportPage() {
  const params = useParams();
  const router = useRouter();
  // Use nodeId *only* from URL param
  const nodeId = (params?.nodeId as string) || "";

  const { getCollectionReport } = useCollections();

  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [report, setReport] = useState<CollectionReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report (tries the hook first; falls back to fetch with year query)
  async function fetchReport(nodeIdToFetch: string, yearToFetch: string) {
    if (!nodeIdToFetch) return;
    setLoading(true);
    setError(null);
    try {
      if (typeof getCollectionReport === "function") {
        // Cast to any so we can optionally pass year without TS errors
        const r = await (getCollectionReport as any)(
          nodeIdToFetch,
          yearToFetch
        );
        if (r) {
          setReport(r as CollectionReport);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch collection report.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!nodeId) return;
    fetchReport(nodeId, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  async function handleLoadYear() {
    if (!nodeId) return;
    await fetchReport(nodeId, year);
  }

  // ===== Derived helpers =====
  const monthly = useMemo(() => {
    const arr = report?.monthlyCollection ?? [];
    const padded = Array.from({ length: 12 }, (_, i) => arr[i] ?? 0);
    return padded;
  }, [report]);

  const monthlyChartData = useMemo(
    () => MONTHS.map((m, i) => ({ month: m, value: monthly[i] ?? 0 })),
    [monthly]
  );

  const totalFromMonths = useMemo(
    () => monthly.reduce((s, n) => s + (n || 0), 0),
    [monthly]
  );

  const cumulativeData = useMemo(() => {
    let run = 0;
    return MONTHS.map((m, i) => {
      run += monthly[i] ?? 0;
      return { month: m, value: run };
    });
  }, [monthly]);

  const lastIdxWithData = useMemo(() => {
    for (let i = monthly.length - 1; i >= 0; i--)
      if ((monthly[i] ?? 0) > 0) return i;
    return monthly.length - 1;
  }, [monthly]);

  const lastMonthVal = monthly[lastIdxWithData] ?? 0;
  const prevMonthVal = monthly[Math.max(0, lastIdxWithData - 1)] ?? 0;
  const momDelta = lastMonthVal - prevMonthVal;
  const momPct = prevMonthVal ? (momDelta / prevMonthVal) * 100 : 0;

  const maxVal = Math.max(...monthly);
  const minVal = Math.min(...monthly);
  const maxIdx = monthly.indexOf(maxVal);
  const minIdx = monthly.indexOf(minVal);

  const mean = totalFromMonths / (monthly.length || 1);
  const variance =
    monthly.reduce((s, n) => s + Math.pow((n || 0) - mean, 2), 0) /
    (monthly.length || 1);
  const stdDev = Math.sqrt(variance);

  const last3 = monthly.slice(
    Math.max(0, lastIdxWithData - 2),
    lastIdxWithData + 1
  );
  const runRate = last3.length
    ? (last3.reduce((s, n) => s + n, 0) / last3.length) * 12
    : 0;

  const quarters = useMemo(() => {
    const q = [
      {
        name: "Q1",
        value: (monthly[0] ?? 0) + (monthly[1] ?? 0) + (monthly[2] ?? 0),
      },
      {
        name: "Q2",
        value: (monthly[3] ?? 0) + (monthly[4] ?? 0) + (monthly[5] ?? 0),
      },
      {
        name: "Q3",
        value: (monthly[6] ?? 0) + (monthly[7] ?? 0) + (monthly[8] ?? 0),
      },
      {
        name: "Q4",
        value: (monthly[9] ?? 0) + (monthly[10] ?? 0) + (monthly[11] ?? 0),
      },
    ];
    return q;
  }, [monthly]);

  // Histogram of monthly values (5 bins)
  const histogramData = useMemo(() => {
    const values = monthly;
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    if (hi === lo)
      return [{ bin: `${lo.toLocaleString()}`, count: values.length }];
    const bins = 5;
    const w = (hi - lo) / bins;
    const counts = Array.from({ length: bins }, () => 0);
    values.forEach((v) => {
      const idx = Math.min(bins - 1, Math.floor((v - lo) / w));
      counts[idx]++;
    });
    return counts.map((c, i) => ({
      bin: `${Math.round(lo + i * w).toLocaleString()}–${Math.round(
        lo + (i + 1) * w
      ).toLocaleString()}`,
      count: c,
    }));
  }, [monthly]);

  // Children arrays
  const topChildren = useMemo(() => {
    const t = report?.topPerformingChildren;
    if (!t) return [] as { name: string; total: number }[];
    return Array.isArray(t) ? t : [t];
  }, [report]);

  const worstChildren = useMemo(() => {
    const w = report?.worstPerformingChildren;
    if (!w) return [] as { name: string; total: number }[];
    return Array.isArray(w) ? w : [w];
  }, [report]);

  // ===== Exports =====
  function exportMonthlyCSV() {
    if (!report) return;
    const header = ["month", "collection", "cumulative", "mom_delta"];
    const rows = monthlyChartData.map((r, i) => [
      r.month,
      String(r.value),
      String(cumulativeData[i].value),
      String(i === 0 ? 0 : r.value - (monthly[i - 1] ?? 0)),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collections-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportChildrenCSV() {
    const childRows: (string | number)[][] =
      report?.childPerformances.map(({ name, total }) => [name, total]) ?? [];

    const rows: (string | number)[][] = [["name", "total"], ...childRows];
    const csv = rows.map((r) => r?.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `regional-performance-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const element = document.body; // you can scope to a specific div if needed
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let position = 0;
    let heightLeft = imgHeight;

    // If the content spans multiple pages
    while (heightLeft > 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        position = -pageHeight;
      }
    }

    pdf.save(`collection-report-${year}.pdf`);
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                {report?.name}: Collection Report
              </h1>
              <p className="text-sm text-gray-600">
                Year: <span className="font-medium">{year}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              aria-label="Year"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoadYear();
              }}
              className="w-28 border rounded-md px-3 py-2 text-sm"
            />
            <Button variant={"secondary"} onClick={handleLoadYear} className="px-3 py-2">
              Load
            </Button>
            <Button
              variant="ghost"
              onClick={exportPDF}
              title="Export monthly CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {loading && !report ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        ) : !report ? (
          <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-600">
            No report available for this year.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <motion.section
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <SummaryCard
                  title="Total Collection"
                  value={report.totalCollection}
                  prefix="₹"
                  icon={<IndianRupee className="h-5 w-5 text-orange-600" />}
                />
                <SummaryCard
                  title="Avg per user"
                  value={report.averageCollectionPerUser}
                  prefix="₹"
                  icon={<Users className="h-5 w-5 text-orange-600" />}
                />
                <SummaryCard
                  title="Collections Today"
                  value={report.collectionsToday}
                  prefix="₹"
                  icon={<Calendar className="h-5 w-5 text-orange-600" />}
                />
                <SummaryCard
                  title="Total Members"
                  value={report.totalMembers}
                  icon={<Users className="h-5 w-5 text-orange-600" />}
                />
                <SummaryCard
                  title={`MoM ${momDelta >= 0 ? "Increase" : "Decrease"}`}
                  value={Math.abs(momDelta)}
                  prefix="₹"
                  icon={
                    momDelta >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    )
                  }
                />
                <SummaryCard
                  title="Run Rate (3‑mo)"
                  value={Math.round(runRate)}
                  prefix="₹"
                  icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
                />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                  <span className="font-medium">Peak:</span> {MONTHS[maxIdx]} —
                  ₹{maxVal.toLocaleString()} (Std Dev:{" "}
                  {Math.round(stdDev).toLocaleString()})
                </div>
                <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                  <span className="font-medium">Trough:</span> {MONTHS[minIdx]}{" "}
                  — ₹{minVal.toLocaleString()} (MoM: {momPct.toFixed(1)}%)
                </div>
              </div>
            </motion.section>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Monthly line (trend) */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Monthly Trend</h3>
                  <div className="text-sm text-gray-500">
                    Year: {report.year}
                  </div>
                </div>

                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={monthlyChartData}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(v: any) => [
                          v?.toLocaleString?.() ?? v,
                          "Collection",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#f97316"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Quarterly bar */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-4"
              >
                <h3 className="text-lg font-semibold mb-3">Quarterly Totals</h3>
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={quarters}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(v: any) => [
                          v?.toLocaleString?.() ?? v,
                          "Amount",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        fill="#f97316"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Monthly bar (histogram-like) */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-4"
              >
                <h3 className="text-lg font-semibold mb-3">Monthly Bars</h3>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(v: any) => [
                          v?.toLocaleString?.() ?? v,
                          "Amount",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        fill="#f97316"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Distribution histogram */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-4"
              >
                <h3 className="text-lg font-semibold mb-3">
                  Monthly Distribution (Histogram)
                </h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={histogramData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        fill="#f97316"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Top vs Worst children (bars) */}
              {report.type != "Gram/Shakha/Mohalla/Sthaan" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <h3 className="text-lg font-semibold mb-3">Top Regions</h3>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={topChildren.map((c) => ({
                          name: c.name,
                          value: c.total,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide={topChildren.length > 5} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                          fill="#10b981"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {report.type != "Gram/Shakha/Mohalla/Sthaan" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4"
                >
                  <h3 className="text-lg font-semibold mb-3">
                    Low-collection Regions
                  </h3>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={worstChildren.map((c) => ({
                          name: c.name,
                          value: c.total,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" hide={worstChildren.length > 5} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                          fill="#ef4444"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Tables */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Monthly Table</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button onClick={exportMonthlyCSV}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Month</th>
                      <th className="py-2 pr-4">Collection</th>
                      <th className="py-2 pr-4">Cumulative</th>
                      <th className="py-2 pr-4">MoM Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyChartData.map((row, i) => (
                      <tr key={row.month} className="border-b last:border-0">
                        <td className="py-2 pr-4">{row.month}</td>
                        <td className="py-2 pr-4">
                          ₹{row.value.toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          ₹{cumulativeData[i].value.toLocaleString()}
                        </td>
                        <td
                          className={`py-2 pr-4 ${
                            i > 0 && row.value - (monthly[i - 1] ?? 0) >= 0
                              ? "text-emerald-700"
                              : "text-red-700"
                          }`}
                        >
                          {i === 0
                            ? "-"
                            : `₹${(
                                row.value - (monthly[i - 1] ?? 0)
                              ).toLocaleString()}`}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-4 font-semibold">Total</td>
                      <td className="py-2 pr-4 font-semibold">
                        ₹{totalFromMonths.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4" />
                      <td className="py-2 pr-4" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Region-wise table */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  Region-wise Collection
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button onClick={exportChildrenCSV}>
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4">Region</th>
                      <th className="py-2 pr-4">Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.childPerformances?.map((row, i) => (
                      <tr key={row.name} className="border-b last:border-0">
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 pr-4">
                          ₹{row.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-4 font-semibold">Total</td>
                      <td className="py-2 pr-4 font-semibold">
                        ₹{report.totalCollection.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {report.type != "Gram/Shakha/Mohalla/Sthaan" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2"></div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topChildren.map((c, i) => (
                          <tr
                            key={`top-${c.name}-${i}`}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 pr-4">{i + 1}</td>
                            <td className="py-2 pr-4">{c.name}</td>
                            <td className="py-2 pr-4">
                              ₹{Number(c.total).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {topChildren.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-3 text-gray-500">
                              No data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Low-collection Regions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {worstChildren.map((c, i) => (
                          <tr
                            key={`worst-${c.name}-${i}`}
                            className="border-b last:border-0"
                          >
                            <td className="py-2 pr-4">{i + 1}</td>
                            <td className="py-2 pr-4">{c.name}</td>
                            <td className="py-2 pr-4">
                              ₹{Number(c.total).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {worstChildren.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-3 text-gray-500">
                              No data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
