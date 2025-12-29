import React, { useState, useEffect } from 'react';
import api from '../api/client';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'transfer',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.filter(inv => inv.status === 'unpaid'));
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleAdd = () => {
    setFormData({ invoice_id: '', amount: '', payment_method: 'transfer', notes: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      setShowModal(false);
      fetchPayments();
      fetchInvoices();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Gagal menyimpan pembayaran');
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      transfer: '🏦',
      cash: '💵',
      'e-wallet': '📱',
      other: '💳'
    };
    return icons[method] || '💳';
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      transfer: '#5865f2',
      cash: '#34d399',
      'e-wallet': '#8b5cf6',
      other: '#f59e0b'
    };
    return colors[method] || '#5865f2';
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
        `}</style>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', fontWeight: '600' }}>
          Memuat data pembayaran...
        </p>
      </div>
    );
  }

  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '28px',
              background: 'linear-gradient(135deg, #5865f2 0%, #8b5cf6 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              Riwayat Pembayaran
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '6px',
              fontSize: '14px'
            }}>
              Total {payments.length} pembayaran - {formatRupiah(totalPayments)}
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>+</span>
            Catat Pembayaran
          </button>
        </div>

        {/* Helper Card */}
        {payments.length === 0 && (
          <div style={{
            padding: '16px 20px',
            background: 'rgba(52, 211, 153, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#34d399',
                marginBottom: '4px'
              }}>
                Langkah Keempat: Catat Pembayaran
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                Ketika pelanggan membayar invoice, catat pembayaran di sini. 
                Pilih invoice yang belum dibayar dan masukkan detail pembayaran.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Timeline */}
      {payments.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {payments.map((payment) => (
            <div 
              key={payment.id}
              style={{
                background: 'rgba(17, 24, 39, 0.6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(88, 101, 242, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
              {/* Gradient Border */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '4px',
                height: '100%',
                background: `linear-gradient(180deg, ${getPaymentMethodColor(payment.payment_method)} 0%, ${getPaymentMethodColor(payment.payment_method)}66 100%)`
              }}></div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1.5fr 1fr',
                gap: '24px',
                alignItems: 'center'
              }}>
                {/* Payment Method */}
                <div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `${getPaymentMethodColor(payment.payment_method)}22`,
                    border: `2px solid ${getPaymentMethodColor(payment.payment_method)}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    marginBottom: '8px'
                  }}>
                    {getPaymentMethodIcon(payment.payment_method)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {payment.payment_method}
                  </div>
                </div>

                {/* Invoice & Customer Info */}
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#5865f2',
                    marginBottom: '6px'
                  }}>
                    {payment.invoice_number}
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '4px'
                  }}>
                    {payment.customer_name}
                  </div>
                  {payment.notes && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontStyle: 'italic',
                      marginTop: '6px'
                    }}>
                      💬 {payment.notes}
                    </div>
                  )}
                </div>

                {/* Date & Time */}
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '4px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Tanggal Pembayaran
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📅</span> {formatDateTime(payment.payment_date)}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '6px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Jumlah
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#34d399'
                  }}>
                    {formatRupiah(payment.amount)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">💳</div>
          <h3>Belum ada pembayaran</h3>
          <p>Catat pembayaran dari pelanggan untuk melacak transaksi</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>💳 Catat Pembayaran</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Pilih Invoice *</label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => {
                    const invoice = invoices.find(i => i.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      invoice_id: e.target.value,
                      amount: invoice ? invoice.amount : ''
                    });
                  }}
                  required
                >
                  <option value="">-- Pilih Invoice Belum Bayar --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name} - {formatRupiah(inv.amount)}
                    </option>
                  ))}
                </select>
                {invoices.length === 0 && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    color: '#f59e0b',
                    fontWeight: '600'
                  }}>
                    ⚠️ Tidak ada invoice yang belum dibayar
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Jumlah (Rp) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  placeholder="300000"
                />
                {formData.amount && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#34d399',
                    fontWeight: '600'
                  }}>
                    {formatRupiah(formData.amount)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Metode Pembayaran *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  required
                >
                  <option value="transfer">🏦 Transfer Bank</option>
                  <option value="cash">💵 Tunai</option>
                  <option value="e-wallet">📱 E-Wallet</option>
                  <option value="other">💳 Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label>Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={invoices.length === 0}
                >
                  💾 Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
