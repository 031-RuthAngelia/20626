import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899'];

export default function AnalyticsCharts() {
  const [days] = useState(7);
  
  // Last 7 days range
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  startDate.setHours(0, 0, 0, 0);

  const transactions = useLiveQuery(() => 
    db.transactions
      .where('date')
      .between(startDate, endOfDay(endDate))
      .toArray()
  ) || [];

  const expenses = useLiveQuery(() => 
    db.expenses
      .where('date')
      .between(startDate, endOfDay(endDate))
      .toArray()
  ) || [];

  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray()) || [];

  const { dailyData, hourlyData, paymentData } = useMemo(() => {
    // 1. Daily Revenue, Profit, Expenses
    const dailyMap = new Map<string, { date: string; revenue: number; profit: number; expense: number }>();
    for (let i = 0; i < days; i++) {
      const d = subDays(endDate, days - 1 - i);
      dailyMap.set(format(d, 'yyyy-MM-dd'), {
        date: format(d, 'dd MMM', { locale: id }),
        revenue: 0,
        profit: 0,
        expense: 0
      });
    }

    // 2. Hourly Data (Today only)
    const hourlyMap = new Map<string, { hour: string; sales: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i.toString(), { hour: `${i}:00`, sales: 0 });
    }

    // 3. Payment Method
    const pmMap = new Map<number, { name: string; value: number }>();

    transactions.forEach(tx => {
      if (tx.status === 'open') return;
      
      const dayKey = format(tx.date, 'yyyy-MM-dd');
      if (dailyMap.has(dayKey)) {
        const d = dailyMap.get(dayKey)!;
        d.revenue += tx.total;
        d.profit += tx.profit;
      }

      // If today, add to hourly
      if (dayKey === format(endDate, 'yyyy-MM-dd')) {
        const hour = new Date(tx.date).getHours().toString();
        if (hourlyMap.has(hour)) {
          hourlyMap.get(hour)!.sales += tx.total;
        }
      }

      // Payment Method
      if (!pmMap.has(tx.paymentMethodId)) {
        pmMap.set(tx.paymentMethodId, { 
          name: paymentMethods.find(p => p.id === tx.paymentMethodId)?.name || 'Unknown', 
          value: 0 
        });
      }
      pmMap.get(tx.paymentMethodId)!.value += tx.total;
    });

    expenses.forEach(ex => {
      if (ex.isDeleted === 1) return;
      const dayKey = format(ex.date, 'yyyy-MM-dd');
      if (dailyMap.has(dayKey)) {
        dailyMap.get(dayKey)!.expense += ex.amount;
      }
    });

    return {
      dailyData: Array.from(dailyMap.values()),
      hourlyData: Array.from(hourlyMap.values()),
      paymentData: Array.from(pmMap.values())
    };
  }, [transactions, expenses, paymentMethods, days, endDate]);

  return (
    <div className="space-y-4 mt-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Tren Penjualan & Laba (7 Hari)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] p-4 pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" style={{ fontSize: 10 }} tickMargin={10} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
              <RechartsTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Penjualan" stroke="#0088FE" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="profit" name="Laba" stroke="#00C49F" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#FF8042" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Penjualan per Jam (Hari Ini)</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-4 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" style={{ fontSize: 10 }} tickMargin={10} />
                <YAxis style={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}k`} />
                <RechartsTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                <Bar dataKey="sales" name="Penjualan" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] p-4 pt-0 flex justify-center">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Belum ada data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
