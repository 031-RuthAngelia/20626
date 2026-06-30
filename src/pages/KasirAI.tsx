import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export default function KasirAI() {
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<{
    summary: string;
    recommendations: string[];
    warnings: string[];
  } | null>(null);

  // Get last 7 days data
  const endDate = new Date();
  const startDate = subDays(endDate, 7);
  
  const transactions = useLiveQuery(() => 
    db.transactions.where('date').between(startDate, endOfDay(endDate)).toArray()
  ) || [];

  const products = useLiveQuery(() => db.products.filter(p => p.isDeleted === 0).toArray()) || [];

  const handleAnalyze = () => {
    setAnalyzing(true);
    
    // Simulate AI processing time to not block UI thread
    setTimeout(() => {
      let totalRevenue = 0;
      let totalProfit = 0;
      const productSales = new Map<number, { name: string, qty: number }>();
      
      transactions.forEach(tx => {
        if (tx.status === 'open') return;
        totalRevenue += tx.total;
        totalProfit += tx.profit;
      });

      // Basic Heuristics AI
      const recommendations: string[] = [];
      const warnings: string[] = [];

      if (totalRevenue === 0) {
        warnings.push("Belum ada penjualan dalam 7 hari terakhir.");
        recommendations.push("Coba buat promo diskon atau sebarkan informasi toko Anda ke media sosial.");
      } else {
        if (totalProfit / totalRevenue < 0.2) {
          warnings.push("Margin keuntungan rata-rata di bawah 20%.");
          recommendations.push("Evaluasi kembali harga jual atau cari supplier dengan harga pokok (HPP) lebih murah.");
        } else {
          recommendations.push("Margin keuntungan sehat. Pertahankan kualitas layanan!");
        }
      }

      const lowStockCount = products.filter(p => p.trackStock !== false && p.stock <= 5).length;
      if (lowStockCount > 0) {
        warnings.push(`Ada ${lowStockCount} produk yang stoknya hampir habis (≤ 5).`);
        recommendations.push("Segera lakukan restock untuk produk-produk yang laris agar tidak kehilangan potensi penjualan.");
      }

      setInsight({
        summary: `Dalam 7 hari terakhir, total penjualan mencapai Rp ${totalRevenue.toLocaleString('id-ID')} dengan perkiraan laba Rp ${totalProfit.toLocaleString('id-ID')}.`,
        recommendations,
        warnings
      });
      
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-2 mb-8 mt-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kawan Kasir AI</h1>
        <p className="text-muted-foreground max-w-lg">
          Asisten pintar yang menganalisis data penjualan Anda dan memberikan rekomendasi strategi bisnis tanpa memakan kuota internet berlebih.
        </p>
      </div>

      {!insight && (
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleAnalyze} 
            disabled={analyzing}
            className="gap-2 text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {analyzing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {analyzing ? 'Menganalisis Data...' : 'Mulai Analisis Bisnis'}
          </Button>
        </div>
      )}

      {insight && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ringkasan Performa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">{insight.summary}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <Sparkles className="w-5 h-5" />
                  Rekomendasi Strategi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Area Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insight.warnings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada peringatan khusus saat ini. Bisnis Anda berjalan lancar!</p>
                ) : (
                  <ul className="space-y-3">
                    {insight.warnings.map((warn, i) => (
                      <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                        <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center shrink-0 text-xs font-bold">
                          !
                        </span>
                        <span className="pt-0.5">{warn}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={handleAnalyze} disabled={analyzing} className="gap-2">
              <BrainCircuit className="w-4 h-4" />
              Perbarui Analisis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
