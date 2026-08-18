import React, { useContext, useState, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const FinancialManager = () => {
  const { 
    payments, 
    expenses = [],
    appointments, 
    patients, 
    services, 
    addPayment, 
    updatePayment,
    deletePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    updatePaymentStatus, 
    getPatientName, 
    getServiceName 
  } = useContext(ClinicContext);
  
  const { t, language } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'income', 'expenses'
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Editing Item State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // New/Edit Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    patient_id: '',
    appointment_id: '',
    catalog_item_id: '',
    item_type: 'service',
    amount: '',
    payment_method: 'Credit Card',
    status: 'paid',
    payment_date: new Date().toISOString().split('T')[0]
  });

  // New/Edit Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Equipment',
    amount: '',
    payment_method: 'Credit Card',
    expense_date: new Date().toISOString().split('T')[0]
  });

  // Category translation map
  const translateCategory = (cat) => {
    const map = {
      'Rent': t('Rent & Facilities', 'שכירות ומבנה'),
      'Equipment': t('Equipment & Supplies', 'ציוד ומלאי'),
      'Software': t('Software & Digital', 'תוכנה ודיגיטל'),
      'Marketing': t('Marketing & Ads', 'שיווק ופרסום'),
      'Salaries': t('Salaries & Services', 'שכר ושירותים'),
      'Other': t('Utilities & Other', 'שונות וכללי')
    };
    return map[cat] || cat;
  };

  // Calculate Income & Expense Totals
  const totalRevenue = useMemo(() => {
    return payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  const totalExpensesSum = useMemo(() => {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  }, [expenses]);

  const netProfitTotal = useMemo(() => {
    return totalRevenue - totalExpensesSum;
  }, [totalRevenue, totalExpensesSum]);

  const pendingPaymentsTotal = useMemo(() => {
    return payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  // Chart Data: Expense Category Distribution
  const expenseCategoryDistribution = useMemo(() => {
    const catTotals = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      catTotals[cat] = (catTotals[cat] || 0) + parseFloat(e.amount || 0);
    });

    const colors = {
      'Rent': '#ef4444',
      'Equipment': '#f59e0b',
      'Software': '#3b82f6',
      'Marketing': '#8b5cf6',
      'Salaries': '#10b981',
      'Other': '#64748b'
    };

    return Object.keys(catTotals).map(cat => ({
      name: translateCategory(cat),
      value: catTotals[cat],
      color: colors[cat] || '#64748b'
    })).filter(c => c.value > 0);
  }, [expenses, t]);

  // Chart Data: 6-Month Income vs Expenses Comparison
  const pnlComparisonChartData = useMemo(() => {
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

      const exp = expenses
        .filter(e => new Date(e.expense_date).getMonth() === mIdx && new Date(e.expense_date).getFullYear() === y)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      last6Months.push({
        name: language === 'he' ? monthNamesHe[mIdx] : monthNamesEn[mIdx],
        revenue: rev,
        expenses: exp,
        profit: rev - exp
      });
    }
    return last6Months;
  }, [payments, expenses, language]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
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

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (methodFilter !== 'all' && e.payment_method !== methodFilter) return false;
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const title = (e.title || '').toLowerCase();
        const category = (e.category || '').toLowerCase();
        const amount = String(e.amount);
        return title.includes(term) || category.includes(term) || amount.includes(term);
      }
      return true;
    }).sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  }, [expenses, categoryFilter, methodFilter, searchTerm]);

  // Open Payment Modal for Create or Edit
  const openPaymentModal = (paymentToEdit = null) => {
    if (paymentToEdit) {
      setEditingPaymentId(paymentToEdit.id);
      setPaymentForm({
        patient_id: paymentToEdit.patient_id || '',
        appointment_id: paymentToEdit.appointment_id || '',
        catalog_item_id: paymentToEdit.catalog_item_id || '',
        item_type: paymentToEdit.item_type || 'service',
        amount: paymentToEdit.amount || '',
        payment_method: paymentToEdit.payment_method || 'Credit Card',
        status: paymentToEdit.status || 'paid',
        payment_date: paymentToEdit.payment_date ? paymentToEdit.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingPaymentId(null);
      setPaymentForm({
        patient_id: '',
        appointment_id: '',
        catalog_item_id: '',
        item_type: 'service',
        amount: '',
        payment_method: 'Credit Card',
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert(t('Please enter a valid amount.', 'אנא הזן סכום תקין.'));
      return;
    }

    const payload = {
      patient_id: paymentForm.patient_id || null,
      appointment_id: paymentForm.appointment_id || null,
      catalog_item_id: paymentForm.catalog_item_id || null,
      item_type: paymentForm.item_type,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.payment_method,
      status: paymentForm.status,
      payment_date: paymentForm.payment_date
    };

    if (editingPaymentId) {
      await updatePayment(editingPaymentId, payload);
    } else {
      await addPayment(payload);
    }

    setIsPaymentModalOpen(false);
    setEditingPaymentId(null);
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this payment record?', 'האם אתה בטוח שברצונך למחוק תשלום זה?'))) {
      await deletePayment(id);
    }
  };

  // Open Expense Modal for Create or Edit
  const openExpenseModal = (expenseToEdit = null) => {
    if (expenseToEdit) {
      setEditingExpenseId(expenseToEdit.id);
      setExpenseForm({
        title: expenseToEdit.title || '',
        category: expenseToEdit.category || 'Equipment',
        amount: expenseToEdit.amount || '',
        payment_method: expenseToEdit.payment_method || 'Credit Card',
        expense_date: expenseToEdit.expense_date ? expenseToEdit.expense_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingExpenseId(null);
      setExpenseForm({
        title: '',
        category: 'Equipment',
        amount: '',
        payment_method: 'Credit Card',
        expense_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsExpenseModalOpen(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim()) {
      alert(t('Please enter an expense title.', 'אנא הזן תיאור להוצאה.'));
      return;
    }
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert(t('Please enter a valid amount.', 'אנא הזן סכום תקין.'));
      return;
    }

    const payload = {
      title: expenseForm.title,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      payment_method: expenseForm.payment_method,
      expense_date: expenseForm.expense_date
    };

    if (editingExpenseId) {
      await updateExpense(editingExpenseId, payload);
    } else {
      await addExpense(payload);
    }

    setIsExpenseModalOpen(false);
    setEditingExpenseId(null);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this expense record?', 'האם אתה בטוח שברצונך למחוק הוצאה זו?'))) {
      await deleteExpense(id);
    }
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
      
      {/* 1. Top Header & Action Buttons */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('Financials & Universal Payments', 'פיננסים, תשלומים וניהול הוצאות')}</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('Full financial overview of clinic income, expenses, and net profit.', 'דוח כספי מלא: הכנסות, מכירת חבילות/מוצרים, הוצאות ועריכה ידנית.')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openExpenseModal(null)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs"
          >
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
            {t('Log Expense', 'רשום הוצאה חדשה')}
          </button>
          <button 
            onClick={() => openPaymentModal(null)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center gap-2 text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            {t('Log Payment / Sale', 'רשום תשלום / מכירת חבילה')}
          </button>
        </div>
      </div>

      {/* 2. Primary Financial Navigation Tabs */}
      <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 border border-slate-200/60 w-fit">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {t('P&L Overview', 'דוח רווח והפסד')}
        </button>
        <button 
          onClick={() => setActiveTab('income')} 
          className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all ${activeTab === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {t('Income & Receipts', 'הכנסות ותשלומים')} ({payments.length})
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all ${activeTab === 'expenses' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {t('Clinic Expenses', 'הוצאות הקליניקה')} ({expenses.length})
        </button>
      </div>

      {/* 3. KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Total Revenue', 'סך כל ההכנסות')}</p>
            <p className="text-3xl font-black text-emerald-600 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Total Expenses', 'סך כל ההוצאות')}</p>
            <p className="text-3xl font-black text-rose-600 tracking-tight" dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{totalExpensesSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100/50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Net Profit', 'רווח נקי כולל')}</p>
            <p className={`text-3xl font-black tracking-tight ${netProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} dir="ltr">
              <span className="text-xl opacity-50 me-1">₪</span>{netProfitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center border border-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-xs">
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

      </div>

      {/* TAB 1: P&L Overview (דוח רווח והפסד) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Income vs Expenses Bar Chart */}
            <div className="lg:col-span-2 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="mb-4">
                <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {t('Income vs Expenses (6 Months)', 'השוואת הכנסות מול הוצאות (6 חודשים אחרונים)')}
                </h3>
              </div>
              <div className="h-[280px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlComparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: language === 'he' ? 'right' : 'left' }}
                      formatter={(val, name) => [`₪${val.toLocaleString()}`, name === 'revenue' ? t('Income', 'הכנסות') : t('Expenses', 'הוצאות')]}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="revenue" barSize={20} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="expenses" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Breakdown by Category Pie Chart */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  {t('Expense Categories', 'פילוח הוצאות לפי קטגוריה')}
                </h3>
              </div>
              
              {expenseCategoryDistribution.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                  {t('No expenses logged yet.', 'לא נרשמו הוצאות עדיין.')}
                </div>
              ) : (
                <>
                  <div className="h-[180px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {expenseCategoryDistribution.map((entry, index) => (
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
                    {expenseCategoryDistribution.map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                        <span className="text-xs font-semibold text-slate-600 truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Income & Payments */}
      {activeTab === 'income' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Status Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex flex-wrap gap-1 border border-slate-200/50">
              <button 
                onClick={() => setStatusFilter('all')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('All Transactions', 'כל העסקאות')}
              </button>
              <button 
                onClick={() => setStatusFilter('paid')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('Paid', 'שולם')}
              </button>
              <button 
                onClick={() => setStatusFilter('pending')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('Pending', 'ממתין')}
              </button>
              <button 
                onClick={() => setStatusFilter('refunded')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'refunded' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('Refunded', 'זיכוי')}
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
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Item / Service', 'פריט / חבילה שנמכרה')}</th>
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
                    const catalogItem = services.find(s => s.id === p.catalog_item_id);
                    const patientName = appt ? getPatientName(appt.patient_id) : (p.patient_id ? getPatientName(p.patient_id) : t('General Patient', 'מטופל כללי'));
                    const itemLabel = catalogItem ? catalogItem.name : (appt ? getServiceName(appt.service_id) : t('General Payment', 'תשלום כללי'));

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
                        <td className="py-4 px-4 text-xs text-slate-700 font-bold text-start">
                          {itemLabel}
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
                        <td className="py-4 px-4 text-end space-x-2 space-x-reverse">
                          {p.status === 'pending' && (
                            <button 
                              onClick={() => updatePaymentStatus(p.id, 'paid')}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                            >
                              {t('Mark Paid', 'סימון כסולק')}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => openPaymentModal(p)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                          >
                            {t('Edit', 'ערוך')}
                          </button>

                          <button 
                            onClick={() => handleDeletePayment(p.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition-colors"
                            title={t('Delete Record', 'מחק עסקה')}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Clinic Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Category Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="all">{t('All Categories', 'כל קטגוריות ההוצאה')}</option>
                <option value="Rent">{t('Rent & Facilities', 'שכירות ומבנה')}</option>
                <option value="Equipment">{t('Equipment & Supplies', 'ציוד ומלאי')}</option>
                <option value="Software">{t('Software & Digital', 'תוכנה ודיגיטל')}</option>
                <option value="Marketing">{t('Marketing & Ads', 'שיווק ופרסום')}</option>
                <option value="Salaries">{t('Salaries & Services', 'שכר ושירותים')}</option>
                <option value="Other">{t('Utilities & Other', 'שונות וכללי')}</option>
              </select>

              <select 
                value={methodFilter} 
                onChange={e => setMethodFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="all">{t('All Payment Methods', 'כל אמצעי התשלום')}</option>
                <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                <option value="Cash">{t('Cash', 'מזומן')}</option>
                <option value="Bit">{t('Bit / Paybox', 'ביט / פייבוקס')}</option>
                <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder={t('Search expense title...', 'חיפוש הוצאה...')} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500/20 outline-none"
              />
              <svg className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/50">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Date', 'תאריך')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Title / Description', 'תיאור ההוצאה')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Category', 'קטגוריה')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Method', 'אמצעי תשלום')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Amount', 'סכום')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">{t('Actions', 'פעולות')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm font-medium text-slate-400">
                      {t('No expenses logged yet.', 'לא נרשמו הוצאות התואמות את התנאים.')}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500 text-start">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-sm text-start">
                        {exp.title}
                      </td>
                      <td className="py-4 px-4 text-start">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          {translateCategory(exp.category)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-start">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          {translateMethod(exp.payment_method)}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-rose-600 text-sm text-start" dir="ltr">
                        -<span className="opacity-50 me-1">₪</span>{parseFloat(exp.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-end space-x-2 space-x-reverse">
                        <button 
                          onClick={() => openExpenseModal(exp)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          {t('Edit', 'ערוך')}
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition-colors"
                          title={t('Delete Record', 'מחק הוצאה')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Universal Log / Edit Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-[#0f172a] p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xl tracking-tight">{editingPaymentId ? t('Edit Payment Record', 'עריכת תשלום קיים') : t('Log Universal Payment / Sale', 'רישום תשלום / מכירת חבילה/מוצר')}</h3>
                <p className="text-slate-400 text-xs mt-1">{t('Record sale of treatment, package, physical product or subscription.', 'בחר טיפול, כרטיסייה, מוצר פיזי או תוכנית ליווי ומכור למטופל.')}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-start">
              
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

              {/* Select Item from Catalog */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Select Offering from Catalog', 'בחר פריט/שירות מהקטלוג')}</label>
                <select 
                  value={paymentForm.catalog_item_id} 
                  onChange={e => {
                    const catId = e.target.value;
                    const item = services.find(s => s.id === catId);
                    setPaymentForm({
                      ...paymentForm, 
                      catalog_item_id: catId,
                      item_type: item ? (item.type || 'service') : 'service',
                      amount: item ? item.default_price : paymentForm.amount
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                >
                  <option value="">{t('General Payment / Custom', 'תשלום כללי / לפי סכום חופשי')}</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.type === 'package' ? '🎟️ כרטיסייה' : s.type === 'product' ? '📦 מוצר' : s.type === 'subscription' ? '⭐ מנוי' : '🩺 טיפול'}] {s.name} - ₪{s.default_price}
                    </option>
                  ))}
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
                    <option value="refunded">{t('Refunded', 'זיכוי')}</option>
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
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
                >
                  {editingPaymentId ? t('Update Payment', 'עדכן תשלום') : t('Save Payment / Issue Package', 'שמור תשלום / הנספק כרטיסייה')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. Log / Edit Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-rose-950 p-6 text-white flex justify-between items-center border-b border-rose-900">
              <div>
                <h3 className="font-extrabold text-xl tracking-tight text-white">{editingExpenseId ? t('Edit Expense Record', 'עריכת הוצאה קיימת') : t('Log New Expense', 'רישום הוצאה חדשה')}</h3>
                <p className="text-rose-300 text-xs mt-1">{t('Record or update clinic expenses and operational costs.', 'הזן או עדכן הוצאת תפעול, שכירות או ציוד לקליניקה.')}</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-rose-300 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4 text-start">
              
              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Title / Description', 'תיאור ההוצאה')}</label>
                <input 
                  type="text" 
                  placeholder={t('e.g., Clinic Rent, Medical Supplies', 'למשל: שכירות, ציוד מתכלה, חשבון חשמל')}
                  value={expenseForm.title} 
                  onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} 
                  required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Category', 'קטגוריה')}</label>
                  <select 
                    value={expenseForm.category} 
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  >
                    <option value="Rent">{t('Rent & Facilities', 'שכירות ומבנה')}</option>
                    <option value="Equipment">{t('Equipment & Supplies', 'ציוד ומלאי')}</option>
                    <option value="Software">{t('Software & Digital', 'תוכנה ודיגיטל')}</option>
                    <option value="Marketing">{t('Marketing & Ads', 'שיווק ופרסום')}</option>
                    <option value="Salaries">{t('Salaries & Services', 'שכר ושירותים')}</option>
                    <option value="Other">{t('Utilities & Other', 'שונות וכללי')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Amount (₪)', 'סכום (₪)')}</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    placeholder="0.00"
                    value={expenseForm.amount} 
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                  />
                </div>
              </div>

              {/* Method & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Payment Method', 'אמצעי תשלום')}</label>
                  <select 
                    value={expenseForm.payment_method} 
                    onChange={e => setExpenseForm({...expenseForm, payment_method: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                  >
                    <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                    <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
                    <option value="Cash">{t('Cash', 'מזומן')}</option>
                    <option value="Bit">{t('Bit / Paybox', 'ביט / Paybox')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Expense Date', 'תאריך הוצאה')}</label>
                  <input 
                    type="date" 
                    value={expenseForm.expense_date} 
                    onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors text-sm"
                >
                  {editingExpenseId ? t('Update Expense', 'עדכן הוצאה') : t('Save Expense', 'שמור הוצאה')}
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
