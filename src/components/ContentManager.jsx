import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import { Plus, Trash2, Search } from 'lucide-react';

export default function ContentManager() {
  const { contentItems, projects, addContentItem, updateContentItem, deleteContentItem } = useContext(ClinicContext);
  const { showToast } = useToast();

  const [platformFilter, setPlatformFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);

  // New Content Form State
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [format, setFormat] = useState('reel');
  const [status, setStatus] = useState('idea');
  const [publishDate, setPublishDate] = useState('');
  const [campaign, setCampaign] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColumns = [
    { id: 'idea', label: 'רעיון' },
    { id: 'planned', label: 'מתוכנן' },
    { id: 'in_production', label: 'בהכנה' },
    { id: 'ready', label: 'מוכן' },
    { id: 'scheduled', label: 'מתוזמן' },
    { id: 'published', label: 'פורסם' }
  ];

  const platformsList = Array.from(new Set(contentItems.map(i => i.platform).filter(Boolean)));
  const campaignsList = Array.from(new Set(contentItems.map(i => i.campaign).filter(Boolean)));

  const filteredItems = contentItems.filter(item => {
    const matchesSearch = !searchTerm || (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter;
    const matchesCampaign = campaignFilter === 'all' || item.campaign === campaignFilter;
    return matchesSearch && matchesPlatform && matchesCampaign;
  });

  const handleCreateContent = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('אנא הזן כותרת פריט תוכן', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addContentItem({
        title: title.trim(),
        platform,
        format,
        status,
        publish_date: publishDate || null,
        campaign: campaign.trim() || null,
        project_id: projectId || null
      });
      showToast('פריט התוכן נוצר בהצלחה');
      setIsAddDrawerOpen(false);
      setTitle('');
      setCampaign('');
    } catch (err) {
      showToast(err.message || 'שגיאה ביצירת פריט תוכן', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    try {
      await deleteContentItem(deleteModalItem.id);
      showToast('פריט התוכן נמחק');
      if (selectedItem?.id === deleteModalItem.id) {
        setSelectedItem(null);
      }
    } catch (err) {
      showToast('שגיאה במחיקת תוכן', 'error');
    } finally {
      setDeleteModalItem(null);
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש תוכן..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">כל הפלטפורמות</option>
            {platformsList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">כל הקמפיינים</option>
            {campaignsList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>תוכן חדש</span>
        </button>
      </div>

      {/* Horizontal Scroll Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-3 space-x-reverse min-w-[1200px] items-start">
          {statusColumns.map(col => {
            const colItems = filteredItems.filter(i => i.status === col.id);

            return (
              <div key={col.id} className="w-[280px] bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-3 shrink-0 min-h-[440px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">{col.label}</span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {colItems.length}
                  </span>
                </div>

                {/* Content Cards */}
                <div className="space-y-2.5">
                  {colItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 space-y-2 cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {item.platform} · {item.format}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {item.title}
                      </h4>

                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800/50">
                        {item.publish_date && <div>פרסום: {item.publish_date}</div>}
                        {item.campaign && <div className="text-emerald-400">{item.campaign}</div>}
                      </div>
                    </div>
                  ))}

                  {colItems.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-600">
                      אין פריטי תוכן
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Content Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="יצירת פריט תוכן חדש"
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateContent}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור תוכן'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateContent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">כותרת / נושא התוכן *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="כותרת התוכן..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">פלטפורמה</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">פורמט</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">סטטוס</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {statusColumns.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">תאריך פרסום</label>
              <input
                type="date"
                value={publishDate}
                onChange={e => setPublishDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">קמפיין</label>
            <input
              type="text"
              value={campaign}
              onChange={e => setCampaign(e.target.value)}
              placeholder="שם קמפיין..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">שיוך לפרויקט</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">ללא קישור לפרויקט</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </form>
      </Drawer>

      {/* Selected Item Detail Drawer */}
      {selectedItem && (
        <Drawer
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`פריט תוכן: ${selectedItem.title}`}
          footer={
            <div className="flex justify-between items-center w-full">
              <button
                onClick={() => setDeleteModalItem(selectedItem)}
                className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center space-x-1 space-x-reverse"
              >
                <Trash2 className="w-4 h-4" />
                <span>מחק תוכן</span>
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                סגור
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">כותרת</label>
              <input
                type="text"
                value={selectedItem.title}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedItem(prev => ({ ...prev, title: val }));
                  updateContentItem(selectedItem.id, { title: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">סטטוס</label>
              <select
                value={selectedItem.status || 'idea'}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedItem(prev => ({ ...prev, status: val }));
                  updateContentItem(selectedItem.id, { status: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {statusColumns.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Drawer>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalItem)}
        onClose={() => setDeleteModalItem(null)}
        onConfirm={handleConfirmDelete}
        title="מחיקת פריט תוכן"
        message={`האם אתה בטוח שברצונך למחוק את פריט התוכן "${deleteModalItem?.title}"?`}
        confirmText="מחק"
        isDanger={true}
      />
    </div>
  );
}
