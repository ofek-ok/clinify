import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ClientDetailDrawer = ({ item, type = 'patient', onClose }) => {
  const { 
    updatePatient, addClinicalNote, addPatientDocument, 
    addLeadCommunication, updateLeadFollowUp, appointments, 
    services, getServiceName, t 
  } = useContext(ClinicContext);

  const [activeTab, setActiveTab] = useState('general');
  const [newNoteText, setNewNoteText] = useState('');
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

  // Format phone for WhatsApp link (remove non-digits, replace leading 0 with 972)
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

  // Add clinical note handler
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addClinicalNote(item.id, newNoteText);
    setNewNoteText('');
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-start">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
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
                    <span className="text-xs text-slate-400" dir="ltr">{phone}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.183-1.101z"/></svg>
                <span>WhatsApp</span>
              </a>

              <a 
                href={`tel:${phone}`}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>{t('Call', 'חייג')}: {phone}</span>
              </a>

              {email !== '-' && (
                <a 
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto shrink-0">
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
                onClick={() => setActiveTab('notes')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'notes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📝 {t('Clinical Notes', 'סיכומי טיפול (SOAP)')}
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
                {/* Contact Information */}
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

                {/* Medical & Allergies */}
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

                {/* Lead Lost Reason / Follow up */}
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

                {/* Tags Management */}
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

            {/* TAB 2: CLINICAL NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Add Note Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">{t('Add Clinical / Treatment Note (SOAP)', 'הוספת סיכום טיפול / הערה קלינית')}</h4>
                  <textarea 
                    rows="3"
                    placeholder={t('Write clinical observations, treatment provided, or next steps...', 'רשום הערות טיפוליות, סיכום יעוץ או הנחיות להמשך...')}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={handleAddNote}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {t('Save Note', 'שמור סיכום טיפול')}
                    </button>
                  </div>
                </div>

                {/* Notes History List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('Notes History', 'היסטוריית סיכומי טיפול')}</h4>
                  {(item.clinical_notes || [
                    { id: '1', created_at: new Date().toISOString(), author: 'ד"ר אוקונסקי', content: 'בוצעה בדיקה ראשונית וצילום פנורמי. הומלץ על תוכנית טיפול לשיקום.' }
                  ]).map((note) => (
                    <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-700">{note.author}</span>
                        <span>{new Date(note.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                        {note.content}
                      </p>
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
