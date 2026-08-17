import React, { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

const FinanceView = () => {
  const { t } = useContext(LanguageContext);

  const mockInvoices = [
    { id: 'INV-2026-001', client: 'ישראל ישראלי', amount: '₪450', date: '2026-08-15', status: 'paid', service: 'טיפול שיניים משמר' },
    { id: 'INV-2026-002', client: 'מיכל אברהמי', amount: '₪850', date: '2026-08-16', status: 'pending', service: 'הלבנת שיניים בלייזר' },
    { id: 'INV-2026-003', client: 'דניאל כהן', amount: '₪300', date: '2026-08-17', status: 'paid', service: 'ייעוץ ראשוני' },
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {t('Finance & Billing', 'ניהול כספים ופיננסים')}
            </h2>
            <span className="text-xs font-extrabold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {t('Module', 'מודול חדש')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {t('Track clinic revenue, client invoices, and payment statuses.', 'מעקב אחר הכנסות המרפאה, חשבוניות מטופלים וסטטוס תשלומים.')}
          </p>
        </div>

        <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto active:scale-[0.98]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('New Invoice', 'חשבונית חדשה')}</span>
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Monthly Revenue', 'הכנסות החודש')}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">₪24,850</h3>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <span>+12.4% {t('vs last month', 'בהשוואה לחודש שעבר')}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Pending Payments', 'תשלומים בהמתנה')}</p>
          <h3 className="text-3xl font-extrabold text-amber-600 tracking-tight">₪3,400</h3>
          <div className="mt-3 text-xs text-slate-500">
            <span>4 {t('invoices awaiting payment', 'חשבוניות ממתינות לגבייה')}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Average Treatment Value', 'ממוצע לטיפול')}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">₪520</h3>
          <div className="mt-3 text-xs text-slate-500">
            <span>{t('Based on 48 completed appointments', 'מבוסס על 48 תורים שהושלמו')}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700">{t('Recent Invoices & Transactions', 'חשבוניות ועסקאות אחרונות')}</h3>
          <span className="text-xs text-slate-400">{t('Showing last 3 invoices', 'מציג 3 חשבוניות אחרונות')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6 font-semibold text-start">{t('Invoice #', 'מס׳ חשבונית')}</th>
                <th className="py-3 px-6 font-semibold text-start">{t('Client Name', 'שם הלקוח')}</th>
                <th className="py-3 px-6 font-semibold text-start">{t('Service', 'שירות')}</th>
                <th className="py-3 px-6 font-semibold text-start">{t('Amount', 'סכום')}</th>
                <th className="py-3 px-6 font-semibold text-start">{t('Date', 'תאריך')}</th>
                <th className="py-3 px-6 font-semibold text-start">{t('Status', 'סטטוס')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-700">{inv.id}</td>
                  <td className="py-4 px-6 font-medium text-slate-800">{inv.client}</td>
                  <td className="py-4 px-6 text-slate-600">{inv.service}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{inv.amount}</td>
                  <td className="py-4 px-6 text-slate-500">{inv.date}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      inv.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {inv.status === 'paid' ? t('Paid', 'שולם') : t('Pending', 'בהמתנה')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceView;
