import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fadeUp,
  staggerContainer,
  staggerItem,
  slideDown,
} from '../../lib/animation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ✅ CountUp hook
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

// ✅ StatCard component
function StatCard({ label, value, prefix = "", color }) {
  const animated = useCountUp(typeof value === "number" ? value : 0);
  const display = typeof value === "number"
    ? `${prefix}${animated.toLocaleString()}`
    : value;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4"
    >
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`text-base md:text-xl font-bold break-all ${color}`}>
        {display}
      </p>
    </motion.div>
  );
}

export default function AdminReports() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      setSubmissions(submissionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      const managersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'manager')));
      setManagers(managersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      toast.error('Failed to load reports');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getFilteredSubmissions = () => {
    const now = new Date();
    if (filter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return submissions.filter((s) => new Date(s.date) >= weekAgo);
    }
    if (filter === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      return submissions.filter((s) => new Date(s.date) >= monthAgo);
    }
    return submissions;
  };

  const filtered = getFilteredSubmissions();
  const totalSales = filtered.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = filtered.reduce((acc, s) => acc + (s.expenses || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const pendingCount = filtered.filter((s) => s.status === 'pending').length;
  const clearedCount = filtered.filter((s) => s.status === 'cleared').length;

  const labels = managers.map((m) => m.stationName || m.name);
  const salesChartData = managers.map((m) => filtered.filter((s) => s.managerId === m.id).reduce((acc, s) => acc + (s.sales || 0), 0));
  const expensesChartData = managers.map((m) => filtered.filter((s) => s.managerId === m.id).reduce((acc, s) => acc + (s.expenses || 0), 0));

  const chartData = {
    labels,
    datasets: [
      { label: 'Sales', data: salesChartData, backgroundColor: '#22c55e', borderRadius: 6, barThickness: 16 },
      { label: 'Expenses', data: expensesChartData, backgroundColor: '#ef4444', borderRadius: 6, barThickness: 16 },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `₦${ctx.parsed.y.toLocaleString()}` } },
    },
    scales: {
      x: { ticks: { color: '#666', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#666', font: { size: 11 }, callback: (v) => `₦${(v / 1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

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
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }} className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OS</span>
          </motion.div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-gray-400 text-sm hover:text-white transition">← Dashboard</button>
          <button onClick={handleLogout} className="text-gray-400 text-sm border border-white/10 px-3 py-1.5 rounded-lg hover:text-white transition">Logout</button>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer">
          {menuOpen ? '✕' : '☰'}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit"
              className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden"
            >
              <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5">← Dashboard</button>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-gray-400 text-sm hover:text-white transition text-left px-3 py-2 rounded-lg hover:bg-white/5 border border-white/10">Logout</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Sales and expenses across all stations</p>
          </div>
          <div className="flex gap-2">
            {['all', 'week', 'month'].map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition capitalize ${filter === f ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
              >
                {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'This Month'}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ✅ Stats with countup */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Sales" value={totalSales} prefix="₦" color="text-green-400" />
          <StatCard label="Total Expenses" value={totalExpenses} prefix="₦" color="text-red-400" />
          <StatCard label="Net Profit" value={netProfit} prefix="₦" color={netProfit >= 0 ? "text-green-400" : "text-red-400"} />
          <StatCard label="Pending" value={pendingCount} color="text-yellow-400" />
          <StatCard label="Cleared" value={clearedCount} color="text-green-400" />
        </motion.div>

        {/* Chart */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-2">Sales vs Expenses by Station</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-gray-400 text-xs">Sales</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-gray-400 text-xs">Expenses</span></div>
          </div>
          {loading ? (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-500 text-sm">Loading...</motion.p>
          ) : labels.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </motion.div>

        {/* Station Breakdown */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Station Breakdown</h2>
          {loading ? (
            <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-gray-500 text-sm">Loading...</motion.p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-3">
              {managers.map((manager) => {
                const managerSubs = filtered.filter((s) => s.managerId === manager.id);
                const sales = managerSubs.reduce((acc, s) => acc + (s.sales || 0), 0);
                const expenses = managerSubs.reduce((acc, s) => acc + (s.expenses || 0), 0);
                const net = sales - expenses;
                const pending = managerSubs.filter((s) => s.status === 'pending').length;

                return (
                  <motion.div
                    key={manager.id}
                    variants={staggerItem}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate(`/admin/station/${manager.id}`)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={{ rotate: 10 }} className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-orange-500 text-sm font-bold">{manager.name?.charAt(0).toUpperCase()}</span>
                      </motion.div>
                      <div>
                        <p className="text-white text-sm font-semibold">{manager.name}</p>
                        <p className="text-gray-500 text-xs">{manager.stationName}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div><p className="text-gray-500 text-xs">Sales</p><p className="text-green-400 text-sm font-bold break-words">₦{sales.toLocaleString()}</p></div>
                      <div><p className="text-gray-500 text-xs">Expenses</p><p className="text-red-400 text-sm font-bold break-words">₦{expenses.toLocaleString()}</p></div>
                      <div><p className="text-gray-500 text-xs">Net</p><p className={`text-sm font-bold break-words ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>₦{net.toLocaleString()}</p></div>
                      <div><p className="text-gray-500 text-xs">Pending</p><p className="text-yellow-400 text-sm font-bold">{pending}</p></div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}