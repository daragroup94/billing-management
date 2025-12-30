import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Save, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  Check,
  AlertCircle,
  Lock,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'ISP Billing Co.',
    companyEmail: 'admin@ispbilling.com',
    companyPhone: '+62 812 3456 7890',
    companyAddress: 'Jl. Teknologi No. 123, Jakarta',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    language: 'id',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    overdueReminders: true,
    paymentConfirmations: true,
    newCustomerAlerts: true,
    invoiceGeneration: true,
    systemUpdates: false
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    dataRetention: 365,
    includeAttachments: true,
    compressBackups: true
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedGeneral = localStorage.getItem('generalSettings');
      const savedNotifications = localStorage.getItem('notificationSettings');
      const savedBackup = localStorage.getItem('backupSettings');

      if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
      if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications));
      if (savedBackup) setBackupSettings(JSON.parse(savedBackup));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveGeneralSettings = () => {
    setLoading(true);
    try {
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
      toast.success('General settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = () => {
    setLoading(true);
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      toast.success('Notification settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveBackupSettings = () => {
    setLoading(true);
    try {
      localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
      toast.success('Backup settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        toast.success('Password changed successfully! Please login again.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Will auto redirect to login via AuthContext
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('An error occurred while changing password');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDownload = () => {
    setLoading(true);
    try {
      // Simulate backup creation
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        settings: {
          general: generalSettings,
          notifications: notificationSettings,
          backup: backupSettings
        },
        user: {
          username: user?.username,
          email: user?.email,
          role: user?.role
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `isp-billing-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded successfully!');
    } catch (error) {
      toast.error('Failed to create backup');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result);
        
        if (backupData.settings) {
          if (backupData.settings.general) {
            setGeneralSettings(backupData.settings.general);
            localStorage.setItem('generalSettings', JSON.stringify(backupData.settings.general));
          }
          if (backupData.settings.notifications) {
            setNotificationSettings(backupData.settings.notifications);
            localStorage.setItem('notificationSettings', JSON.stringify(backupData.settings.notifications));
          }
          if (backupData.settings.backup) {
            setBackupSettings(backupData.settings.backup);
            localStorage.setItem('backupSettings', JSON.stringify(backupData.settings.backup));
          }
        }
        
        toast.success('Backup restored successfully!');
      } catch (error) {
        toast.error('Invalid backup file');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read backup file');
      setLoading(false);
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  };

  const resetToDefaults = () => {
    if (!confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      return;
    }

    // Clear localStorage
    localStorage.removeItem('generalSettings');
    localStorage.removeItem('notificationSettings');
    localStorage.removeItem('backupSettings');

    // Reset to defaults
    setGeneralSettings({
      companyName: 'ISP Billing Co.',
      companyEmail: 'admin@ispbilling.com',
      companyPhone: '+62 812 3456 7890',
      companyAddress: 'Jl. Teknologi No. 123, Jakarta',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      language: 'id',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    });

    setNotificationSettings({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      overdueReminders: true,
      paymentConfirmations: true,
      newCustomerAlerts: true,
      invoiceGeneration: true,
      systemUpdates: false
    });

    setBackupSettings({
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      dataRetention: 365,
      includeAttachments: true,
      compressBackups: true
    });

    toast.success('Settings reset to defaults!');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup & Data', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your application preferences</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetToDefaults}
          className="btn-danger text-sm"
        >
          Reset to Defaults
        </motion.button>
      </div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{user?.full_name || user?.username}</h3>
            <p className="text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-info capitalize">{user?.role}</span>
              <span className="text-xs text-slate-500">
                Last login: {user?.last_login ? new Date(user.last_login).toLocaleString('id-ID') : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs & Content */}
      <div className="card">
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-4 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={18} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">General Settings</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveGeneralSettings}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                    className="input"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Email</label>
                  <input
                    type="email"
                    value={generalSettings.companyEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyEmail: e.target.value })}
                    className="input"
                    placeholder="company@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Phone</label>
                  <input
                    type="tel"
                    value={generalSettings.companyPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, companyPhone: e.target.value })}
                    className="input"
                    placeholder="+62 812 3456 7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                  <select
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    className="input"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    className="input"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                  <select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                    className="input"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                    className="input"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time Format</label>
                  <select
                    value={generalSettings.timeFormat}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, timeFormat: e.target.value })}
                    className="input"
                  >
                    <option value="24h">24 Hour</option>
                    <option value="12h">12 Hour (AM/PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Address</label>
                <textarea
                  value={generalSettings.companyAddress}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, companyAddress: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Full company address"
                />
              </div>
            </motion.div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Notification Settings</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </motion.button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <label 
                    key={key}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-white font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        {key === 'emailNotifications' && 'Receive notifications via email'}
                        {key === 'smsNotifications' && 'Receive notifications via SMS'}
                        {key === 'pushNotifications' && 'Receive push notifications'}
                        {key === 'overdueReminders' && 'Get reminders for overdue payments'}
                        {key === 'paymentConfirmations' && 'Confirm when payments are received'}
                        {key === 'newCustomerAlerts' && 'Alert when new customers register'}
                        {key === 'invoiceGeneration' && 'Notify when invoices are generated'}
                        {key === 'systemUpdates' && 'Receive system update notifications'}
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          [key]: e.target.checked 
                        })}
                        className="sr-only peer"
                      />
                      <div className={`
                        w-14 h-7 rounded-full transition-all
                        ${value ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-700'}
                      `}>
                        <div className={`
                          absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform
                          ${value ? 'translate-x-7' : 'translate-x-0'}
                        `} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Bell className="text-blue-400 mt-1" size={20} />
                  <div>
                    <p className="text-white font-semibold mb-1">Notification Preferences</p>
                    <p className="text-slate-400 text-sm">
                      Configure how and when you want to receive notifications. 
                      Email notifications are recommended for important updates.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Security Settings</h3>
              
              {/* Change Password Section */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="text-purple-400" size={24} />
                  <div>
                    <h4 className="text-white font-semibold">Change Password</h4>
                    <p className="text-slate-400 text-sm">Update your account password</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="input pr-12"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="input pr-12"
                        placeholder="Enter new password (min. 8 characters)"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="input pr-12"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              passwordData.newPassword.length < 8 ? 'w-1/3 bg-red-500' :
                              passwordData.newPassword.length < 12 ? 'w-2/3 bg-yellow-500' :
                              'w-full bg-green-500'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${
                          passwordData.newPassword.length < 8 ? 'text-red-400' :
                          passwordData.newPassword.length < 12 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {passwordData.newPassword.length < 8 ? 'Weak' :
                           passwordData.newPassword.length < 12 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      {passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle size={14} />
                          Passwords do not match
                        </p>
                      )}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </motion.button>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-400 mt-1" size={24} />
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">Two-Factor Authentication (2FA)</h4>
                    <p className="text-slate-400 text-sm mb-4">
                      Add an extra layer of security to your account by enabling 2FA
                    </p>
                    <button className="btn-primary" onClick={() => toast.info('2FA feature coming soon!')}>
                      <Key size={18} className="inline mr-2" />
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <User size={20} />
                  Active Sessions
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">Current Session</p>
                      <p className="text-xs text-slate-400">Browser • {new Date().toLocaleString('id-ID')}</p>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* BACKUP & DATA SETTINGS */}
          {activeTab === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Backup & Data Settings</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={saveBackupSettings}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </motion.button>
              </div>

              {/* Auto Backup Toggle */}
              <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <div>
                  <p className="text-white font-medium">Automatic Backup</p>
                  <p className="text-sm text-slate-400">Automatically backup your data regularly</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={backupSettings.autoBackup}
                    onChange={(e) => setBackupSettings({ ...backupSettings, autoBackup: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`
                    w-14 h-7 rounded-full transition-all
                    ${backupSettings.autoBackup ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-700'}
                  `}>
                    <div className={`
                      absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform
                      ${backupSettings.autoBackup ? 'translate-x-7' : 'translate-x-0'}
                    `} />
                  </div>
                </div>
              </label>

              {/* Backup Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Backup Frequency</label>
                  <select
                    value={backupSettings.backupFrequency}
                    onChange={(e) => setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })}
                    className="input"
                    disabled={!backupSettings.autoBackup}
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Backup Time</label>
                  <input
                    type="time"
                    value={backupSettings.backupTime}
                    onChange={(e) => setBackupSettings({ ...backupSettings, backupTime: e.target.value })}
                    className="input"
                    disabled={!backupSettings.autoBackup || backupSettings.backupFrequency === 'hourly'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Data Retention (days)</label>
                  <input
                    type="number"
                    value={backupSettings.dataRetention}
                    onChange={(e) => setBackupSettings({ ...backupSettings, dataRetention: parseInt(e.target.value) })}
                    className="input"
                    min="30"
                    max="3650"
                  />
                  <p className="text-xs text-slate-500 mt-1">Keep backup files for this many days</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSettings.includeAttachments}
                      onChange={(e) => setBackupSettings({ ...backupSettings, includeAttachments: e.target.checked })}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500"
                    />
                    Include attachments in backup
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSettings.compressBackups}
                      onChange={(e) => setBackupSettings({ ...backupSettings, compressBackups: e.target.checked })}
                      className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500"
                    />
                    Compress backup files
                  </label>
                </div>
              </div>

              {/* Manual Backup Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Download Backup */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-start gap-3 mb-4">
                    <Download className="text-green-400 mt-1" size={24} />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Download Backup</h4>
                      <p className="text-slate-400 text-sm">
                        Create and download a complete backup of your settings and data
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBackupDownload}
                    disabled={loading}
                    className="btn-success w-full"
                  >
                    <Download size={18} className="inline mr-2" />
                    {loading ? 'Creating Backup...' : 'Download Backup'}
                  </motion.button>
                </div>

                {/* Restore Backup */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3 mb-4">
                    <Upload className="text-blue-400 mt-1" size={24} />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Restore Backup</h4>
                      <p className="text-slate-400 text-sm">
                        Upload and restore a previously downloaded backup file
                      </p>
                    </div>
                  </div>
                  <label className="btn-primary w-full cursor-pointer block text-center">
                    <Upload size={18} className="inline mr-2" />
                    Choose Backup File
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupRestore}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
              </div>

              {/* Backup Info */}
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-400 mt-1" size={20} />
                  <div>
                    <p className="text-yellow-400 font-semibold mb-1">Important Information</p>
                    <ul className="text-slate-400 text-sm space-y-1">
                      <li>• Backups are stored in JSON format and contain all settings</li>
                      <li>• Manual backups can be downloaded anytime</li>
                      <li>• Restoring a backup will overwrite current settings</li>
                      <li>• Keep your backup files in a secure location</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Storage Info */}
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Database size={20} />
                  Storage Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-slate-400">Settings Size</span>
                    <span className="text-white font-semibold">~2 KB</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-slate-400">Last Backup</span>
                    <span className="text-white font-semibold">
                      {localStorage.getItem('lastBackup') || 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span className="text-slate-400">Total Backups</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings
