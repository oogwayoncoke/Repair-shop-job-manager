import { useNavigate } from "react-router-dom";
import { useDemo } from "../context/DemoContext";

const ROLE_LABELS = {
  OWNER: "Shop Owner",
  OSTA: "Senior Tech (Osta)",
  SABI: "Junior Tech (Sabi)",
  CUSTOMER: "Customer",
};

export default function DemoBanner() {
  const { isDemo, demoRole, exitDemo } = useDemo();
  const navigate = useNavigate();

  if (!isDemo) return null;

  const handleExit = () => {
    exitDemo();
    navigate("/");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-200 flex items-center justify-between px-5 py-2 bg-[#1a1500] border-b border-[#c5a059]/30 font-sans">
      <div className="flex items-center gap-3">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5a059] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5a059]" />
        </span>
        <span className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold">
          Demo Mode
        </span>
        <span className="text-[#c5a059]/40 text-[10px]">·</span>
        <span className="text-[#c5a059]/70 text-[10px] uppercase tracking-widest">
          {ROLE_LABELS[demoRole] || demoRole}
        </span>
        <span className="text-[#c5a059]/40 text-[10px]">·</span>
        <span className="text-[#c5a059]/50 text-[9px] uppercase tracking-widest italic">
          Changes are session-only
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/demo")}
          className="text-[#c5a059]/60 hover:text-[#c5a059] text-[9px] uppercase tracking-widest transition-colors"
        >
          Switch Role
        </button>
        <button
          onClick={handleExit}
          className="text-[9px] uppercase tracking-widest border border-[#c5a059]/30 text-[#c5a059]/70 hover:text-[#c5a059] hover:border-[#c5a059] px-3 py-1 rounded transition-all"
        >
          Exit Demo
        </button>
      </div>
    </div>
  );
}
