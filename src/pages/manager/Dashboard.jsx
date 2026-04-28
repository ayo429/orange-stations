import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import toast from "react-hot-toast";

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function SubmissionCard({ sub }) {
  const gas = sub.gas ? sub.gas.toLocaleString() : "0";
  const gasQty = sub.gasQty ? sub.gasQty.toLocaleString() : "0";
  const petroleum = sub.petroleum ? sub.petroleum.toLocaleString() : "0";
  const petroleumQty = sub.petroleumQty ? sub.petroleumQty.toLocaleString() : "0";
  const diesel = sub.diesel ? sub.diesel.toLocaleString() : "0";
  const dieselQty = sub.dieselQty ? sub.dieselQty.toLocaleString() : "0";
  const kerosene = sub.kerosene ? sub.kerosene.toLocaleString() : "0";
  const keroseneQty = sub.keroseneQty ? sub.keroseneQty.toLocaleString() : "0";
  const sales = sub.sales ? sub.sales.toLocaleString() : "0";
  const expenses = sub.expenses ? sub.expenses.toLocaleString() : "0";
  const description = sub.description ? sub.description : "No description";
  const photos = sub.photos ? sub.photos : [];
  const isCleared = sub.status === "cleared";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-white font-semibold">{sub.date}</p>
          <p className="text-gray-500 text-xs mt-1">{description}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border ${
          isCleared
            ? "bg-green-500/15 text-green-400 border-green-500/30"
            : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        }`}>
          {isCleared ? "✓ Cleared" : "⏳ Pending"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Gas</p>
          <p className="text-blue-400 font-bold text-sm">₦{gas}</p>
          <p className="text-gray-600 text-xs mt-1">{gasQty} kg/L</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Petroleum</p>
          <p className="text-yellow-400 font-bold text-sm">₦{petroleum}</p>
          <p className="text-gray-600 text-xs mt-1">{petroleumQty} L</p>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Diesel</p>
          <p className="text-purple-400 font-bold text-sm">₦{diesel}</p>
          <p className="text-gray-600 text-xs mt-1">{dieselQty} L</p>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Kerosene</p>
          <p className="text-orange-400 font-bold text-sm">₦{kerosene}</p>
          <p className="text-gray-600 text-xs mt-1">{keroseneQty} L</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 col-span-2">
          <p className="text-gray-500 text-xs mb-1">Total Sales</p>
          <p className="text-white font-bold text-sm">₦{sales}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 col-span-2">
          <p className="text-gray-500 text-xs mb-1">Expenses</p>
          <p className="text-red-400 font-bold text-sm">₦{expenses}</p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {photos.map((url, i) => (
            <img key={i} src={url} alt={`photo ${i + 1}`} className="w-full h-16 object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManagerDashboard() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    gas: "",
    gasQty: "",
    petroleum: "",
    petroleumQty: "",
    diesel: "",
    dieselQty: "",
    kerosene: "",
    keroseneQty: "",
    expenses: "",
    description: "",
    photos: [],
  });

  const fetchSubmissions = async () => {
    setLoading(true);
    let data = [];
    try {
      const snap = await getDocs(
        query(collection(db, "submissions"), where("managerId", "==", user.uid))
      );
      data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      toast.error("Failed to load submissions");
    }
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    setSubmissions(data);
    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    let urls = [];
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        const data = await res.json();
        return data.secure_url;
      });
      urls = await Promise.all(uploadPromises);
    } catch (err) {
      toast.error("Failed to upload photos");
    }
    if (urls.length) {
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
      toast.success("Photos uploaded!");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    const hasAnySales = form.gas || form.petroleum || form.diesel || form.kerosene;
    if (!form.date || !hasAnySales) {
      toast.error("Please fill in date and at least one sales field");
      return;
    }
    // ✅ try block wraps the addDoc call
    try {
      const gas = Number(form.gas);
      const petroleum = Number(form.petroleum);
      const diesel = Number(form.diesel);
      const kerosene = Number(form.kerosene);
      const expenses = Number(form.expenses);
      const sales = gas + petroleum + diesel + kerosene;

      await addDoc(collection(db, "submissions"), {
        managerId: user.uid,
        managerName: userData.name,
        stationName: userData.stationName,
        date: form.date,
        gas,
        gasQty: Number(form.gasQty),
        petroleum,
        petroleumQty: Number(form.petroleumQty),
        diesel,
        dieselQty: Number(form.dieselQty),
        kerosene,
        keroseneQty: Number(form.keroseneQty),
        sales,
        expenses,
        description: form.description,
        photos: form.photos,
        status: "pending",
        submittedAt: new Date().toISOString(),
      });

      toast.success("Report submitted successfully!");
      // ✅ reset includes all new fields
      setForm({
        date: new Date().toISOString().split("T")[0],
        gas: "",
        gasQty: "",
        petroleum: "",
        petroleumQty: "",
        diesel: "",
        dieselQty: "",
        kerosene: "",
        keroseneQty: "",
        expenses: "",
        description: "",
        photos: [],
      });
      setShowForm(false);
      fetchSubmissions();
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const totalSales = submissions.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = submissions.reduce((acc, s) => acc + (s.expenses || 0), 0);
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const stationName = userData ? userData.stationName : "";
  const userName = userData ? userData.name : "";
  const autoTotal = Number(form.gas) + Number(form.petroleum) + Number(form.diesel) + Number(form.kerosene);

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 transition placeholder:text-gray-600";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OS</span>
          </div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">{stationName}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Welcome, {userName}</h1>
            <p className="text-gray-500 text-sm mt-1">{stationName}</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            {showForm ? "Cancel" : "+ Submit Report"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Submissions", value: submissions.length, color: "text-white" },
            { label: "Total Sales", value: `₦${totalSales.toLocaleString()}`, color: "text-green-400" },
            { label: "Total Expenses", value: `₦${totalExpenses.toLocaleString()}`, color: "text-red-400" },
            { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Submit Report Form */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h2 className="text-white font-semibold mb-6">Daily Report</h2>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Gas */}
            <div className="mb-6">
              <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">Gas</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Gas Sales (₦)</label>
                  <input type="number" placeholder="0" value={form.gas} onChange={(e) => setForm({ ...form, gas: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Gas Quantity (kg/L)</label>
                  <input type="number" placeholder="0" value={form.gasQty} onChange={(e) => setForm({ ...form, gasQty: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Petroleum */}
            <div className="mb-6">
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-3">Petroleum</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Petroleum Sales (₦)</label>
                  <input type="number" placeholder="0" value={form.petroleum} onChange={(e) => setForm({ ...form, petroleum: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Petroleum Quantity (L)</label>
                  <input type="number" placeholder="0" value={form.petroleumQty} onChange={(e) => setForm({ ...form, petroleumQty: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Diesel */}
            <div className="mb-6">
              <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">Diesel</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Diesel Sales (₦)</label>
                  <input type="number" placeholder="0" value={form.diesel} onChange={(e) => setForm({ ...form, diesel: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Diesel Quantity (L)</label>
                  <input type="number" placeholder="0" value={form.dieselQty} onChange={(e) => setForm({ ...form, dieselQty: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Kerosene */}
            <div className="mb-6">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-3">Kerosene</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Kerosene Sales (₦)</label>
                  <input type="number" placeholder="0" value={form.kerosene} onChange={(e) => setForm({ ...form, kerosene: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-2">Kerosene Quantity (L)</label>
                  <input type="number" placeholder="0" value={form.keroseneQty} onChange={(e) => setForm({ ...form, keroseneQty: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Auto Total */}
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Total Sales (Auto)</label>
              <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-green-400 text-sm font-bold">
                ₦{autoTotal.toLocaleString()}
              </div>
            </div>

            {/* Expenses */}
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Total Expenses (₦)</label>
              <input type="number" placeholder="0" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: e.target.value })} className={inputClass} />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-gray-400 text-xs mb-2">Description / Notes</label>
              <textarea placeholder="Describe expenses or any issues..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} resize-none`} />
            </div>

            {/* Photo Upload */}
            <div className="mt-4">
              <label className="block text-gray-400 text-xs mb-2">Upload Photos (optional)</label>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="text-gray-400 text-sm" />
              {uploading && <p className="text-orange-500 text-xs mt-2">Uploading photos...</p>}
              {form.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt={`photo ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSubmit} className="mt-6 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition">
              Submit Report
            </button>
          </div>
        )}

        {/* Submissions List */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Your Submissions</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map((sub) => (
                <SubmissionCard key={sub.id} sub={sub} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}