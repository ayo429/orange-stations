import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  slideDown,
} from "../../lib/animation";

function SubmissionCard({ sub, onClear, onUnclear, onPhotoClick }) {
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
  const photos = sub.photos ? sub.photos : [];
  const submittedAt = sub.submittedAt
    ? new Date(sub.submittedAt).toLocaleString()
    : "N/A";
  const clearedAt = sub.clearedAt
    ? new Date(sub.clearedAt).toLocaleDateString()
    : "";
  const isCleared = sub.status === "cleared";
  const description = sub.description ? sub.description : "";

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 border border-white/10 rounded-xl p-5"
    >
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex justify-between items-center gap-2">
          <p className="text-white font-semibold">{sub.date}</p>
          <span
            className={`text-xs px-3 py-1 rounded-full border shrink-0 ${
              isCleared
                ? "bg-green-500/15 text-green-400 border-green-500/30"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
            }`}
          >
            {isCleared ? "✓ Cleared" : "⏳ Pending"}
          </span>
        </div>
        <p className="text-gray-500 text-xs">{description}</p>
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
        <div className="mb-4">
          <p className="text-gray-500 text-xs mb-2">Photos</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {photos.map((url, i) => (
              <motion.img
                key={i}
                whileHover={{ scale: 1.05 }}
                src={url}
                alt={`photo ${i + 1}`}
                onClick={() => onPhotoClick(url)}
                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
              />
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        {isCleared ? (
          <div className="flex items-center gap-3">
            <p className="text-gray-600 text-xs">Cleared {clearedAt}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onUnclear(sub.id)}
              className="bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-yellow-500/25 transition"
            >
              ↩ Mark as Pending
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClear(sub.id)}
            className="bg-green-500/15 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-500/25 transition"
          >
            ✓ Mark as Cleared
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function ManagerInfo({ manager }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex items-center gap-4 mb-8"
    >
      <motion.div
        whileHover={{ rotate: 10, scale: 1.1 }}
        className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center"
      >
        <span className="text-orange-500 text-xl font-bold">
          {manager.name?.charAt(0).toUpperCase()}
        </span>
      </motion.div>
      <div>
        <h1 className="text-white text-2xl font-bold">{manager.name}</h1>
        <p className="text-gray-500 text-sm">{manager.stationName}</p>
        <p className="text-gray-600 text-xs">
          {manager.email} • {manager.phone}
        </p>
      </div>
    </motion.div>
  );
}

export default function AdminStation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [manager, setManager] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const managerDoc = await getDoc(doc(db, "users", id));
      const managerData = { id: managerDoc.id, ...managerDoc.data() };
      const snap = await getDocs(
        query(collection(db, "submissions"), where("managerId", "==", id)),
      );
      const submissionsData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      submissionsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setManager(managerData);
      setSubmissions(submissionsData);
    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleClear = async (submissionId) => {
    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        status: "cleared",
        clearedAt: new Date().toISOString(),
      });
      toast.success("Submission cleared!");
      fetchData();
    } catch (err) {
      toast.error("Failed to clear submission");
    }
  };

  const handleUnclear = async (submissionId) => {
    try {
      await updateDoc(doc(db, "submissions", submissionId), {
        status: "pending",
        clearedAt: null,
      });
      toast.success("Submission marked as pending");
      fetchData();
    } catch (err) {
      toast.error("Failed to update submission");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const totalSales = submissions.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = submissions.reduce(
    (acc, s) => acc + (s.expenses || 0),
    0,
  );
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

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
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 text-sm hover:text-white transition"
          >
            ← Dashboard
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
              variants={slideDown}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden"
            >
              <button
                onClick={() => {
                  navigate("/admin");
                  setMenuOpen(false);
                }}
                className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5"
              >
                ← Dashboard
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
        {manager && <ManagerInfo manager={manager} />}

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: "Total Submissions",
              value: submissions.length,
              color: "text-white",
            },
            {
              label: "Total Sales",
              value: `₦${totalSales.toLocaleString()}`,
              color: "text-green-400",
            },
            {
              label: "Total Expenses",
              value: `₦${totalExpenses.toLocaleString()}`,
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

        {/* Submissions */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-white font-semibold mb-6">
            Submissions ({submissions.length})
          </h2>
          {loading ? (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500 text-sm"
            >
              Loading...
            </motion.p>
          ) : submissions.length === 0 ? (
            <p className="text-gray-500 text-sm">No submissions yet</p>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  sub={sub}
                  onClear={handleClear}
                  onUnclear={handleUnclear}
                  onPhotoClick={setSelectedPhoto}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={selectedPhoto}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
