import React, { useState, useEffect } from 'react';
import api from '../api/client';

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    speed: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', speed: '', price: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/packages', formData);
      setShowModal(false);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Gagal menyimpan paket');
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <div className="loading">Loading packages...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, color: '#2d3748' }}>Paket Internet</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Tambah Paket
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Paket</th>
              <th>Kecepatan</th>
              <th>Harga/Bulan</th>
              <th>Deskripsi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.id}</td>
                <td style={{ fontWeight: '600' }}>{pkg.name}</td>
                <td>{pkg.speed}</td>
                <td style={{ color: '#667eea', fontWeight: '600' }}>{formatRupiah(pkg.price)}</td>
                <td>{pkg.description}</td>
                <td>
                  <span className={`status ${pkg.status}`}>{pkg.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Tambah Paket Baru</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Paket *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Premium"
                />
              </div>
              <div className="form-group">
                <label>Kecepatan *</label>
                <input
                  type="text"
                  value={formData.speed}
                  onChange={(e) => setFormData({...formData, speed: e.target.value})}
                  required
                  placeholder="e.g., 100 Mbps"
                />
              </div>
              <div className="form-group">
                <label>Harga (Rp) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  placeholder="300000"
                />
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Deskripsi paket"
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

export default Packages;
