import { useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";

const ROLES = [
  {
    key: "OWNER",
    label: "Shop Owner",
    sub: "Full visibility",
    description: "Access the operations terminal, finance dashboard, inventory vault, and staff management.",
    icon: "◈",
    redirect: "/owner-dashboard",
    accent: "#c5a059",
    tags: ["Finance", "Analytics", "Staff", "Inventory"],
  },
  {
    key: "OSTA",
    label: "Senior Tech",
    sub: "Osta designation",
    description: "Claim and manage repair tickets, deploy parts from vault, generate invoices, supervise junior techs.",
    icon: "◆",
    redirect: "/osta-control",
    accent: "#6da3d4",
    tags: ["Work Orders", "Parts", "Sessions", "Invoices"],
  },
  {
    key: "SABI",
    label: "Junior Tech",
    sub: "Sabi designation",
    description: "View assigned tasks, punch in/out of diagnostic sessions, and track your active repairs.",
    icon: "◇",
    redirect: "/sabi-terminal",
    accent: "#7ecba4",
    tags: ["My Tasks", "Sessions", "Status"],
  },
  {
    key: "CUSTOMER",
    label: "Customer",
    sub: "Public access",
    description: "Experience the customer-facing intake flow and order tracking portal.",
    icon: "○",
    redirect: "/track/SR-26-0001",
    accent: "#b07ecb",
    tags: ["Track Order", "Public Portal"],
  },
];

export default function DemoSelection() {
  const navigate = useNavigate();
  const { enterDemo } = useDemo();

  const handleSelect = (role) => {
    enterDemo(role.key);
    navigate(role.redirect);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center px-6 py-16 font-serif">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#c5a059]/60 mb-4">
          Interactive Demo
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Choose your perspective
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-sans">
          All actions work in-session. No data is saved. Explore freely.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => handleSelect(role)}
            className="group relative bg-[#161920] border border-[#2a2d35] hover:border-white/20 rounded-2xl p-7 text-left transition-all duration-300 hover:bg-[#1c1f28] hover:-translate-y-0.5 cursor-pointer"
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-5">
              <span
                className="text-3xl font-bold leading-none"
                style={{ color: role.accent }}
              >
                {role.icon}
              </span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {role.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border font-bold"
                    style={{ borderColor: `${role.accent}30`, color: `${role.accent}90` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Label */}
            <h2 className="text-white text-xl font-bold mb-0.5">{role.label}</h2>
            <p
              className="text-[10px] uppercase tracking-widest font-bold mb-4"
              style={{ color: role.accent }}
            >
              {role.sub}
            </p>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed font-sans">
              {role.description}
            </p>

            {/* Bottom CTA */}
            <div
              className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: role.accent }}
            >
              Enter as {role.label}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>

            {/* Subtle accent line on hover */}
            <div
              className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full rounded-b-2xl transition-all duration-500"
              style={{ backgroundColor: role.accent }}
            />
          </button>
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-12 text-[10px] uppercase tracking-widest text-slate-700 font-sans">
        Data resets on page refresh · No backend calls are made
      </p>

      {/* Back link */}
      <button
        onClick={() => navigate("/")}
        className="mt-6 text-slate-600 hover:text-slate-400 text-[11px] uppercase tracking-widest transition-colors font-sans"
      >
        ← Back to home
      </button>
    </div>
  );
}
