'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth, useI18n } from '@/components/providers';
import { Badge, Button, EmptyState, Field, Modal, Panel, PasswordInput, SelectInput, TextArea, TextInput } from '@/components/ui';
import { useQuery } from '@/hooks/use-query';
import { api, authorizedBlob } from '@/lib/api';

type StaffRow = {
  id: string;
  name: string;
  phone: string;
  address: string;
  details: string;
  email: string;
  role: string;
  status: string;
  hasPhoto: boolean;
  hasNid: boolean;
  nidNumber: string;
  nidDocument: { fileType: string; originalName: string; uploadedAt?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  details: '',
  nidNumber: '',
  email: '',
  password: '',
  role: 'STAFF',
  status: 'active',
};

async function authed<T>(tokenFn: () => Promise<string | null>, path: string, options: { method?: string; body?: unknown; form?: FormData } = {}) {
  const token = await tokenFn();
  return api<T>(path, { ...options, token });
}

function StaffPhoto({ id, token, className }: { id: string; token: () => Promise<string | null>; className?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    let url = '';
    token().then(async (value) => {
      if (!value || !active) return;
      const blob = await authorizedBlob(`/api/staff/${id}/photo`, value);
      url = URL.createObjectURL(blob);
      if (active) setSrc(url);
    }).catch(() => undefined);
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, token]);
  if (!src) return <span className={`grid place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600 dark:bg-stone-800 ${className ?? 'h-12 w-12'}`}>KT</span>;
  return <img src={src} alt="" className={`rounded-full object-cover ${className ?? 'h-12 w-12'}`} />;
}

function StaffForm({ initial, onClose, onSaved }: { initial?: StaffRow | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const auth = useAuth();
  const [form, setForm] = useState({ ...emptyForm, ...initial, password: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [nid, setNid] = useState<File | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const body = {
        name: form.name,
        phone: form.phone,
        address: form.address,
        details: form.details,
        nidNumber: form.nidNumber,
        email: form.email,
        password: form.password,
        role: form.role,
        status: form.status,
      };
      const saved = initial
        ? await authed<StaffRow>(auth.token, `/api/staff/${initial.id}`, { method: 'PATCH', body })
        : await authed<StaffRow>(auth.token, '/api/staff', { body });
      if (photo) {
        const data = new FormData();
        data.append('file', photo);
        await authed(auth.token, `/api/staff/${saved.id}/photo`, { form: data });
      }
      if (nid) {
        const data = new FormData();
        data.append('file', nid);
        await authed(auth.token, `/api/staff/${saved.id}/nid`, { form: data });
      }
      toast.success(initial ? t('staff.updated') : t('staff.saved'));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title={initial ? t('common.edit') : t('staff.add')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <section className="space-y-3">
          <h3 className="font-semibold">{t('staff.personal')}</h3>
          <Field label={t('common.name')}><TextInput required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label={t('staff.photo')} hint={t('staff.photoHint')}>
            <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
          </Field>
          <Field label={t('staff.details')}><TextArea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} /></Field>
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">{t('staff.contact')}</h3>
          <Field label={t('common.phone')}><TextInput value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
          <Field label={t('common.address')}><TextArea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">{t('staff.nidSection')}</h3>
          <Field label={t('staff.nidNumber')}><TextInput value={form.nidNumber} onChange={(event) => setForm({ ...form, nidNumber: event.target.value })} /></Field>
          <Field label={t('staff.nidFile')} hint={t('staff.fileHint')}>
            <input type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" onChange={(event) => setNid(event.target.files?.[0] ?? null)} />
          </Field>
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">{t('staff.employment')}</h3>
          <Field label={t('auth.email')}><TextInput type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label={t('staff.password')} hint={initial ? t('staff.passwordHint') : undefined}>
            <PasswordInput value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('staff.role')}>
              <SelectInput value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="STAFF">{t('role.staff')}</option>
                <option value="ADMIN">{t('role.admin')}</option>
              </SelectInput>
            </Field>
            <Field label={t('common.status')}>
              <SelectInput value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="active">{t('staff.active')}</option>
                <option value="inactive">{t('staff.inactive')}</option>
              </SelectInput>
            </Field>
          </div>
        </section>
        <Button type="submit" disabled={pending}>{pending ? t('common.loading') : t('common.save')}</Button>
      </form>
    </Modal>
  );
}

export function StaffManager() {
  const { t } = useI18n();
  const auth = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const rows = useQuery(() => authed<StaffRow[]>(auth.token, `/api/staff?q=${encodeURIComponent(q)}&status=${status}`), [auth.user?.uid, q, status]);

  async function startEdit(row: StaffRow) {
    try {
      const full = await authed<StaffRow>(auth.token, `/api/staff/${row.id}`);
      setEditing(full);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  async function setStaffStatus(row: StaffRow, next: string) {
    try {
      await authed(auth.token, `/api/staff/${row.id}`, { method: 'PATCH', body: { status: next } });
      toast.success(t('staff.updated'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  async function remove(row: StaffRow) {
    if (!window.confirm(t('staff.confirmDelete'))) return;
    try {
      await authed(auth.token, `/api/staff/${row.id}`, { method: 'DELETE' });
      toast.success(t('staff.deleted'));
      rows.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    }
  }

  if (auth.profile && auth.profile.role !== 'ADMIN') return <EmptyState title={t('staff.adminOnly')} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-700">{t('nav.admin')}</p>
          <h1 className="text-2xl font-semibold">{t('nav.staff')}</h1>
          <p className="text-sm text-stone-500">{t('staff.lead')}</p>
        </div>
        <Button type="button" onClick={() => { setEditing(null); setOpen(true); }}>{t('staff.add')}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <TextInput value={q} placeholder={t('staff.search')} onChange={(event) => setQ(event.target.value)} />
        <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t('common.all')}</option>
          <option value="active">{t('staff.active')}</option>
          <option value="inactive">{t('staff.inactive')}</option>
        </SelectInput>
      </div>
      {rows.loading ? <p>{t('common.loading')}</p> : !rows.data?.length ? <EmptyState title={t('common.empty')} /> : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.data.map((row) => (
              <Panel key={row.id}>
                <div className="flex gap-3">
                  {row.hasPhoto ? <StaffPhoto id={row.id} token={auth.token} /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-stone-200 text-xs font-semibold dark:bg-stone-800">KT</span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-sm">{row.phone || '—'}</p>
                    <p className="text-sm text-stone-500">{row.address || '—'}</p>
                    <Badge tone={row.status === 'active' ? 'ok' : 'warn'}>{row.status === 'active' ? t('staff.active') : t('staff.inactive')}</Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/staff/${row.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-3 text-sm font-semibold dark:border-stone-700">{t('staff.view')}</Link>
                  <Button type="button" variant="secondary" onClick={() => { void startEdit(row); }}>{t('common.edit')}</Button>
                  <Button type="button" variant="secondary" onClick={() => void setStaffStatus(row, row.status === 'active' ? 'inactive' : 'active')}>{row.status === 'active' ? t('staff.deactivate') : t('staff.activate')}</Button>
                  <Button type="button" variant="danger" onClick={() => void remove(row)}>{t('common.delete')}</Button>
                </div>
              </Panel>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  <th className="py-2 pr-3">{t('staff.photo')}</th>
                  <th className="py-2 pr-3">{t('common.name')}</th>
                  <th className="py-2 pr-3">{t('common.phone')}</th>
                  <th className="py-2 pr-3">{t('common.address')}</th>
                  <th className="py-2 pr-3">{t('common.status')}</th>
                  <th className="py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.data.map((row) => (
                  <tr key={row.id} className="border-b border-stone-200 align-middle dark:border-stone-800">
                    <td className="py-2 pr-3">{row.hasPhoto ? <StaffPhoto id={row.id} token={auth.token} /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-stone-200 text-xs font-semibold dark:bg-stone-800">KT</span>}</td>
                    <td className="py-2 pr-3 font-semibold">{row.name}</td>
                    <td className="py-2 pr-3">{row.phone || '—'}</td>
                    <td className="max-w-xs py-2 pr-3">{row.address || '—'}</td>
                    <td className="py-2 pr-3"><Badge tone={row.status === 'active' ? 'ok' : 'warn'}>{row.status === 'active' ? t('staff.active') : t('staff.inactive')}</Badge></td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/staff/${row.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700">{t('staff.view')}</Link>
                        <button type="button" className="min-h-11 text-sm font-semibold" onClick={() => { void startEdit(row); }}>{t('common.edit')}</button>
                        <button type="button" className="min-h-11 text-sm font-semibold" onClick={() => void setStaffStatus(row, row.status === 'active' ? 'inactive' : 'active')}>{row.status === 'active' ? t('staff.deactivate') : t('staff.activate')}</button>
                        <button type="button" className="min-h-11 text-sm font-semibold text-red-700" onClick={() => void remove(row)}>{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {open ? <StaffForm initial={editing} onClose={() => setOpen(false)} onSaved={() => rows.reload()} /> : null}
    </div>
  );
}

export function StaffProfile({ id }: { id: string }) {
  const { t } = useI18n();
  const auth = useAuth();
  const [editing, setEditing] = useState(false);
  const record = useQuery(() => authed<StaffRow>(auth.token, `/api/staff/${id}`), [auth.user?.uid, id]);

  async function openNid() {
    const token = await auth.token();
    if (!token || !record.data?.nidDocument) return;
    const blob = await authorizedBlob(`/api/staff/${id}/nid`, token);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  if (auth.profile && auth.profile.role !== 'ADMIN') return <EmptyState title={t('staff.adminOnly')} />;
  if (record.loading) return <p>{t('common.loading')}</p>;
  if (!record.data) return <EmptyState title={t('common.empty')} />;
  const row = record.data;

  return (
    <div className="space-y-4">
      <Link href="/admin/staff" className="text-sm font-semibold text-brand-700">{t('common.back')}</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {row.hasPhoto ? <StaffPhoto id={row.id} token={auth.token} className="h-20 w-20" /> : <span className="grid h-20 w-20 place-items-center rounded-full bg-stone-200 font-semibold dark:bg-stone-800">KT</span>}
          <div>
            <h1 className="text-2xl font-semibold">{row.name}</h1>
            <Badge tone={row.status === 'active' ? 'ok' : 'warn'}>{row.status === 'active' ? t('staff.active') : t('staff.inactive')}</Badge>
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold">{t('staff.personal')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{row.details || '—'}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">{t('staff.contact')}</h2>
          <p className="mt-2 text-sm">{t('common.phone')}: {row.phone || '—'}</p>
          <p className="text-sm">{t('auth.email')}: {row.email || '—'}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">{t('common.address')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{row.address || '—'}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">{t('staff.nidSection')}</h2>
          <p className="mt-2 text-sm">{t('staff.nidNumber')}: {row.nidNumber || '—'}</p>
        </Panel>
        <Panel>
          <h2 className="font-semibold">{t('staff.documents')}</h2>
          {row.hasNid ? (
            <button type="button" className="mt-2 min-h-11 text-sm font-semibold text-brand-700" onClick={() => void openNid()}>
              {t('staff.downloadNid')}{row.nidDocument?.originalName ? ` · ${row.nidDocument.originalName}` : ''}
            </button>
          ) : <p className="mt-2 text-sm text-stone-500">{t('staff.noDocument')}</p>}
        </Panel>
        <Panel>
          <h2 className="font-semibold">{t('staff.employment')}</h2>
          <p className="mt-2 text-sm">{row.role === 'ADMIN' ? t('role.admin') : t('role.staff')}</p>
          <p className="text-sm">{row.status === 'active' ? t('staff.active') : t('staff.inactive')}</p>
          {row.createdAt ? <p className="text-xs text-stone-500">{new Date(row.createdAt).toLocaleString()}</p> : null}
        </Panel>
      </div>
      {editing ? <StaffForm initial={row} onClose={() => setEditing(false)} onSaved={() => record.reload()} /> : null}
    </div>
  );
}
