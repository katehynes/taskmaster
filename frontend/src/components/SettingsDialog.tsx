import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api/tasksApi';
import './SettingsDialog.css';

interface SettingsDialogProps {
  onClose: () => void;
  onSaved?: () => void;
}

export function SettingsDialog({ onClose, onSaved }: SettingsDialogProps) {
  const [expirationDays, setExpirationDays] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setExpirationDays(s.expirationDays))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Math.max(0, Math.floor(Number(expirationDays)));
    setSaving(true);
    try {
      await updateSettings(value);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Settings</h3>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="settings-label">
              <span className="settings-label-text">Tasks stay visible for this many days after their scheduled date:</span>
              <input
                type="number"
                min={0}
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="settings-input"
              />
            </label>
            <p className="settings-hint">Default is 2 days. After that, tasks are hidden from the list (unless you turn on “Show expired”).</p>
            <div className="settings-actions">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
