import React, { useState, useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';

const ClientDetailDrawer = ({ item, type = 'patient', onClose }) => {
  const { showToast } = useToast();
  const { 
    people, patients, leads, appointments, payments, tasks, 
    forms, formSubmissions, leadCommunications, services, patientPackages,
    addPatient, updatePatient, addClinicalNote, addPatientDocument, 
    addLeadCommunication, updateLeadFollowUp, updateLeadStatus, addTask, updateTaskStatus,
    getServiceName, issuePackageToPatient
  } = useContext(ClinicContext);

  const { t } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('overview');

  // Resolve Canonical Person
  const person = useMemo(() => {
    if (!item) return null;
    if (item.person_id) {
      return people.find(p => p.id === item.person_id) || item;
    }
    if (type === 'patient') {
      const patient = patients.find(p => p.id === item.id);
      if (patient?.person_id) return people.find(p => p.id === patient.person_id) || item;
    }
    if (type === 'lead') {
      const lead = leads.find(l => l.id === item.id);
      if (lead?.person_id) return people.find(p => p.id === lead.person_id) || item;
    }
    return people.find(p => p.id === item.id) || item;
  }, [item, type, people, patients, leads]);

  // Resolve Associated Records
  const personId = person?.id;
  const patient = useMemo(() => patients.find(p => p.person_id === personId || p.id === item?.id), [patients, personId, item]);
  const lead = useMemo(() => leads.find(l => l.person_id === personId || l.id === item?.id), [leads, personId, item]);

  // Linked Activity & Financial Data
  const clientAppointments = useMemo(() => {
    if (!personId && !patient?.id) return [];
    return appointments.filter(a => a.person_id === personId || (patient && a.patient_id === patient.id));
  }, [appointments, personId, patient]);

  const clientPayments = useMemo(() => {
    if (!personId && !patient?.id) return [];
    return payments.filter(p => p.person_id === personId || (patient && p.patient_id === patient.id));
  }, [payments, personId, patient]);

  const clientTasks = useMemo(() => {
    if (!personId && !patient?.id) return [];
    return tasks.filter(t => t.person_id === personId || (patient && t.patient_id === patient.id));
  }, [tasks, personId, patient]);

  const clientCommunications = useMemo(() => {
    const leadId = lead?.id;
    return leadCommunications.filter(c => (leadId && c.lead_id === leadId) || (personId && c.person_id === personId));
  }, [leadCommunications, lead, personId]);

  const clientSubmissions = useMemo(() => {
    return formSubmissions.filter(s => s.person_id === personId || (patient && s.patient_id === patient.id) || (lead && s.lead_id === lead.id));
  }, [formSubmissions, personId, patient, lead]);

  const activePkgs = useMemo(() => {
    if (!patient?.id && !personId) return [];
    return patientPackages.filter(p => p.patient_id === patient?.id || p.person_id === personId);
  }, [patientPackages, patient, personId]);

  // Derived V1 Summary Cards
  const totalPaidRevenue = useMemo(() => {
    return clientPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [clientPayments]);

  const completedSessionsCount = useMemo(() => {
    return clientAppointments.filter(a => a.status === 'completed').length;
  }, [clientAppointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = clientAppointments
      .filter(a => a.status !== 'cancelled' && new Date(a.appointment_date) > now)
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    return upcoming[0] || null;
  }, [clientAppointments]);

  // Next Action calculation
  const nextAction = useMemo(() => {
    const nowZero = new Date(new Date().setHours(0,0,0,0));
    const incompleteTask = clientTasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31'))[0];

    if (incompleteTask) {
      const dueDate = incompleteTask.due_date ? new Date(incompleteTask.due_date) : null;
      const isOverdue = dueDate && dueDate < nowZero;
      return {
        type: 'task',
        title: incompleteTask.title,
        date: incompleteTask.due_date,
        isOverdue,
        id: incompleteTask.id
      };
    }

    if (lead?.follow_up_date) {
      const fDate = new Date(lead.follow_up_date);
      const isOverdue = fDate < nowZero;
      return {
        type: 'followup',
        title: t('Follow-up Call', 'שיחת מעקב מתוכננת'),
        date: lead.follow_up_date,
        isOverdue
      };
    }

    return null;
  }, [clientTasks, lead, t]);

  // State Forms
  const [noteMode, setNoteMode] = useState('soap');
  const [simpleNoteText, setSimpleNoteText] = useState('');
  const [soapForm, setSoapForm] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
  const [newDocName, setNewDocName] = useState('');
  const [commType, setCommType] = useState('call');
  const [commNote, setCommNote] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [followUpDateInput, setFollowUpDateInput] = useState(lead?.follow_up_date || '');
  const [lostReasonInput, setLostReasonInput] = useState(lead?.lost_reason || '');

  if (!item || !person) return null;

  const name = person.full_name || 'לא צוין שם';
  const phone = person.phone || '-';
  const email = person.email || '-';
  const source = person.source || 'Website';
  const clientStatus = person.client_status || (patient ? 'customer' : 'lead');

  // Format phone for WhatsApp link
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedWaPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(`שלום ${name}, פניתי אלייך ממרפאת Clinify`)}`;

  // Handlers
  const handleCreateClinicalProfile = async () => {
    try {
      await addPatient({ full_name: name, phone, email, source, status: 'active' });
      setActiveTab('clinical');
      showToast('תיק רפואי נפתח בהצלחה!');
    } catch (err) {
      showToast(err.message || 'שגיאה ביצירת תיק רפואי', 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!patient) return;
    let noteContent = '';

    if (noteMode === 'soap') {
      if (!soapForm.subjective && !soapForm.objective && !soapForm.assessment && !soapForm.plan) {
        showToast('אנא מלא לפחות סעיף אחד בטופס ה-SOAP.', 'error');
        return;
      }
      noteContent = JSON.stringify({
        isSoap: true,
        subjective: soapForm.subjective,
        objective: soapForm.objective,
        assessment: soapForm.assessment,
        plan: soapForm.plan
      });
    } else {
      if (!simpleNoteText.trim()) return;
      noteContent = simpleNoteText.trim();
    }

    await addClinicalNote(patient.id, noteContent);
    showToast('הערה נשמרה בהצלחה!');
    setSimpleNoteText('');
    setSoapForm({ subjective: '', objective: '', assessment: '', plan: '' });
  };

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!patient || !newDocName.trim()) return;
    await addPatientDocument(patient.id, newDocName.trim());
    showToast('מסמך נוסף בהצלחה!');
    setNewDocName('');
  };

  const handleAddComm = async (e) => {
    e.preventDefault();
    if (!commNote.trim()) return;
    const targetLeadId = lead?.id || personId;
    await addLeadCommunication(targetLeadId, commType, commNote.trim());
    showToast('תיעוד תקשורת נשמר!');
    setCommNote('');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addTask({
      person_id: personId,
      patient_id: patient?.id,
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || new Date().toISOString().split('T')[0],
      status: 'todo',
      priority: 'medium'
    });
    showToast('משימה נוצרה בהצלחה!');
    setNewTaskTitle('');
    setNewTaskDueDate('');
  };

  const handleSaveFollowUp = async () => {
    if (lead) {
      await updateLeadFollowUp(lead.id, followUpDateInput || null, lostReasonInput || null);
      showToast('פרטי מעקב עודכנו בהצלחה!');
    }
  };

  const handleQuickIssuePackage = () => {
    if (!patient) return;
    const packageItems = services.filter(s => s.type === 'package');
    if (packageItems.length === 0) {
      showToast('אין כרטיסיות מוגדרות בקטלוג.', 'error');
      return;
    }
    issuePackageToPatient(patient.id, packageItems[0]);
    showToast('הכרטיסייה הונפקה בהצלחה!');
  };

  const renderNoteContent = (noteContent) => {
    try {
      const parsed = JSON.parse(noteContent);
      if (parsed && parsed.isSoap) {
        return (
          <div className="space-y-3 pt-1">
            {parsed.subjective && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 me-2">S - Subjective</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.subjective}</p>
              </div>
            )}
            {parsed.objective && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 me-2">O - Objective</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.objective}</p>
              </div>
            )}
            {parsed.assessment && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 me-2">A - Assessment</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.assessment}</p>
              </div>
            )}
            {parsed.plan && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 me-2">P - Plan</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.plan}</p>
              </div>
            )}
          </div>
        );
      }
    } catch (e) {}
    return <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">{noteContent}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-start">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex ps-10">
        <div className="w-screen max-w-3xl bg-white shadow-lg border-s border-slate-100 flex flex-col animate-in slide-in-from-end duration-300">
          
          {/* Header */}
          <div className="p-6 bg-white text-slate-900 relative overflow-hidden shrink-0">
            <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl font-bold text-slate-900 shadow-lg border border-white/20">
                  {name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      clientStatus === 'customer' 
                        ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                    }`}>
                      {clientStatus === 'customer' ? t('Customer', 'לקוח משלם') : t('Lead', 'ליד / פוטנציאלי')}
                    </span>

                    {lead?.status && (
                      <span className="text-xs font-semibold text-violet-300 bg-violet-500/20 px-2.5 py-0.5 rounded-full border border-violet-500/30 uppercase tracking-wider">
                        {t('Stage', 'שלב')}: {lead.status}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-medium">
                      {t('Source', 'מקור')}: {source}
                    </span>

                    {person.customer_since && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {t('Customer Since', 'לקוח מ-')}: {new Date(person.customer_since).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-700 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
                >
                  🟢 WhatsApp
                </a>
                <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors p-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-700">
              <span dir="ltr">📞 {phone}</span>
              {email !== '-' && <span dir="ltr">✉ {email}</span>}
            </div>
          </div>

          {/* V1 Summary Cards Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Paid Revenue', 'סה"כ הכנסות')}</p>
              <p className="text-base font-extrabold text-emerald-600 mt-0.5">₪{totalPaidRevenue.toLocaleString()}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Completed Sessions', 'פגישות שהושלמו')}</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{completedSessionsCount}</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Next Appointment', 'תור קרוב')}</p>
              <p className="text-xs font-bold text-indigo-600 mt-1 truncate">
                {nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleDateString() : t('None Scheduled', 'אין תור קרוב')}
              </p>
            </div>

            <div className={`bg-white p-3 rounded-2xl border shadow-2xs ${nextAction?.isOverdue ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200/60'}`}>
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Next Action', 'פעולה הבאה')}</p>
                {nextAction?.isOverdue && <span className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.2 rounded">{t('Overdue', 'באיחור')}</span>}
              </div>
              <p className={`text-xs font-bold mt-1 truncate ${nextAction?.isOverdue ? 'text-rose-700' : 'text-slate-800'}`}>
                {nextAction ? `${nextAction.title} (${nextAction.date || ''})` : t('No Action Set', 'ללא יעד מעקב')}
              </p>
            </div>
          </div>

          {/* Client 360 Tab Navigation */}
          <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto shrink-0 scrollbar-none">
            {[
              { id: 'overview', label: t('Overview', 'סקירה כללית') },
              { id: 'appointments', label: `${t('Appointments', 'תורים')} (${clientAppointments.length})` },
              { id: 'payments', label: `${t('Payments', 'תשלומים')} (${clientPayments.length})` },
              { id: 'tasks', label: `${t('Tasks & Follow-up', 'משימות ומעקב')} (${clientTasks.length})` },
              { id: 'communications', label: `${t('Communications', 'תקשורת')} (${clientCommunications.length})` },
              { id: 'forms', label: `${t('Forms', 'טפסים')} (${clientSubmissions.length})` },
              { id: 'clinical', label: `${t('Clinical Profile', 'תיק רפואי')}${patient ? '' : ' ⚠'}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    {t('Identity & Relationship Overview', 'פרטי זהות וסטטוס קשר')}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="text-slate-500 font-semibold">{t('Full Name', 'שם מלא')}:</span> <p className="font-bold text-slate-800">{name}</p></div>
                    <div><span className="text-slate-500 font-semibold">{t('Phone', 'טלפון')}:</span> <p className="font-bold text-slate-800" dir="ltr">{phone}</p></div>
                    <div><span className="text-slate-500 font-semibold">{t('Email', 'אימייל')}:</span> <p className="font-bold text-slate-800" dir="ltr">{email}</p></div>
                    <div><span className="text-slate-500 font-semibold">{t('Source', 'מקור הגעה')}:</span> <p className="font-bold text-slate-800">{source}</p></div>
                    <div><span className="text-slate-500 font-semibold">{t('Relationship Status', 'סטטוס קשר')}:</span> <p className="font-bold text-emerald-600">{clientStatus}</p></div>
                    <div><span className="text-slate-500 font-semibold">{t('Clinical Profile', 'תיק רפואי')}:</span> <p className="font-bold text-slate-800">{patient ? t('Active Profile', 'קיים במערכת') : t('None', 'טרם נפתח')}</p></div>
                  </div>
                </div>

                {!patient && (
                  <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-900">{t('No Clinical Profile Found', 'טרם נפתח תיק טיפולי רפואי')}</h4>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">{t('Open a clinical profile to manage SOAP notes, diagnoses, and medical documents without converting client status to customer.', 'פתח תיק טיפולי להוספת הערכות SOAP ומסמכים רפואיים מבלי לשנות את סטטוס הלקוח.')}</p>
                    </div>
                    <button 
                      onClick={handleCreateClinicalProfile}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      + {t('Create Clinical Profile', 'פתח תיק רפואי')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-extrabold text-sm text-slate-800">{t('Appointment History', 'היסטוריית תורים')}</h4>
                </div>

                {clientAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                    {t('No appointments recorded yet.', 'אין תורים רשומים עבור מטופל זה.')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientAppointments.map(appt => (
                      <div key={appt.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex justify-between items-center gap-4">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{getServiceName(appt.service_id) || t('General Consultation', 'פגישת ייעוץ')}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">📅 {new Date(appt.appointment_date).toLocaleString('he-IL')}</p>
                          {appt.notes && <p className="text-[11px] text-slate-500 italic mt-1">{appt.notes}</p>}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                          appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          appt.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-extrabold text-sm text-slate-800">{t('Payment Ledger', 'יומן תשלומים והכנסות')}</h4>
                  {patient && (
                    <button 
                      onClick={handleQuickIssuePackage}
                      className="text-xs font-extrabold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl border border-violet-200 transition-colors"
                    >
                      + {t('Issue Punch-Card Package', 'הנפק כרטיסיית טיפולים')}
                    </button>
                  )}
                </div>

                {/* Packages List */}
                {activePkgs.length > 0 && (
                  <div className="p-4 bg-violet-50/60 border border-violet-200 rounded-2xl space-y-2 mb-4">
                    <h5 className="font-bold text-xs text-violet-900">{t('Active Packages', 'כרטיסיות טיפול פעילות')}</h5>
                    {activePkgs.map(pkg => (
                      <div key={pkg.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-violet-100">
                        <div>
                          <p className="font-bold text-slate-800">{pkg.name}</p>
                          <p className="text-[10px] text-slate-500">{t('Purchased', 'נרכשה ב-')}: {pkg.purchased_date}</p>
                        </div>
                        <span className="font-extrabold text-violet-700 bg-violet-100 px-2.5 py-1 rounded-lg">
                          {pkg.remaining_sessions} / {pkg.total_sessions} {t('sessions left', 'טיפולים נותרו')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {clientPayments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                    {t('No payment records found.', 'אין תשלומים רשומים.')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientPayments.map(p => (
                      <div key={p.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{p.description || t('Payment Transaction', 'עסקת תשלום')}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{new Date(p.payment_date).toLocaleDateString()} • {p.payment_method}</p>
                        </div>
                        <div className="text-end">
                          <p className="font-extrabold text-sm text-emerald-600">₪{parseFloat(p.amount).toLocaleString()}</p>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TASKS & FOLLOW-UP */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {/* Follow up & Lost Reason config if Lead exists */}
                {lead && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h5 className="font-extrabold text-xs text-slate-800">{t('Lead Follow-up Settings', 'הגדרות מעקב ליד')}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Follow-up Date', 'תאריך מעקב (Follow-up)')}</label>
                        <input 
                          type="date"
                          value={followUpDateInput}
                          onChange={(e) => setFollowUpDateInput(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Lost Reason (if Lost)', 'סיבת אובדן (במידה ואבוד)')}</label>
                        <input 
                          type="text"
                          placeholder={t('Price, location, changed mind...', 'מחיר, מיקום, חוסר מענה...')}
                          value={lostReasonInput}
                          onChange={(e) => setLostReasonInput(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveFollowUp}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {t('Save Follow-up Details', 'שמור פרטי מעקב')}
                    </button>
                  </div>
                )}

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="font-extrabold text-xs text-slate-800">+ {t('Add Task / Action Item', 'הוספת משימת המשך')}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input 
                      type="text"
                      required
                      placeholder={t('Task description...', 'תיאור המשימה...')}
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                    />
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button type="submit" className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer">
                    {t('Add Task', 'הוסף משימה')}
                  </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-700">{t('Linked Tasks', 'משימות משויכות')}</h4>
                  {clientTasks.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">{t('No tasks linked to this person.', 'אין משימות פתוחות.')}</p>
                  ) : (
                    clientTasks.map(task => (
                      <div key={task.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'done'}
                            onChange={(e) => updateTaskStatus(task.id, e.target.checked ? 'done' : 'todo')}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={`font-semibold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-800'}`}>{task.title}</span>
                        </div>
                        {task.due_date && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{task.due_date}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: COMMUNICATIONS */}
            {activeTab === 'communications' && (
              <div className="space-y-6">
                {/* Form to Log Communication */}
                <form onSubmit={handleAddComm} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="font-extrabold text-xs text-slate-800">+ {t('Log Communication / Touchpoint', 'תיעוד התקשרות חדשה')}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select 
                      value={commType} 
                      onChange={(e) => setCommType(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                    >
                      <option value="call">📞 {t('Phone Call', 'שיחת טלפון')}</option>
                      <option value="whatsapp">🟢 WhatsApp</option>
                      <option value="email">✉ {t('Email', 'אימייל')}</option>
                    </select>
                    <input 
                      type="text"
                      required
                      placeholder={t('Notes/Summary of conversation...', 'סיכום הדברים שנאמרו...')}
                      value={commNote}
                      onChange={(e) => setCommNote(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer">
                    {t('Save Entry', 'שמור תיעוד')}
                  </button>
                </form>

                {/* Communication History Timeline */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-700">{t('Communication Log', 'יומן תקשורת')}</h4>
                  {clientCommunications.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">{t('No communications logged yet.', 'אין תיעודי תקשורת רשומים.')}</p>
                  ) : (
                    clientCommunications.map(comm => (
                      <div key={comm.id} className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800 uppercase">
                            {comm.type === 'whatsapp' ? '🟢 WhatsApp' : comm.type === 'call' ? '📞 Phone Call' : '✉ Email'}
                          </span>
                          <span className="text-slate-500 text-[10px]">{new Date(comm.created_at).toLocaleString('he-IL')}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">{comm.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: FORMS */}
            {activeTab === 'forms' && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800">{t('Submitted Forms & Intake Questionnaires', 'טפסי קבלה והצהרות שהוגשו')}</h4>
                {clientSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-200 rounded-2xl">
                    {t('No form submissions recorded for this person.', 'אין טפסים שהוגשו על ידי מגיש זה.')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientSubmissions.map(sub => {
                      const formObj = forms.find(f => f.id === sub.form_id);
                      return (
                        <div key={sub.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-xs text-slate-800">{formObj?.title || t('Intake Form', 'טופס קבלה')}</h5>
                            <span className="text-[10px] text-slate-500">{new Date(sub.submitted_at).toLocaleString('he-IL')}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                            {Object.entries(sub.responses || {}).map(([k, v]) => (
                              <div key={k} className="flex justify-between border-b border-slate-100 last:border-0 py-0.5">
                                <span className="font-semibold text-slate-500">{k}:</span>
                                <span className="font-bold text-slate-800">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: CLINICAL PROFILE */}
            {activeTab === 'clinical' && (
              <div className="space-y-6">
                {!patient ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      📋
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-slate-800">{t('No Clinical Profile Active', 'טרם נפתח תיק טיפולי')}</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                        {t('Creating a clinical profile enables clinical notes, SOAP documentation, and medical attachment uploads.', 'פתיחת תיק טיפולי מאפשרת הוספת תרשומות SOAP ומסמכים רפואיים.')}
                      </p>
                    </div>
                    <button 
                      onClick={handleCreateClinicalProfile}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      + {t('Create Clinical Profile Now', 'פתח תיק טיפולי כעת')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* SOAP / Simple Note Form */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-extrabold text-xs text-slate-800">+ {t('Add Clinical Entry / Note', 'הוספת תרשומת רפואית')}</h4>
                        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                          <button 
                            onClick={() => setNoteMode('soap')} 
                            className={`px-2.5 py-1 rounded-md transition-colors ${noteMode === 'soap' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
                          >
                            SOAP Form
                          </button>
                          <button 
                            onClick={() => setNoteMode('simple')} 
                            className={`px-2.5 py-1 rounded-md transition-colors ${noteMode === 'simple' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'}`}
                          >
                            Simple Text
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleAddNote} className="space-y-3">
                        {noteMode === 'soap' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">S - Subjective (תלונה/תיאור)</label>
                              <textarea rows={2} value={soapForm.subjective} onChange={e => setSoapForm({...soapForm, subjective: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">O - Objective (ממצאים/בדיקה)</label>
                              <textarea rows={2} value={soapForm.objective} onChange={e => setSoapForm({...soapForm, objective: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">A - Assessment (אבחון/הערכה)</label>
                              <textarea rows={2} value={soapForm.assessment} onChange={e => setSoapForm({...soapForm, assessment: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-amber-600 uppercase mb-1">P - Plan (תוכנית המשך)</label>
                              <textarea rows={2} value={soapForm.plan} onChange={e => setSoapForm({...soapForm, plan: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none" />
                            </div>
                          </div>
                        ) : (
                          <textarea 
                            rows={3} 
                            placeholder={t('Enter note content...', 'הזן את תרשומת הטיפול...')} 
                            value={simpleNoteText} 
                            onChange={e => setSimpleNoteText(e.target.value)} 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" 
                          />
                        )}

                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer">
                          {t('Save Note', 'שמור תרשומת')}
                        </button>
                      </form>
                    </div>

                    {/* Clinical Notes List */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-700">{t('Clinical Notes History', 'היסטוריית תרשומות טיפול')}</h4>
                      {(!patient.clinical_notes || patient.clinical_notes.length === 0) ? (
                        <p className="text-xs text-slate-500 italic text-center py-4">{t('No clinical notes recorded yet.', 'אין תרשומות רפואיות.')}</p>
                      ) : (
                        patient.clinical_notes.map(note => (
                          <div key={note.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="font-bold text-slate-700">{note.author || 'מטפל'}</span>
                              <span>{new Date(note.created_at).toLocaleString('he-IL')}</span>
                            </div>
                            {renderNoteContent(note.content)}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Documents Upload Section */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-800">{t('Medical Documents & Attachments', 'מסמכים וקבצים מצורפים')}</h4>
                      <form onSubmit={handleAddDoc} className="flex gap-2">
                        <input 
                          type="text"
                          required
                          placeholder={t('Document title / filename...', 'שם הקובץ/מסמך...')}
                          value={newDocName}
                          onChange={e => setNewDocName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                        />
                        <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-white text-slate-900 font-extrabold text-xs rounded-xl cursor-pointer">
                          + {t('Add Doc', 'הוסף קובץ')}
                        </button>
                      </form>

                      <div className="space-y-2">
                        {(patient.documents || []).map(doc => (
                          <div key={doc.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">📄 {doc.name}</span>
                            <span className="text-[10px] text-slate-500">{doc.uploaded_at}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailDrawer;
