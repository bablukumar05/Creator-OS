import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resources } from '../../../shared/resources';
import { service, message } from '../services/api';
import { memberApi } from '../features/members/api/memberApi';
import { Button } from './ui';
import { money } from '../utils/format';
export default function ResourceForm({ resource, record, onSaved, onCancel }) {
  const config = resources[resource];
  const [relations, setRelations] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState(() =>
    Array.isArray(record?.assignedMembers) ? record.assignedMembers.map(String) : [],
  );
  const [assignedTo, setAssignedTo] = useState(() =>
    record?.assignedTo ? String(record.assignedTo) : '',
  );
  const [busy, setBusy] = useState(false);
  const supportsTeamAssignment = ['campaigns', 'content', 'tasks'].includes(resource);
  const defaults = Object.fromEntries(
    config.fields.map((f) => [
      f.key,
      record?.[f.key] ??
        (f.type === 'items'
          ? [{ description: '', quantity: 1, rate: 0 }]
          : f.type === 'checkbox'
            ? false
            : f.key === 'date'
              ? new Date().toISOString().slice(0, 10)
              : f.options?.[0] || ''),
    ]),
  );
  if (resource === 'brands') {
    defaults.contacts = Array.isArray(record?.contacts) ? record.contacts : [];
  }
  for (const f of config.fields.filter((f) => f.type === 'date'))
    defaults[f.key] = String(defaults[f.key]).slice(0, 10);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: defaults });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: 'contacts' });
  const values = watch();
  useEffect(() => {
    let active = true;
    Promise.all(
      config.fields
        .filter((f) => f.type === 'relation')
        .map(async (f) => [
          f.resource,
          (await service.list(f.resource, { limit: 100, sort: 'title' })).items,
        ]),
    )
      .then((entries) => active && setRelations(Object.fromEntries(entries)))
      .catch((e) => toast.error(message(e)));
    if (supportsTeamAssignment) {
      memberApi
        .list({ status: 'active', limit: 100 })
        .then((res) => {
          if (active) {
            setTeamMembers((res.items || []).filter((m) => m.user?._id || m.userId));
          }
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [resource, config.fields, supportsTeamAssignment]);
  const toggleAssignedMember = (userId) => {
    setAssignedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };
  const submit = async (formValues) => {
    setBusy(true);
    try {
      const data = Object.fromEntries(
        config.fields.map((f) => [f.key, formValues[f.key]]).filter(([, v]) => v != null),
      );
      if (resource === 'invoices')
        data.items = data.items.map(({ description, quantity, rate }) => ({
          description,
          quantity: Number(quantity),
          rate: Number(rate),
        }));
      if (resource === 'brands' && Array.isArray(formValues.contacts)) {
        data.contacts = formValues.contacts
          .filter((c) => c?.name?.trim())
          .map(({ name, role, email, phone, isPrimary }) => ({
            name: name.trim(),
            ...(role?.trim() ? { role: role.trim() } : {}),
            ...(email?.trim() ? { email: email.trim() } : {}),
            ...(phone?.trim() ? { phone: phone.trim() } : {}),
            isPrimary: Boolean(isPrimary),
          }));
      }
      if (resource === 'campaigns') {
        data.assignedMembers = assignedMembers;
      }
      if (['content', 'tasks'].includes(resource)) {
        if (assignedTo) data.assignedTo = assignedTo;
        else if (record?.assignedTo) data.assignedTo = '';
      }
      if (record) await service.update(resource, record._id, data);
      else await service.create(resource, data);
      toast.success(record ? 'Changes saved.' : 'Created successfully.');
      onSaved();
    } catch (e) {
      toast.error(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {config.fields.map((f) => (
          <div
            key={f.key}
            className={
              ['textarea', 'items'].includes(f.type) || f.key === 'title' ? 'sm:col-span-2' : ''
            }
          >
            <label className="label" htmlFor={`field-${f.key}`}>
              {f.label}
              {f.required && <span className="ml-1 text-muted">*</span>}
            </label>
            {f.type === 'items' ? (
              <div className="space-y-3">
                {fields.map((item, i) => (
                  <div key={item.id} className="rounded-lg border border-line p-3">
                    <input
                      aria-label={`Item ${i + 1} description`}
                      className="input mb-2"
                      placeholder="Service or deliverable"
                      {...register(`items.${i}.description`, { required: 'Add a description' })}
                    />
                    <div className="flex items-end gap-2">
                      <label className="min-w-0 flex-1 text-[10px] text-muted">
                        Quantity
                        <input
                          type="number"
                          className="input mt-1"
                          step="0.01"
                          min="0.01"
                          {...register(`items.${i}.quantity`, { required: true, min: 0.01 })}
                        />
                      </label>
                      <label className="min-w-0 flex-1 text-[10px] text-muted">
                        Rate
                        <input
                          type="number"
                          className="input mt-1"
                          step="0.01"
                          min="0"
                          {...register(`items.${i}.rate`, { required: true, min: 0 })}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={fields.length === 1}
                        className="icon-btn"
                        aria-label={`Remove item ${i + 1}`}
                        onClick={() => remove(i)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => append({ description: '', quantity: 1, rate: 0 })}
                >
                  <Plus size={14} />
                  Add line item
                </Button>
                <p className="text-right text-sm font-medium">
                  Subtotal:{' '}
                  {money(
                    (values.items || []).reduce(
                      (n, i) => n + Number(i.quantity || 0) * Number(i.rate || 0),
                      0,
                    ),
                  )}
                </p>
              </div>
            ) : f.type === 'textarea' ? (
              <textarea
                id={`field-${f.key}`}
                rows={3}
                className="input resize-y"
                {...register(f.key, { maxLength: 10000 })}
              />
            ) : f.type === 'select' || f.type === 'relation' ? (
              <select id={`field-${f.key}`} className="input" {...register(f.key)}>
                {f.type === 'relation' ? (
                  <>
                    <option value="">None</option>
                    {relations[f.resource]?.map((item) => (
                      <option value={item._id} key={item._id}>
                        {item.title}
                      </option>
                    ))}
                  </>
                ) : (
                  f.options.map((v) => <option key={v}>{v}</option>)
                )}
              </select>
            ) : (
              <input
                id={`field-${f.key}`}
                type={f.type}
                step={f.type === 'number' ? '0.01' : undefined}
                min={f.type === 'number' ? 0 : undefined}
                max={['tax', 'progress'].includes(f.key) ? 100 : undefined}
                className={f.type === 'checkbox' ? '' : 'input'}
                {...register(f.key, {
                  required: f.required ? `${f.label} is required` : false,
                  min: f.type === 'number' ? 0 : undefined,
                  max: ['tax', 'progress'].includes(f.key) ? 100 : undefined,
                  maxLength: f.type === 'text' ? 500 : undefined,
                  validate:
                    f.type === 'url'
                      ? (v) => !v || /^https?:\/\/[^\s]+$/.test(v) || 'Enter a valid URL (http:// or https://)'
                      : undefined,
                })}
              />
            )}
            {errors[f.key] && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors[f.key].message || 'Please check this field.'}
              </p>
            )}
          </div>
        ))}
        {resource === 'campaigns' && teamMembers.length > 0 && (
          <div className="sm:col-span-2">
            <p className="label">Assigned team members</p>
            <div className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-2">
              {teamMembers.map((member) => {
                const uid = String(member.user?._id || member.userId);
                const checked = assignedMembers.includes(uid);
                return (
                  <label
                    key={uid}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-canvas"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAssignedMember(uid)}
                    />
                    <span className="truncate font-medium">
                      {member.user?.name || member.email}
                    </span>
                    <span className="ml-auto rounded bg-sage px-1.5 py-0.5 text-[10px] capitalize text-accent">
                      {member.role}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {['content', 'tasks'].includes(resource) && teamMembers.length > 0 && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="field-assignedTo">
              Assigned team member
            </label>
            <select
              id="field-assignedTo"
              className="input"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => {
                const uid = String(member.user?._id || member.userId);
                return (
                  <option key={uid} value={uid}>
                    {member.user?.name || member.email} ({member.role})
                  </option>
                );
              })}
            </select>
          </div>
        )}
        {resource === 'brands' && (
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between">
              <p className="label mb-0">Additional brand contacts</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  appendContact({ name: '', role: '', email: '', phone: '', isPrimary: false })
                }
              >
                <Plus size={14} />
                Add contact
              </Button>
            </div>
            {contactFields.map((contact, i) => (
              <div key={contact.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-2">
                <input
                  className="input text-xs"
                  placeholder="Contact name *"
                  {...register(`contacts.${i}.name`)}
                />
                <input
                  className="input text-xs"
                  placeholder="Role (e.g. Brand Manager)"
                  {...register(`contacts.${i}.role`)}
                />
                <input
                  type="email"
                  className="input text-xs"
                  placeholder="Email"
                  {...register(`contacts.${i}.email`)}
                />
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 text-xs"
                    placeholder="Phone"
                    {...register(`contacts.${i}.phone`)}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove contact ${i + 1}`}
                    onClick={() => removeContact(i)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button loading={busy} type="submit">
          {busy ? 'Saving...' : record ? 'Save changes' : `Create ${config.singular}`}
        </Button>
      </div>
    </form>
  );
}
