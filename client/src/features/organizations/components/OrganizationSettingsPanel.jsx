import { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrganization } from '../../../store';
import { message } from '../../../services/api';
import { Button, Badge } from '../../../components/ui';
export function OrganizationSettingsPanel() {
  const { currentOrganization, membership, updateWorkspace, hasPermission } = useOrganization();
  const [busy, setBusy] = useState(false);
  if (!currentOrganization) {
    return <p className="text-xs text-muted">Loading organization details…</p>;
  }
  const canEdit = hasPermission('organization.update');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      await updateWorkspace({
        name: values.name,
        slug: values.slug,
        type: values.type,
        website: values.website,
        description: values.description,
        settings: {
          currency: values.currency,
          timezone: values.timezone,
        },
      });
      toast.success('Organization settings saved.');
    } catch (error) {
      toast.error(message(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-canvas p-4">
        <div>
          <p className="text-sm font-medium">{currentOrganization.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            Slug: <span className="font-mono">{currentOrganization.slug}</span> · Your role:{' '}
            <span className="font-medium capitalize">{membership?.role || 'member'}</span>
          </p>
        </div>
        <Badge>Active</Badge>
      </div>
      <form
        key={currentOrganization._id + (currentOrganization.updatedAt || '')}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="org-settings-name">
              Workspace name
            </label>
            <input
              id="org-settings-name"
              name="name"
              defaultValue={currentOrganization.name || ''}
              disabled={!canEdit}
              required
              minLength={2}
              maxLength={100}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="org-settings-slug">
              Workspace slug
            </label>
            <input
              id="org-settings-slug"
              name="slug"
              defaultValue={currentOrganization.slug || ''}
              disabled={!canEdit}
              required
              minLength={2}
              maxLength={80}
              className="input font-mono text-xs"
            />
          </div>
          <div>
            <label className="label" htmlFor="org-settings-type">
              Organization type
            </label>
            <select
              id="org-settings-type"
              name="type"
              defaultValue={currentOrganization.type || 'creator_workspace'}
              disabled={!canEdit}
              className="input"
            >
              <option value="creator_workspace">Creator workspace</option>
              <option value="agency">Talent agency</option>
              <option value="brand_team">Brand team</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="org-settings-website">
              Website
            </label>
            <input
              id="org-settings-website"
              name="website"
              type="url"
              defaultValue={currentOrganization.website || ''}
              disabled={!canEdit}
              placeholder="https://example.com"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="org-settings-currency">
              Workspace currency
            </label>
            <select
              id="org-settings-currency"
              name="currency"
              defaultValue={currentOrganization.settings?.currency || 'INR'}
              disabled={!canEdit}
              className="input"
            >
              {['INR', 'USD', 'EUR', 'GBP'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="org-settings-timezone">
              Workspace timezone
            </label>
            <input
              id="org-settings-timezone"
              name="timezone"
              defaultValue={currentOrganization.settings?.timezone || 'Asia/Kolkata'}
              disabled={!canEdit}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="org-settings-description">
            Workspace description
          </label>
          <textarea
            id="org-settings-description"
            name="description"
            rows={3}
            defaultValue={currentOrganization.description || ''}
            disabled={!canEdit}
            maxLength={1000}
            className="input"
          />
        </div>
        {canEdit ? (
          <div className="border-t border-line pt-4">
            <Button loading={busy}>Save organization settings</Button>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Only the organization owner can modify workspace settings.
          </p>
        )}
      </form>
    </div>
  );
}
