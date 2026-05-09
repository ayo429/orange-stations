import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ✅ 11am business day helpers
const getBusinessDayStart = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(11, 0, 0, 0);
  if (now < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
};

const getPreviousBusinessDayStart = () => {
  const current = getBusinessDayStart();
  const prev = new Date(current);
  prev.setDate(prev.getDate() - 1);
  return prev;
};

function SubmissionCard({ sub }) {
  const gas = sub.gas ? sub.gas.toLocaleString() : "0";
  const gasQty = sub.gasQty ? sub.gasQty.toLocaleString() : "0";
  const petroleum = sub.petroleum ? sub.petroleum.toLocaleString() : "0";
  const petroleumQty = sub.petroleumQty
    ? sub.petroleumQty.toLocaleString()
    : "0";
  const diesel = sub.diesel ? sub.diesel.toLocaleString() : "0";
  const dieselQty = sub.dieselQty ? sub.dieselQty.toLocaleString() : "0";
  const kerosene = sub.kerosene ? sub.kerosene.toLocaleString() : "0";
  const keroseneQty = sub.keroseneQty ? sub.keroseneQty.toLocaleString() : "0";
  const sales = sub.sales ? sub.sales.toLocaleString() : "0";
  const expenses = sub.expenses ? sub.expenses.toLocaleString() : "0";
  const description = sub.description ? sub.description : "No description";
  const photos = sub.photos ? sub.photos : [];

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-white font-semibold">{sub.date}</p>
          <p className="text-gray-500 text-xs mt-1">{description}</p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border shrink-0 ${
            sub.status === "cleared"
              ? "bg-green-500/15 text-green-400 border-green-500/30"
              : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
          }`}
        >
          {sub.status === "cleared" ? "✓ Cleared" : "⏳ Pending"}
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
            <img
              key={i}
              src={url}
              alt={`photo ${i + 1}`}
              className="w-full h-16 object-cover rounded-lg"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ManagerDashboard() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

  // ✅ Real-time snapshot
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "submissions"), where("managerId", "==", user.uid)),
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log(
          "Submissions from Firestore:",
          data.map((s) => s.id),
        );
        data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setSubmissions(data);
        setLoading(false);
      },
      (err) => {
        toast.error("Failed to load submissions");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user.uid]);

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
        const res = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });
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
    const hasAnySales =
      form.gas || form.petroleum || form.diesel || form.kerosene;
    if (!form.date || !hasAnySales) {
      toast.error("Please fill in date and at least one sales field");
      return;
    }
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
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ✅ Business day calculations
  const businessDayStart = getBusinessDayStart();
  const prevBusinessDayStart = getPreviousBusinessDayStart();

  const todaySubmissions = submissions.filter((s) => {
    const submittedAt = new Date(s.submittedAt);
    return submittedAt >= businessDayStart;
  });

  const yesterdaySubmissions = submissions.filter((s) => {
    const submittedAt = new Date(s.submittedAt);
    return (
      submittedAt >= prevBusinessDayStart && submittedAt < businessDayStart
    );
  });

  const todaySales = todaySubmissions.reduce(
    (acc, s) => acc + (s.sales || 0),
    0,
  );
  const todayExpenses = todaySubmissions.reduce(
    (acc, s) => acc + (s.expenses || 0),
    0,
  );
  const yesterdaySales = yesterdaySubmissions.reduce(
    (acc, s) => acc + (s.sales || 0),
    0,
  );
  const yesterdayExpenses = yesterdaySubmissions.reduce(
    (acc, s) => acc + (s.expenses || 0),
    0,
  );
  const pendingCount = todaySubmissions.filter((s) => s.status === "pending").length;

  const stationName = userData ? userData.stationName : "";
  const userName = userData ? userData.name : "";
  const autoTotal =
    Number(form.gas) +
    Number(form.petroleum) +
    Number(form.diesel) +
    Number(form.kerosene);

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500 transition placeholder:text-gray-600";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center relative"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center"
          >
            <span className="text-white text-xs font-bold">OS</span>
          </motion.div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span className="text-gray-400 text-sm">{stationName}</span>
          <button
            onClick={() => navigate("/manager/history")}
            className="text-gray-400 text-sm hover:text-white transition"
          >
            History
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition"
          >
            Logout
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden"
            >
              <p className="text-gray-500 text-xs px-3 py-1">{stationName}</p>
              <button
                onClick={() => {
                  navigate("/manager/history");
                  setMenuOpen(false);
                }}
                className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5"
              >
                History
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-white/10"
              >
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-white text-2xl font-bold">
              Welcome, {userName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{stationName}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            {showForm ? "Cancel" : "+ Submit Report"}
          </motion.button>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-2"
        >
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">
            Today's Summary
          </p>
        </motion.div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: "Today's Submissions",
              value: todaySubmissions.length,
              color: "text-white",
            },
            {
              label: "Today's Sales",
              value: `₦${todaySales.toLocaleString()}`,
              color: "text-green-400",
            },
            {
              label: "Today's Expenses",
              value: `₦${todayExpenses.toLocaleString()}`,
              color: "text-red-400",
            },
            { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p
                className={`text-base md:text-xl font-bold break-words min-w-0 ${stat.color}`}
              >
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Yesterday's Stats */}
        {(yesterdaySales > 0 || yesterdayExpenses > 0) && (
          <>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-2"
            >
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">
                Yesterday
              </p>
            </motion.div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
            >
              <motion.div
                variants={staggerItem}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <p className="text-gray-500 text-xs mb-1">Yesterday's Sales</p>
                <p className="text-sm md:text-xl font-bold text-green-400/60">
                  ₦{yesterdaySales.toLocaleString()}
                </p>
              </motion.div>
              <motion.div
                variants={staggerItem}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <p className="text-gray-500 text-xs mb-1">
                  Yesterday's Expenses
                </p>
                <p className="text-sm md:text-xl font-bold text-red-400/60">
                  ₦{yesterdayExpenses.toLocaleString()}
                </p>
              </motion.div>
            </motion.div>
          </>
        )}

        {/* Submit Report Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-white font-semibold mb-6">Daily Report</h2>

                <div className="mb-4">
                  <label className="block text-gray-400 text-xs mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div className="mb-6">
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    Gas
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Gas Sales (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.gas}
                        onChange={(e) =>
                          setForm({ ...form, gas: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Gas Quantity (kg/L)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.gasQty}
                        onChange={(e) =>
                          setForm({ ...form, gasQty: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    Petroleum
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Petroleum Sales (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.petroleum}
                        onChange={(e) =>
                          setForm({ ...form, petroleum: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Petroleum Quantity (L)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.petroleumQty}
                        onChange={(e) =>
                          setForm({ ...form, petroleumQty: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    Diesel
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Diesel Sales (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.diesel}
                        onChange={(e) =>
                          setForm({ ...form, diesel: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Diesel Quantity (L)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.dieselQty}
                        onChange={(e) =>
                          setForm({ ...form, dieselQty: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    Kerosene
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Kerosene Sales (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.kerosene}
                        onChange={(e) =>
                          setForm({ ...form, kerosene: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-2">
                        Kerosene Quantity (L)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.keroseneQty}
                        onChange={(e) =>
                          setForm({ ...form, keroseneQty: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-xs mb-2">
                    Total Sales (Auto)
                  </label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-green-400 text-sm font-bold">
                    ₦{autoTotal.toLocaleString()}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-xs mb-2">
                    Total Expenses (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.expenses}
                    onChange={(e) =>
                      setForm({ ...form, expenses: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-xs mb-2">
                    Description / Notes
                  </label>
                  <textarea
                    placeholder="Describe expenses or any issues..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-gray-400 text-xs mb-2">
                    Upload Photos (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="text-gray-400 text-sm"
                  />
                  {uploading && (
                    <p className="text-orange-500 text-xs mt-2">
                      Uploading photos...
                    </p>
                  )}
                  {form.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {form.photos.map((url, i) => (
                        <div key={i} className="relative">
                          <img
                            src={url}
                            alt={`photo ${i + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                photos: prev.photos.filter(
                                  (_, idx) => idx !== i,
                                ),
                              }))
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="mt-6 bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                >
                  Submit Report
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Submissions List */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-white font-semibold mb-6">
            Today's Submissions ({todaySubmissions.length})
          </h2>
          {loading ? (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500 text-sm"
            >
              Loading...
            </motion.p>
          ) : todaySubmissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions today yet</p>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {todaySubmissions.map((sub) => (
                <SubmissionCard key={sub.id} sub={sub} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
