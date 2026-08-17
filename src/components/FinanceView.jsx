import React, { useContext, useMemo, useState } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  flexRender 
} from '@tanstack/react-table';
import { LanguageContext } from '../context/LanguageContext';

const FinanceView = () => {
  const { t } = useContext(LanguageContext);
  const [sorting, setSorting] = useState([]);

  const mockInvoices = useMemo(() => [
    { id: 'INV-2026-001', client: 'ישראל ישראלי', amount: '₪450', date: '2026-08-15', status: 'paid', service: 'טיפול שיניים משמר' },
    { id: 'INV-2026-002', client: 'מיכל אברהמי', amount: '₪850', date: '2026-08-16', status: 'pending', service: 'הלבנת שיניים בלייזר' },
    { id: 'INV-2026-003', client: 'דניאל כהן', amount: '₪300', date: '2026-08-17', status: 'paid', service: 'ייעוץ ראשוני' },
    { id: 'INV-2026-004', client: 'עדי לוי', amount: '₪1,200', date: '2026-08-17', status: 'pending', service: 'יישור שיניים - סד שקוף' },
  ], []);

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: () => t('Invoice #', 'מס׳ חשבונית'),
      cell: ({ getValue }) => <span className="font-extrabold text-slate-900">{getValue()}</span>,
    },
    {
      accessorKey: 'client',
      header: () => t('Client Name', 'שם הלקוח'),
      cell: ({ getValue }) => <span className="font-bold text-slate-800">{getValue()}</span>,
    },
    {
      accessorKey: 'service',
      header: () => t('Service', 'שירות'),
      cell: ({ getValue }) => <span className="text-slate-600 text-xs font-medium">{getValue()}</span>,
    },
    {
      accessorKey: 'amount',
      header: () => t('Amount', 'סכום'),
      cell: ({ getValue }) => <span className="font-black text-slate-900" dir="ltr">{getValue()}</span>,
    },
    {
      accessorKey: 'date',
      header: () => t('Date', 'תאריך'),
      cell: ({ getValue }) => <span className="text-slate-500 text-xs font-medium">{getValue()}</span>,
    },
    {
      accessorKey: 'status',
      header: () => t('Status', 'סטטוס'),
      cell: ({ getValue }) => {
        const isPaid = getValue() === 'paid';
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isPaid 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isPaid ? t('Paid', 'שולם') : t('Pending', 'בהמתנה לגבייה')}
          </span>
        );
      },
    },
  ], [t]);

  const table = useReactTable({
    data: mockInvoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Page Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('Finance & Billing', 'ניהול כספים ופיננסים')}
            </h2>
            <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full border border-cyan-200">
              TanStack Table Powered
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            {t('Track clinic revenue, client invoices, and payment statuses.', 'מעקב אחר הכנסות המרפאה, חשבוניות מטופלים וסטטוס תשלומים.')}
          </p>
        </div>

        <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('New Invoice', 'חשבונית חדשה')}</span>
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{t('Monthly Revenue', 'הכנסות החודש')}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">₪24,850</h3>
          <div className="mt-3 flex items-center text-xs font-extrabold text-emerald-600 gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <span>+12.4% {t('vs last month', 'בהשוואה לחודש שעבר')}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{t('Pending Payments', 'תשלומים בהמתנה')}</p>
          <h3 className="text-3xl font-black text-amber-600 tracking-tight">₪3,400</h3>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            <span>4 {t('invoices awaiting payment', 'חשבוניות ממתינות לגבייה')}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{t('Average Treatment Value', 'ממוצע לטיפול')}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">₪520</h3>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            <span>{t('Based on 48 completed appointments', 'מבוסס על 48 תורים שהושלמו')}</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table (TanStack Table Powered) */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{t('Recent Invoices & Transactions', 'חשבוניות ועסקאות אחרונות')}</h3>
          <span className="text-xs font-bold text-slate-400">{mockInvoices.length} {t('invoices', 'חשבוניות')}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-slate-50/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-3.5 px-6 font-extrabold cursor-pointer select-none text-start hover:text-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-4 px-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
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
