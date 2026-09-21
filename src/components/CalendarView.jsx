import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import AppointmentManager from './AppointmentManager';
import Drawer from './ui/Drawer';
import { useToast } from './ui/Toast';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';

const getIsraelDateKey = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return map.year + '-' + map.month + '-' + map.day;
};

const getIsraelOffsetString = (dateStr) => {
  const probe = new Date(dateStr + 'T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(probe);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  const offsetMinutes = Math.round((asUtc - probe.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return sign + String(Math.floor(absolute / 60)).padStart(2,'0') + ':' + String(absolute % 60).padStart(2,'0');
};

const buildIsraelIsoTimestamp = (dateStr, timeStr) => dateStr + 'T' + timeStr + ':00' + getIsraelOffsetString(dateStr);

export default function CalendarView({ initialTab = 'grid' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { 
    appointments, 
    services, 
    patients,
    people,
    leads, 
    businessHours, 
    addAppointment,
    getPatientName, 
    getServiceName,
    getAvailableSlotsForDate 
  } = useContext(ClinicContext);

  const { showToast } = useToast();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // New Appointment Form State
  const [personId, setPersonId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [apptDate, setApptDate] = useState(getIsraelDateKey());
  const [apptTime, setApptTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = services.find(s => String(s.id) === String(serviceId));
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

  // Calculate Week Days starting from Sunday
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay + (currentWeekOffset * 7));

    const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dayStr = new Intl.DateTimeFormat('he-IL', { timeZone: BUSINESS_TIME_ZONE, day: 'numeric', month: 'numeric' }).format(d);
      const isoStr = getIsraelDateKey(d);
      return {
        dayName: dayNames[i],
        dayStr,
        isoStr,
        dateObj: d,
        dayIndex: i
      };
    });
  }, [currentWeekOffset]);

  // Derive operating hours from businessHours context
  const operatingHours = useMemo(() => {
    const openHours = businessHours.filter(h => h.isOpen);
    let start = 9;
    let end = 18;

    if (openHours.length > 0) {
      const startTimes = openHours.map(h => parseInt(h.startTime.split(':')[0], 10));
      const endTimes = openHours.map(h => parseInt(h.endTime.split(':')[0], 10));
      start = Math.min(...startTimes);
      end = Math.max(...endTimes);
    }
    return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => start + i);
  }, [businessHours]);

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length < 7) return '';
    const startStr = `${weekDays[0].dateObj.getDate()} ב${weekDays[0].dateObj.toLocaleString('he-IL', { month: 'long' })}`;
    const endStr = `${weekDays[6].dateObj.getDate()} ב${weekDays[6].dateObj.toLocaleString('he-IL', { month: 'long' })}`;
    return `${startStr} – ${endStr}`;
  }, [weekDays]);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!personId || !serviceId) {
      showToast('אנא בחר לקוח או ליד ושירות', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (!apptTime) {
        showToast('אין שעה פנויה בתאריך שנבחר', 'error');
        return;
      }
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
    } catch (err) {
      showToast(err.message || 'שגיאה בקביעת תור', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Tabs */}
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              יומן
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              רשימת תורים
            </button>
          </div>

          {/* Week Navigation */}
          {activeTab === 'grid' && (
            <div className="flex items-center space-x-2 space-x-reverse bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium">
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold">{weekRangeLabel}</span>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {currentWeekOffset !== 0 && (
                <button
                  onClick={() => setCurrentWeekOffset(0)}
                  className="mr-2 text-[11px] text-emerald-400 hover:underline font-bold"
                >
                  היום
                </button>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>תור חדש</span>
        </button>
      </div>

      {/* Grid or List View */}
      {activeTab === 'grid' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-start">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                  <th className="py-2.5 px-3 border-l border-slate-200 w-20 text-center">שעה</th>
                  {weekDays.map(day => (
                    <th key={day.isoStr} className="py-2.5 px-3 border-l border-slate-200 text-center w-[13.5%]">
                      <div>{day.dayName}</div>
                      <div className="text-[10px] font-normal text-slate-500">{day.dayStr}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {operatingHours.map(hour => (
                  <tr key={hour} className="h-16">
                    <td className="py-2 px-2 border-l border-slate-200 text-center text-slate-500 font-mono text-[11px] bg-slate-50">
                      {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                    </td>
                    {weekDays.map(day => {
                      const dayAppts = appointments.filter(a => {
                        const d = new Date(a.appointment_date);
                        const hourInIsrael = Number(new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(d));
                        return hourInIsrael === hour && getIsraelDateKey(d) === day.isoStr;
                      });

                      return (
                        <td key={`${hour}-${day.isoStr}`} className="border-l border-slate-200 p-1 relative hover:bg-slate-100/30 transition-colors">
                          {dayAppts.map(appt => {
                            const isCompleted = appt.status === 'completed';
                            return (
                              <div
                                key={appt.id}
                                className={`p-1.5 rounded-lg border text-[11px] space-y-0.5 ${
                                  isCompleted
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : appt.status === 'cancelled'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-900'
                                }`}
                              >
                                <div className="font-bold truncate">{getPatientName(appt.patient_id)}</div>
                                <div className="text-[10px] text-slate-500 truncate">{getServiceName(appt.service_id)}</div>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AppointmentManager />
      )}

      {/* Add Appointment Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="קביעת תור חדש"
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateAppointment}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'קבע תור'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">לקוח / ליד *</label>
            <select
              required
              value={personId}
              onChange={e => setPersonId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="">בחר לקוח או ליד...</option>
              {bookablePeople.map(person => {
                const lead = leads.find(item => item.person_id === person.id);
                const suffix = person.client_status === 'customer' ? 'לקוח' : (lead?.status === 'scheduled' ? 'ליד · נקבע תור' : 'ליד');
                return <option key={person.id} value={person.id}>{person.full_name} · {suffix}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">שירות *</label>
            <select
              required
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="">בחר שירות...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} (₪{s.default_price || 0})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תאריך</label>
              <input
                type="date"
                value={apptDate}
                onChange={e => setApptDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">שעה פנויה</label>
              <select
                value={apptTime}
                onChange={e => setApptTime(e.target.value)}
                disabled={!serviceId || !apptDate || availableSlots.length === 0}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none disabled:opacity-60"
              >
                {availableSlots.length === 0 ? (
                  <option value="">אין שעות פנויות</option>
                ) : (
                  availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">סטטוס תור</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="scheduled">מתוכנן</option>
              <option value="confirmed">מאושר</option>
              <option value="cancelled">מבוטל</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">הערות</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="הערות לתור..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
