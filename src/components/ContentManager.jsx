import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import {
  Plus, Trash2, Search, CalendarDays, Columns3, List,
  Pencil, Filter, ExternalLink
} from 'lucide-react';

const STATUS_COLUMNS = [
  { id:'idea', en:'Idea', he:'רעיון' },
  { id:'planned', en:'Planned', he:'מתוכנן' },
  { id:'in_production', en:'In Production', he:'בהכנה' },
  { id:'ready', en:'Ready', he:'מוכן' },
  { id:'scheduled', en:'Scheduled', he:'מתוזמן' },
  { id:'published', en:'Published', he:'פורסם' }
];

const PLATFORMS = [
  ['instagram','Instagram'],
  ['facebook','Facebook'],
  ['tiktok','TikTok'],
  ['linkedin','LinkedIn'],
  ['youtube','YouTube'],
  ['x','X'],
  ['newsletter','Newsletter'],
  ['website','Website'],
  ['podcast','Podcast']
];

const FORMATS = [
  ['reel','Reel / Short'],
  ['carousel','Carousel'],
  ['post','Post'],
  ['story','Story'],
  ['article','Article / Blog'],
  ['video','Long Video'],
  ['email','Email'],
  ['podcast','Podcast']
];

const AUDIENCES = [
  ['athletes','Athletes & Trainees','ספורטאים ומתאמנים'],
  ['professionals','High-Demand Professionals','High-Demand Professionals'],
  ['both','Both Audiences','שני הקהלים'],
  ['general','General','כללי']
];

const OBJECTIVES = [
  ['awareness','Awareness','מודעות'],
  ['education','Education / Value','חינוך / ערך'],
  ['authority','Authority','סמכות מקצועית'],
  ['engagement','Engagement','מעורבות'],
  ['conversion','Conversion','המרה'],
  ['retention','Retention','שימור']
];

const STAGES = [
  ['research','Research','מחקר'],
  ['writing','Writing','כתיבה'],
  ['design','Design','עיצוב'],
  ['recording','Recording','צילום'],
  ['editing','Editing','עריכה'],
  ['review','Review','בדיקה'],
  ['done','Done','מוכן']
];

export default function ContentManager() {
  const { contentItems, projects, addContentItem, updateContentItem, deleteContentItem } = useContext(ClinicContext);
  const { showToast } = useToast();
  const { t } = useContext(LanguageContext);

  const [view, setView] = useState('kanban');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyForm = {
    title:'',
    platform:'instagram',
    format:'reel',
    audience:'both',
    objective:'awareness',
    status:'idea',
    stage:'research',
    publish_date:'',
    campaign:'',
    cta:'',
    project_id:''
  };
  const [form, setForm] = useState(emptyForm);

  const campaignsList = useMemo(
    () => Array.from(new Set(contentItems.map(i => i.campaign).filter(Boolean))).sort(),
    [contentItems]
  );

  const filteredItems = useMemo(() => contentItems.filter(item => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const haystack = [item.title,item.campaign,item.cta,item.platform,item.format,item.objective,item.audience].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
    if (campaignFilter !== 'all' && item.campaign !== campaignFilter) return false;
    if (audienceFilter !== 'all' && item.audience !== audienceFilter) return false;
    return true;
  }), [contentItems, searchTerm, platformFilter, campaignFilter, audienceFilter]);

  const upcomingItems = useMemo(() =>
    [...filteredItems]
      .filter(item => item.publish_date)
      .sort((a,b) => new Date(a.publish_date) - new Date(b.publish_date)),
    [filteredItems]
  );

  const openNew = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setIsDrawerOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      title:item.title || '',
      platform:item.platform || 'instagram',
      format:item.format || 'reel',
      audience:item.audience || 'both',
      objective:item.objective || 'awareness',
      status:item.status || 'idea',
      stage:item.stage || 'research',
      publish_date:item.publish_date ? String(item.publish_date).slice(0,10) : '',
      campaign:item.campaign || '',
      cta:item.cta || '',
      project_id:item.project_id || ''
    });
    setIsDrawerOpen(true);
  };

  const saveItem = async (e) => {
    e?.preventDefault?.();
    if (!form.title.trim()) {
      showToast(t('Please enter a content title / topic','אנא הזן כותרת / נושא תוכן'), 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        campaign: form.campaign.trim() || null,
        cta: form.cta.trim() || null,
        project_id: form.project_id || null,
        publish_date: form.publish_date || null
      };

      if (editingItem) {
        const updated = await updateContentItem(editingItem.id, payload);
        setEditingItem(updated || { ...editingItem, ...payload });
        showToast(t('Content item updated','פריט התוכן עודכן'));
      } else {
        await addContentItem(payload);
        showToast(t('Content item created','פריט התוכן נוצר'));
      }
      setIsDrawerOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
    } catch (err) {
      showToast(err.message || t('Could not save content item','לא ניתן לשמור את פריט התוכן'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickStatusChange = async (item, status) => {
    try {
      await updateContentItem(item.id,{status});
    } catch(err) {
      showToast(err.message || t('Could not update status','לא ניתן לעדכן סטטוס'),'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    try {
      await deleteContentItem(deleteModalItem.id);
      showToast(t('Content item moved to Trash','פריט התוכן הועבר לאשפה'));
      setIsDrawerOpen(false);
      setEditingItem(null);
    } catch(err) {
      showToast(err.message || t('Could not move to Trash','לא ניתן להעביר לאשפה'),'error');
    } finally {
      setDeleteModalItem(null);
    }
  };

  const platformLabel = value => PLATFORMS.find(([id])=>id===value)?.[1] || value || '-';
  const optionLabel = (options,value) => { const found = options.find(([id])=>id===value); return found ? t(found[1], found[2] ?? found[1]) : value || '-'; };

  return (
    <div className="space-y-4 dir-rtl text-start">
      <section className="premium-panel rounded-2xl overflow-hidden">
        <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">{t('Content','תוכן')}</h1>
            <p className="mt-1 text-xs text-slate-500">{t('One pipeline for all OP content — from idea to publication.','Pipeline אחד לכל התוכן של OP — מרעיון ועד פרסום.')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <ViewButton active={view==='kanban'} onClick={()=>setView('kanban')} icon={Columns3}>Kanban</ViewButton>
              <ViewButton active={view==='calendar'} onClick={()=>setView('calendar')} icon={CalendarDays}>Calendar</ViewButton>
              <ViewButton active={view==='list'} onClick={()=>setView('list')} icon={List}>List</ViewButton>
            </div>
            <button onClick={openNew} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-500">
              <Plus className="w-4 h-4"/> {t('New Content','תוכן חדש')}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder={t("Search content...","חיפוש תוכן...")} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-xs outline-none focus:border-violet-400"/>
            </div>
            <button onClick={()=>setShowFilters(v=>!v)} className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${showFilters ? 'border-violet-200 bg-violet-50 text-violet-700':'border-slate-200 bg-white text-slate-600'}`}>
              <Filter className="w-4 h-4"/> {t('Filter','סינון')}
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-2 pt-3 sm:grid-cols-3">
              <FilterSelect value={platformFilter} onChange={setPlatformFilter}>
                <option value="all">{t('All Platforms','כל הפלטפורמות')}</option>
                {PLATFORMS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
              </FilterSelect>
              <FilterSelect value={campaignFilter} onChange={setCampaignFilter}>
                <option value="all">{t('All Campaigns','כל הקמפיינים')}</option>
                {campaignsList.map(c=><option key={c} value={c}>{c}</option>)}
              </FilterSelect>
              <FilterSelect value={audienceFilter} onChange={setAudienceFilter}>
                <option value="all">{t('All Audiences','כל הקהלים')}</option>
                {AUDIENCES.map(([id,en,he])=><option key={id} value={id}>{t(en,he)}</option>)}
              </FilterSelect>
            </div>
          )}
        </div>
      </section>

      {view==='kanban' && (
        <div className="overflow-x-auto pb-3">
          <div className="grid auto-cols-[280px] grid-flow-col gap-3 min-w-max">
            {STATUS_COLUMNS.map(col=>{
              const items=filteredItems.filter(item=>item.status===col.id);
              return (
                <section key={col.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3">
                    <span className="text-xs font-extrabold text-slate-900">{t(col.en,col.he)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{items.length}</span>
                  </div>
                  <div className="space-y-2 p-2 min-h-[420px]">
                    {items.map(item=>(
                      <article key={item.id} onClick={()=>openEdit(item)} className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">{platformLabel(item.platform)}</span>
                          {item.publish_date && <span className="text-[9px] font-medium text-slate-400">{String(item.publish_date).slice(0,10)}</span>}
                        </div>
                        <h3 className="mt-2 text-xs font-extrabold leading-5 text-slate-900">{item.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.format && <Pill>{optionLabel(FORMATS,item.format)}</Pill>}
                          {item.audience && <Pill>{optionLabel(AUDIENCES,item.audience)}</Pill>}
                        </div>
                        {item.campaign && <div className="mt-2 text-[10px] font-bold text-violet-600">{item.campaign}</div>}
                        <select value={item.status || 'idea'} onClick={e=>e.stopPropagation()} onChange={e=>quickStatusChange(item,e.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px]">
                          {STATUS_COLUMNS.map(s=><option key={s.id} value={s.id}>{t(s.en,s.he)}</option>)}
                        </select>
                      </article>
                    ))}
                    {!items.length && <div className="py-10 text-center text-[10px] text-slate-400">{t('No items','אין פריטים')}</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {view==='calendar' && (
        <section className="premium-panel rounded-2xl overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-xs font-extrabold text-slate-900">{t('Publishing Calendar','לוח פרסומים')}</h2>
            <p className="mt-1 text-[10px] text-slate-400">{t('Sorted by planned publishing date.','ממויין לפי תאריך הפרסום המתוכנן.')}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingItems.length ? upcomingItems.map(item=>(
              <button key={item.id} type="button" onClick={()=>openEdit(item)} className="grid w-full grid-cols-[110px_1fr_auto] items-center gap-3 px-4 py-3 text-start hover:bg-slate-50">
                <div className="font-mono text-[11px] font-bold text-violet-700">{String(item.publish_date).slice(0,10)}</div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-[10px] text-slate-400">{platformLabel(item.platform)} · {optionLabel(FORMATS,item.format)} · {optionLabel(AUDIENCES,item.audience)}</div>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{optionLabel(STATUS_COLUMNS.map(s=>[s.id,s.en,s.he]),item.status)}</span>
              </button>
            )) : <div className="py-14 text-center text-xs text-slate-400">{t('No content items with a publishing date.','אין פריטי תוכן עם תאריך פרסום.')}</div>}
          </div>
        </section>
      )}

      {view==='list' && (
        <section className="premium-panel rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3 text-start">{t('Content','תוכן')}</th>
                <th className="px-3 py-3 text-start">{t('Platform','פלטפורמה')}</th>
                <th className="px-3 py-3 text-start">{t('Audience','קהל')}</th>
                <th className="px-3 py-3 text-start">{t('Objective','מטרה')}</th>
                <th className="px-3 py-3 text-start">{t('Status','סטטוס')}</th>
                <th className="px-3 py-3 text-start">{t('Publish Date','פרסום')}</th>
                <th className="px-3 py-3 text-center">{t('Actions','פעולות')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item=>(
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    {item.campaign && <div className="mt-1 text-[10px] text-violet-600">{item.campaign}</div>}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{platformLabel(item.platform)}</td>
                  <td className="px-3 py-3 text-slate-600">{optionLabel(AUDIENCES,item.audience)}</td>
                  <td className="px-3 py-3 text-slate-600">{optionLabel(OBJECTIVES,item.objective)}</td>
                  <td className="px-3 py-3">
                    <select value={item.status||'idea'} onChange={e=>quickStatusChange(item,e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px]">
                      {STATUS_COLUMNS.map(s=><option key={s.id} value={s.id}>{t(s.en,s.he)}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] text-slate-500">{item.publish_date ? String(item.publish_date).slice(0,10) : '-'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={()=>openEdit(item)} className="p-1.5 text-slate-400 hover:text-violet-600"><Pencil className="w-4 h-4"/></button>
                      <button onClick={()=>setDeleteModalItem(item)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={()=>{setIsDrawerOpen(false);setEditingItem(null);}}
        title={editingItem ? t('Edit Content Item','עריכת פריט תוכן') : t('New Content Item','פריט תוכן חדש')}
        width="max-w-2xl"
        footer={
          <>
            {editingItem && (
              <button type="button" onClick={()=>setDeleteModalItem(editingItem)} className="mr-auto inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                <Trash2 className="w-4 h-4"/> העבר לאשפה
              </button>
            )}
            <button type="button" onClick={()=>setIsDrawerOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">{t('Cancel','ביטול')}</button>
            <button type="button" onClick={saveItem} disabled={isSubmitting} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? t('Saving...','שומר...') : t('Save','שמור')}
            </button>
          </>
        }
      >
        <form onSubmit={saveItem} className="space-y-4">
          <Field label={t("Title / Topic *","כותרת / נושא *")}>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="work-input" placeholder={t("What is the content topic?","מה נושא התוכן?")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Platform","פלטפורמה")}>
              <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} className="work-input">
                {PLATFORMS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
              </select>
            </Field>
            <Field label={t("Format","פורמט")}>
              <select value={form.format} onChange={e=>setForm({...form,format:e.target.value})} className="work-input">
                {FORMATS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Audience","קהל יעד")}>
              <select value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})} className="work-input">
                {AUDIENCES.map(([id,en,he])=><option key={id} value={id}>{t(en,he)}</option>)}
              </select>
            </Field>
            <Field label={t("Content Objective","מטרת התוכן")}>
              <select value={form.objective} onChange={e=>setForm({...form,objective:e.target.value})} className="work-input">
                {OBJECTIVES.map(([id,en,he])=><option key={id} value={id}>{t(en,he)}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Status","סטטוס")}>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="work-input">
                {STATUS_COLUMNS.map(s=><option key={s.id} value={s.id}>{t(s.en,s.he)}</option>)}
              </select>
            </Field>
            <Field label={t("Production Stage","שלב הפקה")}>
              <select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} className="work-input">
                {STAGES.map(([id,en,he])=><option key={id} value={id}>{t(en,he)}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Publish Date","תאריך פרסום")}>
              <input type="date" value={form.publish_date} onChange={e=>setForm({...form,publish_date:e.target.value})} className="work-input"/>
            </Field>
            <Field label={t("Campaign","קמפיין")}>
              <input value={form.campaign} onChange={e=>setForm({...form,campaign:e.target.value})} className="work-input" placeholder={t("e.g. Launch Jan 2027","למשל: Launch Jan 2027")}/>
            </Field>
          </div>

          <Field label="CTA">
            <input value={form.cta} onChange={e=>setForm({...form,cta:e.target.value})} className="work-input" placeholder={t("What do we want the reader to do?","מה אנחנו רוצים שהקורא יעשה?")}/>
          </Field>

          <Field label={t("Linked Project","שיוך לפרויקט")}>
            <select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})} className="work-input">
              <option value="">{t("No Project","ללא פרויקט")}</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </form>
      </Drawer>

      <ConfirmModal
        isOpen={Boolean(deleteModalItem)}
        onClose={()=>setDeleteModalItem(null)}
        onConfirm={handleConfirmDelete}
        title={t("Move content item to Trash?","להעביר את פריט התוכן לאשפה?")}
        message={deleteModalItem ? t(`“${deleteModalItem.title}” will be removed from the pipeline and remain available in Trash.`, `“${deleteModalItem.title}” יוסר מה־pipeline ויישאר זמין לשחזור באשפה.`) : ''}
        confirmText={t("Move to Trash","העבר לאשפה")}
        cancelText={t("Cancel","ביטול")}
        isDanger
      />
    </div>
  );
}

function Field({label,children}) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-500">{label}</span>{children}</label>;
}

function FilterSelect({value,onChange,children}) {
  return <select value={value} onChange={e=>onChange(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700">{children}</select>;
}

function Pill({children}) {
  return <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-semibold text-slate-500">{children}</span>;
}

function ViewButton({active,onClick,icon:Icon,children}) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition ${active ? 'bg-white text-slate-950 shadow-sm':'text-slate-500'}`}><Icon className="w-3.5 h-3.5"/>{children}</button>;
}
