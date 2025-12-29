import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import api from '../api/client';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    totalPackages: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [packageDist, setPackageDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, revenueRes, growthRes, distRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/revenue-chart'),
        api.get('/dashboard/customer-growth'),
        api.get('/dashboard/package-distribution')
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setCustomerGrowth(growthRes.data);
      setPackageDist(distRes.data);
      setLoading(false);

      // Check if user has completed setup
      const hasData = statsRes.data.totalCustomers > 0 || statsRes.data.totalPackages > 0;
      if (hasData) {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const setupSteps = [
    {
      step: 1,
      icon: '📦',
      title: 'Buat Paket Internet',
      description: 'Tambahkan paket layanan internet dengan harga dan kecepatan',
      action: 'Paket Internet',
      color: '#5865f2',
      completed: stats.totalPackages > 0
    },
    {
      step: 2,
      icon: '👥',
      title: 'Daftarkan Pelanggan',
      description: 'Tambahkan data pelanggan yang akan berlangganan',
      action: 'Pelanggan',
      color: '#8b5cf6',
      completed: stats.totalCustomers > 0
    },
    {
      step: 3,
      icon: '🧾',
      title: 'Buat Invoice',
      description: 'Generate invoice untuk pelanggan berdasarkan paket',
      action: 'Invoice',
      color: '#ec4899',
      completed: false
    },
    {
      step: 4,
      icon: '💳',
      title: 'Catat Pembayaran',
      description: 'Rekam pembayaran yang diterima dari pelanggan',
      action: 'Pembayaran',
      color: '#34d399',
      completed: stats.monthlyRevenue > 0
    }
  ];

  // Dark theme chart options
  const revenueChartOptions = {
    backgroundColor: 'transparent',
    title: {
      text: 'Tren Revenue',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.9)'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#5865f2',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        if (params[0]) {
          return `${params[0].name}<br/>${params[0].marker} ${formatRupiah(params[0].value)}`;
        }
        return '';
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: revenueData.map(d => d.month),
      axisLine: { lineStyle: { color: 'rgba(88, 101, 242, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)', rotate: 30, fontSize: 11 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 11,
        formatter: (value) => value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value / 1000 + 'K'
      },
      splitLine: {
        lineStyle: { color: 'rgba(88, 101, 242, 0.1)', type: 'dashed' }
      }
    },
    series: [{
      name: 'Revenue',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#5865f2', borderWidth: 2, borderColor: '#fff' },
      lineStyle: {
        width: 3,
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#5865f2' },
            { offset: 0.5, color: '#8b5cf6' },
            { offset: 1, color: '#ec4899' }
          ]
        }
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(88, 101, 242, 0.5)' },
            { offset: 1, color: 'rgba(88, 101, 242, 0.05)' }
          ]
        }
      },
      data: revenueData.map(d => parseFloat(d.revenue))
    }],
    animationDuration: 2000
  };

  const customerGrowthOptions = {
    backgroundColor: 'transparent',
    title: {
      text: 'Pertumbuhan Pelanggan',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#34d399',
      borderWidth: 1,
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: customerGrowth.map(d => d.month),
      axisLine: { lineStyle: { color: 'rgba(88, 101, 242, 0.3)' } },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(88, 101, 242, 0.1)', type: 'dashed' } }
    },
    series: [{
      name: 'Pelanggan',
      type: 'bar',
      data: customerGrowth.map(d => parseInt(d.customers)),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#34d399' },
            { offset: 1, color: '#10b981' }
          ]
        },
        borderRadius: [8, 8, 0, 0]
      },
      barWidth: '50%',
      label: {
        show: true,
        position: 'top',
        color: '#34d399',
        fontWeight: 'bold',
        fontSize: 12
      }
    }]
  };

  const packageDistOptions = {
    backgroundColor: 'transparent',
    title: {
      text: 'Distribusi Paket',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 'bold', color: 'rgba(255, 255, 255, 0.9)' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: '#5865f2',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }
    },
    series: [{
      name: 'Paket',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      itemStyle: {
        borderRadius: 10,
        borderColor: 'rgba(17, 24, 39, 0.8)',
        borderWidth: 3
      },
      label: {
        show: true,
        formatter: '{b}\n{d}%',
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 11
      },
      data: packageDist.map((d, i) => ({
        value: parseInt(d.count),
        name: d.name,
        itemStyle: {
          color: ['#5865f2', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4]
        }
      }))
    }]
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(88, 101, 242, 0.2)',
          borderTop: '4px solid #5865f2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', fontWeight: '600' }}>
          Memuat dashboard...
        </p>
      </div>
    );
  }

  const hasData = stats.totalCustomers > 0 || stats.totalPackages > 0;

  return (
    <div>
      {/* Welcome Banner - Only show when no data */}
      {!hasData && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          backdropFilter: 'blur(20px)',
          padding: '32px',
          borderRadius: '20px',
          border: '2px solid rgba(88, 101, 242, 0.3)',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(88, 101, 242, 0.3) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite'
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '900',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Selamat Datang di ISP Billing System!
              </h2>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}>
                Mari kita mulai dengan setup awal. Ikuti 4 langkah sederhana untuk menggunakan sistem billing Anda.
              </p>
            </div>

            {/* Setup Steps */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginTop: '32px'
            }}>
              {setupSteps.map((step, index) => (
                <div
                  key={step.step}
                  style={{
                    background: step.completed 
                      ? 'rgba(52, 211, 153, 0.15)' 
                      : 'rgba(17, 24, 39, 0.6)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: step.completed 
                      ? '2px solid rgba(52, 211, 153, 0.5)' 
                      : '2px solid rgba(88, 101, 242, 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px ${step.color}44`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {step.completed && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      background: 'rgba(52, 211, 153, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      border: '2px solid rgba(52, 211, 153, 0.5)'
                    }}>
                      ✅
                    </div>
                  )}
                  
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: `${step.color}22`,
                    border: `2px solid ${step.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    marginBottom: '16px'
                  }}>
                    {step.icon}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: step.color,
                    fontWeight: '700',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Langkah {step.step}
                  </div>
                  
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    {step.title}
                  </h3>
                  
                  <p style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '1.5',
                    marginBottom: '16px'
                  }}>
                    {step.description}
                  </p>
                  
                  <div style={{
                    padding: '10px 16px',
                    background: step.completed 
                      ? 'rgba(52, 211, 153, 0.2)' 
                      : `${step.color}22`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: step.completed ? '#34d399' : step.color,
                    textAlign: 'center',
                    border: step.completed 
                      ? '1px solid rgba(52, 211, 153, 0.5)' 
                      : `1px solid ${step.color}44`
                  }}>
                    {step.completed ? '✓ Selesai' : `Klik menu "${step.action}"`}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Tips */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'rgba(88, 101, 242, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(88, 101, 242, 0.3)'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                <div>
                  <strong style={{ color: '#5865f2' }}>Tips:</strong> Gunakan menu sidebar di sebelah kiri untuk navigasi. 
                  Mulai dengan menambahkan <strong>Paket Internet</strong> terlebih dahulu!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stat-cards">
        <div className="stat-card" style={{ position: 'relative' }}>
          <div className="icon">👥</div>
          <h3>Total Pelanggan</h3>
          <div className="value">{stats.totalCustomers}</div>
          <div className="trend" style={{
            background: stats.totalCustomers > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            color: stats.totalCustomers > 0 ? '#34d399' : 'rgba(255, 255, 255, 0.5)'
          }}>
            {stats.totalCustomers > 0 ? 'Pelanggan Aktif' : 'Belum ada data'}
          </div>
          {stats.totalCustomers === 0 && (
            <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              📌 Klik menu "Pelanggan" untuk menambah
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="icon">💰</div>
          <h3>Revenue Bulan Ini</h3>
          <div className="value">{formatRupiah(stats.monthlyRevenue)}</div>
          <div className="trend" style={{
            background: stats.monthlyRevenue > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            color: stats.monthlyRevenue > 0 ? '#34d399' : 'rgba(255, 255, 255, 0.5)'
          }}>
            {stats.monthlyRevenue > 0 ? 'Total Pembayaran' : 'Belum ada data'}
          </div>
          {stats.monthlyRevenue === 0 && (
            <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              📌 Catat pembayaran di menu "Pembayaran"
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="icon">🧾</div>
          <h3>Invoice Pending</h3>
          <div className="value">{stats.pendingInvoices}</div>
          <div className="trend" style={{ 
            color: stats.pendingInvoices > 0 ? '#ef4444' : '#34d399',
            background: stats.pendingInvoices > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
            borderColor: stats.pendingInvoices > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'
          }}>
            {stats.pendingInvoices > 0 ? 'Perlu Ditagih' : 'Semua Lunas'}
          </div>
          {stats.pendingInvoices === 0 && (
            <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              📌 Buat invoice di menu "Invoice"
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="icon">📦</div>
          <h3>Total Paket</h3>
          <div className="value">{stats.totalPackages}</div>
          <div className="trend" style={{
            background: stats.totalPackages > 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            color: stats.totalPackages > 0 ? '#34d399' : 'rgba(255, 255, 255, 0.5)'
          }}>
            {stats.totalPackages > 0 ? 'Paket Tersedia' : 'Belum ada data'}
          </div>
          {stats.totalPackages === 0 && (
            <div style={{
              marginTop: '12px',
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic'
            }}>
              📌 Tambah paket di menu "Paket Internet"
            </div>
          )}
        </div>
      </div>

      {/* Charts - Only show if has data */}
      {hasData && (revenueData.length > 0 || customerGrowth.length > 0) && (
        <div className="charts-grid">
          {revenueData.length > 0 && (
            <div className="chart-card">
              <ReactECharts
                option={revenueChartOptions}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          )}
          {customerGrowth.length > 0 && (
            <div className="chart-card">
              <ReactECharts
                option={customerGrowthOptions}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </div>
          )}
        </div>
      )}

      {hasData && packageDist.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <ReactECharts
              option={packageDistOptions}
              style={{ height: '400px' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
