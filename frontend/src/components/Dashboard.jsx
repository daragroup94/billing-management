// frontend/src/components/Dashboard.jsx
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

  // Grafik Revenue dengan gradient dan animasi mewah
  const revenueChartOptions = {
    title: {
      text: 'Revenue Trend',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#667eea',
      borderWidth: 1,
      textStyle: {
        color: '#2d3748'
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#667eea'
        }
      },
      formatter: (params) => {
        const value = formatRupiah(params[0].value);
        return `${params[0].name}<br/>${params[0].marker} ${value}`;
      }
    },
    legend: {
      data: ['Revenue'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: revenueData.map(d => d.month),
      axisLine: {
        lineStyle: {
          color: '#cbd5e0'
        }
      },
      axisLabel: {
        color: '#4a5568',
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#4a5568',
        formatter: (value) => {
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          }
          return value / 1000 + 'K';
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        sampling: 'average',
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(102, 126, 234, 0.5)'
              },
              {
                offset: 1,
                color: 'rgba(102, 126, 234, 0.05)'
              }
            ]
          }
        },
        data: revenueData.map(d => parseFloat(d.revenue))
      }
    ],
    animationDuration: 2000,
    animationEasing: 'cubicOut'
  };

  // Grafik Customer Growth dengan bar chart 3D effect
  const customerGrowthOptions = {
    title: {
      text: 'Customer Growth',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#48bb78',
      borderWidth: 1,
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: customerGrowth.map(d => d.month),
      axisLine: {
        lineStyle: {
          color: '#cbd5e0'
        }
      },
      axisLabel: {
        color: '#4a5568'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisLabel: {
        color: '#4a5568'
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'Customers',
        type: 'bar',
        data: customerGrowth.map(d => parseInt(d.customers)),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: '#48bb78'
              },
              {
                offset: 1,
                color: '#38a169'
              }
            ]
          },
          borderRadius: [10, 10, 0, 0]
        },
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          color: '#2d3748',
          fontWeight: 'bold'
        }
      }
    ],
    animationDuration: 2000,
    animationEasing: 'elasticOut'
  };

  // Grafik Package Distribution dengan donut chart mewah
  const packageDistOptions = {
    title: {
      text: 'Package Distribution',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: {
        color: '#4a5568'
      }
    },
    series: [
      {
        name: 'Packages',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontWeight: 'bold'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true
        },
        data: packageDist.map((d, i) => ({
          value: parseInt(d.count),
          name: d.name,
          itemStyle: {
            color: [
              '#667eea',
              '#48bb78',
              '#f6ad55',
              '#fc8181'
            ][i % 4]
          }
        }))
      }
    ],
    animationDuration: 2000,
    animationEasing: 'cubicOut'
  };

  // Grafik tambahan: Revenue vs Target (gauge)
  const revenueTargetOptions = {
    title: {
      text: 'Monthly Revenue Target',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748'
      }
    },
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 10000000,
        splitNumber: 5,
        center: ['50%', '70%'],
        radius: '90%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 0.5, color: '#764ba2' },
              { offset: 1, color: '#f093fb' }
            ]
          }
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18
        },
        pointer: {
          icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
          width: 10,
          length: '75%',
          offsetCenter: [0, '5%']
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          distance: 25,
          color: '#4a5568',
          fontSize: 12,
          formatter: (value) => {
            return (value / 1000000) + 'M';
          }
        },
        title: {
          show: false
        },
        detail: {
          backgroundColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 2,
          width: '60%',
          lineHeight: 40,
          height: 40,
          borderRadius: 8,
          offsetCenter: [0, '35%'],
          valueAnimation: true,
          formatter: (value) => {
            return formatRupiah(value);
          },
          color: '#2d3748',
          fontSize: 16,
          fontWeight: 'bold'
        },
        data: [{ value: stats.monthlyRevenue }]
      }
    ],
    animationDuration: 4000,
    animationEasing: 'elasticOut'
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="icon">👥</div>
          <h3>Total Pelanggan</h3>
          <div className="value">{stats.totalCustomers}</div>
          <div className="trend">↑ 12% dari bulan lalu</div>
        </div>
        <div className="stat-card">
          <div className="icon">💰</div>
          <h3>Revenue Bulan Ini</h3>
          <div className="value">{formatRupiah(stats.monthlyRevenue)}</div>
          <div className="trend">↑ 8% dari bulan lalu</div>
        </div>
        <div className="stat-card">
          <div className="icon">🧾</div>
          <h3>Invoice Pending</h3>
          <div className="value">{stats.pendingInvoices}</div>
          <div className="trend" style={{ color: '#f56565' }}>Perlu ditagih</div>
        </div>
        <div className="stat-card">
          <div className="icon">📦</div>
          <h3>Total Paket</h3>
          <div className="value">{stats.totalPackages}</div>
          <div className="trend">Paket aktif</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <ReactECharts
            option={revenueChartOptions}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
        <div className="chart-card">
          <ReactECharts
            option={customerGrowthOptions}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <ReactECharts
            option={packageDistOptions}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
        <div className="chart-card">
          <ReactECharts
            option={revenueTargetOptions}
            style={{ height: '400px' }}
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
