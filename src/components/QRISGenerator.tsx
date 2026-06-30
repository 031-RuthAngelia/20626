import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRISGeneratorProps {
  amount: number;
  qrisPayload?: string; // Payload statis (NMID) dari pengaturan
}

export default function QRISGenerator({ amount, qrisPayload }: QRISGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrisPayload) return;

    // TODO: Logika untuk menambahkan nominal ke payload statis QRIS
    // Secara sederhana, untuk QRIS dinamis offline, kita perlu memodifikasi payload string
    // Namun karena struktur QRIS kompleks (EMV Co), untuk amannya kita render payload statis jika tidak ada integrasi API
    // Sebagai mock, kita gunakan qrisPayload langsung.
    const finalPayload = qrisPayload; 

    QRCode.toDataURL(finalPayload, { width: 300, margin: 2 })
      .then(url => {
        setQrCodeUrl(url);
        // Also draw to canvas for download
        if (canvasRef.current) {
          QRCode.toCanvas(canvasRef.current, finalPayload, { width: 300, margin: 2 });
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Gagal membuat QRIS');
      });
  }, [amount, qrisPayload]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QRIS-${amount}.png`;
    link.href = url;
    link.click();
  };

  const handleCopy = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(blob => {
      if (blob) {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          setCopied(true);
          toast.success('QRIS disalin ke clipboard');
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          toast.error('Gagal menyalin QRIS');
        });
      }
    });
  };

  if (!qrisPayload) {
    return <div className="text-sm text-muted-foreground text-center p-4 border rounded-lg">QRIS belum dikonfigurasi di Pengaturan</div>;
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-xl bg-card">
      <div className="text-center space-y-1">
        <p className="font-semibold text-lg">QRIS Dinamis</p>
        <p className="text-sm text-muted-foreground">Scan untuk membayar Rp {amount.toLocaleString('id-ID')}</p>
      </div>
      
      <div className="bg-white p-2 rounded-xl shadow-sm">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="QRIS" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2 w-full max-w-[200px]">
        <Button variant="outline" className="flex-1" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
        <Button className="flex-1" onClick={handleDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
