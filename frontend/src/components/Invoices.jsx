import React, { useState, useEffect } from 'react';
import api from '../api/client';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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

  if (loading) return <div className="loading">Loading invoices...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#2d3748' }}>Daftar Invoice</h2>
        <p style={{ color: '#718096', marginTop: '5px' }}>
          Total Invoice: {invoices.length} | 
          Unpaid: {invoices.filter(i => i.status === 'unpaid').length}
        </p>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Pelanggan</th>
              <th>Email</th>
              <th>Jumlah</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td style={{ fontWeight: '600', color: '#667eea' }}>
                  {invoice.invoice_number}
                </td>
                <td>{invoice.customer_name}</td>
                <td>{invoice.email}</td>
                <td style={{ fontWeight: '600' }}>{formatRupiah(invoice.amount)}</td>
                <td>
                  {new Date(invoice.due_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td>
                  <span className={`status ${invoice.status}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  {new Date(invoice.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Invoices;
