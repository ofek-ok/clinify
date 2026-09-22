import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { Trash2 } from 'lucide-react';
import { useToast } from './ui/Toast';
import { Search, Plus, Phone, MessageSquare, Mail } from 'lucide-react';

const getIsraelDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

export default function LeadsPipeline({ onSelectLead }) {
  const { leads, leadCommunications, addLead, updateLeadStatus, updateLeadFollowUp, addLeadCommunication, deleteLead } = useContext(ClinicContext);
  const { showToast } = useToast();
  const todayKey = getIsraelDateKey();

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Lost Reason modal state
  const [lostModalLead, setLostModalLead] = useState(null);
  const [deleteModalLead, setDeleteModalLead] = useState(null);

  // New Lead form state
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Instagram');
  const [newLeadCampaign, setNewLeadCampaign] = useState('General Inquiries');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Communication note state inside drawer
  const [commType, setCommType] = useState('call');
  const [commNote, setCommNote] = useState('');

  const statusColumns = [
    { id: 'new', title: 'חדש' },
    { id: 'contacted', title: 'יצרנו קשר' },
    { id: 'qualified', title: 'מתאים' },
    { id: 'scheduled', title: 'נקבע תור' },
    { id: 'lost', title: 'אבוד' }
  ];


  const selectedLeadCommunications = (leadCommunications || [])
    .filter(item => item.lead_id === selectedLead?.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatWhatsAppPhone = (phone) => {
    const clean = String(phone || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.startsWith('972')) return clean;
    if (clean.startsWith('0')) return `972${clean.slice(1)}`;
    return clean;
  };

  const getCommunicationTypeLabel = (type) => {
    const labels = {
      call: 'שיחה',
      whatsapp: 'WhatsApp',
      email: 'מייל',
      note: 'הערה'
    };
    return labels[type] || type;
  };

  // Sources & Campaigns lists for filter
  const sourcesList = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));
  const campaignsList = Array.from(new Set(leads.map(l => l.campaign).filter(Boolean)));

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      (lead.full_name && lead.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.phone && lead.phone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesCampaign = campaignFilter === 'all' || lead.campaign === campaignFilter;
    return matchesSearch && matchesSource && matchesCampaign;
  });

  const handleCreateLead = async (e) => {
    e.preventDefault();

    if (!newLeadName.trim()) {
      showToast('אנא הזן שם מלא', 'error');
      return;
    }

    if (!newLeadPhone.trim() && !newLeadEmail.trim()) {
      showToast('יש להזין לפחות טלפון או דוא״ל', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addLead({
        full_name: newLeadName.trim(),
        phone: newLeadPhone.trim() || null,
        email: newLeadEmail.trim() || null,
        source: newLeadSource,
        campaign: newLeadCampaign.trim() || 'General Inquiries',
        status: 'new'
      });

      if (result?._existing) {
        showToast('הליד כבר קיים במערכת', 'info');
        setSelectedLead(result);
      } else {
        showToast('הליד נוצר בהצלחה');
      }

      setIsAddDrawerOpen(false);
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadCampaign('General Inquiries');
    } catch (err) {
      showToast(err.message || 'שגיאה ביצירת הליד', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteModalLead) return;
    try {
      await deleteLead(deleteModalLead.id);
      if (selectedLead?.id === deleteModalLead.id) setSelectedLead(null);
      showToast('הליד הועבר לאשפה');
    } catch (err) {
      showToast(err.message || 'לא ניתן להעביר את הליד לאשפה', 'error');
    } finally {
      setDeleteModalLead(null);
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    if (newStatus === 'lost') {
      setLostModalLead(lead);
      return;
    }
    try {
      await updateLeadStatus(lead.id, newStatus);
      showToast('סטטוס הליד עודכן');
      if (selectedLead?.id === lead.id) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast('שגיאה בעדכון הסטטוס', 'error');
    }
  };

  const handleConfirmLost = async (reason) => {
    if (!lostModalLead) return;
    try {
      await updateLeadStatus(lostModalLead.id, 'lost');
      await updateLeadFollowUp(lostModalLead.id, lostModalLead.follow_up_date, reason || 'לא מצוין');
      showToast('הליד עודכן כאבוד');
      if (selectedLead?.id === lostModalLead.id) {
        setSelectedLead(prev => ({ ...prev, status: 'lost', lost_reason: reason }));
      }
    } catch (err) {
      showToast('שגיאה בעדכון סיבת אובדן', 'error');
    } finally {
      setLostModalLead(null);
    }
  };

  const handleLogComm = async (e) => {
    e.preventDefault();
    if (!selectedLead || !commNote.trim()) return;
    try {
      await addLeadCommunication(selectedLead.id, commType, commNote.trim());
      showToast('תיעוד תקשורת נשמר');
      setCommNote('');
    } catch (err) {
      showToast('שגיאה בשמירת תיעוד', 'error');
    }
  };


  const handleFollowUpChange = async (value) => {
    if (!selectedLead) return;
    const previousValue = selectedLead.follow_up_date || '';
    setSelectedLead(prev => ({ ...prev, follow_up_date: value || null }));

    try {
      await updateLeadFollowUp(
        selectedLead.id,
        value || null,
        selectedLead.lost_reason || null
      );
      showToast(value ? 'תאריך המעקב עודכן' : 'תאריך המעקב הוסר');
    } catch (err) {
      setSelectedLead(prev => ({ ...prev, follow_up_date: previousValue || null }));
      showToast('שגיאה בעדכון תאריך המעקב', 'error');
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, טלפון או אימייל..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">כל המקורות</option>
            {sourcesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">כל הקמפיינים</option>
            {campaignsList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ליד חדש</span>
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1220px] grid-cols-5 gap-3 items-start">
        {statusColumns.map(col => {
          const colLeads = filteredLeads.filter(l => l.status === col.id);

          return (
            <div key={col.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 min-h-[400px]">
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">{col.title}</span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-2">
                {colLeads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      if (onSelectLead) onSelectLead(lead);
                      setSelectedLead(lead);
                    }}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 space-y-2 cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-400 transition-colors">
                        {lead.full_name}
                      </h4>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      {lead.source && (
                        <div>
                          <span>{lead.source}</span>
                          {lead.campaign && <span> · {lead.campaign}</span>}
                        </div>
                      )}
                      {lead.phone ? (
                        <div className="font-mono text-slate-700 dir-ltr text-right">{lead.phone}</div>
                      ) : lead.email ? (
                        <div className="truncate text-slate-700 dir-ltr text-right">{lead.email}</div>
                      ) : null}
                      {lead.follow_up_date && (
                        <div className={`font-medium ${
                          lead.follow_up_date < todayKey && !['lost', 'won'].includes(lead.status)
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}>
                          {lead.follow_up_date < todayKey && !['lost', 'won'].includes(lead.status)
                            ? 'מעקב באיחור: '
                            : 'חזרה: '}
                          {lead.follow_up_date}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-600">
                    אין לידים בסטטוס זה
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {selectedLead && (
        <div className="fixed bottom-6 end-6 z-[70]">
          <button type="button" onClick={() => setDeleteModalLead(selectedLead)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-lg hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> העבר ליד לאשפה
          </button>
        </div>
      )}

      {/* Add Lead Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="הוספת ליד חדש"
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateLead}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור ליד'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">שם מלא *</label>
            <input
              type="text"
              required
              value={newLeadName}
              onChange={e => setNewLeadName(e.target.value)}
              placeholder="ישראל ישראלי"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">טלפון</label>
            <input
              type="tel"
              value={newLeadPhone}
              onChange={e => setNewLeadPhone(e.target.value)}
              placeholder="050-0000000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 dir-ltr text-left focus:outline-none focus:border-violet-500"
            />
          </div>

          <p className="text-[11px] text-slate-500">יש להזין לפחות טלפון או דוא״ל.</p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">דוא״ל</label>
            <input
              type="email"
              value={newLeadEmail}
              onChange={e => setNewLeadEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 dir-ltr text-left focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">מקור פנייה</label>
            <select
              value={newLeadSource}
              onChange={e => setNewLeadSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Website">Website</option>
              <option value="Referral">המלצה</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Direct">ישיר</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">קמפיין</label>
            <input
              type="text"
              value={newLeadCampaign}
              onChange={e => setNewLeadCampaign(e.target.value)}
              placeholder="שם קמפיין / Pre-Launch"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
            />
          </div>
        </form>
      </Drawer>

      {/* Selected Lead Detail Drawer */}
      {selectedLead && (
        <Drawer
          isOpen={Boolean(selectedLead)}
          onClose={() => setSelectedLead(null)}
          title={`כרטיס ליד: ${selectedLead.full_name}`}
          width="max-w-xl"
        >
          <div className="space-y-6">
            {/* Quick Action Bar */}
            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-2 rounded-xl border border-slate-200">
              {selectedLead.phone && (
                <>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1 space-x-reverse"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>התקשר</span>
                  </a>
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(selectedLead.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1 space-x-reverse"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}
              {selectedLead.email && (
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1 space-x-reverse"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>מייל</span>
                </a>
              )}
            </div>

            {/* Editable Status */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">סטטוס פנייה</label>
              <select
                value={selectedLead.status || 'new'}
                onChange={e => handleStatusChange(selectedLead, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {statusColumns.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Lead Metadata */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">פרטי פנייה</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">שם: </span>
                  <span className="text-slate-900 font-medium">{selectedLead.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">טלפון: </span>
                  <span className="text-slate-900 font-mono dir-ltr inline-block">{selectedLead.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">דוא״ל: </span>
                  <span className="text-slate-900 font-medium dir-ltr inline-block">{selectedLead.email || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">מקור: </span>
                  <span className="text-slate-900 font-medium">{selectedLead.source || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">קמפיין: </span>
                  <span className="text-slate-900 font-medium">{selectedLead.campaign || '-'}</span>
                </div>
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">תאריך חזרה למעקב</label>
              <input
                type="date"
                value={selectedLead.follow_up_date || ''}
                onChange={e => handleFollowUpChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {/* Log Communication */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700">תיעוד תקשורת</h4>
              <form onSubmit={handleLogComm} className="space-y-2">
                <div className="flex space-x-2 space-x-reverse">
                  <select
                    value={commType}
                    onChange={e => setCommType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                  >
                    <option value="call">שיחה</option>
                    <option value="whatsapp">ווטסאפ</option>
                    <option value="email">מייל</option>
                    <option value="note">הערה</option>
                  </select>
                  <input
                    type="text"
                    placeholder="תיעוד סיכום שיחה..."
                    value={commNote}
                    onChange={e => setCommNote(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    שמור
                  </button>
                </div>
              </form>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-slate-600">היסטוריית תקשורת</h5>
                  <span className="text-[10px] text-slate-400">{selectedLeadCommunications.length} רשומות</span>
                </div>

                {selectedLeadCommunications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                    עדיין אין תיעוד תקשורת.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLeadCommunications.map(item => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold text-slate-600">
                            {getCommunicationTypeLabel(item.type)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.created_at ? new Date(item.created_at).toLocaleString('he-IL') : ''}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700">{item.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Lost Reason Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(lostModalLead)}
        onClose={() => setLostModalLead(null)}
        onConfirm={handleConfirmLost}
        title="סיבת אובדן ליד"
        confirmText="עדכן כאבוד"
        inputField={{
          label: "אנא ציין סיבה לאובדן הליד (למשל: מחיר, לא ענה, עבר מקום):",
          placeholder: "סיבת אובדן...",
          required: true
        }}
      />
      <ConfirmModal
        isOpen={Boolean(deleteModalLead)}
        onClose={() => setDeleteModalLead(null)}
        onConfirm={handleDeleteLead}
        title="העברת ליד לאשפה"
        message={deleteModalLead ? `להעביר את ${deleteModalLead.full_name || 'הליד'} לאשפה? ניתן לשחזר אותו ממסך האשפה.` : ''}
        confirmText="העבר לאשפה"
      />
    </div>
  );
}
