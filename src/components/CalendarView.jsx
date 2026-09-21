import React, { useState, useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import AppointmentManager from './AppointmentManager';
import Drawer from './ui/Drawer';
import { useToast } from './ui/Toast';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';

export default function CalendarView({ initialTab = 'grid' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { 
    appointments, 
    services, 
    patients, 
    businessHours, 
    addAppointment,
    getPatientName, 
    getServiceName 
  } = useContext(ClinicContext);

  const { showToast } = useToast();

  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // New Appointment Form State
  const [patientId, setPatientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const dayStr = `${d.getDate()}/${d.getMonth() + 1}`;
      const isoStr = d.toISOString().split('T')[0];
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
    if (!patientId || !serviceId) {
      showToast('אנא בחר לקוח ושירות', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const fullDateTime = `${apptDate}T${apptTime}:00`;
      await addAppointment({
        patient_id: patientId,
        service_id: serviceId,
        appointment_date: new Date(fullDateTime).toISOString(),
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
                        return d.getHours() === hour && d.toISOString().split('T')[0] === day.isoStr;
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
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-200'
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
            <label className="block text-xs font-medium text-slate-700 mb-1">לקוח *</label>
            <select
              required
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="">בחר לקוח...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
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
              {services.map(s => <option key={s.id} value={s.id}>{s.name} (₪{s.price})</option>)}
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
              <label className="block text-xs font-medium text-slate-700 mb-1">שעה</label>
              <input
                type="time"
                value={apptTime}
                onChange={e => setApptTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
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
              <option value="completed">הושלם</option>
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
