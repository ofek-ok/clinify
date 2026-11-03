import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { Trash2, Search, Plus, Phone, MessageSquare, Mail, Activity, Tag, FileText, CheckCircle2, ChevronDown, Calendar } from 'lucide-react';
import { useToast } from './ui/Toast';

export const TOPIC_OPTIONS = [
  { id: 'פציעת ספורט', label: 'פציעת ספורט / אימון', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'כאבי גב וצוואר', label: 'כאבי גב, צוואר או כתפיים', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'עומס משרדי', label: 'עומס מישיבה וקריירה', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'תחזוקה והתאוששות', label: 'תחזוקה והתאוששות', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'שיפור תנועה', label: 'שיפור תנועה וביצועים', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' }
];

export function getPainLevelInfo(level, t = (en, he) => he) {
  if (level === null || level === undefined || level === '') return null;
  const num = Number(level);
  if (Number.isNaN(num)) return null;
  if (num <= 3) {
    return {
      num,
      label: `${t('Mild Load', 'עומס קל')} ${num}/10`,
      shortLabel: `${num}/10 ${t('Mild', 'קל')}`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      description: t('Mild load / regular maintenance — optimal time for release and injury prevention.', 'עומס קל / תחזוקה שוטפת — זמן מצוין לשחרור ומניעת פציעה.')
    };
  }
  if (num <= 6) {
    return {
      num,
      label: `${t('Moderate Pain', 'כאב בינוני')} ${num}/10`,
      shortLabel: `${num}/10 ${t('Moderate', 'בינוני')}`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      barColor: 'bg-amber-500',
      description: t('Moderate pain or tension — the body signals a need for targeted release.', 'כאב או עומס בינוני — הגוף מאותת שדורש שחרור וטיפול ממוקד.')
    };
  }
  return {
    num,
    label: `${t('Significant Pain', 'כאב חריף')} ${num}/10`,
    shortLabel: `${num}/10 ${t('Significant', 'חריף')}`,
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barColor: 'bg-rose-500',
    description: t('Significant pain limiting movement — requires clinical assessment and plan.', 'כאב משמעותי שמגביל תנועה — דורש אבחון והתאמת תוכנית טיפול.')
  };
}

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
  const { t } = useContext(LanguageContext);
  const todayKey = getIsraelDateKey();

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Lost Reason modal state
  const [lostModalLead, setLostModalLead] = useState(null);
  const [deleteModalLead, setDeleteModalLead] = useState(null);

  // New Lead form state
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadTopic, setNewLeadTopic] = useState('פציעת ספורט');
  const [newLeadPainLevel, setNewLeadPainLevel] = useState(null);
  const [newLeadNote, setNewLeadNote] = useState('');
  const [newLeadMarketingConsent, setNewLeadMarketingConsent] = useState(true);
  const [newLeadSource, setNewLeadSource] = useState('Website');
  const [newLeadCampaign, setNewLeadCampaign] = useState('performance_list');
  const [newLeadUtmSource, setNewLeadUtmSource] = useState('website');
  const [newLeadUtmMedium, setNewLeadUtmMedium] = useState('organic');
  const [showAdvancedUtm, setShowAdvancedUtm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Communication note state inside drawer
  const [commType, setCommType] = useState('call');
  const [commNote, setCommNote] = useState('');

  const statusColumns = [
    { id: 'new', title: t('New','חדש') },
    { id: 'contacted', title: t('Contacted','יצרנו קשר') },
    { id: 'qualified', title: t('Qualified','מתאים') },
    { id: 'scheduled', title: t('Scheduled','נקבע תור') },
    { id: 'lost', title: t('Lost','אבוד') }
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
      call: t('Call','שיחה'),
      whatsapp: 'WhatsApp',
      email: t('Email','מייל'),
      note: t('Note','הערה')
    };
    return labels[type] || type;
  };

  // Sources, Campaigns & Topics lists for filters
  const sourcesList = Array.from(new Set(leads.map(l => l.source).filter(Boolean)));
  const campaignsList = Array.from(new Set(leads.map(l => l.campaign).filter(Boolean)));
  const availableTopics = Array.from(new Set([
    ...TOPIC_OPTIONS.map(opt => opt.id),
    ...leads.map(l => l.topic).filter(Boolean)
  ]));

  const filteredLeads = leads.filter(lead => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (lead.full_name && lead.full_name.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.includes(searchTerm)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.topic && lead.topic.toLowerCase().includes(q)) ||
      (lead.note && lead.note.toLowerCase().includes(q)) ||
      (lead.campaign && lead.campaign.toLowerCase().includes(q));
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    const matchesCampaign = campaignFilter === 'all' || lead.campaign === campaignFilter;
    const matchesTopic = topicFilter === 'all' || lead.topic === topicFilter;
    return matchesSearch && matchesSource && matchesCampaign && matchesTopic;
  });

  const handleCreateLead = async (e) => {
    e.preventDefault();

    if (!newLeadName.trim()) {
      showToast(t('Please enter a full name', 'אנא הזן שם מלא'), 'error');
      return;
    }

    if (!newLeadPhone.trim() && !newLeadEmail.trim()) {
      showToast(t('Enter at least a phone number or email', 'יש להזין לפחות טלפון או דוא״ל'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addLead({
        full_name: newLeadName.trim(),
        phone: newLeadPhone.trim() || null,
        email: newLeadEmail.trim() || null,
        topic: newLeadTopic || null,
        pain_level: newLeadPainLevel,
        note: newLeadNote.trim() || null,
        marketing_consent: newLeadMarketingConsent,
        source: newLeadSource,
        campaign: newLeadCampaign.trim() || 'performance_list',
        utm_source: newLeadUtmSource || null,
        utm_medium: newLeadUtmMedium || null,
        utm_campaign: newLeadCampaign.trim() || null,
        status: 'new'
      });

      if (result?._existing) {
        showToast(t('This lead already exists', 'הליד כבר קיים במערכת'), 'info');
        setSelectedLead(result);
      } else {
        showToast(t('Lead created successfully', 'הליד נוצר בהצלחה'));
      }

      setIsAddDrawerOpen(false);
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadTopic('פציעת ספורט');
      setNewLeadPainLevel(null);
      setNewLeadNote('');
      setNewLeadMarketingConsent(true);
      setNewLeadSource('Website');
      setNewLeadCampaign('performance_list');
    } catch (err) {
      showToast(err.message || t('Error creating lead', 'שגיאה ביצירת הליד'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteModalLead) return;
    try {
      await deleteLead(deleteModalLead.id);
      if (selectedLead?.id === deleteModalLead.id) setSelectedLead(null);
      showToast(t('Lead moved to trash', 'הליד הועבר לאשפה'));
    } catch (err) {
      showToast(err.message || t('Could not move lead to trash', 'לא ניתן להעביר את הליד לאשפה'), 'error');
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
      showToast(t('Lead status updated', 'סטטוס הליד עודכן'));
      if (selectedLead?.id === lead.id) {
        setSelectedLead(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast(t('Error updating status', 'שגיאה בעדכון הסטטוס'), 'error');
    }
  };

  const handleConfirmLost = async (reason) => {
    if (!lostModalLead) return;
    try {
      await updateLeadStatus(lostModalLead.id, 'lost');
      await updateLeadFollowUp(lostModalLead.id, lostModalLead.follow_up_date, reason || t('Not specified','לא מצוין'));
      showToast(t('Lead marked as lost', 'הליד עודכן כאבוד'));
      if (selectedLead?.id === lostModalLead.id) {
        setSelectedLead(prev => ({ ...prev, status: 'lost', lost_reason: reason }));
      }
    } catch (err) {
      showToast(t('Error updating loss reason', 'שגיאה בעדכון סיבת אובדן'), 'error');
    } finally {
      setLostModalLead(null);
    }
  };

  const handleLogComm = async (e) => {
    e.preventDefault();
    if (!selectedLead || !commNote.trim()) return;
    try {
      await addLeadCommunication(selectedLead.id, commType, commNote.trim());
      showToast(t('Communication saved', 'תיעוד תקשורת נשמר'));
      setCommNote('');
    } catch (err) {
      showToast(t('Error saving communication', 'שגיאה בשמירת תיעוד'), 'error');
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
      showToast(value ? t('Follow-up date updated', 'תאריך המעקב עודכן') : t('Follow-up date removed', 'תאריך המעקב הוסר'));
    } catch (err) {
      setSelectedLead(prev => ({ ...prev, follow_up_date: previousValue || null }));
      showToast(t('Error updating follow-up', 'שגיאה בעדכון תאריך המעקב'), 'error');
    }
  };

  const selectedPainInfo = selectedLead ? getPainLevelInfo(selectedLead.pain_level, t) : null;

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder={t("Search by name, phone, topic, note...","חיפוש לפי שם, טלפון, תחום, הערה...")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Topic Filter */}
          <select
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">{t('All Topics','כל תחומי הפנייה')}</option>
            {availableTopics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">{t('All Sources','כל המקורות')}</option>
            {sourcesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Campaign Filter */}
          <select
            value={campaignFilter}
            onChange={e => setCampaignFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">{t('All Campaigns','כל הקמפיינים')}</option>
            {campaignsList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('New Lead','ליד חדש')}</span>
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
                {colLeads.map(lead => {
                  const painInfo = getPainLevelInfo(lead.pain_level, t);
                  const topicObj = TOPIC_OPTIONS.find(opt => opt.id === lead.topic);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => {
                        if (onSelectLead) onSelectLead(lead);
                        setSelectedLead(lead);
                      }}
                      className="bg-white border border-slate-200 hover:border-violet-300 rounded-xl p-3 space-y-2 cursor-pointer transition-all hover:shadow-md group"
                    >
                      {/* Name & Time */}
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition-colors truncate">
                          {lead.full_name}
                        </h4>
                        {lead.created_at && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {new Date(lead.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* Topic & Pain Level Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {lead.topic && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            topicObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {lead.topic}
                          </span>
                        )}
                        {painInfo && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${painInfo.badgeClass}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{painInfo.shortLabel}</span>
                          </span>
                        )}
                      </div>

                      {/* Note excerpt if provided */}
                      {lead.note && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          <span className="text-slate-400 font-bold ml-1">💬</span>
                          {lead.note}
                        </div>
                      )}

                      {/* Contact & Meta footer */}
                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          {lead.phone ? (
                            <div className="font-mono text-slate-700 dir-ltr text-right text-[11px]">{lead.phone}</div>
                          ) : lead.email ? (
                            <div className="truncate text-slate-700 dir-ltr text-right text-[11px]">{lead.email}</div>
                          ) : null}

                          {lead.source && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[110px]" title={lead.source}>
                              {lead.source} {lead.campaign ? `· ${lead.campaign}` : ''}
                            </span>
                          )}
                        </div>

                        {lead.follow_up_date && (
                          <div className={`font-medium text-[10px] flex items-center gap-1 ${
                            lead.follow_up_date < todayKey && !['lost', 'won'].includes(lead.status)
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {lead.follow_up_date < todayKey && !['lost', 'won'].includes(lead.status)
                              ? t('Overdue: ','מעקב באיחור: ')
                              : t('Follow-up: ','חזרה: ')}
                            {lead.follow_up_date}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colLeads.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400">
                    {t('No leads in this status','אין לידים בסטטוס זה')}
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
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 shadow-lg hover:bg-rose-50 cursor-pointer">
            <Trash2 className="h-4 w-4" /> {t('Move Lead to Trash','העבר ליד לאשפה')}
          </button>
        </div>
      )}

      {/* Add Lead Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={t("Add New Lead","הוספת ליד חדש")}
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100 cursor-pointer"
            >
              {t('Cancel','ביטול')}
            </button>
            <button
              onClick={handleCreateLead}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? t('Saving...','שומר...') : t('Save Lead','שמור ליד')}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-start font-sans">
          {/* Section: Contact info */}
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Contact Information','פרטי קשר וזיהוי')}</h5>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Full Name *','שם מלא *')}</label>
              <input
                type="text"
                required
                value={newLeadName}
                onChange={e => setNewLeadName(e.target.value)}
                placeholder={t("John Doe","ישראל ישראלי")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Phone *','טלפון *')}</label>
              <input
                type="tel"
                value={newLeadPhone}
                onChange={e => setNewLeadPhone(e.target.value)}
                placeholder="050-0000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 dir-ltr text-left focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Email','דוא״ל (רשות)')}</label>
              <input
                type="email"
                value={newLeadEmail}
                onChange={e => setNewLeadEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 dir-ltr text-left focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Section: Treatment & Health assessment */}
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <h5 className="text-xs font-bold text-violet-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              {t('Treatment & Health Assessment','פרטי פנייה ובריאות')}
            </h5>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Inquiry Topic / Reason','תחום הפנייה / סיבת הטיפול')}</label>
              <select
                value={newLeadTopic}
                onChange={e => setNewLeadTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {TOPIC_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Pain level selector 1-10 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">{t('Pain / Load Level (1-10)','מדד דרגת כאב / עומס (1–10)')}</label>
                <span className="text-[11px] font-bold text-violet-600">
                  {newLeadPainLevel ? `${newLeadPainLevel}/10` : t('None','לא צוין')}
                </span>
              </div>
              <div className="grid grid-cols-11 gap-1">
                <button
                  type="button"
                  onClick={() => setNewLeadPainLevel(null)}
                  className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    newLeadPainLevel === null 
                      ? 'bg-slate-700 text-white border-slate-700' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {t('None','ללא')}
                </button>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewLeadPainLevel(num)}
                    className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      newLeadPainLevel === num
                        ? num <= 3 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : num <= 6
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Additional Details / Note','פירוט נוסף או הערות הפונה')}</label>
              <textarea
                rows={3}
                value={newLeadNote}
                onChange={e => setNewLeadNote(e.target.value)}
                placeholder={t("e.g. sharp knee pain after running, bothersome when climbing stairs...","למשל: כאב חד בברך ימין לאחר ריצה, מפריע בעלייה במדרגות...")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newLeadMarketingConsent}
                onChange={e => setNewLeadMarketingConsent(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 bg-white border-slate-300 focus:ring-0 focus:outline-none cursor-pointer"
              />
              <span className="text-xs text-slate-700">{t('Consent to contact and receive updates','אישור יצירת קשר וקבלת עדכונים (Marketing Consent)')}</span>
            </label>
          </div>

          {/* Section: Attribution & UTM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Source & Campaign','נתוני מקור וקמפיין')}</h5>
              <button
                type="button"
                onClick={() => setShowAdvancedUtm(!showAdvancedUtm)}
                className="text-[11px] text-slate-500 hover:text-violet-600 flex items-center gap-1 cursor-pointer"
              >
                <span>{t('Advanced UTM Settings','הגדרות UTM מתקדמות')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedUtm ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('Lead Source','מקור פנייה')}</label>
                <select
                  value={newLeadSource}
                  onChange={e => setNewLeadSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Website">{t('Website','אתר (Website)')}</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Referral">{t('Referral','המלצה')}</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Direct">{t('Direct','ישיר')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('Campaign','קמפיין')}</label>
                <input
                  type="text"
                  value={newLeadCampaign}
                  onChange={e => setNewLeadCampaign(e.target.value)}
                  placeholder="performance_list"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {showAdvancedUtm && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">utm_source</label>
                  <input
                    type="text"
                    value={newLeadUtmSource}
                    onChange={e => setNewLeadUtmSource(e.target.value)}
                    placeholder="website / instagram / google"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">utm_medium</label>
                  <input
                    type="text"
                    value={newLeadUtmMedium}
                    onChange={e => setNewLeadUtmMedium(e.target.value)}
                    placeholder="organic / cpc / bio / story"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </Drawer>

      {/* Selected Lead Detail Drawer */}
      {selectedLead && (
        <Drawer
          isOpen={Boolean(selectedLead)}
          onClose={() => setSelectedLead(null)}
          title={`${t('Lead Card','כרטיס ליד')}: ${selectedLead.full_name}`}
          width="max-w-xl"
        >
          <div className="space-y-6 dir-rtl text-start font-sans">
            {/* Quick Action Bar */}
            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 p-2 rounded-xl border border-slate-200">
              {selectedLead.phone && (
                <>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="flex-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1.5 space-x-reverse border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t('Call','התקשר')}</span>
                  </a>
                  <a
                    href={`https://wa.me/${formatWhatsAppPhone(selectedLead.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-violet-700 hover:bg-violet-600 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1.5 space-x-reverse transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </>
              )}
              {selectedLead.email && (
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-900 text-xs font-medium py-2 rounded-lg flex items-center justify-center space-x-1.5 space-x-reverse border border-slate-200 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{t('Email','מייל')}</span>
                </a>
              )}
            </div>

            {/* Editable Status */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{t('Lead Status','סטטוס פנייה')}</label>
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

            {/* BLOCK 1: Treatment & Health Assessment */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  {t('Inquiry & Treatment Assessment','פרטי פנייה והערכת עומס')}
                </h4>
                {selectedLead.marketing_consent !== false && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('Consent Approved','אישור דיוור וקשר')}
                  </span>
                )}
              </div>

              {/* Topic badge */}
              {selectedLead.topic && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">{t('Inquiry Topic:','תחום הפנייה:')}</span>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border ${
                    TOPIC_OPTIONS.find(opt => opt.id === selectedLead.topic)?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedLead.topic}
                  </span>
                </div>
              )}

              {/* Pain level meter */}
              {selectedPainInfo ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{t('Pain / Load Level:','דרגת כאב / עומס:')}</span>
                    <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${selectedPainInfo.badgeClass}`}>
                      {selectedPainInfo.label}
                    </span>
                  </div>
                  {/* Progress meter bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-xs transition-all ${
                          i < selectedPainInfo.num
                            ? selectedPainInfo.barColor
                            : 'bg-slate-200/80'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    {selectedPainInfo.description}
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  {t('No pain level specified in the form.','לא הוזנה דרגת כאב בטופס.')}
                </div>
              )}

              {/* Note / complaint */}
              {selectedLead.note && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    {t('Visitor Note:','פירוט נוסף / הערות הפונה מהאתר:')}
                  </span>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedLead.note}
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 2: Attribution & UTM */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                {t('Attribution & Marketing (UTM)','נתוני מקור ושיווק (UTM / Tracking)')}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">{t('Source:','מקור: ')}</span>
                  <span className="text-slate-900 font-medium">{selectedLead.utm_source || selectedLead.source || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t('Medium:','מדיה: ')}</span>
                  <span className="text-slate-900 font-medium">{selectedLead.utm_medium || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t('Campaign:','קמפיין: ')}</span>
                  <span className="text-slate-900 font-medium">{selectedLead.utm_campaign || selectedLead.campaign || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t('Created At:','נוצר בתאריך: ')}</span>
                  <span className="text-slate-900 font-mono">
                    {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('he-IL') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCK 3: Contact Details & Follow-up */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-700">{t('Contact Details','פרטי קשר ומעקב')}</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">{t('Name:','שם מלא: ')}</span>
                  <span className="text-slate-900 font-medium">{selectedLead.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">{t('Phone:','טלפון: ')}</span>
                  <span className="text-slate-900 font-mono dir-ltr inline-block">{selectedLead.phone || '-'}</span>
                </div>
                {selectedLead.email && (
                  <div className="col-span-2">
                    <span className="text-slate-400">{t('Email:','אימייל: ')}</span>
                    <span className="text-slate-900 font-mono dir-ltr inline-block">{selectedLead.email}</span>
                  </div>
                )}
              </div>

              {/* Follow-up Date */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Follow-up Date','תאריך חזרה למעקב (Follow-up)')}</label>
                <input
                  type="date"
                  value={selectedLead.follow_up_date || ''}
                  onChange={e => handleFollowUpChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* BLOCK 4: Communication History & Logging */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-700">{t('Communication Log','תיעוד תקשורת')}</h4>
              <form onSubmit={handleLogComm} className="space-y-2">
                <div className="flex space-x-2 space-x-reverse">
                  <select
                    value={commType}
                    onChange={e => setCommType(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900"
                  >
                    <option value="call">{t('Call','שיחה')}</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">{t('Email','מייל')}</option>
                    <option value="note">{t('Note','הערה')}</option>
                  </select>
                  <input
                    type="text"
                    placeholder={t("Communication summary...","תיעוד סיכום שיחה...")}
                    value={commNote}
                    onChange={e => setCommNote(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="submit"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {t('Save','שמור')}
                  </button>
                </div>
              </form>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-slate-600">{t('Communication History','היסטוריית תקשורת')}</h5>
                  <span className="text-[10px] text-slate-400">{selectedLeadCommunications.length} {t('records','רשומות')}</span>
                </div>

                {selectedLeadCommunications.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                    {t('No communication history yet.','עדיין אין תיעוד תקשורת.')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLeadCommunications.map(item => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
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
        title={t("Lost Lead Reason","סיבת אובדן ליד")}
        confirmText={t("Mark as Lost","עדכן כאבוד")}
        inputField={{
          label: t("Please state why the lead was lost (e.g. price, no response, went elsewhere):","אנא ציין סיבה לאובדן הליד (למשל: מחיר, לא ענה, עבר מקום):"),
          placeholder: t("Loss reason...","סיבת אובדן..."),
          required: true
        }}
      />
      <ConfirmModal
        isOpen={Boolean(deleteModalLead)}
        onClose={() => setDeleteModalLead(null)}
        onConfirm={handleDeleteLead}
        title={t("Move Lead to Trash","העברת ליד לאשפה")}
        message={deleteModalLead ? t(`Move ${deleteModalLead.full_name || 'the lead'} to Trash? It can be restored from Trash.`, `להעביר את ${deleteModalLead.full_name || 'הליד'} לאשפה? ניתן לשחזר אותו ממסך האשפה.`) : ''}
        confirmText={t("Move to Trash","העבר לאשפה")}
      />
    </div>
  );
}
