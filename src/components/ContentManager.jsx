import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ContentManager = () => {
  const { contentItems, projects, addContentItem, updateContentItem, deleteContentItem } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [itemForm, setItemForm] = useState({
    title: '',
    platform: 'instagram',
    format: 'post',
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

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await addContentItem({
        ...itemForm,
        publish_date: itemForm.publish_date || null,
        project_id: itemForm.project_id || null
      });
      setFormModalOpen(false);
      setItemForm({
        title: '',
        platform: 'instagram',
        format: 'post',
        audience: 'both',
        objective: 'awareness',
        status: 'idea',
        stage: 'research',
        publish_date: '',
        campaign: '',
        cta: '',
        project_id: ''
      });
    } catch (err) {
      console.error("Content item save error:", err);
      setErrorMessage(t("Could not save content item. Please try again.", "לא הצלחנו לשמור את פריט התוכן. נסה שוב."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColumns = [
    { id: 'idea', label: t('Ideas', 'רעיון') },
    { id: 'planned', label: t('Planned', 'מתוכנן') },
    { id: 'in_production', label: t('In Preparation', 'בהכנה') },
    { id: 'ready', label: t('Ready', 'מוכן') },
    { id: 'scheduled', label: t('Scheduled', 'מתוזמן') },
    { id: 'published', label: t('Published', 'פורסם') }
  ];

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('Content', 'תוכן')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Manage content items, platforms and publishing status.', 'ניהול ופרסום תכנים בערוצים השונים.')}</p>
        </div>

        <button 
          onClick={() => setFormModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs"
        >
          + {t('New Content Item', 'פריט תוכן חדש')}
        </button>
      </div>

      {/* Modal Form */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{t('Create Content Item', 'יצירת פריט תוכן')}</h3>
              <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {errorMessage && (
                <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Title / Topic', 'כותרת / נושא התוכן')}</label>
                <input 
                  type="text" 
                  value={itemForm.title} 
                  onChange={e => setItemForm({...itemForm, title: e.target.value})} 
                  required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Platform', 'פלטפורמה')}</label>
                  <select 
                    value={itemForm.platform} 
                    onChange={e => setItemForm({...itemForm, platform: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="website">Website</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Format', 'פורמט')}</label>
                  <select 
                    value={itemForm.format} 
                    onChange={e => setItemForm({...itemForm, format: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Status', 'סטטוס')}</label>
                  <select 
                    value={itemForm.status} 
                    onChange={e => setItemForm({...itemForm, status: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="idea">{t('Idea', 'רעיון')}</option>
                    <option value="planned">{t('Planned', 'מתוכנן')}</option>
                    <option value="in_production">{t('In Preparation', 'בהכנה')}</option>
                    <option value="ready">{t('Ready', 'מוכן')}</option>
                    <option value="scheduled">{t('Scheduled', 'מתוזמן')}</option>
                    <option value="published">{t('Published', 'פורסם')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Publish Date', 'תאריך פרסום')}</label>
                  <input 
                    type="date" 
                    value={itemForm.publish_date} 
                    onChange={e => setItemForm({...itemForm, publish_date: e.target.value})} 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Link to Project', 'קישור לפרויקט')}</label>
                <select 
                  value={itemForm.project_id} 
                  onChange={e => setItemForm({...itemForm, project_id: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">{t('None', 'ללא קישור לפרויקט')}</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors mt-2"
              >
                {isSubmitting ? t('Saving...', 'שומר...') : t('Save Content Item', 'שמור פריט תוכן')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statusColumns.map(col => {
          const colItems = contentItems.filter(item => item.status === col.id);
          return (
            <div key={col.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col min-h-[420px]">
              <div className="flex justify-between items-center mb-3 px-1">
                <h4 className="font-bold text-slate-700 text-xs">{col.label}</h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                  {colItems.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colItems.map(item => {
                  const linkedProject = projects.find(p => p.id === item.project_id);
                  return (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-1.5">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.platform} • {item.format}
                        </span>
                        <button onClick={() => deleteContentItem(item.id)} className="text-slate-400 hover:text-rose-600 text-xs">
                          ✕
                        </button>
                      </div>

                      <h5 className="font-bold text-xs text-slate-800 leading-snug">{item.title}</h5>

                      {linkedProject && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          {linkedProject.name}
                        </p>
                      )}

                      <div className="pt-1 border-t border-slate-100 flex justify-between items-center">
                        <select 
                          value={item.status} 
                          onChange={(e) => updateContentItem(item.id, { status: e.target.value })}
                          className="text-[10px] font-medium border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 outline-none"
                        >
                          <option value="idea">רעיון</option>
                          <option value="planned">מתוכנן</option>
                          <option value="in_production">בהכנה</option>
                          <option value="ready">מוכן</option>
                          <option value="scheduled">מתוזמן</option>
                          <option value="published">פורסם</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="text-center py-8 opacity-40">
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

export default ContentManager;
