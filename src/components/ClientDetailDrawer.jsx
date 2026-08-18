import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ClientDetailDrawer = ({ item, type = 'patient', onClose }) => {
  const { 
    updatePatient, addClinicalNote, addPatientDocument, 
    addLeadCommunication, updateLeadFollowUp, appointments, 
    services, getServiceName, t, patientPackages, redeemPackageSession, issuePackageToPatient
  } = useContext(ClinicContext);

  const [activeTab, setActiveTab] = useState('general');
  
  // Note Form State (Simple or SOAP mode)
  const [noteMode, setNoteMode] = useState('soap');
  const [simpleNoteText, setSimpleNoteText] = useState('');
  const [soapForm, setSoapForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  const [newDocName, setNewDocName] = useState('');
  const [newCommNote, setNewCommNote] = useState('');
  const [commType, setCommType] = useState('call');
  const [tagInput, setTagInput] = useState('');
  const [lostReasonInput, setLostReasonInput] = useState(item?.lost_reason || '');
  const [followUpDateInput, setFollowUpDateInput] = useState(item?.follow_up_date || '');

  if (!item) return null;

  const isPatient = type === 'patient';
  const name = item.full_name || item.name || 'לא צוין שם';
  const phone = item.phone || '-';
  const email = item.email || '-';
  const tags = item.tags || (isPatient ? ['VIP', 'טיפול משמר'] : ['מתעניין', 'פייסבוק']);

  // Patient active packages
  const activePkgs = patientPackages.filter(p => p.patient_id === item.id);

  // Format phone for WhatsApp link
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedWaPhone = cleanPhone.startsWith('0') ? '972' + cleanPhone.substring(1) : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedWaPhone}?text=${encodeURIComponent(`שלום ${name}, פניתי אלייך ממרפאת Clinify`)}`;

  // Patient appointments
  const clientAppointments = appointments.filter(a => a.patient_id === item.id);

  // Add tag handler
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    const newTags = [...tags, tagInput.trim()];
    if (isPatient) updatePatient(item.id, { tags: newTags });
    setTagInput('');
  };

  // Add clinical note handler (SOAP or Simple)
  const handleAddNote = (e) => {
    e.preventDefault();
    let noteContent = '';

    if (noteMode === 'soap') {
      if (!soapForm.subjective && !soapForm.objective && !soapForm.assessment && !soapForm.plan) {
        alert(t('Please fill in at least one SOAP section.', 'אנא מלא לפחות סעיף אחד בטופס ה-SOAP.'));
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
      noteContent = simpleNoteText;
    }

    addClinicalNote(item.id, noteContent);
    setSimpleNoteText('');
    setSoapForm({ subjective: '', objective: '', assessment: '', plan: '' });
  };

  // Add document handler
  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    addPatientDocument(item.id, newDocName);
    setNewDocName('');
  };

  // Add communication log handler
  const handleAddComm = (e) => {
    e.preventDefault();
    if (!newCommNote.trim()) return;
    addLeadCommunication(item.id, commType, newCommNote);
    setNewCommNote('');
  };

  // Save follow up & lost reason
  const handleSaveFollowUp = () => {
    updateLeadFollowUp(item.id, followUpDateInput, lostReasonInput);
    alert(t('Saved successfully!', 'הפרטים נשמרו בהצלחה!'));
  };

  // Handle issuing package directly from CRM
  const handleQuickIssuePackage = () => {
    const packageItems = services.filter(s => s.type === 'package');
    if (packageItems.length === 0) {
      alert(t('No package items in catalog. Add one in Settings first.', 'אין כרטיסיות מוגדרות בקטלוג. הוסף כרטיסייה בהגדרות קודם.'));
      return;
    }
    issuePackageToPatient(item.id, packageItems[0]);
    alert(t('Package issued successfully!', 'הכרטיסייה הונפקה בהצלחה למטופל!'));
  };

  // Render clinical note card
  const renderNoteContent = (noteContent) => {
    try {
      const parsed = JSON.parse(noteContent);
      if (parsed && parsed.isSoap) {
        return (
          <div className="space-y-3 pt-1">
            {parsed.subjective && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 me-2">S - Subjective (תלונה/תיאור)</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.subjective}</p>
              </div>
            )}
            {parsed.objective && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 me-2">O - Objective (ממצאים/בדיקה)</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.objective}</p>
              </div>
            )}
            {parsed.assessment && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 me-2">A - Assessment (אבחון/הערכה)</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.assessment}</p>
              </div>
            )}
            {parsed.plan && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 me-2">P - Plan (תוכנית המשך)</span>
                <p className="text-xs text-slate-700 font-medium mt-1">{parsed.plan}</p>
              </div>
            )}
          </div>
        );
      }
    } catch (e) {
      // Raw string
    }
    return <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">{noteContent}</p>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-start">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex ps-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-s border-slate-100 flex flex-col animate-in slide-in-from-end duration-300">
          
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 end-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl font-bold text-white shadow-lg border border-white/20">
                  {name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">{name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {isPatient ? t('Patient', 'מטופל במערכת') : t('Lead', 'ליד בצנרת')}
                    </span>
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 transition-colors"
                    >
                      🟢 WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>

          {/* Drawer Sub-Nav Tabs */}
          <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/50 shrink-0 overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'general' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📋 {t('General Details', 'מידע כללי ורפואי')}
            </button>

            {isPatient && (
              <button
                onClick={() => setActiveTab('packages')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'packages' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                🎟️ {t('Punch Cards & Packages', 'כרטיסיות וחבילות')}
              </button>
            )}

            {isPatient && (
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📝 {t('Clinical Notes (SOAP)', 'תיק רפואי וסיכומי טיפול')}
              </button>
            )}

            {isPatient && (
              <button
                onClick={() => setActiveTab('appointments')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'appointments' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📅 {t('Appointments', 'היסטוריית תורים')}
              </button>
            )}

            {isPatient && (
              <button
                onClick={() => setActiveTab('docs')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'docs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📄 {t('Documents & Files', 'מסמכים וקבצים')}
              </button>
            )}

            <button
              onClick={() => setActiveTab('comm')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'comm' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              💬 {t('Communication & Follow-up', 'יומן תקשורת ומעקב')}
            </button>
          </div>

          {/* Drawer Body Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Contact & Personal Details', 'פרטי התקשרות ואישיים')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">{t('Phone', 'טלפון')}</p>
                      <p className="font-semibold text-slate-800" dir="ltr">{phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{t('Email', 'אימייל')}</p>
                      <p className="font-semibold text-slate-800">{email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{t('Status', 'סטטוס')}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 mt-0.5">
                        {item.status || 'פעיל'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{t('Created At', 'תאריך הצטרפות')}</p>
                      <p className="font-semibold text-slate-800">{item.created_at ? new Date(item.created_at).toLocaleDateString('he-IL') : 'היום'}</p>
                    </div>
                  </div>
                </div>

                {isPatient && (
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 space-y-3">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      {t('Medical Alerts & Allergies', 'אזהרות רפואיות ורגישויות')}
                    </h4>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      {item.allergies || t('No known medical allergies recorded.', 'לא נרשמו אלרגיות או רגישויות ידועות.')}
                    </p>
                  </div>
                )}

                {!isPatient && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('Lead Management Details', 'ניהול ומעקב ליד')}</h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{t('Follow-up Date', 'תאריך מתוכנן לפולואו-אפ')}</label>
                      <input 
                        type="date" 
                        value={followUpDateInput}
                        onChange={(e) => setFollowUpDateInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{t('Lost Reason (if lost)', 'סיבת הפסד (אם סומן כאבוד)')}</label>
                      <select 
                        value={lostReasonInput}
                        onChange={(e) => setLostReasonInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">{t('Select reason...', 'בחר סיבה...')}</option>
                        <option value="High Price">{t('Price too high', 'מחיר יקר מדי')}</option>
                        <option value="No Answer">{t('No response after multiple calls', 'לא ענה למספר ניסיונות')}</option>
                        <option value="Competitor">{t('Chose another clinic', 'בחר במרפאה אחרת')}</option>
                        <option value="Not Relevant">{t('Not relevant / Wrong number', 'לא רלוונטי / טעות במספר')}</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleSaveFollowUp}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg text-xs transition-colors"
                    >
                      {t('Save Details', 'שמור פרטי מעקב')}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Tags & Labels', 'תגיות וסיווג')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddTag} className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder={t('Add new tag...', 'הוסף תגית חדשה...')}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none focus:border-emerald-500"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors">
                      + {t('Add', 'הוסף')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB: PACKAGES & PUNCH CARDS */}
            {activeTab === 'packages' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                  <div>
                    <h4 className="font-extrabold text-amber-900 text-sm">{t('Patient Punch Cards & Package Balances', 'כרטיסיות וחבילות טיפול פעילות')}</h4>
                    <p className="text-xs text-amber-700 mt-0.5">{t('Track remaining session credits and redeem treatments.', 'עקוב אחר יתרת הטיפולים בכרטיסייה ונכה טיפולים בזמן הגעה.')}</p>
                  </div>
                  <button 
                    onClick={handleQuickIssuePackage}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-colors shrink-0"
                  >
                    + {t('Issue New Package', 'הנפק כרטיסייה')}
                  </button>
                </div>

                <div className="space-y-4">
                  {activePkgs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                      {t('No active packages found for this patient.', 'אין כרטיסיות פעילות למטופל זה. לחץ על "הנפק כרטיסייה" להנפקה מהירה.')}
                    </div>
                  ) : (
                    activePkgs.map(pkg => (
                      <div key={pkg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                              🎟️ {t('Package Active', 'כרטיסייה בתוקף')}
                            </span>
                            <h4 className="font-extrabold text-slate-800 text-base mt-1">{pkg.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{t('Purchased on', 'נרכשה בתאריך')}: {pkg.purchased_date}</p>
                          </div>
                          
                          <div className="text-end">
                            <span className="text-2xl font-black text-amber-600">{pkg.remaining_sessions} / {pkg.total_sessions}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Sessions Left', 'טיפולים נותרים')}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full transition-all duration-500" 
                            style={{ width: `${(pkg.remaining_sessions / pkg.total_sessions) * 100}%` }}
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button 
                            disabled={pkg.remaining_sessions <= 0}
                            onClick={() => redeemPackageSession(pkg.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors disabled:opacity-50"
                          >
                            - {t('Redeem 1 Session', 'נכה טיפול 1 מהכרטיסייה')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CLINICAL NOTES (SOAP) */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Note Form Header Switch */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {t('New Clinical Session Note (SOAP)', 'הזנת סיכום טיפול קליני (SOAP)')}
                    </h4>
                    <div className="bg-slate-200 p-0.5 rounded-lg flex text-[11px] font-bold">
                      <button 
                        type="button"
                        onClick={() => setNoteMode('soap')}
                        className={`px-3 py-1 rounded-md transition-all ${noteMode === 'soap' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                      >
                        {t('Structured SOAP', 'תבנית מובנית SOAP')}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNoteMode('simple')}
                        className={`px-3 py-1 rounded-md transition-all ${noteMode === 'simple' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                      >
                        {t('Free Text', 'טקסט חופשי')}
                      </button>
                    </div>
                  </div>

                  {/* Structured SOAP Form */}
                  {noteMode === 'soap' ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-700 mb-1">S - Subjective (תלונת המטופל ותיאור חופשי)</label>
                        <textarea 
                          rows="2"
                          placeholder={t('Patient reported symptoms, pain level, history...', 'תלונות המטופל, דרגת כאב, תיאור פגישה...')}
                          value={soapForm.subjective}
                          onChange={e => setSoapForm({...soapForm, subjective: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-700 mb-1">O - Objective (ממצאים קליניים ובדיקה פיזית)</label>
                        <textarea 
                          rows="2"
                          placeholder={t('Clinical observations, range of motion, test results...', 'ממצאים בבדיקה, טווח תנועה, תגובות, בדיקות רפואיות...')}
                          value={soapForm.objective}
                          onChange={e => setSoapForm({...soapForm, objective: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-purple-700 mb-1">A - Assessment (אבחון והערכת התקדמות)</label>
                        <textarea 
                          rows="2"
                          placeholder={t('Practitioner diagnosis, progress assessment...', 'אבחנת המטפל, הערכת התקדמות הטיפול...')}
                          value={soapForm.assessment}
                          onChange={e => setSoapForm({...soapForm, assessment: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-amber-700 mb-1">P - Plan (תוכנית המשך, תרגילים והנחיות)</label>
                        <textarea 
                          rows="2"
                          placeholder={t('Treatment plan, homework exercises, next appointment date...', 'תוכנית המשך, תרגילים לבית, הנחיות לפגישה הבאה...')}
                          value={soapForm.plan}
                          onChange={e => setSoapForm({...soapForm, plan: e.target.value})}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea 
                        rows="4"
                        placeholder={t('Write clinical observations, treatment provided, or next steps...', 'רשום הערות טיפוליות, סיכום יעוץ או הנחיות להמשך...')}
                        value={simpleNoteText}
                        onChange={(e) => setSimpleNoteText(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      />
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={handleAddNote}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                    >
                      {t('Save SOAP Note', 'שמור סיכום טיפול')}
                    </button>
                  </div>
                </div>

                {/* Notes History List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Medical Timeline & Notes History', 'ציר זמן - היסטוריית סיכומי טיפול')}</h4>
                  {(item.clinical_notes || [
                    { 
                      id: 'demo_soap_1', 
                      created_at: new Date().toISOString(), 
                      author: 'ד"ר אוקונסקי', 
                      content: JSON.stringify({
                        isSoap: true,
                        subjective: 'המטופל מדווח על כאב גב תחתון דרגה 6/10 לאחר פעילות ספורטיבית.',
                        objective: 'הגבלה בכיפוף לפנים, רגישות למגע בחוליות L4-L5.',
                        assessment: 'עומס שרירי מוגבר. שיפור מתוני לעומת טיפול קודם.',
                        plan: 'טיפול מנואלי, מתיחות להמסטרינגס, פגישת מעקב בעוד שבוע.'
                      })
                    }
                  ]).map((note) => (
                    <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-100 pb-2.5">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {note.author}
                        </span>
                        <span className="font-medium bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-600 text-[11px]">{new Date(note.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      
                      {renderNoteContent(note.content)}
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 3: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Client Appointment History', 'היסטוריית תורים ופגישות')}</h4>
                
                {clientAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {clientAppointments.map((appt) => (
                      <div key={appt.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-800">{getServiceName(appt.service_id)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{new Date(appt.appointment_date).toLocaleString('he-IL')}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {appt.status === 'completed' ? t('Completed', 'הושלם') : t('Scheduled', 'נקבע')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">{t('No past appointments recorded for this client.', 'לא נמצאו תורים קודמים עבור מטופל זה.')}</p>
                )}
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'docs' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Upload Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">{t('Attach Document or Medical File', 'צירוף מסמך או קובץ רפואי')}</h4>
                  <form onSubmit={handleAddDoc} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={t('Document title (e.g. Panoramic X-Ray)...', 'שם המסמך (למשל: צילום פנורמי)...')}
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-xs flex-1 outline-none bg-white"
                    />
                    <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                      {t('Attach File', 'צרף מסמך')}
                    </button>
                  </form>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Attached Documents', 'מסמכים שצורפו')}</h4>
                  {(item.documents || [
                    { id: '1', name: 'טופס הצהרת בריאות חתום.pdf', uploaded_at: '2026-08-10', size: '420 KB' }
                  ]).map((doc) => (
                    <div key={doc.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.uploaded_at} • {doc.size}</p>
                        </div>
                      </div>
                      <button onClick={() => alert('מוריד קובץ...')} className="text-xs font-bold text-emerald-600 hover:underline">
                        {t('Download', 'הורד')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: COMMUNICATION LOG */}
            {activeTab === 'comm' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Add Communication Entry */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">{t('Log Call / Interaction', 'תיעוד שיחה או פנייה')}</h4>
                  <div className="flex gap-2">
                    <select 
                      value={commType} 
                      onChange={(e) => setCommType(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="call">📞 {t('Phone Call', 'שיחת טלפון')}</option>
                      <option value="whatsapp">🟢 WhatsApp</option>
                      <option value="email">✉️ {t('Email', 'אימייל')}</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder={t('Summary of conversation...', 'סיכום השיחה או הפנייה...')}
                      value={newCommNote}
                      onChange={(e) => setNewCommNote(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none bg-white"
                    />
                    <button onClick={handleAddComm} className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors">
                      {t('Log', 'תעד')}
                    </button>
                  </div>
                </div>

                {/* Communication Log List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Interaction History', 'היסטוריית פניות ושיחות')}</h4>
                  {(item.communication_log || [
                    { id: '1', type: 'call', created_at: new Date().toISOString(), note: 'שיחה קצרה – המטופל ביקש לקבל הצעת מחיר במייל.' }
                  ]).map((comm) => (
                    <div key={comm.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          {comm.type === 'call' ? '📞 שיחת טלפון' : comm.type === 'whatsapp' ? '🟢 WhatsApp' : '✉️ אימייל'}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(comm.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      <p className="text-xs text-slate-600">{comm.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientDetailDrawer;
