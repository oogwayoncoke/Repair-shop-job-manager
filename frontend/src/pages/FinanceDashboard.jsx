import {
  DollarSign,
  Package,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api";

const CATEGORIES = [
  { value: "parts", label: "Spare Parts" },
  { value: "labor", label: "Technician / Labor" },
  { value: "rent", label: "Shop Rent" },
  { value: "utilities", label: "Electricity / Internet" },
  { value: "marketing", label: "Marketing / Ads" },
  { value: "other", label: "Miscellaneous" },
];

const EMPTY_FORM = { title: "", amount: "", category: "other" };

// ─── Main Page ────────────────────────────────────────────────────────────────
const FinanceDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(null); // null | "add" | expense object

  const fetchAll = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        api.get("/shops/finance/summary/"),
        api.get("/shops/expenses/"),
      ]);

      setSummary(sumRes?.data || null);

      // Safety Check: Guarantee `expenses` is always an array
      const expData = expRes?.data;
      setExpenses(Array.isArray(expData) ? expData : []);
    } catch (err) {
      console.error("Treasury Sync Failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaved = () => {
    setModal(null);
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense entry?")) return;
    try {
      await api.delete(`/shops/expenses/${id}/`);
      fetchAll();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-[#c5a059] uppercase italic animate-pulse tracking-[0.4em]">
        Syncing Treasury Data...
      </div>
    );

  if (error || !summary)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-red-500 uppercase italic tracking-[0.2em]">
        Critical Error: Financial Link Severed.
      </div>
    );

  const { total_revenue, total_expenses, net_profit, expense_breakdown } =
    summary;

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 font-serif text-slate-200">
      {/* Header */}
      <header className="mb-12 border-b border-[#2d3139] pb-6">
        <h1 className="text-[#c5a059] text-3xl tracking-[0.4em] uppercase font-bold">
          Financial Oversight
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] mt-2 italic">
          Real-time Revenue & Expense Manifest
        </p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard
          title="Total Revenue"
          value={total_revenue}
          icon={<TrendingUp className="text-emerald-500" />}
          color="text-emerald-500"
        />
        <StatCard
          title="Total Expenses"
          value={total_expenses}
          icon={<TrendingDown className="text-red-500" />}
          color="text-red-500"
        />
        <StatCard
          title="Net Profit"
          value={net_profit}
          icon={<DollarSign className="text-[#c5a059]" />}
          color="text-[#c5a059]"
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category breakdown */}
        <section className="bg-[#1a1d23] border border-[#2d3139] rounded-3xl p-8">
          <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-6 font-bold flex items-center gap-2 font-serif">
            <Package size={18} className="text-[#c5a059]" /> Category Allocation
          </h2>
          <div className="space-y-6">
            {Object.entries(expense_breakdown || {}).length === 0 && (
              <p className="text-slate-600 text-xs uppercase tracking-widest italic">
                No expense data yet.
              </p>
            )}
            {Object.entries(expense_breakdown || {}).map(
              ([category, amount], i) => {
                const pct =
                  total_expenses > 0 ? (amount / total_expenses) * 100 : 0;
                const label =
                  CATEGORIES.find((c) => c.value === category)?.label ||
                  category;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] uppercase mb-2">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-500">
                        {parseFloat(amount).toLocaleString()} EGP
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0f1115] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c5a059]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* Expense ledger */}
        <section className="bg-[#1a1d23] border border-[#2d3139] rounded-3xl p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2 font-serif">
              <TrendingDown size={18} className="text-red-500" /> Expense Ledger
            </h2>
            <button
              onClick={() => setModal("add")}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#c5a059] border border-[#c5a059]/30 hover:border-[#c5a059] px-3 py-1.5 rounded-lg transition-all"
            >
              <Plus size={12} /> Add Entry
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {(expenses || []).length === 0 && (
              <p className="text-slate-600 text-xs uppercase tracking-widest italic text-center py-8">
                No expenses recorded.
              </p>
            )}
            {(expenses || []).map((exp) => (
              <ExpenseRow
                key={exp.id}
                expense={exp}
                onEdit={() => setModal(exp)}
                onDelete={() => handleDelete(exp.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Modal */}
      {modal && (
        <ExpenseModal
          expense={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

// ─── Expense Row ──────────────────────────────────────────────────────────────
const ExpenseRow = ({ expense, onEdit, onDelete }) => {
  const label =
    CATEGORIES.find((c) => c.value === expense.category)?.label ||
    expense.category;
  return (
    <div className="flex items-center justify-between bg-[#0f1115] border border-[#2d3139] rounded-xl px-4 py-3 group">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-slate-200 text-sm font-bold truncate">
          {expense.title}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-red-400 font-mono text-sm font-bold">
          -{parseFloat(expense.amount).toLocaleString()} EGP
        </span>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-[#2d3139] text-slate-400 hover:text-[#c5a059] transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-[#2d3139] text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
const ExpenseModal = ({ expense, onClose, onSaved }) => {
  const isEdit = Boolean(expense);
  const [form, setForm] = useState(
    expense
      ? {
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setErr("Title is required.");
      return;
    }
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      setErr("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (isEdit) {
        await api.patch(`/shops/expenses/${expense.id}/`, form);
      } else {
        await api.post("/shops/expenses/", form);
      }
      onSaved();
    } catch (e) {
      setErr("Failed to save. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1d23] border border-[#2d3139] rounded-3xl p-8 w-full max-w-md mx-4 font-serif">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-[#c5a059] text-lg tracking-widest uppercase font-bold">
              {isEdit ? "Edit Expense" : "New Expense"}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1 italic">
              {isEdit
                ? "Update the entry below"
                : "Record a new operating cost"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Shop Rent – April"
              className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-[#c5a059]/50 placeholder:text-slate-600 font-sans"
            />
          </Field>

          <Field label="Amount (EGP)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-[#c5a059]/50 placeholder:text-slate-600 font-sans font-mono"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full bg-[#0f1115] border border-[#2d3139] rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-[#c5a059]/50 font-sans"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          {err && (
            <p className="text-red-400 text-[10px] uppercase tracking-widest">
              {err}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#2d3139] text-slate-400 text-[11px] uppercase tracking-widest hover:border-slate-500 hover:text-slate-300 transition-all font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/40 text-[#c5a059] text-[11px] uppercase tracking-widest hover:bg-[#c5a059]/20 hover:border-[#c5a059] transition-all disabled:opacity-40 font-sans"
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Record Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-sans">
      {label}
    </label>
    {children}
  </div>
);

const StatCard = ({ title, value, icon, color, highlight }) => (
  <div
    className={`p-8 rounded-3xl border ${highlight ? "border-[#c5a059] bg-[#c5a059]/5" : "border-[#2d3139] bg-[#1a1d23]"} transition-all`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        {title}
      </span>
      {icon}
    </div>
    <div className="flex items-baseline gap-2">
      <h3 className={`text-3xl font-mono font-bold ${color}`}>
        {parseFloat(value).toLocaleString()}
      </h3>
      <span className="text-[10px] text-slate-500">EGP</span>
    </div>
  </div>
);

export default FinanceDashboard;