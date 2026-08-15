import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { api, getImageUrl } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface ShippingCompany {
  public_id: string;
  name: string;
  phone: string;
  logo_url?: string;
  notes?: string;
  is_active: boolean;
  region_ids?: number[];
  regions?: string[];
}

interface Region {
  id: number;
  name_ar: string;
  is_active: boolean;
}

const emptyForm = {
  name: '',
  phone: '',
  logo_url: '',
  notes: '',
  is_active: true,
  region_ids: [] as number[],
};

export function ShippingCompaniesPage() {
  const { handleError } = useApiError();
  const [companies, setCompanies] = useState<ShippingCompany[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingCompany | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ companies: ShippingCompany[] }>('/admin/shipping-companies');
      setCompanies(data.companies ?? []);
    } catch {
      // errors surface via the global handler
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    api
      .get<{ regions: Region[] }>('/regions')
      .then((d) => setRegions(d.regions ?? []))
      .catch(() => {});
  }, [fetchCompanies]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(c: ShippingCompany) {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      logo_url: c.logo_url ?? '',
      notes: c.notes ?? '',
      is_active: c.is_active,
      region_ids: c.region_ids ?? [],
    });
    setDialogOpen(true);
  }

  function toggleRegion(id: number) {
    setForm((f) => ({
      ...f,
      region_ids: f.region_ids.includes(id)
        ? f.region_ids.filter((r) => r !== id)
        : [...f.region_ids, id],
    }));
  }

  // At least one governorate: a carrier with no coverage appears for nobody, so
  // saving one would silently create a record that can never be seen.
  const canSave =
    form.name.trim().length >= 2 && form.phone.trim().length >= 6 && form.region_ids.length > 0;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        logo_url: form.logo_url.trim() || undefined,
        notes: form.notes.trim() || undefined,
        is_active: form.is_active,
        region_ids: form.region_ids,
      };
      if (editing) {
        await api.patch(`/admin/shipping-companies/${editing.public_id}`, body);
        toast.success('تم تحديث شركة الشحن');
      } else {
        await api.post('/admin/shipping-companies', body);
        toast.success('تمت إضافة شركة الشحن');
      }
      setDialogOpen(false);
      fetchCompanies();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(c: ShippingCompany) {
    try {
      await api.delete(`/admin/shipping-companies/${c.public_id}`);
      toast.success('تم إيقاف شركة الشحن');
      fetchCompanies();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPageHeader
        title="شركات الشحن"
        actions={<Button onClick={openCreate}>إضافة شركة</Button>}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <p className="text-muted-foreground">لا توجد شركات شحن</p>
            <p className="text-xs text-muted-foreground">
              لن تظهر أي شركة للتجار حتى تضيف واحدة وتحدد المحافظات التي تغطيها.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الشركة</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>المحافظات</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.public_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {c.logo_url ? (
                      <img
                        src={getImageUrl(c.logo_url) ?? undefined}
                        alt=""
                        className="size-9 rounded object-cover"
                      />
                    ) : (
                      <span className="grid size-9 place-items-center rounded bg-muted">🚚</span>
                    )}
                    <span className="font-medium">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell dir="ltr" className="text-end">
                  {c.phone}
                </TableCell>
                <TableCell className="max-w-64">
                  <span className="text-xs text-muted-foreground">
                    {(c.regions ?? []).join('، ') || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={c.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                    {c.is_active ? 'نشطة' : 'موقوفة'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      تعديل
                    </Button>
                    {c.is_active && (
                      <Button size="sm" variant="outline" onClick={() => deactivate(c)}>
                        إيقاف
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل شركة الشحن' : 'إضافة شركة شحن'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold">اسم الشركة *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="شركة النقل السريع"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">رقم الهاتف *</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01012345678"
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">رابط الشعار (اختياري)</label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">ملاحظات (اختياري)</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="مبردات، نقل مجمدات..."
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">
                المحافظات التي تغطيها * ({form.region_ids.length})
              </label>
              <div className="grid max-h-52 grid-cols-2 gap-1 overflow-y-auto rounded-lg border p-2">
                {regions
                  .filter((r) => r.is_active)
                  .map((r) => (
                    <label key={r.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.region_ids.includes(r.id)}
                        onChange={() => toggleRegion(r.id)}
                        className="size-4 accent-green-600"
                      />
                      {r.name_ar}
                    </label>
                  ))}
              </div>
              {form.region_ids.length === 0 && (
                <p className="mt-1 text-xs text-destructive">
                  اختر محافظة واحدة على الأقل، وإلا لن تظهر الشركة لأي تاجر.
                </p>
              )}
            </div>

            {editing && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-bold">نشطة</span>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={save} disabled={!canSave || saving}>
              {saving ? '...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
