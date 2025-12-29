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
          Memuat data paket...
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes cardPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .package-card {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          padding: 28px;
          border-radius: 20px;
          border: 1px solid rgba(88, 101, 242, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .package-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #5865f2 0%, #8b5cf6 50%, #ec4899 100%);
        }
        .package-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(88, 101, 242, 0.4);
          border-color: rgba(88, 101, 242, 0.6);
        }
      `}</style>

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
              Paket Internet
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '6px',
              fontSize: '14px'
            }}>
              Kelola paket layanan internet yang tersedia
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleAdd} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>+</span>
            Tambah Paket Baru
          </button>
        </div>

        {/* Helper Card */}
        {packages.length === 0 && (
          <div style={{
            padding: '16px 20px',
            background: 'rgba(88, 101, 242, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#5865f2',
                marginBottom: '4px'
              }}>
                Langkah Pertama: Buat Paket Internet
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: '1.5'
              }}>
                Paket adalah layanan internet yang akan Anda tawarkan kepada pelanggan. 
                Contoh: "Premium 100 Mbps - Rp 450.000/bulan"
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Package Cards Grid */}
      {packages.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              {/* Package Icon & Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #5865f2 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 8px 20px rgba(88, 101, 242, 0.4)'
                }}>
                  📦
                </div>
                <div>
                  <div style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: 'white',
                    marginBottom: '4px'
                  }}>
                    {pkg.name}
                  </div>
                  <span className={`status ${pkg.status}`}>
                    {pkg.status}
                  </span>
                </div>
              </div>

              {/* Speed */}
              <div style={{
                padding: '16px',
                background: 'rgba(88, 101, 242, 0.1)',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid rgba(88, 101, 242, 0.2)'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Kecepatan
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#5865f2',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⚡</span> {pkg.speed}
                </div>
              </div>

              {/* Price */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Harga Per Bulan
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {formatRupiah(pkg.price)}
                </div>
              </div>

              {/* Description */}
              {pkg.description && (
                <div style={{
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  {pkg.description}
                </div>
              )}

              {/* Meta Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                paddingTop: '12px',
                borderTop: '1px solid rgba(88, 101, 242, 0.2)'
              }}>
                <span>ID: {pkg.id}</span>
                <span>{new Date(pkg.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📦</div>
          <h3>Belum ada paket internet</h3>
          <p>Mulai tambahkan paket layanan internet untuk pelanggan Anda</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>📦 Tambah Paket Baru</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Paket *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Premium, Ultimate, Basic"
                />
              </div>
              <div className="form-group">
                <label>Kecepatan *</label>
                <input
                  type="text"
                  value={formData.speed}
                  onChange={(e) => setFormData({...formData, speed: e.target.value})}
                  required
                  placeholder="e.g., 100 Mbps, 50 Mbps"
                />
              </div>
              <div className="form-group">
                <label>Harga Per Bulan (Rp) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  placeholder="300000"
                />
                {formData.price && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#5865f2',
                    fontWeight: '600'
                  }}>
                    {formatRupiah(formData.price)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Deskripsi paket (opsional)"
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
                <button type="submit" className="btn btn-primary">
                  💾 Simpan Paket
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
