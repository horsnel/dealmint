import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Shield, Trash2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { PasswordStrengthMeter } from '@/components/common/PasswordStrengthMeter';
import { passwordStrength } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { UserSettings } from '@/types';

const defaults: UserSettings = {
  emailNotifications: true,
  orderUpdates: true,
  messageAlerts: true,
  marketing: false,
  showPhone: false,
  showLocation: true,
};

const notificationRows: { key: keyof UserSettings; label: string; description: string }[] = [
  { key: 'orderUpdates', label: 'Order updates', description: 'New orders, deliveries and payments' },
  { key: 'messageAlerts', label: 'Message alerts', description: 'When someone sends you a message' },
  { key: 'emailNotifications', label: 'Email notifications', description: 'Get important updates by email' },
  { key: 'marketing', label: 'Tips and offers', description: 'Occasional product news and promotions' },
];

const privacyRows: { key: keyof UserSettings; label: string; description: string }[] = [
  { key: 'showLocation', label: 'Show my location', description: 'Display your city on your public profile' },
  { key: 'showPhone', label: 'Show my phone number', description: 'Let people you work with see your number' },
];

export function SettingsPage() {
  usePageTitle('Settings');
  const navigate = useNavigate();
  const { user, updateSettings, changePassword, deleteAccount, logout } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  if (!user) return null;
  const settings = { ...defaults, ...(user.settings || {}) };

  const toggle = (key: keyof UserSettings, value: boolean) => {
    updateSettings({ [key]: value });
    toast.success('Preference saved');
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (!current) return setPwError('Enter your current password');
    if (!passwordStrength(next).valid) return setPwError('Use 8+ characters with at least one letter and one number');
    if (next !== confirm) return setPwError('The new passwords do not match');
    setSaving(true);
    setTimeout(() => {
      const res = changePassword(current, next);
      setSaving(false);
      if (!res.ok) return setPwError(res.error);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Password updated');
    }, 500);
  };

  const handleDelete = () => {
    deleteAccount();
    setDeleteOpen(false);
    navigate('/', { replace: true });
    toast.success('Your account has been deleted');
  };

  const inputClass = 'mt-1 dark:bg-violet-700 dark:border-violet-600';

  const renderSwitches = (rows: typeof notificationRows) =>
    rows.map((row) => (
      <div key={row.key} className="flex items-center justify-between gap-4 py-3">
        <div>
          <Label htmlFor={row.key} className="text-gray-900 dark:text-white font-medium">
            {row.label}
          </Label>
          <p className="text-sm text-gray-500 dark:text-gray-400">{row.description}</p>
        </div>
        <Switch id={row.key} checked={settings[row.key]} onCheckedChange={(v) => toggle(row.key, v)} />
      </div>
    ));

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">Settings</h1>

        <Card className="dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Choose what you hear about</CardDescription>
          </CardHeader>
          <CardContent className="divide-y dark:divide-violet-700">{renderSwitches(notificationRows)}</CardContent>
        </Card>

        <Card className="dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Control what appears on your public profile</CardDescription>
          </CardHeader>
          <CardContent className="divide-y dark:divide-violet-700">{renderSwitches(privacyRows)}</CardContent>
        </Card>

        <Card className="dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePassword} className="space-y-4 max-w-md" noValidate>
              <div>
                <Label htmlFor="current-password" className="dark:text-gray-200">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="dark:text-gray-200">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  className={inputClass}
                />
                <PasswordStrengthMeter password={next} />
              </div>
              <div>
                <Label htmlFor="confirm-new-password" className="dark:text-gray-200">Confirm new password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              {pwError && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">{pwError}</p>
              )}
              <Button type="submit" disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                {saving ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="dark:bg-violet-800 dark:border-violet-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Sign out</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of Dealmint on this device</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate('/');
                  toast.success('You have been logged out');
                }}
                className="dark:border-violet-600 dark:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t dark:border-violet-700">
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">Delete account</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently remove your profile, listings, messages and wallet records
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirm('');
                  setDeleteOpen(true);
                }}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete your account?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              This cannot be undone. Any wallet balance ({`₦${user.walletBalance.toLocaleString()}`}) will be lost, so
              withdraw it first. Type your email to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={user.email}
            aria-label="Type your email to confirm"
            className="dark:bg-violet-700 dark:border-violet-600"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-violet-600 dark:text-white">Keep my account</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirm.trim().toLowerCase() !== user.email.toLowerCase()}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
