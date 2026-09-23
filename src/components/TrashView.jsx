import React, { useContext, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ClinicContext } from '../context/ClinicContext';
import { useToast } from './ui/Toast';

const TABLES = [
  ['people', 'אנשי קשר'],
  ['patients', 'מטופלים'],
  ['leads', 'לידים'],
  ['appointments', 'תורים'],
  ['services', 'שירותים'],
  ['payments', 'תשלומים'],
  ['expenses', 'הוצאות'],
  ['tasks', 'משימות'],
  ['projects', 'פרויקטים'],
  ['content_items', 'תוכן'],
  ['forms', 'טפסים'],
  ['form_submissions', 'מילויי טפסים'],
  ['patient_packages', 'חבילות'],
  ['lead_communications', 'תקשורות'],
  ['patient_clinical_notes', 'הערות קליניות'],
  ['patient_documents', 'מסמכים'],
  ['calendar_blocks', 'חסימות יומן']
];

const getRecordTitle = (table, row) => {
  if (row.full_name) return row.full_name;
  if (row.name) return row.name;
  if (row.title) return row.title;
  if (table === 'appointments') return 'תור';
  if (table === 'payments') return `תשלום ₪${row.amount || 0}`;
  if (table === 'expenses') return row.category || 'הוצאה';
  if (table === 'patient_clinical_notes') return row.content?.slice(0, 50) || 'הערה קלינית';
  if (table === 'patient_documents') return row.name || 'מסמך';
  return row.id;
};

export default function TrashView() {
  const { restoreRecord } = useContext(ClinicContext);
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringKey, setRestoringKey] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadTrash = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(TABLES.map(async ([table, label]) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false })
          .limit(100);

        if (error) {
          console.warn(`Could not load trash for ${table}`, error);
          return [];
        }

        return (data || []).map(row => ({ table, label, row }));
      }));

      setItems(results.flat().sort((a, b) =>
        new Date(b.row.deleted_at || 0) - new Date(a.row.deleted_at || 0)
      ));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(item => item.table === filter);
  }, [items, filter]);

  const activeTables = useMemo(() => {
    const counts = new Map();
    items.forEach(item => counts.set(item.table, (counts.get(item.table) || 0) + 1));
    return TABLES.filter(([table]) => counts.has(table)).map(([table, label]) => ({
      table,
      label,
      count: counts.get(table)
    }));
  }, [items]);

  const handleRestore = async (item) => {
    const key = `${item.table}:${item.row.id}`;
    setRestoringKey(key);
    try {
      await restoreRecord(item.table, item.row.id);
      setItems(prev => prev.filter(candidate => !(candidate.table === item.table && candidate.row.id === item.row.id)));
      showToast('הרשומה שוחזרה בהצלחה');
    } catch (error) {
      showToast(error.message || 'לא ניתן לשחזר את הרשומה', 'error');
    } finally {
      setRestoringKey(null);
    }
  };

  return (
    <div className="space-y-5 dir-rtl text-start">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">אשפה</h1>
          <p className="mt-1 text-xs text-slate-500">רשומות שנמחקו נשמרות כאן וניתנות לשחזור.</p>
        </div>
        <button type="button" onClick={loadTrash} disabled={loading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          רענון
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          הכל ({items.length})
        </button>
        {activeTables.map(item => (
          <button key={item.table} type="button" onClick={() => setFilter(item.table)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === item.table ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">טוען אשפה...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Trash2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">האשפה ריקה</p>
            <p className="mt-1 text-xs text-slate-400">רשומות שתמחק יופיעו כאן.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map(item => {
              const key = `${item.table}:${item.row.id}`;
              return (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{item.label}</span>
                      <p className="truncate text-xs font-bold text-slate-900">{getRecordTitle(item.table, item.row)}</p>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      נמחק {new Date(item.row.deleted_at).toLocaleString('he-IL')}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={restoringKey === key}
                    onClick={() => handleRestore(item)}
                    className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {restoringKey === key ? 'משחזר...' : 'שחזור'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
        מחיקה כרגע היא מחיקה בטוחה לאשפה. מחיקה לצמיתות תתווסף רק עם הגנות נוספות, כדי שלא למחוק בטעות היסטוריה קלינית או פיננסית מקושרת.
      </div>
    </div>
  );
}
