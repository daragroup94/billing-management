// ================================================
// FILE: frontend/src/pages/Dashboard.jsx - ENHANCED VERSION
// ================================================
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, FileText, Package, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { dashboardAPI } from '../api';
import api from '../api/client';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalPackages: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart data
  const [revenueData, setRevenueData] = useState([]);
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [packageDistData, setPackageDistData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh setiap 30 detik untuk update overdue
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // ✅ ENHANCED: Gunakan endpoint backend yang sudah filter overdue
      const [
        statsData, 
        activityData, 
        revenueChart, 
        customerGrowth, 
        packageDist, 
        overdueData
      ] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity(),
        dashboardAPI.getRevenueChart(),
        dashboardAPI.getCustomerGrowth(),
        dashboardAPI.getPackageDistribution(),
        api.get('/invoices/overdue').then(res => res.data) // NEW ENDPOINT
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setRevenueData(revenueChart);
      setCustomerGrowthData(customerGrowth);
      setPackageDistData(packageDist);
      setOverdueInvoices(overdueData.data || []);
      
      console.log('📊 Dashboard Data Loaded:');
      console.log('Stats:', statsData);
      console.log('Overdue Invoices:', overdueData.count);
      
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatCompactPrice = (value) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    }
    return `Rp ${(value / 1000).toFixed(0)}K`;
  };

  // Colors for charts
  const COLORS = ['#5865f2', '#8b5cf6', '#ec4899', '#f59e0b'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-blue-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-white font-semibold">
              {entry.name}: {entry.name.includes('Revenue') ? formatPrice(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Pelanggan",
      value: stats.totalCustomers,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      trend: "up",
      trendValue: "+12%"
    },
    {
      title: "Revenue Bulan Ini",
      value: formatPrice(stats.monthlyRevenue),
      icon: DollarSign,
      color: "from-green-500 to-emerald-500",
      trend: "up",
      trendValue: "+8%"
    },
    {
      title: "Invoice Pending",
      value: stats.pendingInvoices,
      icon: FileText,
      color: "from-yellow-500 to-orange-500",
      trend: stats.pendingInvoices > 20 ? "up" : "down",
      trendValue: stats.pendingInvoices > 20 ? "+5%" : "-5%"
    },
    {
      title: "Total Paket",
      value: stats.totalPackages,
      icon: Package,
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* ✅ ENHANCED: Overdue Alert Banner dengan detail lebih lengkap */}
      {overdueInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/20 animate-pulse">
              <AlertCircle className="text-red-400" size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-red-400">
                  ⚠️ PERHATIAN: {overdueInvoices.length} Invoice Terlambat!
                </h3>
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <Clock size={16} />
                  <span>Last updated: {new Date().toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
              
              <p className="text-slate-300 mb-3">
                Terdapat {overdueInvoices.length} pelanggan dengan total tunggakan{' '}
                <span className="font-bold text-red-300">
                  {formatPrice(overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0))}
                </span>
                . Segera lakukan penagihan!
              </p>

              {/* Top 5 Overdue */}
              <div className="space-y-2 mb-3">
                {overdueInvoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{inv.customer_name}</p>
                      <p className="text-xs text-slate-400">{inv.invoice_number} • {inv.package_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold text-sm">{formatPrice(inv.amount)}</p>
                      <p className="text-xs text-red-300">{inv.days_overdue} hari</p>
                    </div>
                  </div>
                ))}
              </div>

              {overdueInvoices.length > 5 && (
                <button 
                  onClick={() => window.location.hash = '#invoices-overdue'}
                  className="text-sm text-red-300 hover:text-red-200 underline"
                >
                  Lihat {overdueInvoices.length - 5} invoice lainnya →
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <Icon className="text-white" size={24} />
                </div>
                {stat.trend && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <TrendingUp size={16} />
                    <span>{stat.trendValue}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ✅ NEW: Overdue Invoice Card (jika ada) */}
      {stats.overdueInvoices > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-red-500/20">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-red-400">{stats.overdueInvoices}</h3>
                <p className="text-slate-300">Invoice Terlambat</p>
                <p className="text-xs text-slate-500 mt-1">Perlu tindakan segera!</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.hash = '#invoices-overdue'}
              className="btn-danger"
            >
              Lihat Detail →
            </button>
          </div>
        </motion.div>
      )}

      {/* Charts Grid - Revenue & Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5865f2" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#5865f2" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={formatCompactPrice}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#5865f2" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Customer Growth */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-green-500" size={20} />
            Pertumbuhan Pelanggan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={customerGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="customers" 
                fill="#34d399"
                radius={[8, 8, 0, 0]}
                name="Customers"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Package Distribution & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="text-purple-500" size={20} />
            Distribusi Paket
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={packageDistData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name} (${count})`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {packageDistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {recentActivity.slice(0, 8).map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'payment' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{activity.customer_name}</p>
                  <p className="text-xs text-slate-400">
                    {activity.type === 'payment' ? 'Payment received' : 'New customer'}
                  </p>
                </div>
                {activity.amount > 0 && (
                  <span className="text-sm font-semibold text-green-400">
                    {formatPrice(activity.amount)}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
