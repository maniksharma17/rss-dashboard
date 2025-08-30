'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Calendar,
  CreditCard,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Edit2,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { SummaryCard } from "@/components/ui/summary-card";
import { AddPaymentModal } from "@/components/modals/add-payment-modal";
import { MemberResponse, Mode, PaymentRow, useMembers } from "@/hooks/use-members";
import Link from "next/link";
import { format } from "date-fns";
import { EditMemberModal } from "@/components/modals/edit-member-modal";
import { DeleteMemberModal } from "@/components/modals/delete-member-modal";

/**
 * Single-column, subtle design:
 * - Header -> Member Card -> Summary -> Filters -> Table
 * - One export button (header)
 * - No glass/backdrop blur
 */

const inr = (n: number | undefined) =>
  `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function MemberPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId as string;

  const { getMember } = useMembers();

  // We'll store the inner member data object here (robust to wrapper shapes)
  const [memberData, setMemberData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Table + Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [modes, setModes] = useState<Mode[]>([]);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // when deleted, send user back
  const handleDeleted = () => {
    setDeleteOpen(false);
    router.back(); 
  };


  const searchRef = useRef<HTMLInputElement | null>(null);

  // Fetch member (robust: handles getMember hook returning wrapper or inner object)
  const fetchMember = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      if (getMember) {
        const res = await getMember(memberId);
        setMemberData(res)
      } else {
        const res = await fetch(`/api/members/${memberId}`);
        if (res.ok) {
          const json = await res.json();
          // API may return wrapper { success, data }
          setMemberData(json?.data ?? json);
        }
      }
    } catch (e) {
      console.error("failed to fetch member", e);
    } finally {
      setLoading(false);
    }
  }, [getMember, memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  // payments derived
  const payments: PaymentRow[] = useMemo(() => memberData?.payments ?? [], [memberData?.payments]);

  const sortedPayments = useMemo(
    () => [...payments].sort((a, b) => (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())),
    [payments]
  );

  // filter function (mode, date range, amount range, text search)
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedPayments.filter((p) => {
      if (modes.length > 0 && !modes.includes(p.modeOfPayment)) return false;
      if (minAmount !== undefined && (p.amount ?? 0) < minAmount) return false;
      if (maxAmount !== undefined && (p.amount ?? 0) > maxAmount) return false;
      if (startDate) {
        const s = new Date(startDate).setHours(0, 0, 0, 0);
        if (!p.date || new Date(p.date).getTime() < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate).setHours(23, 59, 59, 999);
        if (!p.date || new Date(p.date).getTime() > e) return false;
      }
      if (!q) return true;
      const mode = (p.modeOfPayment || "").toString().toLowerCase();
      const desc = (p.description || "").toString().toLowerCase();
      const amt = String(p.amount || "").toLowerCase();
      const d = p.date ? format(new Date(p.date), "dd/MM/yyyy") : "";
      return mode.includes(q) || desc.includes(q) || amt.includes(q) || d.includes(q);
    });
  }, [sortedPayments, search, modes, minAmount, maxAmount, startDate, endDate]);

  const totalAmount = useMemo(() => (memberData?.totalPaid ?? filteredPayments.reduce((s, p) => s + (p.amount ?? 0), 0)), [memberData?.totalPaid, filteredPayments]);
  const lastPayment = sortedPayments[0];
  const memberSince = memberData?.createdAt ? format(new Date(memberData.createdAt), "dd MMM yyyy") : undefined;

  // pagination
  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPayments.slice(start, start + limit);
  }, [filteredPayments, page, limit]);

  // DataTable columns
  const paymentColumns: Column<PaymentRow>[] = [
    {
      key: "date",
      header: "Date",
      render: (value: string) => (value ? format(new Date(value), "dd/MM/yyyy") : "-"),
    },
    {
      key: "modeOfPayment",
      header: "Payment Mode",
      render: (value: Mode) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === "cash" ? "bg-green-50 text-green-800" : value === "upi" ? "bg-blue-50 text-blue-800" : "bg-amber-50 text-amber-800"
        }`}>
          {String(value)?.toUpperCase?.() ?? "-"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (value: number) => inr(value),
    },
  ];

  // Export helpers (CSV)
  async function exportCSV(useFiltered = true) {
    const rows = (useFiltered ? filteredPayments : payments) ?? [];
    if (!rows.length) {
      alert("No payments to export.");
      return;
    }
    const header = ["date", "amount", "modeOfPayment", "description"];
    const csv = [header.join(",")]
      .concat(
        rows.map((r) => [r.date ?? "", String(r.amount ?? ""), r.modeOfPayment ?? "", (r.description ?? "").replace(/\n/g, " ")].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(memberData?.name ?? "member").replace(/\s+/g, "_")}-payments-${useFiltered ? "filtered" : "full"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Simple "send receipt" mock/fallback
  async function sendReceipt(paymentId?: string) {
    try {
      if (!paymentId && lastPayment) paymentId = lastPayment._id as string;
      if (!paymentId) throw new Error("No payment available to send receipt.");
      const res = await fetch(`/api/members/${memberId}/send-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (res.ok) {
        alert("Receipt sent successfully.");
      } else {
        console.warn("send-receipt endpoint not available, using mock");
        alert("Receipt sent (mock).");
      }
    } catch (e) {
      console.error(e);
      alert("Could not send receipt. (mock fallback executed)");
    }
  }

  async function copyMemberId() {
    if (!memberData?._id) return;
    try {
      await navigator.clipboard.writeText(memberData._id);
      alert("Member ID copied to clipboard.");
    } catch {
      alert("Could not copy to clipboard.");
    }
  }

  async function updateMember(payload: Partial<MemberResponse>) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        // API may return wrapper or inner
        const inner = updated?.data ?? updated;
        setMemberData((prev: any) => ({ ...(prev ?? {}), ...(inner ?? {}) }));
        alert("Member updated");
        setEditOpen(false);
        return;
      }
      // fallback optimistic
      setMemberData((prev: any) => ({ ...(prev ?? {}), ...(payload ?? {}) }));
      alert("Member updated (mock)");
      setEditOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to update member");
    }
  }

  // Simple skeleton while loading with no prior data
  if (loading && !memberData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-10 w-1/3 bg-gray-200 rounded" />
          <div className="h-6 w-1/4 bg-gray-200 rounded" />
          <div className="h-48 bg-white rounded-lg shadow-sm border border-gray-100" />
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-full mx-auto px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-10">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {memberData?.name ?? "Member"}
              </h1>
              <div className="mt-1 text-sm text-gray-600">
                {memberData?.phone && (
                  <span className="inline-flex items-center gap-2 mr-3">
                    <Phone className="h-4 w-4" /> {memberData.phone}
                  </span>
                )}
                {memberData?.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {memberData.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS cluster */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => exportCSV(true)} className="hidden sm:inline-flex">
              <FileText className="h-4 w-4 mr-2" /> Export CSV
            </Button>

            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit
            </Button>

            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>

            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Payment
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-full mx-auto px-6 py-6 space-y-6">
        {/* Member Card (top after header) */}
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold">{(memberData?.name ?? "?").slice(0, 1)}</div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{memberData?.name ?? "Member"}</h2>
                  <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-2">
                    {memberData?.branchId?.name && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-gray-800"><Building2 className="h-4 w-4" />{memberData.branchId.name}</span>}
                    {memberSince && <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-blue-50 text-blue-700"><Calendar className="h-4 w-4" />Member since {memberSince}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={copyMemberId} className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm text-gray-700 bg-white">
                    <Hash className="h-4 w-4" /> Copy ID
                  </button>
                  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit2 className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700">
                <div><span className="font-medium">Phone:</span> {memberData?.phone ?? "-"}</div>
                <div><span className="font-medium">Email:</span> {memberData?.email ?? "-"}</div>
                <div><span className="font-medium">Age:</span> {memberData?.age ?? "-"}</div>
                <div><span className="font-medium">Occupation:</span> {memberData?.occupation ?? "-"}</div>
                {memberData?.address && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-1 text-gray-500" /><div><span className="font-medium">Address:</span> {memberData.address}</div></div>}
                <div className="text-xs text-gray-500">Member ID: <span className="font-mono">{memberData?._id ?? "-"}</span></div>
              </div>

              {lastPayment && (
                <p className="mt-3 text-sm text-gray-600">Last payment: <span className="font-medium">{inr(lastPayment.amount)}</span> on {format(new Date(lastPayment.date), 'dd MMM yyyy')} via {lastPayment.modeOfPayment?.toUpperCase()}</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryCard title="Total Payments" value={totalAmount} prefix="₹" icon={<CreditCard className="h-5 w-5" />} />
          <SummaryCard title="Number of Payments" value={payments.length} icon={<Calendar className="h-5 w-5" />} />
          <SummaryCard title="Average Payment" value={Number((totalAmount/payments.length).toFixed(2))} prefix="₹" icon={<CreditCard className="h-5 w-5" />} />
          <SummaryCard title="Highest Payment" value={Math.max(...payments.map(payment => {return payment.amount}))} prefix="₹" icon={<CreditCard className="h-5 w-5" />} />
        </section>

        {/* Filters */}
        <section className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by mode, description, amount or date…"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input type="date" value={startDate ?? ""} onChange={(e) => { setStartDate(e.target.value || null); setPage(1); }} className="border rounded-md px-2 py-1 text-sm" />

              <label className="text-sm text-gray-600">To</label>
              <input type="date" value={endDate ?? ""} onChange={(e) => { setEndDate(e.target.value || null); setPage(1); }} className="border rounded-md px-2 py-1 text-sm" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mode:</label>
              {(["cash", "upi", "card"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setModes((prev) => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-sm border ${modes.includes(m) ? "bg-indigo-50 border-indigo-200" : "bg-white"}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-600">Min ₹</label>
              <input type="number" value={minAmount ?? ""} onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : undefined)} className="border rounded-md px-2 py-1 w-28 text-sm" />

              <label className="text-sm text-gray-600">Max ₹</label>
              <input type="number" value={maxAmount ?? ""} onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : undefined)} className="border rounded-md px-2 py-1 w-28 text-sm" />

              <button onClick={() => { setSearch(""); setStartDate(null); setEndDate(null); setModes([]); setMinAmount(undefined); setMaxAmount(undefined); setPage(1); }} className="text-sm text-gray-600">Clear</button>
            </div>
          </div>
        </section>

        {/* Table */}
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">Payment Records</h3>
          </div>

          <DataTable
            columns={paymentColumns}
            data={paginatedPayments}
            totalItems={filteredPayments.length}
            page={page}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => setLimit(l)}
            onSearch={(q) => setSearch(q)}
            searchPlaceholder="Search by mode, description, amount or date…"
          />

          {!loading && filteredPayments.length === 0 && (
            <div className="mt-4 text-sm text-gray-500">No payments found. Try adjusting filters or add a payment.</div>
          )}
        </motion.section>
      </main>

      {/* Modals */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); fetchMember(); }}
        memberId={memberId}
        memberName={memberData?.name ?? ""}
      />

      <EditMemberModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        member={memberData}
        onUpdated={fetchMember}
      />

      <DeleteMemberModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        memberId={memberId}
        memberName={memberData?.name}
        onDeleted={handleDeleted}
      />
      
    </div>
  );
}

