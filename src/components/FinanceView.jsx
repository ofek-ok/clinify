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
      cell: ({ getValue }) => <span className="font-bold text-slate-800">{getValue()}</span>,
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
      cell: ({ getValue }) => <span className="font-bold text-slate-900" dir="ltr">{getValue()}</span>,
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {t('Finance & Billing', 'ניהול כספים ופיננסים')}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {t('Track clinic revenue, client invoices, and payment statuses.', 'מעקב אחר הכנסות המרפאה, חשבוניות מטופלים וסטטוס תשלומים.')}
          </p>
        </div>

        <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{t('New Invoice', 'חשבונית חדשה')}</span>
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Monthly Revenue', 'הכנסות החודש')}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">₪24,850</h3>
          <p className="text-xs font-semibold text-emerald-600 mt-2">+12.4% {t('vs last month', 'בהשוואה לחודש שעבר')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Pending Payments', 'תשלומים בהמתנה')}</p>
          <h3 className="text-3xl font-extrabold text-amber-600 tracking-tight">₪3,400</h3>
          <p className="text-xs text-slate-500 font-medium mt-2">4 {t('invoices awaiting payment', 'חשבוניות ממתינות לגבייה')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t('Average Treatment Value', 'ממוצע לטיפול')}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">₪520</h3>
          <p className="text-xs text-slate-500 font-medium mt-2">{t('Based on 48 completed appointments', 'מבוסס על 48 תורים שהושלמו')}</p>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">{t('Recent Invoices & Transactions', 'חשבוניות ועסקאות אחרונות')}</h3>
          <span className="text-xs text-slate-400 font-semibold">{mockInvoices.length} {t('invoices', 'חשבוניות')}</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-3 px-6 font-semibold cursor-pointer select-none text-start hover:text-slate-800 transition-colors"
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
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
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
