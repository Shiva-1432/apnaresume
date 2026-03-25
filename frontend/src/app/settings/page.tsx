'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormInput from '@/components/ui/FormInput';

type SettingsTab = 'profile' | 'privacy' | 'account';

interface LocalUser {
  name?: string;
  email?: string;
  created_at?: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleExportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/gdpr/export-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'json'
        }
      );

      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apnaresume-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      alert('Your data has been exported');
    } catch {
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure? This will delete your account and ALL your data permanently.\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    const confirmDelete = prompt('Type "DELETE" to confirm account deletion:', '');

    if (confirmDelete !== 'DELETE') {
      alert('Account deletion cancelled');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/gdpr/delete-account`,
        {
          password,
          confirm: 'DELETE'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.error || 'Failed to delete account');
      } else {
        alert('Failed to delete account');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs: SettingsTab[] = ['profile', 'privacy', 'account'];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">Settings</h1>

        <div className="flex gap-4 mb-8 border-b">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'profile' && 'Profile'}
              {t === 'privacy' && 'Privacy & Data'}
              {t === 'account' && 'Account'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
            <p className="text-gray-600">Profile editing will be added here.</p>
          </Card>
        )}

        {tab === 'privacy' && (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Your Data</h2>
              <p className="text-gray-600 mb-6">
                Download all your personal data in JSON format. This includes your resume, analyses,
                applications, and more.
              </p>
              <Button
                variant="primary"
                onClick={handleExportData}
                loading={loading}
                disabled={loading}
              >
                Export My Data
              </Button>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Account</h2>
              <p className="text-gray-600 mb-6">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="mb-6">
                <FormInput
                  label="Confirm your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={loading}
                disabled={loading || !password}
                fullWidth
              >
                {loading ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </Card>
          </div>
        )}

        {tab === 'account' && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
