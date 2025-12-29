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

  if (loading) return <div className="loading">Loading payments...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, color: '#2d3748' }}>Riwayat Pembayaran</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Catat Pembayaran
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Invoice No</th>
              <th>Pelanggan</th>
              <th>Jumlah</th>
              <th>Metode</th>
              <th>Tanggal</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td style={{ fontWeight: '600', color: '#667eea' }}>
                  {payment.invoice_number}
                </td>
                <td>{payment.customer_name}</td>
                <td style={{ fontWeight: '600', color: '#48bb78' }}>
                  {formatRupiah(payment.amount)}
                </td>
                <td style={{ textTransform: 'capitalize' }}>{payment.payment_method}</td>
                <td>
                  {new Date(payment.payment_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>{payment.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Catat Pembayaran</h2>
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
                  <option value="">-- Pilih Invoice --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name} - {formatRupiah(inv.amount)}
                    </option>
                  ))}
                </select>
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
              </div>
              <div className="form-group">
                <label>Metode Pembayaran *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  required
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="cash">Tunai</option>
                  <option value="e-wallet">E-Wallet</option>
                  <option value="other">Lainnya</option>
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
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan
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
