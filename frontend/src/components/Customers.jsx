import React, { useState, useEffect } from 'react';
import api from '../api/client';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    installation_address: '',
    status: 'active'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      installation_address: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      installation_address: customer.installation_address || '',
      status: customer.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pelanggan ini?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Gagal menghapus pelanggan');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Gagal menyimpan data pelanggan');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const filteredCustomers = customers
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );

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
          Memuat data pelanggan...
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .filter-tabs {
          display: flex;
          gap: 12px;
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(20px);
          padding: 8px;
          border-radius: 12px;
          border: 1px solid rgba(88, 101, 242, 0.3);
        }
        .filter-tab {
          padding: 10px 20px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.6);
        }
        .filter-tab.active {
          background: linear-gradient(135deg, #5865f2 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
        }
        .filter-tab:hover:not(.active) {
          background: rgba(88, 101, 242, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        .search-box {
          position: relative;
          flex: 1;
          max-width: 400px;
        }
        .search-box input {
          width: 100%;
          padding: 12px 20px 12px 44px;
          border: 1px solid rgba(88, 101, 242, 0.3);
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(20px);
          color: white;
        }
        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .search-box input:focus {
          outline: none;
          border-color: #5865f2;
          box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.2);
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
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
              Data Pelanggan
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '6px',
              fontSize: '14px'
            }}>
              Kelola informasi pelanggan ISP Anda
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>+</span>
            Tambah Pelanggan
          </button>
        </div>

        {/* Filters & Search */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div className="filter-tabs">
            {['all', 'active', 'inactive'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? '📋 Semua' : status === 'active' ? '✅ Aktif' : '⏸️ Nonaktif'}
              </button>
            ))}
          </div>
          
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Cari nama, email, atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredCustomers.length > 0 ? (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{color: '#5865f2', fontWeight: '700'}}>{customer.id}</td>
                  <td style={{ fontWeight: '600', color: 'white' }}>{customer.name}</td>
                  <td style={{color: 'rgba(255, 255, 255, 0.8)'}}>{customer.email}</td>
                  <td style={{color: 'rgba(255, 255, 255, 0.8)'}}>{customer.phone}</td>
                  <td style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px'}}>{customer.address}</td>
                  <td>
                    <span className={`status ${customer.status}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px'}}>
                    {new Date(customer.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => handleEdit(customer)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleDelete(customer.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">
            {searchTerm || filterStatus !== 'all' ? '🔍' : '👥'}
          </div>
          <h3>
            {searchTerm || filterStatus !== 'all' 
              ? 'Tidak ada pelanggan ditemukan' 
              : 'Belum ada pelanggan'}
          </h3>
          <p>
            {searchTerm || filterStatus !== 'all'
              ? 'Coba ubah filter atau kata kunci pencarian'
              : 'Mulai tambahkan pelanggan baru untuk sistem billing Anda'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingCustomer ? '✏️ Edit Pelanggan' : '➕ Tambah Pelanggan'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="nama@email.com"
                />
              </div>
              <div className="form-group">
                <label>Nomor Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="form-group">
                <label>Alamat</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Alamat lengkap pelanggan"
                />
              </div>
              <div className="form-group">
                <label>Alamat Instalasi</label>
                <textarea
                  name="installation_address"
                  value={formData.installation_address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Alamat instalasi (jika berbeda)"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? '💾 Update' : '💾 Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
