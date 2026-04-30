import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function AdminReports() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const submissionsSnap = await getDocs(collection(db, "submissions"));
      const submissionsData = submissionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSubmissions(submissionsData);

      const managersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "manager")),
      );
      setManagers(
        managersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    } catch (err) {
      toast.error("Failed to load reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getFilteredSubmissions = () => {
    const now = new Date();
    if (filter === "week") {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return submissions.filter((s) => new Date(s.date) >= weekAgo);
    }
    if (filter === "month") {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      return submissions.filter((s) => new Date(s.date) >= monthAgo);
    }
    return submissions;
  };

  const filtered = getFilteredSubmissions();

  const totalSales = filtered.reduce((acc, s) => acc + (s.sales || 0), 0);
  const totalExpenses = filtered.reduce((acc, s) => acc + (s.expenses || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const pendingCount = filtered.filter((s) => s.status === "pending").length;
  const clearedCount = filtered.filter((s) => s.status === "cleared").length;

  // Chart data
  const labels = managers.map((manager) => manager.stationName || manager.name);

  const salesChartData = managers.map((manager) => {
    const managerSubs = filtered.filter((s) => s.managerId === manager.id);
    return managerSubs.reduce((acc, s) => acc + (s.sales || 0), 0);
  });

  const expensesChartData = managers.map((manager) => {
    const managerSubs = filtered.filter((s) => s.managerId === manager.id);
    return managerSubs.reduce((acc, s) => acc + (s.expenses || 0), 0);
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sales",
        data: salesChartData,
        backgroundColor: "#22c55e",
        borderRadius: 6,
        barThickness: 16,
      },
      {
        label: "Expenses",
        data: expensesChartData,
        backgroundColor: "#ef4444",
        borderRadius: 6,
        barThickness: 16,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₦${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#666", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: {
          color: "#666",
          font: { size: 11 },
          callback: (value) => `₦${(value / 1000).toFixed(0)}k`,
        },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OS</span>
          </div>
          <span className="text-white font-semibold">Orange Stations</span>
        </div>

        {/* Desktop */}
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl bg-transparent border-none cursor-pointer"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="absolute top-full right-0 w-48 bg-[#111] border border-white/10 rounded-xl p-3 flex flex-col gap-2 z-50 md:hidden">
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
          </div>
        )}
      </nav>

      <div className="px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Reports</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sales and expenses across all stations
            </p>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {["all", "week", "month"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition capitalize ${
                  filter === f
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:text-white"
                }`}
              >
                {f === "all"
                  ? "All Time"
                  : f === "week"
                    ? "This Week"
                    : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
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
            {
              label: "Net Profit",
              value: `₦${netProfit.toLocaleString()}`,
              color: netProfit >= 0 ? "text-green-400" : "text-red-400",
            },
            { label: "Pending", value: pendingCount, color: "text-yellow-400" },
            { label: "Cleared", value: clearedCount, color: "text-green-400" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
             <p className={`text-sm md:text-xl font-bold break-words min-w-0 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-white font-semibold mb-2">
            Sales vs Expenses by Station
          </h2>

          {/* Legend */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-gray-400 text-xs">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-gray-400 text-xs">Expenses</span>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : labels.length === 0 ? (
            <p className="text-gray-500 text-sm">No data available</p>
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>

        {/* Per Station Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-6">Station Breakdown</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            <div className="flex flex-col gap-3">
              {managers.map((manager) => {
                const managerSubs = filtered.filter(
                  (s) => s.managerId === manager.id,
                );
                const sales = managerSubs.reduce(
                  (acc, s) => acc + (s.sales || 0),
                  0,
                );
                const expenses = managerSubs.reduce(
                  (acc, s) => acc + (s.expenses || 0),
                  0,
                );
                const net = sales - expenses;
                const pending = managerSubs.filter(
                  (s) => s.status === "pending",
                ).length;

                return (
                  <div
                    key={manager.id}
                    onClick={() => navigate(`/admin/station/${manager.id}`)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-orange-500 text-sm font-bold">
                          {manager.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {manager.name}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {manager.stationName}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-gray-500 text-xs">Sales</p>
                        <p className="text-green-400 text-sm font-bold break-words">
                          ₦{sales.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Expenses</p>
                        <p className="text-red-400 text-sm font-bold break-words">
                          ₦{expenses.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Net</p>
                        <p
                          className={`text-sm font-bold break-words ${net >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          ₦{net.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Pending</p>
                        <p className="text-yellow-400 text-sm font-bold break-words">
                          {pending}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
