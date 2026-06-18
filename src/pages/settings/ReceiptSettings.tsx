import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Receipt, ChevronLeft, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import LockedPage from '@/components/LockedPage';
import { toast } from 'sonner';

export default function ReceiptSettings() {
  const { t } = useTranslation('settings');
  const { can } = useAuth();
  const storeSettings = useLiveQuery(() => db.storeSettings.toCollection().first());
  const [footerText, setFooterText] = useState('');

  // Sync state with db loaded value
  useEffect(() => {
    if (storeSettings) {
      setFooterText(storeSettings.receiptFooter ?? '');
    }
  }, [storeSettings]);

  if (!can('manage_store_settings')) {
    return <LockedPage title={t('masterData.receiptFooter.title')} permissionLabel={t('masterData.theme.permissionLabel')} />;
  }

  const handleSave = async () => {
    if (!storeSettings?.id) return;
    try {
      await db.storeSettings.update(storeSettings.id, {
        receiptFooter: footerText.trim(),
      });
      toast.success(t('masterData.receiptFooter.saveSuccess'));
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          {t('masterData.receiptFooter.title')}
        </h1>
      </div>

      {/* Editor Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="receipt-footer-input">{t('masterData.receiptFooter.title')}</Label>
            <Input
              id="receipt-footer-input"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={t('receipt.footerFallback')}
              className="h-11"
              maxLength={80}
            />
            <p className="text-[10px] text-muted-foreground">
              {t('masterData.receiptFooter.description')}
            </p>
          </div>

          <Button className="w-full h-11 gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" />
            {t('common:save')}
          </Button>
        </CardContent>
      </Card>

      {/* Live Preview Card */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block px-1">
          Preview Struk
        </span>
        <Card className="border border-dashed border-border/80 bg-white dark:bg-zinc-900 shadow-inner rounded-xl overflow-hidden">
          <CardContent className="p-6 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 space-y-4">
            <div className="text-center space-y-1 opacity-55">
              <p className="font-bold text-xs">TOKO MAJU JAYA</p>
              <p>Tangerang</p>
              <p>081208120812</p>
            </div>
            
            <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700" />
            
            <div className="space-y-1.5 opacity-55">
              <div className="flex justify-between">
                <span>Nasi Goreng Spesial</span>
                <span>Rp 15.000</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-800 dark:text-zinc-200">
                <span>TOTAL</span>
                <span>Rp 15.000</span>
              </div>
            </div>

            <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700" />
            
            {/* Real-time footer preview */}
            <div className="text-center py-2 text-zinc-900 dark:text-zinc-100 font-semibold break-words transition-all px-4">
              {footerText.trim() || t('receipt.footerFallback')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
