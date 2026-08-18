import React, { useContext, useState, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FinancialManager = () => {
  const { 
    payments, 
    appointments, 
    patients, 
    services, 
    addPayment, 
    updatePaymentStatus, 
    getPatientName, 
    getServiceName 
  } = useContext(ClinicContext);
  
  const { t, language } = useContext(LanguageContext);

  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending', 'refunded'
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    patient_id: '',
    appointment_id: '',
    amount: '',
    payment_method: 'Credit Card',
    status: 'paid',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // Calculate Metrics
  const totalRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  const pendingPaymentsTotal = useMemo(() => {
    return payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    return payments
      .filter(p => p.status === 'paid' && new Date(p.payment_date).getMonth() === currMonth && new Date(p.payment_date).getFullYear() === currYear)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  const avgTicketSize = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    if (paidPayments.length === 0) return 0;
    return totalRevenue / paidPayments.length;
  }, [payments, totalRevenue]);

  // Chart Data: Payment Methods Distribution
  const methodDistribution = useMemo(() => {
    const counts = { 'Credit Card': 0, 'Cash': 0, 'Bit': 0, 'Bank Transfer': 0 };
    payments.forEach(p => {
      const m = p.payment_method || 'Credit Card';
      if (counts[m] !== undefined) {
        counts[m] += parseFloat(p.amount || 0);
      } else {
        counts['Credit Card'] += parseFloat(p.amount || 0);
      }
    });

    const colors = {
      'Credit Card': '#10b981',
      'Cash': '#3b82f6',
      'Bit': '#8b5cf6',
      'Bank Transfer': '#f59e0b'
    };

    return [
      { name: t('Credit Card', 'כרטיס אשראי'), value: counts['Credit Card'], color: colors['Credit Card'] },
      { name: t('Cash', 'מזומן'), value: counts['Cash'], color: colors['Cash'] },
      { name: t('Bit / Paybox', 'ביט / פייבוקס'), value: counts['Bit'], color: colors['Bit'] },
      { name: t('Bank Transfer', 'העברה בנקאית'), value: counts['Bank Transfer'], color: colors['Bank Transfer'] },
    ].filter(item => item.value > 0);
  }, [payments, t]);

  // Monthly Revenue Chart Data
  const monthlyRevenueChartData = useMemo(() => {
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesHe = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      
      const rev = payments
        .filter(p => p.status === 'paid' && new Date(p.payment_date).getMonth() === mIdx && new Date(p.payment_date).getFullYear() === y)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      last6Months.push({
        name: language === 'he' ? monthNamesHe[mIdx] : monthNamesEn[mIdx],
        revenue: rev
      });
    }
    return last6Months;
  }, [payments, language]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Status filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      // Method filter
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
      // Search filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const appt = appointments.find(a => a.id === p.appointment_id);
        const patientName = appt ? getPatientName(appt.patient_id).toLowerCase() : '';
        const method = (p.payment_method || '').toLowerCase();
        const amount = String(p.amount);
        return patientName.includes(term) || method.includes(term) || amount.includes(term);
      }
      return true;
    }).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  }, [payments, statusFilter, methodFilter, searchTerm, appointments, getPatientName]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert(t('Please enter a valid amount.', 'אנא הזן סכום תקין.'));
      return;
    }

    await addPayment({
      patient_id: paymentForm.patient_id || null,
      appointment_id: paymentForm.appointment_id || null,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      status: paymentForm.status,
      payment_date: paymentForm.payment_date
    });

    setIsModalOpen(false);
    setPaymentForm({
      patient_id: '',
      appointment_id: '',
      amount: '',
      payment_method: 'Credit Card',
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    });
  };

  const translateMethod = (method) => {
    const map = {
      'Credit Card': t('Credit Card', 'כרטיס אשראי'),
      'Cash': t('Cash', 'מזומן'),
      'Bit': t('Bit / Paybox', 'ביט / Paybox'),
      'Bank Transfer': t('Bank Transfer', 'העברה בנקאית')
    };
    return map[method] || method;
  };

  const translateStatus = (status) => {
    const map = {
      'paid': t('Paid', 'שולם'),
      'pending': t('Pending', 'ממתין'),
      'refunded': t('Refunded', 'זיכוי')
    };
    return map[status] || status;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-12 text-start relative">
      
      {/* 1. Header & Quick Action */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('Financials & Payments', 'פיננסים ותשלומים')}</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('Track clinic revenue, invoices, and payment methods.', 'עקוב אחר הכנסות הקליניקה, תשלומים ודוחות כספיים.')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          {t('Log New Payment', 'רשום תשלום חדש')}
        </button>
      </div>

      {/* 2. KPI Summary Bar (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Total Revenue', 'סך כל ההכנסות')}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Pending Payments', 'תשלומים ממתינים')}</p>
            <p className="text-3xl font-black text-amber-600 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{pendingPaymentsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('This Month', 'הכנסות החודש')}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{thisMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
        </div>

        {/* Avg Ticket Size */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:bg-white/90 shadow-sm">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Avg. Transaction', 'עסקה ממוצעת')}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{avgTicketSize.toFixed(2)}
            </p>
          </div>
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          </div>
        </div>

      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {t('Revenue Trend (6 Months)', 'מגמת הכנסות (6 חודשים אחרונים)')}
            </h3>
          </div>
          <div className="h-[260px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="finRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: language === 'he' ? 'right' : 'left' }}
                  formatter={(val) => [`₪${val.toLocaleString()}`, t('Revenue', 'הכנסות')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#finRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {t('Payment Methods', 'התפלגות אמצעי תשלום')}
            </h3>
          </div>
          
          {methodDistribution.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              {t('No payment method data available', 'אין נתונים זמינים על אמצעי תשלום')}
            </div>
          ) : (
            <>
              <div className="h-[180px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {methodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(val) => [`₪${val.toLocaleString()}`, 'סכום']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                {methodDistribution.map(m => (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }}></span>
                    <span className="text-xs font-semibold text-slate-600 truncate">{m.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Status Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1 border border-slate-200/50">
            <button 
              onClick={() => setStatusFilter('all')} 
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('All Transactions', 'כל העסקאות')}
            </button>
            <button 
              onClick={() => setStatusFilter('paid')} 
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('Paid', 'שולם')}
            </button>
            <button 
              onClick={() => setStatusFilter('pending')} 
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('Pending', 'ממתין')}
            </button>
          </div>

          {/* Search & Method Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={methodFilter} 
              onChange={e => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">{t('All Methods', 'כל אמצעי התשלום')}</option>
              <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
              <option value="Cash">{t('Cash', 'מזומן')}</option>
              <option value="Bit">{t('Bit / Paybox', 'ביט / פייבוקס')}</option>
              <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
            </select>

            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder={t('Search patient or amount...', 'חיפוש לפי מטופל או סכום...')} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
              <svg className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 bg-slate-50/50">
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Date', 'תאריך')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Patient', 'מטופל')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Service / Notes', 'שירות / הערה')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Method', 'אמצעי תשלום')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Amount', 'סכום')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Status', 'סטטוס')}</th>
                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">{t('Actions', 'פעולות')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm font-medium text-slate-400">
                    {t('No transactions found matching your criteria.', 'לא נמצאו עסקאות התואמות את החיפוש.')}
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const appt = appointments.find(a => a.id === p.appointment_id);
                  const patientName = appt ? getPatientName(appt.patient_id) : (p.patient_id ? getPatientName(p.patient_id) : t('General Patient', 'מטופל כללי'));
                  const serviceName = appt ? getServiceName(appt.service_id) : '-';

                  let statusBadge = p.status === 'paid' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : p.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                    : 'bg-rose-50 text-rose-700 border-rose-200/60';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500 text-start">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm text-start">
                        {patientName}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500 font-medium text-start">
                        {serviceName}
                      </td>
                      <td className="py-4 px-4 text-start">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          {translateMethod(p.payment_method)}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-800 text-sm text-start" dir="ltr">
                        <span className="opacity-50 me-1">₪</span>{parseFloat(p.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-start">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${statusBadge}`}>
                          {translateStatus(p.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-end">
                        {p.status === 'pending' && (
                          <button 
                            onClick={() => updatePaymentStatus(p.id, 'paid')}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                          >
                            {t('Mark Paid', 'סימון כסולק')}
                          </button>
                        )}
                        {p.status === 'paid' && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Completed', 'הושלם')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Log New Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-[#0f172a] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xl tracking-tight">{t('Log New Payment', 'רישום תשלום חדש')}</h3>
                <p className="text-slate-400 text-xs mt-1">{t('Record a transaction directly into the ledger.', 'הזן עסקה כספית ישירות לספרי הקליניקה.')}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-start">
              
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Select Patient', 'בחר מטופל')}</label>
                <select 
                  value={paymentForm.patient_id} 
                  onChange={e => setPaymentForm({...paymentForm, patient_id: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="">{t('General Patient / Unassigned', 'מטופל כללי / ללא שיוך')}</option>
                  {patients.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.full_name} ({pt.phone})</option>
                  ))}
                </select>
              </div>

              {/* Select Appointment (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Link to Appointment (Optional)', 'שיוך לתור (אופציונלי)')}</label>
                <select 
                  value={paymentForm.appointment_id} 
                  onChange={e => {
                    const apptId = e.target.value;
                    const appt = appointments.find(a => a.id === apptId);
                    let suggestedAmount = paymentForm.amount;
                    if (appt) {
                      const svc = services.find(s => s.id === appt.service_id);
                      if (svc) suggestedAmount = svc.default_price;
                    }
                    setPaymentForm({
                      ...paymentForm, 
                      appointment_id: apptId,
                      patient_id: appt ? appt.patient_id : paymentForm.patient_id,
                      amount: suggestedAmount
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="">{t('No specific appointment', 'ללא תור ספציפי')}</option>
                  {appointments.map(a => {
                    const dateStr = new Date(a.appointment_date).toLocaleDateString();
                    return (
                      <option key={a.id} value={a.id}>
                        {getPatientName(a.patient_id)} - {getServiceName(a.service_id)} ({dateStr})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Amount (₪)', 'סכום (₪)')}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="0.00"
                    value={paymentForm.amount} 
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Payment Method', 'אמצעי תשלום')}</label>
                  <select 
                    value={paymentForm.payment_method} 
                    onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                    <option value="Cash">{t('Cash', 'מזומן')}</option>
                    <option value="Bit">{t('Bit / Paybox', 'ביט / Paybox')}</option>
                    <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
                  </select>
                </div>
              </div>

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Status', 'סטטוס')}</label>
                  <select 
                    value={paymentForm.status} 
                    onChange={e => setPaymentForm({...paymentForm, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  >
                    <option value="paid">{t('Paid', 'שולם')}</option>
                    <option value="pending">{t('Pending', 'ממתין')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Payment Date', 'תאריך תשלום')}</label>
                  <input 
                    type="date" 
                    value={paymentForm.payment_date} 
                    onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
                >
                  {t('Save Payment', 'שמור תשלום')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialManager;
