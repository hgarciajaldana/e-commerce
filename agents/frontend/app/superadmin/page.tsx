'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import type { Empresa } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9-]+$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const PLANES = [
  { value: 'basic', label: 'Básico' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'enterprise', label: 'Enterprise' },
];

interface FormErrors {
  nombre?: string;
  nit?: string;
  subdominio?: string;
  portal_company_id?: string;
}

interface FormState {
  nombre: string;
  nit: string;
  subdominio: string;
  portal_company_id: string;
  plan: string;
}

const EMPTY_FORM: FormState = { nombre: '', nit: '', subdominio: '', portal_company_id: '', plan: 'basic' };

// ── Componente ────────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  // Lista
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Toggle
  const [toggleTarget, setToggleTarget] = useState<Empresa | null>(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Formulario de creación (panel lateral)
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Carga de empresas ─────────────────────────────────────────────────────

  const fetchEmpresas = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.getEmpresas({ page: p, limit: 20 });
      setEmpresas(res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setError('No se pudieron cargar las empresas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmpresas(1); }, [fetchEmpresas]);

  // ── Toggle activa/inactiva ────────────────────────────────────────────────

  const handleToggleConfirm = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    setToggleError(null);
    try {
      if (toggleTarget.activa) {
        await superAdminApi.updateEmpresa(toggleTarget.id, { activa: false });
      } else {
        await superAdminApi.updateEmpresa(toggleTarget.id, { activa: true });
      }
      setToggleTarget(null);
      fetchEmpresas(page);
    } catch {
      setToggleError('No se pudo actualizar el estado. Intenta de nuevo.');
    } finally {
      setToggling(false);
    }
  };

  // ── Formulario de nueva empresa ───────────────────────────────────────────

  const handleNombreChange = (value: string) => {
    setForm((f) => ({
      ...f,
      nombre: value,
      subdominio: !f.subdominio || f.subdominio === slugify(f.nombre) ? slugify(value) : f.subdominio,
    }));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es requerido.';
    if (!form.nit.trim()) errs.nit = 'El NIT es requerido.';
    if (!form.subdominio.trim()) {
      errs.subdominio = 'El subdominio es requerido.';
    } else if (!SLUG_REGEX.test(form.subdominio)) {
      errs.subdominio = 'Solo letras minúsculas, números y guiones.';
    } else if (form.subdominio.startsWith('-') || form.subdominio.endsWith('-')) {
      errs.subdominio = 'No puede comenzar ni terminar con guión.';
    } else if (form.subdominio.length < 2) {
      errs.subdominio = 'Mínimo 2 caracteres.';
    }
    if (form.portal_company_id && !/^[0-9a-f-]{36}$/i.test(form.portal_company_id)) {
      errs.portal_company_id = 'Debe ser un UUID válido (ej. 550e8400-e29b-41d4-a716-446655440000).';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    setSubmitting(true);
    try {
      await superAdminApi.createEmpresa({
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        slug: form.subdominio,
        planId: form.plan,
        portal_company_id: form.portal_company_id.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setFormOpen(false);
      fetchEmpresas(1);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; message?: string };
      if (apiErr.status === 409) {
        setFormErrors({ subdominio: 'Este subdominio ya está en uso.' });
      } else {
        setServerError(apiErr.message || 'No se pudo crear la empresa.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Lista de empresas ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Empresas</h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Cargando…' : `${total} empresa${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchEmpresas(page)} disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Recargar
            </Button>
            <Button size="sm" onClick={() => { setFormOpen(true); setForm(EMPTY_FORM); setFormErrors({}); setServerError(null); }}>
              <Plus size={16} />
              Nueva empresa
            </Button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchEmpresas(page)}>Reintentar</Button>
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No hay empresas registradas aún.</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={16} />Crear primera empresa
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Empresa</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Subdominio</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Creada</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{empresa.nombre}</p>
                        <p className="text-xs text-gray-400">{empresa.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {empresa.subdominio}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{empresa.plan || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={empresa.activa ? 'success' : 'default'}>
                          {empresa.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(empresa.created_at ?? empresa.createdAt).toLocaleDateString('es', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setToggleTarget(empresa); setToggleError(null); }}
                            title={empresa.activa ? 'Desactivar' : 'Activar'}
                            className={`transition-colors ${empresa.activa ? 'text-green-500 hover:text-red-500' : 'text-gray-400 hover:text-green-500'}`}
                          >
                            {empresa.activa ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchEmpresas(p)} />
          </>
        )}
      </div>

      {/* ── Panel formulario: apilado en mobile, lateral en desktop ── */}
      {formOpen && (
        <aside className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Nueva empresa</h3>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Nombre"
                required
                placeholder="Ej. Tienda Ejemplo"
                value={form.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                error={formErrors.nombre}
                disabled={submitting}
              />

              <Input
                label="NIT"
                required
                placeholder="Ej. 900123456-7"
                value={form.nit}
                onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value.trim() }))}
                error={formErrors.nit}
                disabled={submitting}
              />

              <Input
                label="Subdominio"
                required
                placeholder="ej. tienda-ejemplo"
                value={form.subdominio}
                onChange={(e) => setForm((f) => ({ ...f, subdominio: e.target.value.toLowerCase() }))}
                error={formErrors.subdominio}
                hint="Solo minúsculas, números y guiones"
                disabled={submitting}
              />

              <Input
                label="Portal Company ID"
                placeholder="UUID del portal-clientes"
                value={form.portal_company_id}
                onChange={(e) => setForm((f) => ({ ...f, portal_company_id: e.target.value.trim() }))}
                error={formErrors.portal_company_id}
                hint="UUID de la empresa en portal-clientes (opcional)"
                disabled={submitting}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-gray-100"
                >
                  {PLANES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{serverError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </aside>
      )}

      {/* ── Modal confirmación toggle ── */}
      <Modal
        open={!!toggleTarget}
        onClose={() => !toggling && setToggleTarget(null)}
        title={toggleTarget?.activa ? 'Desactivar empresa' : 'Activar empresa'}
        size="sm"
      >
        <p className="text-sm text-gray-700 mb-4">
          {toggleTarget?.activa ? (
            <>¿Desactivar <strong>{toggleTarget.nombre}</strong>? Los usuarios no podrán acceder al panel ni a la tienda.</>
          ) : (
            <>¿Activar <strong>{toggleTarget?.nombre}</strong>? La empresa recuperará acceso completo.</>
          )}
        </p>
        {toggleError && <p className="text-sm text-red-600 mb-4">{toggleError}</p>}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setToggleTarget(null)} disabled={toggling}>Cancelar</Button>
          <Button variant={toggleTarget?.activa ? 'danger' : 'primary'} loading={toggling} onClick={handleToggleConfirm}>
            {toggleTarget?.activa ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
