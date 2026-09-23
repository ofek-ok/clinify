import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import AppointmentManager from './AppointmentManager';
import Drawer from './ui/Drawer';
import { useToast } from './ui/Toast';
import { ChevronRight, ChevronLeft, Plus, CalendarDays } from 'lucide-react';

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';

const getIsraelDateKey = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
};

const dateFromKey = (key) => new Date(`${key}T12:00:00`);

const getIsraelOffsetString = (dateStr) => {
  const probe = new Date(dateStr + 'T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(probe);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  const offsetMinutes = Math.round((asUtc - probe.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return sign + String(Math.floor(absolute / 60)).padStart(2, '0') + ':' + String(absolute % 60).padStart(2, '0');
};

const buildIsraelIsoTimestamp = (dateStr, timeStr) =>
  dateStr + 'T' + timeStr + ':00' + getIsraelOffsetString(dateStr);

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const eventHourInIsrael = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return -1;
  return Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(d));
};

export default function CalendarView({ initialTab = 'week' }) {
  const initialMode = initialTab === 'list' ? 'list' : initialTab === 'grid' ? 'week' : initialTab;
  const [viewMode, setViewMode] = useState(initialMode || 'week');
  const [focusDate, setFocusDate] = useState(dateFromKey(getIsraelDateKey()));
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editForm, setEditForm] = useState({
    person_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    notes: ''
  });

  const {
    appointments,
    services,
    patients,
    people,
    leads,
    businessHours,
    calendarBlocks,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getPatientName,
    getPersonName,
    getServiceName,
    getAvailableSlotsForDate,
    isTimeSlotAvailable,
    isWithinBusinessHours
  } = useContext(ClinicContext);

  const { showToast } = useToast();
  const { t, language } = useContext(LanguageContext);

  const [personId, setPersonId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [apptDate, setApptDate] = useState(getIsraelDateKey());
  const [apptTime, setApptTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = services.find(s => String(s.id) === String(serviceId));

  const getAppointmentPersonName = (appt) =>
    getPersonName(appt?.person_id) ||
    getPatientName(appt?.patient_id) ||
    t('Client','לקוח');

  const getAppointmentTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('he-IL', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppointmentStatusClasses = (appointmentStatus) => {
    if (appointmentStatus === 'completed') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (appointmentStatus === 'cancelled') return 'bg-rose-50 border-rose-200 text-rose-700';
    if (appointmentStatus === 'confirmed') return 'bg-sky-50 border-sky-200 text-sky-800';
    if (appointmentStatus === 'no_show') return 'bg-rose-50 border-rose-200 text-rose-800';
    if (appointmentStatus === 'rescheduled') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-slate-100 border-slate-300 text-slate-900';
  };

  const bookablePeople = useMemo(() => {
    return people
      .filter(person => {
        if (person.client_status === 'customer') return true;
        const lead = leads.find(item => item.person_id === person.id);
        return lead && lead.status !== 'lost' && lead.status !== 'won';
      })
      .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'he'));
  }, [people, leads]);

  const availableSlots = useMemo(() => {
    if (!apptDate || !selectedService) return [];
    return getAvailableSlotsForDate(apptDate, Number(selectedService.duration_minutes || 30));
  }, [apptDate, selectedService, getAvailableSlotsForDate]);

  useEffect(() => {
    if (availableSlots.length === 0) {
      if (apptTime) setApptTime('');
      return;
    }
    if (!apptTime || !availableSlots.includes(apptTime)) {
      setApptTime(availableSlots[0]);
    }
  }, [availableSlots, apptTime]);

  const operatingHours = useMemo(() => {
    const openHours = businessHours.filter(h => h.isOpen);
    let start = 9;
    let end = 18;
    if (openHours.length > 0) {
      start = Math.min(...openHours.map(h => parseInt(h.startTime.split(':')[0], 10)));
      end = Math.max(...openHours.map(h => parseInt(h.endTime.split(':')[0], 10)));
    }
    return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => start + i);
  }, [businessHours]);

  const weekDays = useMemo(() => {
    const currentDay = focusDate.getDay();
    const sunday = addDays(focusDate, -currentDay);
    const dayNames = language === 'he' ? ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(sunday, i);
      return {
        dayName: dayNames[i],
        dayStr: new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(d),
        isoStr: getIsraelDateKey(d),
        dateObj: d
      };
    });
  }, [focusDate]);

  const monthDays = useMemo(() => {
    const first = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1, 12, 0, 0);
    const gridStart = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      return {
        dateObj: d,
        isoStr: getIsraelDateKey(d),
        inMonth: d.getMonth() === focusDate.getMonth()
      };
    });
  }, [focusDate]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'day') {
      return focusDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'month') {
      return focusDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = weekDays[0]?.dateObj;
      const end = weekDays[6]?.dateObj;
      if (!start || !end) return '';
      return `${start.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return t('All appointments','כל התורים');
  }, [viewMode, focusDate, weekDays]);

  const movePeriod = (direction) => {
    if (viewMode === 'day') setFocusDate(prev => addDays(prev, direction));
    if (viewMode === 'week') setFocusDate(prev => addDays(prev, direction * 7));
    if (viewMode === 'month') {
      setFocusDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1, 12, 0, 0));
    }
  };

  const openCreateForDate = (dateKey) => {
    setApptDate(dateKey);
    setIsAddDrawerOpen(true);
  };

  const appointmentsForDate = (dateKey) =>
    appointments
      .filter(a => getIsraelDateKey(a.appointment_date) === dateKey)
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  const blocksForDate = (dateKey) =>
    (calendarBlocks || [])
      .filter(block => getIsraelDateKey(block.starts_at) === dateKey)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  const openAppointment = (appt) => {
    setSelectedAppointment(appt);
    setEditForm({
      person_id: appt.person_id || '',
      service_id: appt.service_id || '',
      appointment_date: getIsraelDateKey(appt.appointment_date),
      appointment_time: getAppointmentTime(appt.appointment_date),
      status: appt.status || 'scheduled',
      notes: appt.notes || ''
    });
  };

  const renderEventCard = (appt, compact = false) => (
    <button
      type="button"
      key={appt.id}
      onClick={() => openAppointment(appt)}
      className={`w-full text-start ${compact ? 'px-1.5 py-1' : 'p-2'} rounded-lg border text-[11px] space-y-0.5 transition hover:shadow-sm ${getAppointmentStatusClasses(appt.status)}`}
      title={`${getAppointmentTime(appt.appointment_date)} · ${getAppointmentPersonName(appt)} · ${getServiceName(appt.service_id)}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold truncate">{getAppointmentPersonName(appt)}</span>
        <span className="text-[10px] font-mono shrink-0">{getAppointmentTime(appt.appointment_date)}</span>
      </div>
      {!compact && <div className="text-[10px] opacity-75 truncate">{getServiceName(appt.service_id)}</div>}
    </button>
  );

  const renderBusyCard = (block, compact = false) => (
    <div
      key={`busy-${block.id}`}
      className={`${compact ? 'px-1.5 py-1' : 'p-2'} rounded-lg border border-slate-300 bg-slate-100 text-slate-600 text-[11px]`}
      title={t("Busy time from external calendar","זמן תפוס מיומן חיצוני")}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-bold truncate">{t('Busy · Google','תפוס · Google')}</span>
        <span className="text-[10px] font-mono shrink-0">{getAppointmentTime(block.starts_at)}</span>
      </div>
    </div>
  );

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    if (!editForm.person_id || !editForm.service_id || !editForm.appointment_date || !editForm.appointment_time) {
      showToast('יש למלא לקוח, שירות, תאריך ושעה', 'error');
      return;
    }

    const service = services.find(item => String(item.id) === String(editForm.service_id));
    const duration = Number(service?.duration_minutes || 30);
    const nextDateTime = buildIsraelIsoTimestamp(editForm.appointment_date, editForm.appointment_time);
    if (isWithinBusinessHours && !isWithinBusinessHours(nextDateTime, duration)) {
      showToast('השעה שנבחרה מחוץ לשעות הפעילות', 'error');
      return;
    }
    if (isTimeSlotAvailable && !isTimeSlotAvailable(nextDateTime, duration, selectedAppointment.id)) {
      showToast('השעה שנבחרה מתנגשת עם תור או זמן תפוס אחר', 'error');
      return;
    }

    setIsEditingAppointment(true);
    try {
      const updated = await updateAppointment(selectedAppointment.id, {
        person_id: editForm.person_id,
        service_id: editForm.service_id,
        appointment_date: nextDateTime,
        status: editForm.status,
        notes: editForm.notes || null
      });
      setSelectedAppointment(updated);
      showToast('התור עודכן בהצלחה');
    } catch (err) {
      showToast(err.message || 'לא ניתן לעדכן את התור', 'error');
    } finally {
      setIsEditingAppointment(false);
    }
  };

  const handleDeleteSelectedAppointment = async () => {
    if (!selectedAppointment) return;
    const confirmed = window.confirm(t(`Move the appointment for ${getAppointmentPersonName(selectedAppointment)} to Trash?`, `להעביר את התור של ${getAppointmentPersonName(selectedAppointment)} לאשפה?`));
    if (!confirmed) return;

    setIsEditingAppointment(true);
    try {
      await deleteAppointment(selectedAppointment.id);
      showToast('התור הועבר לאשפה');
      setSelectedAppointment(null);
    } catch (err) {
      showToast(err.message || 'לא ניתן למחוק את התור', 'error');
    } finally {
      setIsEditingAppointment(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!personId || !serviceId) {
      showToast('אנא בחר לקוח או ליד ושירות', 'error');
      return;
    }
    if (!apptTime) {
      showToast('אין שעה פנויה בתאריך שנבחר', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullDateTime = buildIsraelIsoTimestamp(apptDate, apptTime);
      const linkedPatient = patients.find(patient => patient.person_id === personId);
      await addAppointment({
        person_id: personId,
        patient_id: linkedPatient?.id || null,
        service_id: serviceId,
        appointment_date: fullDateTime,
        status,
        notes
      });
      showToast('התור נקבע בהצלחה');
      setIsAddDrawerOpen(false);
      setNotes('');
      setFocusDate(dateFromKey(apptDate));
    } catch (err) {
      showToast(err.message || 'שגיאה בקביעת תור', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            {[
              ['day', t('Day','יום')],
              ['week', t('Week','שבוע')],
              ['month', t('Month','חודש')],
              ['list', t('List','רשימה')]
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === id ? 'bg-violet-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {viewMode !== 'list' && (
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900">
              <button type="button" onClick={() => movePeriod(-1)} className="p-1 text-slate-500 hover:text-slate-900">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="min-w-[150px] text-center px-2 font-bold">{periodLabel}</span>
              <button type="button" onClick={() => movePeriod(1)} className="p-1 text-slate-500 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFocusDate(dateFromKey(getIsraelDateKey()))}
                className="mr-1 px-2 py-1 rounded-lg text-[11px] font-bold text-violet-700 hover:bg-violet-50"
              >
                {t('Today','היום')}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => openCreateForDate(getIsraelDateKey(focusDate))}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('New Appointment','תור חדש')}</span>
        </button>
      </div>

      {viewMode === 'day' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div>
              <p className="text-sm font-bold text-slate-900">{periodLabel}</p>
              <p className="text-[11px] text-slate-500">{t('Full daily view of appointments and busy times','תצוגה יומית מלאה של תורים וזמנים תפוסים')}</p>
            </div>
            <button type="button" onClick={() => openCreateForDate(getIsraelDateKey(focusDate))} className="text-xs font-bold text-violet-700 hover:underline">
              + {t('Appointment on this day','תור ביום הזה')}
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {operatingHours.map(hour => {
              const dateKey = getIsraelDateKey(focusDate);
              const hourAppts = appointmentsForDate(dateKey).filter(a => eventHourInIsrael(a.appointment_date) === hour);
              const hourBlocks = blocksForDate(dateKey).filter(b => eventHourInIsrael(b.starts_at) === hour);
              return (
                <div key={hour} className="grid grid-cols-[72px_1fr] min-h-20">
                  <div className="bg-slate-50 border-l border-slate-200 p-3 text-center font-mono text-[11px] text-slate-500">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  <div className="p-2 space-y-1 hover:bg-slate-50/60">
                    {hourBlocks.map(block => renderBusyCard(block))}
                    {hourAppts.map(appt => renderEventCard(appt))}
                    {hourBlocks.length === 0 && hourAppts.length === 0 && (
                      <button
                        type="button"
                        onClick={() => openCreateForDate(dateKey)}
                        className="h-full min-h-14 w-full rounded-lg text-[11px] text-slate-300 hover:text-violet-600 hover:bg-violet-50/40"
                      >
                        {t('Available','פנוי')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-start">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-2.5 px-3 border-l border-slate-200 w-20 text-center">{t('Time','שעה')}</th>
                  {weekDays.map(day => (
                    <th key={day.isoStr} className={`py-2.5 px-3 border-l border-slate-200 text-center w-[13.5%] ${day.isoStr === getIsraelDateKey() ? 'bg-violet-50/70' : ''}`}>
                      <button type="button" onClick={() => { setFocusDate(day.dateObj); setViewMode('day'); }} className="w-full">
                        <div className={day.isoStr === getIsraelDateKey() ? 'text-violet-700' : ''}>{day.dayName}</div>
                        <div className={`text-[10px] font-normal ${day.isoStr === getIsraelDateKey() ? 'text-violet-600' : 'text-slate-500'}`}>{day.dayStr}</div>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {operatingHours.map(hour => (
                  <tr key={hour} className="h-16">
                    <td className="py-2 px-2 border-l border-slate-200 text-center text-slate-500 font-mono text-[11px] bg-slate-50">
                      {String(hour).padStart(2, '0')}:00
                    </td>
                    {weekDays.map(day => {
                      const dayAppts = appointmentsForDate(day.isoStr).filter(a => eventHourInIsrael(a.appointment_date) === hour);
                      const dayBlocks = blocksForDate(day.isoStr).filter(b => eventHourInIsrael(b.starts_at) === hour);
                      return (
                        <td key={`${hour}-${day.isoStr}`} className="border-l border-slate-200 p-1 align-top hover:bg-slate-50/50">
                          <div className="space-y-1">
                            {dayBlocks.map(block => renderBusyCard(block, true))}
                            {dayAppts.map(appt => renderEventCard(appt, true))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 text-center">
            {(language === 'he' ? ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(day => <div key={day} className="py-2.5 border-l border-slate-200">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map(day => {
              const dayAppts = appointmentsForDate(day.isoStr);
              const dayBlocks = blocksForDate(day.isoStr);
              const isToday = day.isoStr === getIsraelDateKey();
              return (
                <div
                  key={day.isoStr}
                  className={`min-h-28 border-l border-b border-slate-200 p-1.5 ${day.inMonth ? 'bg-white' : 'bg-slate-50/70'}`}
                >
                  <button
                    type="button"
                    onClick={() => { setFocusDate(day.dateObj); setViewMode('day'); }}
                    className={`mb-1 h-6 w-6 rounded-full text-[11px] font-bold ${isToday ? 'bg-violet-600 text-white' : day.inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
                  >
                    {day.dateObj.getDate()}
                  </button>
                  <div className="space-y-1">
                    {dayBlocks.slice(0, 1).map(block => renderBusyCard(block, true))}
                    {dayAppts.slice(0, 3).map(appt => renderEventCard(appt, true))}
                    {dayAppts.length + dayBlocks.length > 4 && (
                      <button type="button" onClick={() => { setFocusDate(day.dateObj); setViewMode('day'); }} className="text-[10px] font-bold text-slate-500 hover:text-violet-700">
                        +{dayAppts.length + dayBlocks.length - 4} {t('more','נוספים')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'list' && <AppointmentManager />}

      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={t("Create New Appointment","קביעת תור חדש")}
        footer={
          <>
            <button type="button" onClick={() => setIsAddDrawerOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100">
              {t('Cancel','ביטול')}
            </button>
            <button type="button" onClick={handleCreateAppointment} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
              {isSubmitting ? t('Saving...','שומר...') : t('Schedule Appointment','קבע תור')}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Client / Lead *','לקוח / ליד *')}</label>
            <select required value={personId} onChange={e => setPersonId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="">{t("Select client or lead...","בחר לקוח או ליד...")}</option>
              {bookablePeople.map(person => {
                const lead = leads.find(item => item.person_id === person.id);
                const suffix = person.client_status === 'customer' ? t('Client','לקוח') : (lead?.status === 'scheduled' ? t('Lead · Scheduled','ליד · נקבע תור') : t('Lead','ליד'));
                return <option key={person.id} value={person.id}>{person.full_name} · {suffix}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Service *','שירות *')}</label>
            <select required value={serviceId} onChange={e => setServiceId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="">{t("Select service...","בחר שירות...")}</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} (₪{s.default_price || 0})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Date','תאריך')}</label>
              <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Available Time','שעה פנויה')}</label>
              <select value={apptTime} onChange={e => setApptTime(e.target.value)} disabled={!serviceId || !apptDate || availableSlots.length === 0} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none disabled:opacity-60">
                {availableSlots.length === 0 ? <option value="">{t("No available times","אין שעות פנויות")}</option> : availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Appointment Status','סטטוס תור')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
              <option value="scheduled">{t("Scheduled","מתוכנן")}</option>
              <option value="confirmed">{t("Confirmed","מאושר")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('Notes','הערות')}</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("Appointment notes...","הערות לתור...")} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
            זמינות השעות מתחשבת בשעות הפעילות, בתורים קיימים ובזמנים תפוסים שיסונכרנו מ-Google Calendar.
          </div>
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title={t("Appointment Details","פרטי תור")}
        footer={
          <>
            <button
              type="button"
              onClick={handleDeleteSelectedAppointment}
              disabled={isEditingAppointment}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50"
            >
              {t('Move to Trash','העבר לאשפה')}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSelectedAppointment(null)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              {t('Close','סגור')}
            </button>
            <button
              type="button"
              onClick={handleUpdateAppointment}
              disabled={isEditingAppointment}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
            >
              {isEditingAppointment ? t('Saving...','שומר...') : t('Save Changes','שמור שינויים')}
            </button>
          </>
        }
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Client / Lead','לקוח / ליד')}</label>
              <select
                value={editForm.person_id}
                onChange={e => setEditForm(prev => ({ ...prev, person_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">{t("Select client...","בחר לקוח...")}</option>
                {bookablePeople.map(person => (
                  <option key={person.id} value={person.id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Service','שירות')}</label>
              <select
                value={editForm.service_id}
                onChange={e => setEditForm(prev => ({ ...prev, service_id: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="">{t("Select service...","בחר שירות...")}</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration_minutes || 30} {t('min','דק׳')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('Date','תאריך')}</label>
                <input
                  type="date"
                  value={editForm.appointment_date}
                  onChange={e => setEditForm(prev => ({ ...prev, appointment_date: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t('Time','שעה')}</label>
                <input
                  type="time"
                  step="1800"
                  value={editForm.appointment_time}
                  onChange={e => setEditForm(prev => ({ ...prev, appointment_time: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Status','סטטוס')}</label>
              <select
                value={editForm.status}
                onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="scheduled">{t("Scheduled","מתוכנן")}</option>
                <option value="confirmed">{t("Confirmed","מאושר")}</option>
                <option value="completed">{t("Completed","הושלם")}</option>
                <option value="no_show">{t("No Show","אי הופעה")}</option>
                <option value="cancelled">{t("Cancelled","מבוטל")}</option>
                <option value="rescheduled">{t("Rescheduled","הוזז")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('Notes','הערות')}</label>
              <textarea
                rows={4}
                value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                placeholder={t("Appointment notes...","הערות לתור...")}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
              שינוי תאריך, שעה או שירות נבדק מול שעות הפעילות, תורים קיימים וזמנים תפוסים לפני השמירה.
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
