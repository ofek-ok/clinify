import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useToast } from './ui/Toast';

const TYPE_META = {
  status: ['Statuses','סטטוסים','Status','סטטוס'],
  priority: ['Priorities','עדיפויות','Priority','עדיפות'],
  area: ['Areas','תחומים','Area','תחום'],
  label: ['Labels','תגיות','Label','תגית']
};

export default function WorkOptionsManager() {
  const { workOptions, addWorkOption, updateWorkOption } = useContext(ClinicContext);
  const { showToast } = useToast();
  const { t } = useContext(LanguageContext);
  const [activeType, setActiveType] = useState('status');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#64748b');
  const [saving, setSaving] = useState(false);

  const options = useMemo(() =>
    workOptions.filter(o => o.option_type === activeType)
      .sort((a,b) => a.sort_order - b.sort_order),
    [workOptions, activeType]
  );

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await addWorkOption({
        option_type: activeType,
        label: newLabel,
        color: newColor,
        sort_order: options.length ? Math.max(...options.map(o => o.sort_order || 0)) + 10 : 10
      });
      setNewLabel('');
      showToast(t(`${TYPE_META[activeType][2]} added successfully`, `${TYPE_META[activeType][3]} נוסף בהצלחה`));
    } catch (err) {
      showToast(err.message || t('Could not add option','לא ניתן להוסיף אפשרות'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="premium-panel rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900">{t('Customize Work','התאמה אישית של Work')}</h3>
        <p className="text-xs text-slate-500 mt-1">{t('Manage the options used across tasks and boards.','נהל את האפשרויות שיופיעו בכל המשימות והלוחות.')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_META).map(([id,meta]) => (
          <button key={id} type="button" onClick={() => setActiveType(id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeType===id ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
            {t(meta[0],meta[1])}
          </button>
        ))}
      </div>

      <div className="premium-panel rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 grid grid-cols-[1fr_90px_100px_80px] gap-2 text-[11px] font-bold text-slate-500">
          <span>{t('Name','שם')}</span><span>{t('Color','צבע')}</span><span>{t('Order','סדר')}</span><span>{t('Active','פעיל')}</span>
        </div>
        <div className="divide-y divide-slate-100">
          {options.map(option => (
            <div key={option.id} className="p-3 grid grid-cols-[1fr_90px_100px_80px] gap-2 items-center">
              <input
                value={option.label}
                onChange={e => updateWorkOption(option.id,{label:e.target.value})}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="color"
                value={option.color || '#64748b'}
                onChange={e => updateWorkOption(option.id,{color:e.target.value})}
                className="w-10 h-8 rounded border border-slate-200 p-0"
              />
              <input
                type="number"
                value={option.sort_order || 0}
                onChange={e => updateWorkOption(option.id,{sort_order:Number(e.target.value)})}
                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
              />
              <button type="button" onClick={() => updateWorkOption(option.id,{is_active:!option.is_active})}
                className={`inline-flex items-center gap-1 text-xs font-bold ${option.is_active ? 'text-violet-700' : 'text-slate-400'}`}>
                {option.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {option.is_active ? t('Active','פעיל') : t('Hidden','מוסתר')}
              </button>
            </div>
          ))}
          {options.length===0 && <div className="p-6 text-center text-xs text-slate-500">{t('No options yet.','אין אפשרויות עדיין.')}</div>}
        </div>
      </div>

      <div className="premium-panel rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Add','הוסף')} {t(TYPE_META[activeType][2],TYPE_META[activeType][3])}</label>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder={t("New name...","שם חדש...")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Color','צבע')}</label>
            <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)} className="w-12 h-9 rounded border border-slate-200 p-0" />
          </div>
          <button type="button" onClick={handleAdd} disabled={saving || !newLabel.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
            <Plus className="w-4 h-4" /> {t('Add','הוסף')}
          </button>
        </div>
      </div>
    </div>
  );
}
