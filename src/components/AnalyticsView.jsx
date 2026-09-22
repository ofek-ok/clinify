import React, { useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const AnalyticsView = () => {
  const { appointments, leads, services, getPaymentForAppointment } = useContext(ClinicContext);
  const { t, language } = useContext(LanguageContext);

  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const revenue = appointments.reduce((sum, appt) => {
        if (!appt?.appointment_date) return sum;
        const apptDate = new Date(appt.appointment_date);
        if (apptDate.getMonth() !== month || apptDate.getFullYear() !== year) return sum;
        const payment = getPaymentForAppointment(appt.id);
        return sum + (payment?.status === 'paid' ? Number(payment.amount || 0) : 0);
      }, 0);
      return { name: d.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short' }), revenue };
    });
  }, [appointments, getPaymentForAppointment, language]);

  const leadSourcesData = useMemo(() => {
    const sourceLabels = {
      Website: t('Website', 'אתר הבית'),
      Facebook: t('Facebook/IG', 'פייסבוק / אינסטגרם'),
      WhatsApp: t('WhatsApp', 'ווטסאפ'),
      Direct: t('Direct/Referral', 'הפניות / ישיר')
    };
    const colors = { Website: '#06b6d4', Facebook: '#3b82f6', WhatsApp: '#14b8a6', Direct: '#8b5cf6' };
    const counts = leads.reduce((acc, lead) => {
      const source = lead?.source || 'Direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([source, value]) => ({
      name: sourceLabels[source] || source,
      value,
      color: colors[source] || '#64748b'
    }));
  }, [leads, t]);

  const funnelData = useMemo(() => {
    const total = leads.length;
    const contacted = leads.filter(l => l?.status && l.status !== 'new').length;
    const converted = leads.filter(l => ['won', 'converted'].includes(l?.status)).length;
    return [
      { name: t('Total Leads', 'סך הכל לידים'), value: total, fill: '#cbd5e1' },
      { name: t('Contacted', 'נוצר קשר'), value: contacted, fill: '#8b5cf6' },
      { name: t('Converted', 'הומרו ללקוחות'), value: converted, fill: '#06b6d4' }
    ];
  }, [leads, t]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-4 text-start">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:bg-white/90">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('Monthly Revenue (₪)', 'הכנסות חודשיות (₪)')}
            </h3>
          </div>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: language === 'he' ? 'right' : 'left' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value) => [`₪${value}`, t('Revenue', 'הכנסה')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Pie Chart */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:bg-white/90">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {t('Lead Sources', 'מקורות הגעה של לידים')}
            </h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourcesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {leadSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: language === 'he' ? 'right' : 'left' }}
                  formatter={(value) => [value, t('Leads', 'לידים')]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {leadSourcesData.map(source => (
              <div key={source.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{source.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:bg-white/90 lg:col-span-2">
          <div className="mb-6">
            <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {t('Sales Conversion Funnel', 'משפך המרות מכירות')}
            </h3>
          </div>
          <div className="h-[200px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 'bold', fill: '#475569' }} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: language === 'he' ? 'right' : 'left' }}
                  formatter={(value) => [value, t('Count', 'כמות')]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;
