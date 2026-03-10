'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import type { Coleccion, StoreConfig, PromocionCarrusel, TextPos, Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import PhoneInput from '@/components/store/PhoneInput';
import ImageUpload from '@/components/ui/ImageUpload';
import { AlertCircle, CheckCircle2, Plus, Trash2, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';

function SectionCard({
  title,
  children,
  onClear,
  clearLabel = 'Limpiar sección',
}: {
  title: string;
  children: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            title={clearLabel}
          >
            <RotateCcw size={12} />
            {clearLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

const emptyPromo = (): PromocionCarrusel => ({
  id: crypto.randomUUID(),
  titulo: '',
  subtitulo: '',
  imagenUrl: '',
  enlace: '',
  textoBoton: '',
  textPos: 'center',
  activa: true,
  orden: 0,
});

type EnlaceTipo = 'ninguno' | 'productos' | 'promociones' | 'coleccion' | 'categoria' | 'personalizado';

function derivarTipo(enlace: string): EnlaceTipo {
  if (!enlace) return 'ninguno';
  if (enlace === '/productos') return 'productos';
  if (enlace === '/promociones') return 'promociones';
  if (enlace.startsWith('/colecciones/')) return 'coleccion';
  if (enlace.startsWith('/productos?categoria=')) return 'categoria';
  return 'personalizado';
}

function SlideEnlaceSelector({
  value,
  colecciones,
  categorias,
  onChange,
}: {
  value: string;
  colecciones: Coleccion[];
  categorias: Category[];
  onChange: (val: string) => void;
}) {
  const [tipo, setTipo] = useState<EnlaceTipo>(() => derivarTipo(value));
  const [coleccionId, setColeccionId] = useState<string>(() => {
    if (value.startsWith('/colecciones/')) return value.replace('/colecciones/', '');
    return '';
  });
  const [categoriaId, setCategoriaId] = useState<string>(() => {
    if (value.startsWith('/productos?categoria=')) return value.replace('/productos?categoria=', '');
    return '';
  });
  const [custom, setCustom] = useState<string>(() => {
    if (derivarTipo(value) === 'personalizado') return value;
    return '';
  });

  const handleTipo = (t: EnlaceTipo) => {
    setTipo(t);
    if (t === 'ninguno') onChange('');
    else if (t === 'productos') onChange('/productos');
    else if (t === 'promociones') onChange('/promociones');
    else if (t === 'coleccion') {
      const first = colecciones[0];
      if (first) { setColeccionId(first.id); onChange(`/colecciones/${first.id}`); }
      else { setColeccionId(''); onChange(''); }
    } else if (t === 'categoria') {
      const first = categorias[0];
      if (first) { setCategoriaId(first.id); onChange(`/productos?categoria=${first.id}`); }
      else { setCategoriaId(''); onChange(''); }
    } else {
      onChange(custom);
    }
  };

  const handleColeccion = (id: string) => {
    setColeccionId(id);
    onChange(id ? `/colecciones/${id}` : '');
  };

  const handleCategoria = (id: string) => {
    setCategoriaId(id);
    onChange(id ? `/productos?categoria=${id}` : '');
  };

  const handleCustom = (val: string) => {
    setCustom(val);
    onChange(val);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Enlace (opcional)</label>
      <select
        value={tipo}
        onChange={(e) => handleTipo(e.target.value as EnlaceTipo)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
      >
        <option value="ninguno">Sin enlace</option>
        <option value="productos">Todos los productos → /productos</option>
        <option value="promociones">Promociones → /promociones</option>
        <option value="coleccion">Por colección</option>
        <option value="categoria">Por categoría</option>
        <option value="personalizado">URL personalizada</option>
      </select>
      {tipo === 'coleccion' && (
        <select
          value={coleccionId}
          onChange={(e) => handleColeccion(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
        >
          {colecciones.length === 0 && <option value="">Sin colecciones disponibles</option>}
          {colecciones.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      )}
      {tipo === 'categoria' && (
        <select
          value={categoriaId}
          onChange={(e) => handleCategoria(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
        >
          {categorias.length === 0 && <option value="">Sin categorías disponibles</option>}
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      )}
      {tipo === 'personalizado' && (
        <input
          type="text"
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="/mi-pagina-personalizada"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Datos de la tienda ─────────────────────────────────────────────────
  const [tituloTienda, setTituloTienda] = useState('');
  const [descripcionTienda, setDescripcionTienda] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [monedaSimbolo, setMonedaSimbolo] = useState('$');
  const [logoUrl, setLogoUrl] = useState('');

  // ── Apariencia ─────────────────────────────────────────────────────────
  const [colorPrimario, setColorPrimario] = useState('#6366f1');
  const [colorSecundario, setColorSecundario] = useState('#8b5cf6');
  const [gradienteActivo, setGradienteActivo] = useState(false);
  const [gradienteAngulo, setGradienteAngulo] = useState(135);
  const [colorHeader, setColorHeader] = useState('#ffffff');
  const [colorFondo, setColorFondo] = useState('#ffffff');
  const [colorTexto, setColorTexto] = useState('#111827');

  // ── Hero ───────────────────────────────────────────────────────────────
  const [heroTipo, setHeroTipo] = useState<'color' | 'gradiente' | 'imagen'>('color');
  const [bannerUrl, setBannerUrl] = useState('');
  const [heroTitulo, setHeroTitulo] = useState('');
  const [heroSubtitulo, setHeroSubtitulo] = useState('');
  const [heroCtaTexto, setHeroCtaTexto] = useState('');
  const [heroCtaUrl, setHeroCtaUrl] = useState('/productos');
  const [heroTextPos, setHeroTextPos] = useState<'left' | 'center' | 'right'>('center');

  // ── Carrusel de promociones ────────────────────────────────────────────
  const [promociones, setPromociones] = useState<PromocionCarrusel[]>([]);
  const [editingPromo, setEditingPromo] = useState<PromocionCarrusel | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);

  // ── Contacto ───────────────────────────────────────────────────────────
  const [whatsappNumero, setWhatsappNumero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [direccion, setDireccion] = useState('');
  const [horario, setHorario] = useState('');
  const [mensajeTemplate, setMensajeTemplate] = useState('');

  // ── Redes sociales ─────────────────────────────────────────────────────
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [twitter, setTwitter] = useState('');
  const [youtube, setYoutube] = useState('');

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    adminApi.getStoreConfig()
      .then((res) => {
        const c = res.data;
        setConfig(c);
        setTituloTienda(c.tituloTienda ?? '');
        setDescripcionTienda(c.descripcionTienda ?? '');
        setMoneda(c.moneda ?? 'COP');
        setMonedaSimbolo(c.monedaSimbolo ?? '$');
        setLogoUrl(c.logoUrl ?? '');
        setColorPrimario(c.colorPrimario ?? '#6366f1');
        setColorSecundario(c.colorSecundario ?? '#8b5cf6');
        setGradienteActivo(c.gradienteActivo ?? false);
        setGradienteAngulo(c.gradienteAngulo ?? 135);
        setColorHeader(c.colorHeader ?? '#ffffff');
        setColorFondo(c.colorFondo ?? '#ffffff');
        setColorTexto(c.colorTexto ?? '#111827');
        setHeroTipo((c.heroTipo as 'color' | 'gradiente' | 'imagen') ?? 'color');
        setBannerUrl(c.bannerUrl ?? '');
        setHeroTitulo(c.heroTitulo ?? '');
        setHeroSubtitulo(c.heroSubtitulo ?? '');
        setHeroCtaTexto(c.heroCtaTexto ?? '');
        setHeroCtaUrl(c.heroCtaUrl ?? '/productos');
        setHeroTextPos((c.heroTextPos as 'left' | 'center' | 'right') ?? 'center');
        setPromociones(c.promociones ?? []);
        setWhatsappNumero(c.whatsappNumero ?? '');
        setTelefono(c.telefono ?? '');
        setEmailContacto(c.emailContacto ?? '');
        setDireccion(c.direccion ?? '');
        setHorario(c.horario ?? '');
        setMensajeTemplate(c.mensajeTemplate ?? '');
        setInstagram(c.instagram ?? '');
        setFacebook(c.facebook ?? '');
        setTiktok(c.tiktok ?? '');
        setTwitter(c.twitter ?? '');
        setYoutube(c.youtube ?? '');
      })
      .catch(() => setLoadError('No se pudo cargar la configuración.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    adminApi.getColecciones().then((res) => setColecciones(res.data)).catch(() => {});
    adminApi.getCategories().then((res) => setCategorias(res.data)).catch(() => {});
  }, []);

  // ── Gradient preview style ─────────────────────────────────────────────
  const gradientPreview = gradienteActivo && colorSecundario
    ? `linear-gradient(${gradienteAngulo}deg, ${colorPrimario}, ${colorSecundario})`
    : colorPrimario;

  // ── Hero background preview ────────────────────────────────────────────
  const heroPreviewStyle = (): React.CSSProperties => {
    if (heroTipo === 'gradiente' && colorSecundario) {
      return { background: `linear-gradient(${gradienteAngulo}deg, ${colorPrimario}, ${colorSecundario})` };
    }
    if (heroTipo === 'imagen' && bannerUrl) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)), url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { backgroundColor: colorPrimario };
  };

  // ── Promo CRUD ─────────────────────────────────────────────────────────
  const handleAddPromo = () => {
    const np = emptyPromo();
    np.orden = promociones.length;
    setEditingPromo(np);
    setShowPromoForm(true);
  };

  const handleSavePromo = () => {
    if (!editingPromo) return;
    if (!editingPromo.titulo.trim()) {
      alert('El título del slide es obligatorio.');
      return;
    }
    if (!editingPromo.imagenUrl) {
      alert('Debes subir una imagen para el slide.');
      return;
    }
    setPromociones((prev) => {
      const exists = prev.find((p) => p.id === editingPromo.id);
      if (exists) return prev.map((p) => (p.id === editingPromo.id ? editingPromo : p));
      return [...prev, editingPromo];
    });
    setEditingPromo(null);
    setShowPromoForm(false);
  };

  const handleDeletePromo = (id: string) => {
    setPromociones((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTogglePromo = (id: string) => {
    setPromociones((prev) => prev.map((p) => (p.id === id ? { ...p, activa: !p.activa } : p)));
  };

  const handleEditPromo = (promo: PromocionCarrusel) => {
    setEditingPromo({ ...promo });
    setShowPromoForm(true);
  };

  // ── Section clear handlers ─────────────────────────────────────────────
  const clearHero = () => {
    if (!confirm('¿Limpiar la sección Hero? Se borrarán título, subtítulo, CTA e imagen de fondo.')) return;
    setHeroTipo('color');
    setBannerUrl('');
    setHeroTitulo('');
    setHeroSubtitulo('');
    setHeroCtaTexto('');
    setHeroCtaUrl('/productos');
  };

  const clearCarrusel = () => {
    if (!confirm('¿Eliminar todos los slides del carrusel? Esta acción vaciará el carrusel.')) return;
    setPromociones([]);
    setEditingPromo(null);
    setShowPromoForm(false);
  };

  const clearContacto = () => {
    if (!confirm('¿Limpiar los datos de contacto? Se borrarán teléfono, email, dirección y horario.')) return;
    setWhatsappNumero('');
    setTelefono('');
    setEmailContacto('');
    setDireccion('');
    setHorario('');
    setMensajeTemplate('');
  };

  const clearRedesSociales = () => {
    if (!confirm('¿Limpiar todas las redes sociales?')) return;
    setInstagram('');
    setFacebook('');
    setTiktok('');
    setTwitter('');
    setYoutube('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await adminApi.updateStoreConfig({
        tituloTienda: tituloTienda.trim(),
        descripcionTienda: descripcionTienda.trim() || undefined,
        moneda: moneda.trim(),
        monedaSimbolo: monedaSimbolo.trim(),
        logoUrl: logoUrl.trim() || null,
        colorPrimario,
        colorSecundario: gradienteActivo ? colorSecundario : null,
        gradienteActivo,
        gradienteAngulo,
        colorHeader: colorHeader || null,
        colorFondo: colorFondo || null,
        colorTexto: colorTexto || null,
        heroTipo,
        bannerUrl: bannerUrl.trim() || null,
        heroTitulo: heroTitulo.trim() || null,
        heroSubtitulo: heroSubtitulo.trim() || null,
        heroCtaTexto: heroCtaTexto.trim() || null,
        heroCtaUrl: heroCtaUrl.trim() || '/productos',
        heroTextPos,
        promociones: promociones.map((p, i) => ({ ...p, orden: i })),
        whatsappNumero: whatsappNumero.trim(),
        telefono: telefono.trim() || null,
        emailContacto: emailContacto.trim() || null,
        direccion: direccion.trim() || null,
        horario: horario.trim() || null,
        mensajeTemplate: mensajeTemplate.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        twitter: twitter.trim() || null,
        youtube: youtube.trim() || null,
        version: config.version,
      } as Parameters<typeof adminApi.updateStoreConfig>[0]);
      setConfig(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (loadError) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <AlertCircle size={36} className="text-red-400 mb-3" />
        <p className="text-gray-600 mb-4">{loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Configuración de la tienda</h2>
        <p className="text-sm text-gray-500 mt-1">Personaliza la apariencia, contenido y datos de contacto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {saveError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />{saveError}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle2 size={16} className="shrink-0" />Configuración guardada correctamente.
          </div>
        )}

        {/* ── Datos de la tienda ─────────────────────────────────────── */}
        <SectionCard title="Datos de la empresa">
          <Input
            label="Nombre de la empresa / tienda"
            required
            value={tituloTienda}
            onChange={(e) => setTituloTienda(e.target.value)}
            placeholder="Mi Tienda"
          />
          <div>
            <FieldLabel>Descripción breve</FieldLabel>
            <textarea
              rows={2}
              value={descripcionTienda}
              onChange={(e) => setDescripcionTienda(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Descripción que aparecerá en el footer y página de contacto..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Moneda (código)" value={moneda} onChange={(e) => setMoneda(e.target.value)} placeholder="COP" />
            <Input label="Símbolo" value={monedaSimbolo} onChange={(e) => setMonedaSimbolo(e.target.value)} placeholder="$" />
          </div>
          <ImageUpload
            label="Logo"
            value={logoUrl}
            onChange={setLogoUrl}
            onClear={() => setLogoUrl('')}
            aspectRatio="free"
            hint="Recomendado: fondo transparente, formato PNG"
          />
        </SectionCard>

        {/* ── Apariencia ─────────────────────────────────────────────── */}
        <SectionCard title="Apariencia y colores">
          {/* Color primario */}
          <div>
            <FieldLabel>Color primario</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          {/* Gradiente toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-700">Usar gradiente</p>
              <p className="text-xs text-gray-400">Aplica un degradado en el hero y elementos del tema</p>
            </div>
            <button
              type="button"
              onClick={() => setGradienteActivo(!gradienteActivo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gradienteActivo ? 'bg-[var(--color-primary)]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                  gradienteActivo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Gradient settings */}
          {gradienteActivo && (
            <div className="space-y-3 pl-3 border-l-2 border-[var(--color-primary)]/30">
              <div>
                <FieldLabel>Color secundario</FieldLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <Input
                    value={colorSecundario}
                    onChange={(e) => setColorSecundario(e.target.value)}
                    placeholder="#8b5cf6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Ángulo ({gradienteAngulo}°)</FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={gradienteAngulo}
                  onChange={(e) => setGradienteAngulo(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
              {/* Live preview */}
              <div>
                <p className="text-xs text-gray-400 mb-1">Vista previa</p>
                <div
                  className="h-10 rounded-lg"
                  style={{ background: gradientPreview }}
                />
              </div>
            </div>
          )}

          {/* Header color */}
          <div>
            <FieldLabel>Color del header</FieldLabel>
            <p className="text-xs text-gray-400 mb-2">Fondo de la barra de navegación superior</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHeader}
                onChange={(e) => setColorHeader(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                value={colorHeader}
                onChange={(e) => setColorHeader(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>

          {/* Fondo color */}
          <div>
            <FieldLabel>Color de fondo</FieldLabel>
            <p className="text-xs text-gray-400 mb-2">Color de fondo general de la tienda</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorFondo}
                onChange={(e) => setColorFondo(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                value={colorFondo}
                onChange={(e) => setColorFondo(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>

          {/* Texto color */}
          <div>
            <FieldLabel>Color de texto</FieldLabel>
            <p className="text-xs text-gray-400 mb-2">Color principal del texto en la tienda</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorTexto}
                onChange={(e) => setColorTexto(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                value={colorTexto}
                onChange={(e) => setColorTexto(e.target.value)}
                placeholder="#111827"
                className="flex-1"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Hero / Banner ───────────────────────────────────────────── */}
        <SectionCard title="Hero / Banner principal" onClear={clearHero} clearLabel="Limpiar hero">
          <div>
            <FieldLabel>Tipo de fondo</FieldLabel>
            <div className="flex gap-2">
              {(['color', 'gradiente', 'imagen'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHeroTipo(t)}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                    heroTipo === t
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t === 'color' ? 'Color sólido' : t === 'gradiente' ? 'Gradiente' : 'Imagen'}
                </button>
              ))}
            </div>
          </div>

          {heroTipo === 'imagen' && (
            <ImageUpload
              label="Imagen de fondo del hero"
              value={bannerUrl}
              onChange={setBannerUrl}
              onClear={() => setBannerUrl('')}
              aspectRatio="banner"
              hint="Recomendado: 1200×400px o más ancha"
            />
          )}

          {/* Hero mini preview */}
          <div
            className="h-24 rounded-lg flex flex-col items-center justify-center text-white text-center px-4"
            style={heroPreviewStyle()}
          >
            <p className="text-sm font-bold truncate max-w-full">{heroTitulo || 'Título del hero'}</p>
            <p className="text-xs opacity-80 truncate max-w-full">{heroSubtitulo || 'Subtítulo...'}</p>
            <span className="mt-1.5 px-3 py-0.5 bg-white rounded-full text-xs font-medium" style={{ color: colorPrimario }}>
              {heroCtaTexto || 'Ver productos'}
            </span>
          </div>

          <Input
            label="Título"
            value={heroTitulo}
            onChange={(e) => setHeroTitulo(e.target.value)}
            placeholder="Bienvenido a nuestra tienda"
          />
          <Input
            label="Subtítulo"
            value={heroSubtitulo}
            onChange={(e) => setHeroSubtitulo(e.target.value)}
            placeholder="Encuentra los mejores productos"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Texto del botón"
              value={heroCtaTexto}
              onChange={(e) => setHeroCtaTexto(e.target.value)}
              placeholder="Ver productos"
            />
            <Input
              label="URL del botón"
              value={heroCtaUrl}
              onChange={(e) => setHeroCtaUrl(e.target.value)}
              placeholder="/productos"
            />
          </div>
          <div>
            <FieldLabel>Posición del texto</FieldLabel>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setHeroTextPos(pos)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    heroTextPos === pos
                      ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5 font-medium'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pos === 'left' ? 'Izquierda' : pos === 'center' ? 'Centro' : 'Derecha'}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Carrusel de promociones ─────────────────────────────────── */}
        <SectionCard title="Carrusel de promociones" onClear={clearCarrusel} clearLabel="Vaciar carrusel">
          <p className="text-xs text-gray-400 -mt-2">
            Imágenes o banners que se muestran en el homepage como carrusel automático.
          </p>

          {/* Promo list */}
          <div className="space-y-2">
            {promociones.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay promociones configuradas.</p>
            )}
            {promociones.map((promo, idx) => (
              <div
                key={promo.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <GripVertical size={16} className="text-gray-300 shrink-0" />
                {promo.imagenUrl ? (
                  <img
                    src={promo.imagenUrl}
                    alt={promo.titulo}
                    className="w-12 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                    Img
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{promo.titulo || 'Sin título'}</p>
                  {promo.subtitulo && <p className="text-xs text-gray-400 truncate">{promo.subtitulo}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePromo(promo.id)}
                    className={`p-1.5 rounded transition-colors ${promo.activa ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={promo.activa ? 'Activa — click para desactivar' : 'Inactiva — click para activar'}
                  >
                    {promo.activa ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditPromo(promo)}
                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors text-xs font-medium"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePromo(promo.id)}
                    className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit promo form */}
          {showPromoForm && editingPromo ? (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-800">
                {promociones.find((p) => p.id === editingPromo.id) ? 'Editar promoción' : 'Nueva promoción'}
              </p>
              <ImageUpload
                label="Imagen del slide"
                value={editingPromo.imagenUrl || null}
                onChange={(url) => setEditingPromo({ ...editingPromo, imagenUrl: url })}
                onClear={() => setEditingPromo({ ...editingPromo, imagenUrl: '' })}
                aspectRatio="video"
                hint="Recomendado: 1280×720px"
              />
              <Input
                label="Título"
                required
                value={editingPromo.titulo}
                onChange={(e) => setEditingPromo({ ...editingPromo, titulo: e.target.value })}
                placeholder="Oferta de temporada"
              />
              <Input
                label="Subtítulo"
                value={editingPromo.subtitulo ?? ''}
                onChange={(e) => setEditingPromo({ ...editingPromo, subtitulo: e.target.value })}
                placeholder="Hasta 50% de descuento"
              />
              <SlideEnlaceSelector
                value={editingPromo.enlace ?? ''}
                colecciones={colecciones}
                categorias={categorias}
                onChange={(val) => setEditingPromo({ ...editingPromo, enlace: val })}
              />
              <div>
                <FieldLabel>Posición del texto</FieldLabel>
                <select
                  value={editingPromo.textPos ?? 'center'}
                  onChange={(e) => setEditingPromo({ ...editingPromo, textPos: e.target.value as TextPos })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <Input
                label="Texto del botón CTA"
                value={editingPromo.textoBoton ?? ''}
                onChange={(e) => setEditingPromo({ ...editingPromo, textoBoton: e.target.value })}
                placeholder="Ver más"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleSavePromo}>
                  Guardar slide
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowPromoForm(false); setEditingPromo(null); }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPromo}
              className="w-full"
            >
              <Plus size={15} />
              Agregar slide
            </Button>
          )}
        </SectionCard>

        {/* ── Contacto ───────────────────────────────────────────────── */}
        <SectionCard title="Contacto" onClear={clearContacto} clearLabel="Limpiar contacto">
          <div>
            <FieldLabel required>WhatsApp</FieldLabel>
            <PhoneInput value={whatsappNumero} onChange={(val) => setWhatsappNumero(val)} />
          </div>
          <Input
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+57 300 123 4567"
          />
          <Input
            label="Email de contacto"
            type="email"
            value={emailContacto}
            onChange={(e) => setEmailContacto(e.target.value)}
            placeholder="contacto@mitienda.com"
          />
          <Input
            label="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle 123 #45-67, Bogotá"
          />
          <Input
            label="Horario de atención"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            placeholder="Lunes a Viernes 9am – 6pm"
          />
          <div>
            <FieldLabel>Plantilla de mensaje WhatsApp</FieldLabel>
            <textarea
              rows={3}
              value={mensajeTemplate}
              onChange={(e) => setMensajeTemplate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Hola! Quiero hacer el siguiente pedido: {pedido}"
            />
          </div>
        </SectionCard>

        {/* ── Redes sociales ─────────────────────────────────────────── */}
        <SectionCard title="Redes sociales" onClear={clearRedesSociales} clearLabel="Limpiar redes">
          <Input
            label="Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/mitienda"
          />
          <Input
            label="Facebook"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="https://facebook.com/mitienda"
          />
          <Input
            label="TikTok"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="https://tiktok.com/@mitienda"
          />
          <Input
            label="Twitter / X"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="https://x.com/mitienda"
          />
          <Input
            label="YouTube"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/@mitienda"
          />
        </SectionCard>

        <div className="flex gap-3 pb-8">
          <Button type="submit" loading={saving}>
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
