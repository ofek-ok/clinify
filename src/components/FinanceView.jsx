import React, { useState, useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import { useToast } from './ui/Toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinanceView({ initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const {
    payments,
    expenses,
    patients,
    appointments,
    addPayment,
    addExpense,
    updatePayment,
    updateExpense,
    updatePaymentStatus,
    deletePayment,
    deleteExpense,
    todayStr
  } = useContext(ClinicContext);
  const { showToast } = useToast();
  const { t, language } = useContext(LanguageContext);

  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);

  // New Payment Form
  const [payPatientId, setPayPatientId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Credit Card');
  const [payStatus, setPayStatus] = useState('paid');
  const [payDate, setPayDate] = useState(todayStr);

  // New Expense Form
  const [expDescription, setExpDescription] = useState('');
  const [expCategory, setExpCategory] = useState('Clinical Equipment');
  const [expAmount, setExpAmount] = useState('');
  const [expMethod, setExpMethod] = useState('Credit Card');
  const [expDate, setExpDate] = useState(todayStr);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');

  // Current Month Operational Context Metrics
  const currentMonthMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const monthPayments = payments.filter(p => {
      const d = new Date(p.payment_date || p.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.expense_date || e.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const incomeMonth = monthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const expensesMonth = monthExpenses
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const profitMonth = incomeMonth - expensesMonth;

    const pendingCollection = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return { incomeMonth, expensesMonth, profitMonth, pendingCollection };
  }, [payments, expenses, language]);

  // 6-Month Chart Data
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = d.toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { month: 'short' });
      const year = d.getFullYear();
      const monthIdx = d.getMonth();

      const inc = payments
        .filter(p => p.status === 'paid' && new Date(p.payment_date || p.created_at).getFullYear() === year && new Date(p.payment_date || p.created_at).getMonth() === monthIdx)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const exp = expenses
        .filter(e => new Date(e.expense_date || e.created_at).getFullYear() === year && new Date(e.expense_date || e.created_at).getMonth() === monthIdx)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      months.push({ name: mLabel, income: inc, expenses: exp });
    }
    return months;
  }, [payments, expenses]);

  const filteredPayments = useMemo(() => payments
    .filter(p => {
      if (paymentStatusFilter !== 'all' && p.status !== paymentStatusFilter) return false;
      if (paymentMethodFilter !== 'all' && p.payment_method !== paymentMethodFilter) return false;
      if (!searchTerm.trim()) return true;
      const pat = patients.find(patient => patient.id === p.patient_id || patient.person_id === p.person_id);
      const haystack = [pat?.full_name, p.payment_method, p.amount, p.status].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    })
    .sort((a,b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at)),
  [payments, patients, paymentStatusFilter, paymentMethodFilter, searchTerm]);

  const filteredExpenses = useMemo(() => expenses
    .filter(e => {
      if (expenseCategoryFilter !== 'all' && e.category !== expenseCategoryFilter) return false;
      if (!searchTerm.trim()) return true;
      const haystack = [e.title, e.category, e.payment_method, e.amount].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    })
    .sort((a,b) => new Date(b.expense_date || b.created_at) - new Date(a.expense_date || a.created_at)),
  [expenses, expenseCategoryFilter, searchTerm]);

  const paymentMethods = useMemo(() => Array.from(new Set(payments.map(p => p.payment_method).filter(Boolean))), [payments]);
  const expenseCategories = useMemo(() => Array.from(new Set(expenses.map(e => e.category).filter(Boolean))), [expenses]);

  const openPaymentDrawer = (payment = null) => {
    setEditingPaymentId(payment?.id || null);
    setPayPatientId(payment?.patient_id || '');
    setPayAmount(payment?.amount || '');
    setPayMethod(payment?.payment_method || 'Credit Card');
    setPayStatus(payment?.status || 'paid');
    setPayDate((payment?.payment_date || todayStr || '').split('T')[0]);
    setIsPaymentDrawerOpen(true);
  };

  const openExpenseDrawer = (expense = null) => {
    setEditingExpenseId(expense?.id || null);
    setExpDescription(expense?.title || expense?.description || '');
    setExpCategory(expense?.category || 'Clinical Equipment');
    setExpAmount(expense?.amount || '');
    setExpMethod(expense?.payment_method || 'Credit Card');
    setExpDate((expense?.expense_date || todayStr || '').split('T')[0]);
    setIsExpenseDrawerOpen(true);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!payPatientId || !payAmount || Number(payAmount) <= 0) {
      showToast(t('Please select a client and enter a positive payment amount', 'אנא בחר לקוח והזן סכום חיובי לתשלום'), 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        patient_id: payPatientId,
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        status: payStatus,
        payment_date: payDate || todayStr
      };
      if (editingPaymentId) {
        await updatePayment(editingPaymentId, payload);
        showToast(t('Payment updated successfully', 'התשלום עודכן בהצלחה'));
      } else {
        await addPayment(payload);
        showToast(t('Payment recorded successfully', 'התשלום נרשם בהצלחה'));
      }
      setIsPaymentDrawerOpen(false);
      setEditingPaymentId(null);
      setPayAmount('');
    } catch (err) {
      showToast(err.message || t('Could not save payment', 'שגיאה ברשום תשלום'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expDescription.trim() || !expAmount || Number(expAmount) <= 0) {
      showToast(t('Please enter a description and a positive expense amount', 'אנא הזן תיאור וסכום הוצאה חיובי'), 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: expDescription.trim(),
        category: expCategory,
        amount: parseFloat(expAmount),
        payment_method: expMethod,
        expense_date: expDate || todayStr
      };
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        showToast(t('Expense updated successfully', 'ההוצאה עודכנה בהצלחה'));
      } else {
        await addExpense(payload);
        showToast(t('Expense recorded successfully', 'ההוצאה נרשמה בהצלחה'));
      }
      setIsExpenseDrawerOpen(false);
      setEditingExpenseId(null);
      setExpDescription('');
      setExpAmount('');
    } catch (err) {
      showToast(err.message || t('Could not save expense', 'שגיאה ברשום הוצאה'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-start font-sans">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('Finance','כספים')}</h1>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          {[
            { id: 'overview', label: t('Overview','סקירה') },
            { id: 'income', label: t('Income','הכנסות') },
            { id: 'expenses', label: t('Expenses','הוצאות') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Compact Current Month Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">{t('Income this month','הכנסות החודש')}</span>
              <p className="text-xl font-bold text-emerald-600">₪{currentMonthMetrics.incomeMonth.toLocaleString()}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">{t('Expenses this month','הוצאות החודש')}</span>
              <p className="text-xl font-bold text-rose-400">₪{currentMonthMetrics.expensesMonth.toLocaleString()}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">{t('Profit this month','רווח החודש')}</span>
              <p className={`text-xl font-bold ${currentMonthMetrics.profitMonth >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                ₪{currentMonthMetrics.profitMonth.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">{t('Pending collection','ממתין לגבייה')}</span>
              <p className="text-xl font-bold text-amber-400">₪{currentMonthMetrics.pendingCollection.toLocaleString()}</p>
            </div>
          </div>

          {/* Simple 6-Month Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">{t('Income vs Expenses — 6 months','הכנסות מול הוצאות — 6 חודשים')}</h3>
            <div className="h-64 w-full dir-ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="income" name={t('Income','הכנסות')} stroke="#059669" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="expenses" name={t('Expenses','הוצאות')} stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* INCOME TAB */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('Search...','חיפוש...')} className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-2 text-xs outline-none" />
              </div>
              <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs">
                <option value="all">{t('All statuses','כל הסטטוסים')}</option>
                <option value="paid">{t('Paid','שולם')}</option>
                <option value="pending">{t('Pending','ממתין')}</option>
                <option value="refunded">{t('Refunded','הוחזר')}</option>
              </select>
              <select value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs">
                <option value="all">{t('All methods','כל האמצעים')}</option>
                {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <button
              onClick={() => openPaymentDrawer()}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Payment','תשלום חדש')}</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-4 text-start">{t('Client','לקוח')}</th>
                  <th className="py-3 px-4 text-start">{t('Date','תאריך')}</th>
                  <th className="py-3 px-4 text-start">{t('Amount','סכום')}</th>
                  <th className="py-3 px-4 text-start">{t('Payment Method','אמצעי תשלום')}</th>
                  <th className="py-3 px-4 text-start">{t('Status','סטטוס')}</th>
                  <th className="py-3 px-4 text-center">{t('Actions','פעולות')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">{t('No payments recorded.','אין תשלומים רשומים.')}</td></tr>
                ) : (
                  filteredPayments.map(p => {
                    const pat = patients.find(patient => patient.id === p.patient_id || patient.person_id === p.person_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-100">
                        <td className="py-3 px-4 font-bold text-slate-900">{pat ? pat.full_name : t('General client','לקוח כללי')}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{p.payment_date || '-'}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600">₪{p.amount}</td>
                        <td className="py-3 px-4 text-slate-500">{p.payment_method === 'PayBox' ? 'PayBox' : p.payment_method === 'Credit Card' ? t('Credit Card','אשראי') : p.payment_method === 'Bank Transfer' ? t('Bank Transfer','העברה בנקאית') : p.payment_method === 'Cash' ? t('Cash','מזומן') : t('Pay at Clinic','תשלום במקום')}</td>
                        <td className="py-3 px-4">
                          <select
                            value={p.status}
                            onChange={async e => {
                              try {
                                await updatePaymentStatus(p.id, e.target.value);
                                showToast(t('Payment status updated','סטטוס התשלום עודכן'));
                              } catch (err) {
                                showToast(err.message || t('Could not update payment','לא ניתן לעדכן את התשלום'), 'error');
                              }
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold outline-none border ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'refunded' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                          >
                            <option value="paid">{t('Paid','שולם')}</option>
                            <option value="pending">{t('Pending','ממתין')}</option>
                            <option value="refunded">{t('Refunded','הוחזר')}</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => openPaymentDrawer(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" title={t('Edit','עריכה')}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(t('Move this payment to Trash?','להעביר את התשלום לאשפה?'))) return;
                              try {
                                await deletePayment(p.id);
                                showToast(t('Payment moved to Trash','התשלום הועבר לאשפה'));
                              } catch (err) {
                                showToast(err.message || t('Could not move payment to Trash','לא ניתן למחוק את התשלום'), 'error');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title={t('Move to Trash','העבר לאשפה')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          </div>
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

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('Search...','חיפוש...')} className="h-9 w-48 rounded-lg border border-slate-200 bg-slate-50 pr-8 pl-2 text-xs outline-none" />
              </div>
              <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs">
                <option value="all">{t('All categories','כל הקטגוריות')}</option>
                {expenseCategories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <button
              onClick={() => openExpenseDrawer()}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Expense','הוצאה חדשה')}</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-4 text-start">{t('Description','תיאור')}</th>
                  <th className="py-3 px-4 text-start">{t('Category','קטגוריה')}</th>
                  <th className="py-3 px-4 text-start">{t('Date','תאריך')}</th>
                  <th className="py-3 px-4 text-start">{t('Amount','סכום')}</th>
                  <th className="py-3 px-4 text-start">{t('Payment Method','אמצעי תשלום')}</th>
                  <th className="py-3 px-4 text-center">{t('Actions','פעולות')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">{t('No expenses recorded.','אין הוצאות רשומות.')}</td></tr>
                ) : (
                  filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-900">{e.title || e.description || '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{e.category || '-'}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{e.expense_date || '-'}</td>
                      <td className="py-3 px-4 font-bold text-rose-400">₪{e.amount}</td>
                      <td className="py-3 px-4 text-slate-500">{e.payment_method || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => openExpenseDrawer(e)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" title={t('Edit','עריכה')}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(t('Move this expense to Trash?','להעביר את ההוצאה לאשפה?'))) return;
                            try {
                              await deleteExpense(e.id);
                              showToast(t('Expense moved to Trash','ההוצאה הועברה לאשפה'));
                            } catch (err) {
                              showToast(err.message || t('Could not move expense to Trash','לא ניתן למחוק את ההוצאה'), 'error');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title={t('Move to Trash','העבר לאשפה')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Drawer */}
      <Drawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        title={editingPaymentId ? t('Edit Payment','עריכת תשלום') : t('Record New Payment','רישום תשלום חדש')}
        footer={
          <>
            <button onClick={() => setIsPaymentDrawerOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100">{t('Cancel','ביטול')}</button>
            <button onClick={handleCreatePayment} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? t('Saving...','שומר...') : editingPaymentId ? t('Save Changes','שמור שינויים') : t('Save Payment','שמור תשלום')}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Client *','לקוח *')}</label>
            <select required value={payPatientId} onChange={e => setPayPatientId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="">{t('Select client...','בחר לקוח...')}</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Amount (₪) *','סכום (₪) *')}</label>
            <input type="number" required step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="350" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Payment Method','אמצעי תשלום')}</label>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="PayBox">PayBox</option>
              <option value="תשלום במקום">{t('Pay at Clinic','תשלום במקום')}</option>
              <option value="Credit Card">{t('Credit Card','כרטיס אשראי')}</option>
              <option value="Bank Transfer">{t('Bank Transfer','העברה בנקאית')}</option>
              <option value="Cash">{t('Cash','מזומן')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Payment Status','סטטוס תשלום')}</label>
            <select value={payStatus} onChange={e => setPayStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="paid">{t('Paid','שולם')}</option>
              <option value="pending">{t('Pending collection','ממתין לגבייה')}</option>
              <option value="refunded">{t('Refunded','הוחזר')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Date','תאריך')}</label>
            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>
        </form>
      </Drawer>

      {/* Add Expense Drawer */}
      <Drawer
        isOpen={isExpenseDrawerOpen}
        onClose={() => setIsExpenseDrawerOpen(false)}
        title={editingExpenseId ? t('Edit Expense','עריכת הוצאה') : t('Record New Expense','רישום הוצאה חדשה')}
        footer={
          <>
            <button onClick={() => setIsExpenseDrawerOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100">{t('Cancel','ביטול')}</button>
            <button onClick={handleCreateExpense} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? t('Saving...','שומר...') : editingExpenseId ? t('Save Changes','שמור שינויים') : t('Save Expense','שמור הוצאה')}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Expense Description *','תיאור ההוצאה *')}</label>
            <input type="text" required value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder={t('Clinical equipment / Advertising...','ציוד קליני / פרסום...')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Category','קטגוריה')}</label>
            <input type="text" value={expCategory} onChange={e => setExpCategory(e.target.value)} placeholder={t('Equipment / Marketing / Operations','ציוד / שיווק / תפעול')} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Amount (₪) *','סכום (₪) *')}</label>
            <input type="number" required step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="150" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Payment Method','אמצעי תשלום')}</label>
            <select value={expMethod} onChange={e => setExpMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="Credit Card">{t('Credit Card','כרטיס אשראי')}</option>
              <option value="Bank Transfer">{t('Bank Transfer','העברה בנקאית')}</option>
              <option value="Cash">{t('Cash','מזומן')}</option>
              <option value="PayBox">PayBox</option>
              <option value="תשלום במקום">{t('Pay at Clinic','תשלום במקום')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Date','תאריך')}</label>
            <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
