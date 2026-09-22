import React, { useState, useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import Drawer from './ui/Drawer';
import { useToast } from './ui/Toast';
import { Plus, Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';
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
    updatePaymentStatus,
    deletePayment,
    deleteExpense,
    todayStr
  } = useContext(ClinicContext);
  const { showToast } = useToast();

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
  const [expCategory, setExpCategory] = useState('ציוד קליני');
  const [expAmount, setExpAmount] = useState('');
  const [expMethod, setExpMethod] = useState('Credit Card');
  const [expDate, setExpDate] = useState(todayStr);

  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [payments, expenses]);

  // 6-Month Chart Data
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = d.toLocaleString('he-IL', { month: 'short' });
      const year = d.getFullYear();
      const monthIdx = d.getMonth();

      const inc = payments
        .filter(p => p.status === 'paid' && new Date(p.payment_date || p.created_at).getFullYear() === year && new Date(p.payment_date || p.created_at).getMonth() === monthIdx)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const exp = expenses
        .filter(e => new Date(e.expense_date || e.created_at).getFullYear() === year && new Date(e.expense_date || e.created_at).getMonth() === monthIdx)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      months.push({ name: mLabel, הכנסות: inc, הוצאות: exp });
    }
    return months;
  }, [payments, expenses]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!payPatientId || !payAmount) {
      showToast('אנא בחר לקוח והזן סכום לתשלום', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPayment({
        patient_id: payPatientId,
        amount: parseFloat(payAmount),
        payment_method: payMethod,
        status: payStatus,
        payment_date: payDate || todayStr
      });
      showToast('התשלום נרשם בהצלחה');
      setIsPaymentDrawerOpen(false);
      setPayAmount('');
    } catch (err) {
      showToast(err.message || 'שגיאה ברשום תשלום', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expDescription || !expAmount) {
      showToast('אנא הזן תיאור וסכום הוצאה', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addExpense({
        title: expDescription.trim(),
        category: expCategory,
        amount: parseFloat(expAmount),
        payment_method: expMethod,
        expense_date: expDate || todayStr
      });
      showToast('ההוצאה נרשמה בהצלחה');
      setIsExpenseDrawerOpen(false);
      setExpDescription('');
      setExpAmount('');
    } catch (err) {
      showToast(err.message || 'שגיאה ברשום הוצאה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-start font-sans">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">כספים</h1>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          {[
            { id: 'overview', label: 'סקירה' },
            { id: 'income', label: 'הכנסות' },
            { id: 'expenses', label: 'הוצאות' }
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
              <span className="text-slate-500 text-xs font-medium">הכנסות החודש</span>
              <p className="text-xl font-bold text-violet-400">₪{currentMonthMetrics.incomeMonth.toLocaleString()}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">הוצאות החודש</span>
              <p className="text-xl font-bold text-rose-400">₪{currentMonthMetrics.expensesMonth.toLocaleString()}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">רווח החודש</span>
              <p className={`text-xl font-bold ${currentMonthMetrics.profitMonth >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>
                ₪{currentMonthMetrics.profitMonth.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 text-xs font-medium">ממתין לגבייה</span>
              <p className="text-xl font-bold text-amber-400">₪{currentMonthMetrics.pendingCollection.toLocaleString()}</p>
            </div>
          </div>

          {/* Simple 6-Month Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900">הכנסות מול הוצאות — 6 חודשים</h3>
            <div className="h-64 w-full dir-ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="הכנסות" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="הוצאות" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* INCOME TAB */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">רשימת הכנסות ותשלומים</span>
            <button
              onClick={() => setIsPaymentDrawerOpen(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>תשלום חדש</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-4 text-start">לקוח</th>
                  <th className="py-3 px-4 text-start">תאריך</th>
                  <th className="py-3 px-4 text-start">סכום</th>
                  <th className="py-3 px-4 text-start">אמצעי תשלום</th>
                  <th className="py-3 px-4 text-start">סטטוס</th>
                  <th className="py-3 px-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">אין תשלומים רשומים.</td></tr>
                ) : (
                  payments.map(p => {
                    const pat = patients.find(patient => patient.id === p.patient_id || patient.person_id === p.person_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-100">
                        <td className="py-3 px-4 font-bold text-slate-900">{pat ? pat.full_name : 'לקוח כללי'}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">{p.payment_date || '-'}</td>
                        <td className="py-3 px-4 font-bold text-violet-400">₪{p.amount}</td>
                        <td className="py-3 px-4 text-slate-500">{p.payment_method === 'PayBox' ? 'PayBox' : p.payment_method === 'Credit Card' ? 'אשראי' : 'תשלום במקום'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={p.status}
                            onChange={async e => {
                              try {
                                await updatePaymentStatus(p.id, e.target.value);
                                showToast('סטטוס התשלום עודכן');
                              } catch (err) {
                                showToast(err.message || 'לא ניתן לעדכן את התשלום', 'error');
                              }
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-bold outline-none border ${p.status === 'paid' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                          >
                            <option value="paid">שולם</option>
                            <option value="pending">ממתין</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm('להעביר את התשלום לאשפה?')) return;
                              try {
                                await deletePayment(p.id);
                                showToast('התשלום הועבר לאשפה');
                              } catch (err) {
                                showToast(err.message || 'לא ניתן למחוק את התשלום', 'error');
                              }
                            }}
                            className="text-[11px] font-bold text-rose-700 hover:underline"
                          >
                            מחיקה
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

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">רשימת הוצאות</span>
            <button
              onClick={() => setIsExpenseDrawerOpen(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>הוצאה חדשה</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-3 px-4 text-start">תיאור</th>
                  <th className="py-3 px-4 text-start">קטגוריה</th>
                  <th className="py-3 px-4 text-start">תאריך</th>
                  <th className="py-3 px-4 text-start">סכום</th>
                  <th className="py-3 px-4 text-start">אמצעי תשלום</th>
                  <th className="py-3 px-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-500">אין הוצאות רשומות.</td></tr>
                ) : (
                  expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-100">
                      <td className="py-3 px-4 font-bold text-slate-900">{e.title || e.description || '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{e.category || '-'}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{e.expense_date || '-'}</td>
                      <td className="py-3 px-4 font-bold text-rose-400">₪{e.amount}</td>
                      <td className="py-3 px-4 text-slate-500">{e.payment_method || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm('להעביר את ההוצאה לאשפה?')) return;
                            try {
                              await deleteExpense(e.id);
                              showToast('ההוצאה הועברה לאשפה');
                            } catch (err) {
                              showToast(err.message || 'לא ניתן למחוק את ההוצאה', 'error');
                            }
                          }}
                          className="text-[11px] font-bold text-rose-700 hover:underline"
                        >
                          מחיקה
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

      {/* Add Payment Drawer */}
      <Drawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        title="רישום תשלום חדש"
        footer={
          <>
            <button onClick={() => setIsPaymentDrawerOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100">ביטול</button>
            <button onClick={handleCreatePayment} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? 'שומר...' : 'שמור תשלום'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">לקוח *</label>
            <select required value={payPatientId} onChange={e => setPayPatientId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="">בחר לקוח...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">סכום (₪) *</label>
            <input type="number" required step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="350" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">אמצעי תשלום</label>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="PayBox">PayBox</option>
              <option value="תשלום במקום">תשלום במקום</option>
              <option value="Credit Card">כרטיס אשראי</option>
              <option value="Bank Transfer">העברה בנקאית</option>
              <option value="Cash">מזומן</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">סטטוס תשלום</label>
            <select value={payStatus} onChange={e => setPayStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="paid">שולם</option>
              <option value="pending">ממתין לגבייה</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">תאריך</label>
            <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>
        </form>
      </Drawer>

      {/* Add Expense Drawer */}
      <Drawer
        isOpen={isExpenseDrawerOpen}
        onClose={() => setIsExpenseDrawerOpen(false)}
        title="רישום הוצאה חדשה"
        footer={
          <>
            <button onClick={() => setIsExpenseDrawerOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100">ביטול</button>
            <button onClick={handleCreateExpense} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? 'שומר...' : 'שמור הוצאה'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">תיאור ההוצאה *</label>
            <input type="text" required value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="ציוד קליני / פרסום..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">קטגוריה</label>
            <input type="text" value={expCategory} onChange={e => setExpCategory(e.target.value)} placeholder="ציוד / שיווק / תפעול" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">סכום (₪) *</label>
            <input type="number" required step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="150" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">תאריך</label>
            <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
