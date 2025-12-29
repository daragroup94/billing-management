import React, { useState, useEffect } from 'react';
import api from '../api/client';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    package_id: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes, packagesRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/customers'),
        api.get('/packages')
      ]);
      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
      setPackages(packagesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `INV-${year}${month}-${random}`;
  };

  const handleAdd = () => {
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    const dueDate = nextMonth.toISOString().split('T')[0];
    
    setFormData({
      customer_id: '',
      package_id: '',
      amount: '',
      due_date: dueDate
    });
    setShowModal(true);
  };

  const handleCustomerChange = (customerId) => {
    setFormData({
      ...formData,
      customer_id: customerId,
      package_id: '',
      amount: ''
    });
  };

  const handlePackageChange = (packageId) => {
    const selectedPackage = packages.find(p => p.id === parseInt(packageId));
    setFormData({
      ...formData,
      package_id: packageId,
      amount: selectedPackage ? selectedPackage.price : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const invoiceNumber = generateInvoiceNumber();
      await api.post('/invoices/create', {
        ...formData,
        invoice_number: invoiceNumber
      });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Gagal membuat invoice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus invoice ini?')) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Gagal menghapus invoice');
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/invoices/${id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengupdate status');
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    return status === 'paid' ? '#48bb78' : status === 'unpaid' ? '#f56565' : '#ed8936';
  };

  const getOverdueDays = (dueDate, status) => {
    if (status === 'paid') return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const filteredInvoices = invoices
    .filter(inv => filterStatus === 'all' || inv.status === filterStatus)
    .filter(inv => 
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    overdue: invoices.filter(i => {
      const days = getOverdueDays(i.due_date, i.status);
      return days && days > 0;
    }).length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
    unpaidAmount: invoices.filter(i => i.status === 'unpaid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
  };

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
          Loading invoices...
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .stat-card-invoice {
          animation: fadeInUp 0.6s ease-out backwards;
        }
        .stat-card-invoice:nth-child(1) { animation-delay: 0.1s; }
        .stat-card-invoice:nth-child(2) { animation-delay: 0.2s; }
        .stat-card-invoice:nth-child(3) { animation-delay: 0.3s; }
        .stat-card-invoice:nth-child(4) { animation-delay: 0.4s; }
        
        .invoice-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .invoice-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }
        
        .status-badge.paid {
          background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
          color: #22543d;
          box-shadow: 0 4px 12px rgba(150, 230, 161, 0.3);
        }
        
        .status-badge.unpaid {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          color: #7c2d12;
          box-shadow: 0 4px 12px rgba(252, 182, 159, 0.3);
        }
        
        .status-badge.overdue {
          background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
          color: #742a2a;
          box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }
        
        .filter-tabs {
          display: flex;
          gap: 12px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .filter-tab {
          padding: 12px 24px;
          border: none;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          color: #718096;
        }
        
        .filter-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .filter-tab:hover:not(.active) {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        
        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }
        
        .search-box input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 14px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.95);
        }
        
        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: #a0aec0;
        }
      `}</style>

      {/* Header dengan Stats */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              Invoice Management
            </h2>
            <p style={{ 
              color: '#718096', 
              marginTop: '8px',
              fontSize: '15px'
            }}>
              Kelola dan pantau semua invoice pelanggan
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px'
          }}>
            <span style={{ fontSize: '20px' }}>+</span>
            Buat Invoice Baru
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div className="stat-card-invoice" style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '13px', color: '#667eea', fontWeight: '700', marginBottom: '8px' }}>
              TOTAL INVOICE
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: '#2d3748',
              marginBottom: '4px'
            }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {formatRupiah(stats.totalAmount)}
            </div>
          </div>

          <div className="stat-card-invoice" style={{
            background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(56, 161, 105, 0.1) 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid rgba(72, 187, 120, 0.2)',
            boxShadow: '0 8px 25px rgba(72, 187, 120, 0.15)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <div style={{ fontSize: '13px', color: '#48bb78', fontWeight: '700', marginBottom: '8px' }}>
              TERBAYAR
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: '#2d3748',
              marginBottom: '4px'
            }}>
              {stats.paid}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {formatRupiah(stats.paidAmount)}
            </div>
          </div>

          <div className="stat-card-invoice" style={{
            background: 'linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(221, 107, 32, 0.1) 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid rgba(237, 137, 54, 0.2)',
            boxShadow: '0 8px 25px rgba(237, 137, 54, 0.15)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '13px', color: '#ed8936', fontWeight: '700', marginBottom: '8px' }}>
              BELUM BAYAR
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: '#2d3748',
              marginBottom: '4px'
            }}>
              {stats.unpaid}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {formatRupiah(stats.unpaidAmount)}
            </div>
          </div>

          <div className="stat-card-invoice" style={{
            background: 'linear-gradient(135deg, rgba(245, 101, 101, 0.1) 0%, rgba(229, 62, 62, 0.1) 100%)',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid rgba(245, 101, 101, 0.2)',
            boxShadow: '0 8px 25px rgba(245, 101, 101, 0.15)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '13px', color: '#f56565', fontWeight: '700', marginBottom: '8px' }}>
              TERLAMBAT
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              color: '#2d3748',
              marginBottom: '4px'
            }}>
              {stats.overdue}
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              Perlu tindakan segera
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center',
          marginBottom: '25px',
          flexWrap: 'wrap'
        }}>
          <div className="filter-tabs">
            {['all', 'paid', 'unpaid'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '📋 Semua' : status === 'paid' ? '✅ Terbayar' : '⏳ Belum Bayar'}
              </button>
            ))}
          </div>
          
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari invoice, pelanggan, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoice Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '24px'
      }}>
        {filteredInvoices.map((invoice) => {
          const overdueDays = getOverdueDays(invoice.due_date, invoice.status);
          const isOverdue = overdueDays && overdueDays > 0;

          return (
            <div 
              key={invoice.id} 
              className="invoice-card"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                padding: '28px',
                borderRadius: '20px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                border: `2px solid ${isOverdue ? '#feb2b2' : 'rgba(255, 255, 255, 0.8)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Gradient Top Border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '6px',
                background: `linear-gradient(90deg, ${getStatusColor(invoice.status)} 0%, ${getStatusColor(invoice.status)}aa 100%)`
              }}></div>

              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: '800',
                    color: '#667eea',
                    marginBottom: '4px'
                  }}>
                    {invoice.invoice_number}
                  </div>
                  <div style={{ fontSize: '13px', color: '#a0aec0' }}>
                    Dibuat: {formatDate(invoice.created_at)}
                  </div>
                </div>
                <span className={`status-badge ${isOverdue ? 'overdue' : invoice.status}`}>
                  {isOverdue ? `⚠️ ${overdueDays}h Terlambat` : 
                   invoice.status === 'paid' ? '✅ Lunas' : '⏳ Belum Bayar'}
                </span>
              </div>

              {/* Customer Info */}
              <div style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: '#2d3748',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>👤</span> {invoice.customer_name}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>📧</span> {invoice.email}
                </div>
              </div>

              {/* Amount & Due Date */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#a0aec0',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    JUMLAH TAGIHAN
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '900',
                    color: '#2d3748'
                  }}>
                    {formatRupiah(invoice.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#a0aec0',
                    fontWeight: '600',
                    marginBottom: '6px'
                  }}>
                    JATUH TEMPO
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    color: isOverdue ? '#f56565' : '#2d3748'
                  }}>
                    📅 {formatDate(invoice.due_date)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                {invoice.status === 'unpaid' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                    style={{ flex: 1 }}
                  >
                    ✅ Tandai Lunas
                  </button>
                )}
                {invoice.status === 'paid' && (
                  <button 
                    className="btn btn-sm"
                    onClick={() => handleStatusUpdate(invoice.id, 'unpaid')}
                    style={{ 
                      flex: 1,
                      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                      color: 'white'
                    }}
                  >
                    ↩️ Batalkan
                  </button>
                )}
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(invoice.id)}
                  style={{ width: '48px', padding: '8px' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredInvoices.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
          <h3 style={{ color: '#2d3748', marginBottom: '10px' }}>
            Tidak ada invoice ditemukan
          </h3>
          <p style={{ color: '#718096' }}>
            {searchTerm ? 'Coba kata kunci lain' : 'Mulai buat invoice baru untuk pelanggan'}
          </p>
        </div>
      )}

      {/* Modal Create Invoice */}
      {showModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 style={{ 
              marginBottom: '30px',
              fontSize: '28px',
              fontWeight: '800'
            }}>
              🧾 Buat Invoice Baru
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Pilih Pelanggan *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  style={{ fontSize: '15px' }}
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.filter(c => c.status === 'active').map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pilih Paket *</label>
                <select
                  value={formData.package_id}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  required
                  disabled={!formData.customer_id}
                  style={{ fontSize: '15px' }}
                >
                  <option value="">-- Pilih Paket --</option>
                  {packages.filter(p => p.status === 'active').map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.speed} - {formatRupiah(pkg.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Jumlah Tagihan (Rp) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  placeholder="Masukkan jumlah"
                  style={{ fontSize: '18px', fontWeight: '600' }}
                />
                {formData.amount && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: '#667eea',
                    fontWeight: '600'
                  }}>
                    {formatRupiah(formData.amount)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Tanggal Jatuh Tempo *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required
                  style={{ fontSize: '15px' }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '30px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowModal(false)}
                  style={{ fontSize: '15px' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ fontSize: '15px' }}
                >
                  💾 Simpan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
