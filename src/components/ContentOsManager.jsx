import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ContentOsManager = () => {
  const { contentItems, projects, addContentItem, updateContentItem, deleteContentItem } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'grid'
  const [formModalOpen, setFormModalOpen] = useState(false);

  const [itemForm, setItemForm] = useState({
    title: '',
    platform: 'instagram',
    format: 'reel',
    audience: 'both',
    objective: 'awareness',
    status: 'idea',
    stage: 'research',
    publish_date: '',
    campaign: '',
    cta: '',
    project_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.title) return;
    await addContentItem({
      ...itemForm,
      publish_date: itemForm.publish_date || null,
      project_id: itemForm.project_id || null
    });
    setFormModalOpen(false);
    setItemForm({
      title: '',
      platform: 'instagram',
      format: 'reel',
      audience: 'both',
      objective: 'awareness',
      status: 'idea',
      stage: 'research',
      publish_date: '',
      campaign: '',
      cta: '',
      project_id: ''
    });
  };

  const statusColumns = [
    { id: 'idea', label: t('Ideas', 'רעיונות'), color: 'bg-slate-100 text-slate-700' },
    { id: 'planned', label: t('Planned', 'בתכנון'), color: 'bg-blue-100 text-blue-700' },
    { id: 'in_production', label: t('In Production', 'בהפקה'), color: 'bg-amber-100 text-amber-700' },
    { id: 'ready', label: t('Ready', 'מוכן לפרסום'), color: 'bg-purple-100 text-purple-700' },
    { id: 'published', label: t('Published', 'פורסם'), color: 'bg-violet-100 text-violet-700' }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Content OS V1', 'מערכת תוכן (Content OS)')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Manage content production pipeline, target audiences, platforms and CTA campaigns.', 'ניהול קנבן הפקת תוכן, קהלי יעד, פלטפורמות וקמפיינים.')}</p>
        </div>

        <button 
          onClick={() => setFormModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all"
        >
          + {t('Create Content Item', 'פריט תוכן חדש')}
        </button>
      </div>

      {/* New Content Item Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{t('Create Content Item', 'יצירת פריט תוכן חדש')}</h3>
              <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Title / Topic', 'כותרת / נושא התוכן')}</label>
                <input type="text" value={itemForm.title} onChange={e => setItemForm({...itemForm, title: e.target.value})} required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Platform', 'פלטפורמה')}</label>
                  <select value={itemForm.platform} onChange={e => setItemForm({...itemForm, platform: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="website">Website</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Format', 'פורמט תוכן')}</label>
                  <select value={itemForm.format} onChange={e => setItemForm({...itemForm, format: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="reel">Reel / Short</option>
                    <option value="post">Post / Carousel</option>
                    <option value="article">Article / Blog</option>
                    <option value="video">Long Video</option>
                    <option value="story">Story</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Audience', 'קהל יעד')}</label>
                  <select value={itemForm.audience} onChange={e => setItemForm({...itemForm, audience: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="both">{t('Both Athletes & Professionals', 'ספורטאים ומקצוענים')}</option>
                    <option value="athletes">{t('Athletes Only', 'ספורטאים')}</option>
                    <option value="professionals">{t('Professionals Only', 'מקצוענים')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Objective', 'מטרת העל')}</label>
                  <select value={itemForm.objective} onChange={e => setItemForm({...itemForm, objective: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="awareness">{t('Awareness', 'מודעות ומותג')}</option>
                    <option value="trust">{t('Trust & Authority', 'אמון וסמכות קלינית')}</option>
                    <option value="conversion">{t('Direct Conversion', 'המרה והנעה לפעולה')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Status', 'סטטוס')}</label>
                  <select value={itemForm.status} onChange={e => setItemForm({...itemForm, status: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                    <option value="idea">{t('Idea', 'רעיון')}</option>
                    <option value="planned">{t('Planned', 'בתכנון')}</option>
                    <option value="in_production">{t('In Production', 'בהפקה')}</option>
                    <option value="ready">{t('Ready', 'מוכן')}</option>
                    <option value="published">{t('Published', 'פורסם')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Publish Date', 'תאריך פרסום')}</label>
                  <input type="date" value={itemForm.publish_date} onChange={e => setItemForm({...itemForm, publish_date: e.target.value})} 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Link to Strategic Project', 'קישור לפרויקט אסטרטגי')}</label>
                <select value={itemForm.project_id} onChange={e => setItemForm({...itemForm, project_id: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                  <option value="">{t('None', 'ללא קישור לפרויקט')}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs mt-2 shadow-sm">
                {t('Save Content Item', 'שמור פריט תוכן')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statusColumns.map(col => {
          const colItems = contentItems.filter(item => item.status === col.id);
          return (
            <div key={col.id} className="bg-slate-50/70 rounded-2xl border border-slate-200 p-3 flex flex-col min-h-[480px]">
              <div className="flex justify-between items-center mb-3 px-1">
                <h4 className="font-bold text-slate-700 text-xs">{col.label}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colItems.map(item => {
                  const linkedProject = projects.find(p => p.id === item.project_id);
                  return (
                    <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.platform} • {item.format}
                        </span>
                        <button onClick={() => deleteContentItem(item.id)} className="text-slate-300 hover:text-rose-500 text-xs opacity-0 group-hover:opacity-100">
                          ✕
                        </button>
                      </div>

                      <h5 className="font-bold text-xs text-slate-800 leading-snug">{item.title}</h5>

                      {linkedProject && (
                        <p className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max">
                          📁 {linkedProject.name}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                        <span>🎯 {item.audience}</span>
                        <select 
                          value={item.status} 
                          onChange={(e) => updateContentItem(item.id, { status: e.target.value })}
                          className="text-[10px] font-semibold border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 outline-none"
                        >
                          <option value="idea">רעיון</option>
                          <option value="planned">מתוכנן</option>
                          <option value="in_production">בהפקה</option>
                          <option value="ready">מוכן</option>
                          <option value="published">פורסם</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="text-center py-10 opacity-40">
                    <p className="text-xs text-slate-500">{t('No items', 'אין פריטים')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentOsManager;
