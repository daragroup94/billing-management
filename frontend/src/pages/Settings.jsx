import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    companyName: 'ISP Billing Co.',
    companyEmail: 'admin@ispbilling.com',
    companyPhone: '+62 812 3456 7890',
    companyAddress: 'Jl. Teknologi No. 123, Jakarta',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    language: 'id',
    emailNotifications: true,
    smsNotifications: false,
    overdueReminders: true,
    paymentConfirmations: true,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '365'
  });

  const handleSave = () => {
    // Save settings logic here
    toast.success('Settings saved successfully!');
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
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your application preferences</p>
      </div>

      {/* Tabs */}
      <div className="card">
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
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
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
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">General Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Email</label>
                <input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Phone</label>
                <input
                  type="tel"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Address</label>
                <textarea
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="input min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="input"
                  >
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
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
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="input"
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Notification Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-slate-400">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div>
                    <p className="text-white font-medium">SMS Notifications</p>
                    <p className="text-sm text-slate-400">Receive notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Overdue Payment Reminders</p>
                    <p className="text-sm text-slate-400">Send reminders for overdue payments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.overdueReminders}
                    onChange={(e) => setSettings({ ...settings, overdueReminders: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Payment Confirmations</p>
                    <p className="text-sm text-slate-400">Send confirmation when payment received</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.paymentConfirmations}
                    onChange={(e) => setSettings({ ...settings, paymentConfirmations: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
            </motion.div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Security Settings</h3>
              
              <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-400 mt-1" size={24} />
                  <div>
                    <p className="text-white font-semibold mb-2">Two-Factor Authentication</p>
                    <p className="text-slate-400 text-sm mb-4">Add an extra layer of security to your account</p>
                    <button className="btn-primary">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Change Password</label>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="input"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="input"
                  />
                  <button className="btn-primary">
                    Update Password
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Backup & Data Settings */}
          {activeTab === 'backup' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Backup & Data Settings</h3>
              
              <label className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <div>
                  <p className="text-white font-medium">Automatic Backup</p>
                  <p className="text-sm text-slate-400">Automatically backup your data</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="input"
                  disabled={!settings.autoBackup}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Data Retention (days)</label>
                <input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => setSettings({ ...settings, dataRetention: e.target.value })}
                  className="input"
                  min="30"
                  max="3650"
                />
                <p className="text-xs text-slate-500 mt-2">Keep data for this many days before automatic deletion</p>
              </div>

              <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-400 font-semibold mb-2">Manual Backup</p>
                <p className="text-slate-400 text-sm mb-4">Download a complete backup of your data</p>
                <button className="btn-primary">
                  <Database size={18} className="inline mr-2" />
                  Download Backup
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            Save Changes
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
