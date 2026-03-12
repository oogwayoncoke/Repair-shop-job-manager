import { Cpu, Lock, Settings, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const WorkOrderForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    device_type: "ELEC", // Matches "ELEC" choice in model
    brand: "",
    model_name: "",
    serial_number: "",
    description: "",
    // Specific Fields
    password_hint: "",
    os_version: "",
    fuel_type: "",
    engine_displacement: "",
  });

  const deviceChoices = [
    { value: "ELEC", label: "Electrical / Electronic" },
    { value: "MECH", label: "Mechanical / Automotive" },
  ];

  useEffect(() => {
    if (!token || token === "undefined") {
      setTokenValid(false);
      setError("Invalid link.");
      return;
    }

    const verifyToken = async () => {
      try {
        await api.get(`/shops/validate/${token}/`);
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setError("This invitation link is invalid or has expired.");
      }
    };
    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    if (error) setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokenValid) return;
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/shops/work-order/create/", {
        ...formData,
        token: token,
      });

      const trackingId = response.data.ticket_id || response.data.id;
      navigate("/submission-success", {
        state: { workOrderId: String(trackingId) },
      });
    } catch (err) {
      const serverError = err.response?.data;
      setError(
        typeof serverError === "object"
          ? Object.entries(serverError)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "Submission failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#0f1115]">
        <div className="animate-pulse text-[#c5a059] uppercase tracking-widest font-serif">
          Verifying Authority...
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#0f1115] p-4 font-serif">
        <div className="bg-[#1a1d23] border border-red-500/30 rounded-xl p-10 shadow-2xl w-full max-w-lg text-center">
          <Lock className="text-red-500 mx-auto mb-6" size={48} />
          <h2 className="text-[#c5a059] text-xl uppercase tracking-widest mb-4">
            Access Denied
          </h2>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0f1115] p-4 font-serif text-slate-100">
      <div className="bg-[#1a1d23] border border-[#2d3139] rounded-xl p-6 md:p-10 shadow-2xl w-full max-w-5xl">
        <h2 className="text-[#c5a059] text-xl md:text-3xl font-serif tracking-widest uppercase mb-10 text-center italic">
          Repair Intake Terminal
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-5 bg-[#13151a] p-6 rounded-lg border border-[#2d3139]">
              <h3 className="text-[#c5a059] text-[10px] uppercase tracking-widest border-b border-[#2d3139] pb-2 font-black">
                Customer Identification
              </h3>
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059] transition-all"
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Detailed report of the issue..."
                rows="5"
                className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 resize-none outline-none focus:border-[#C5A059]"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col gap-5 bg-[#13151a] p-6 rounded-lg border border-[#2d3139]">
              <h3 className="text-[#c5a059] text-[10px] uppercase tracking-widest border-b border-[#2d3139] pb-2 font-black">
                Asset Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="device_type"
                  value={formData.device_type}
                  className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059] text-xs font-bold uppercase"
                  onChange={handleChange}
                >
                  {deviceChoices.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  name="brand"
                  placeholder="Brand"
                  className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="model_name"
                  placeholder="Model Name"
                  className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                  onChange={handleChange}
                  required
                />
                <input
                  name="serial_number"
                  placeholder="Serial Number"
                  className="bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                  onChange={handleChange}
                  required
                />
              </div>

              {/* DYNAMIC SUB-TYPE FIELDS */}
              <div className="mt-4 pt-4 border-t border-[#2d3139] space-y-4">
                {formData.device_type === "ELEC" ? (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 text-[#c5a059] text-[9px] uppercase font-bold tracking-tighter">
                      <Cpu size={14} /> Electronic Parameters
                    </div>
                    <input
                      name="password_hint"
                      placeholder="Security / Password Hint"
                      className="w-full bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                      onChange={handleChange}
                    />
                    <input
                      name="os_version"
                      placeholder="OS Version (e.g. Windows 11, iOS 17)"
                      className="w-full bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                      onChange={handleChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 text-[#c5a059] text-[9px] uppercase font-bold tracking-tighter">
                      <Settings size={14} /> Mechanical Parameters
                    </div>
                    <input
                      name="fuel_type"
                      placeholder="Fuel Type (e.g. Petrol, Diesel, EV)"
                      className="w-full bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                      onChange={handleChange}
                    />
                    <input
                      name="engine_displacement"
                      placeholder="Engine Displacement (e.g. 2.0L, 1600cc)"
                      className="w-full bg-[#1a1d23] border border-[#4A4439] rounded-lg p-4 outline-none focus:border-[#C5A059]"
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg flex items-center gap-3">
              <ShieldAlert className="text-red-500" size={20} />
              <p className="text-red-400 text-[10px] uppercase font-black">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A059] text-[#0F1115] py-5 rounded-lg font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-white transition-all disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? "Transmitting..." : "Initialize Repair Protocol"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkOrderForm;
