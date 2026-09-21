import React, { useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';
const OPEN_LEAD_STATUSES = new Set(['new', 'contacted', 'qualified', 'scheduled']);

const getDateParts = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day
  };
};

const getDateKey = (value = new Date()) => {
  const { year, month, day } = getDateParts(value);
  return `${year}-${month}-${day}`;
};

const getMonthKey = (value = new Date()) => {
  const { year, month } = getDateParts(value);
  return `${year}-${month}`;
};

const getBusinessHour = () => {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  }).format(new Date());

  return Number(hour);
};

const getGreeting = (t) => {
  const hour = getBusinessHour();

  if (hour < 12) return t('Good morning, Ofek', 'בוקר טוב, אופק');
  if (hour < 18) return t('Good afternoon, Ofek', 'צהריים טובים, אופק');
  return t('Good evening, Ofek', 'ערב טוב, אופק');
};

const formatMoney = (value) =>
  new Intl.NumberFormat('he-IL', {
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const DashboardOverview = ({ navigate }) => {
  const {
    patients = [],
    leads = [],
    appointments = [],
    services = [],
    tasks = [],
    payments = [],
    getPatientName = () => '',
    getPersonName = () => '',
    getServiceName = () => ''
  } = useContext(ClinicContext) || {};

  const { t } = useContext(LanguageContext);

  const todayKey = useMemo(() => getDateKey(), []);
  const currentMonthKey = useMemo(() => getMonthKey(), []);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('he-IL', {
      timeZone: BUSINESS_TIME_ZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const todayAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];

    return appointments
      .filter(appt => {
        if (!appt?.appointment_date) return false;
        return getDateKey(appt.appointment_date) === todayKey;
      })
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  }, [appointments, todayKey]);

  const openLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads.filter(lead => lead && OPEN_LEAD_STATUSES.has(lead.status));
  }, [leads]);

  const newLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads.filter(lead => lead?.status === 'new');
  }, [leads]);

  const tasksDueToday = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => task?.due_date === todayKey && task.status !== 'done');
  }, [tasks, todayKey]);

  const overdueTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(task => task?.due_date && task.due_date < todayKey && task.status !== 'done');
  }, [tasks, todayKey]);

  const outstandingAppointments = useMemo(() => {
    if (!Array.isArray(appointments) || !Array.isArray(payments)) return [];

    return appointments.filter(appt => {
      if (!appt || appt.status !== 'completed') return false;
      return !payments.some(
        payment => payment?.appointment_id === appt.id && payment.status === 'paid'
      );
    });
  }, [appointments, payments]);

  const outstandingCollectionTotal = useMemo(() => {
    return outstandingAppointments.reduce((sum, appt) => {
      const pendingPayment = payments.find(
        payment => payment?.appointment_id === appt.id && payment.status === 'pending'
      );

      if (pendingPayment) {
        return sum + Number(pendingPayment.amount || 0);
      }

      const service = services.find(
        item => item && String(item.id) === String(appt.service_id)
      );

      return sum + Number(service?.default_price || 0);
    }, 0);
  }, [outstandingAppointments, payments, services]);

  const activeClientsCount = useMemo(() => {
    if (!Array.isArray(patients)) return 0;
    return patients.filter(patient => patient?.status === 'active').length;
  }, [patients]);

  const revenueThisMonth = useMemo(() => {
    if (!Array.isArray(payments)) return 0;

    return payments
      .filter(payment => {
        if (!payment || payment.status !== 'paid' || !payment.payment_date) return false;
        return getMonthKey(payment.payment_date) === currentMonthKey;
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }, [payments, currentMonthKey]);

  const actionItemsCount =
    newLeads.length + overdueTasks.length + outstandingAppointments.length;

  const getAppointmentClientName = (appt) =>
    getPatientName(appt?.patient_id) ||
    getPersonName(appt?.person_id) ||
    t('Client', 'לקוח');

  const translateStatus = (status) => {
    const map = {
      scheduled: t('Scheduled', 'נקבע'),
      confirmed: t('Confirmed', 'אושר'),
      completed: t('Completed', 'הושלם'),
      cancelled: t('Cancelled', 'בוטל'),
      no_show: t('No Show', 'לא הגיע'),
      rescheduled: t('Rescheduled', 'נקבע מחדש')
    };

    return map[status] || status;
  };

  const getStatusClasses = (status) => {
    if (status === 'completed') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (status === 'cancelled' || status === 'no_show') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (status === 'confirmed') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const metricCards = [
    {
      label: t("Today's Appointments", 'תורים היום'),
      value: todayAppointments.length,
      meta: `${todayAppointments.filter(a => a.status === 'completed').length} ${t('completed', 'הושלמו')}`,
      onClick: () => navigate('calendar')
    },
    {
      label: t('Open Leads', 'לידים פתוחים'),
      value: openLeads.length,
      meta: `${newLeads.length} ${t('new inquiries', 'חדשים')}`,
      onClick: () => navigate('leads')
    },
    {
      label: t("Tasks Due Today", 'משימות להיום'),
      value: tasksDueToday.length,
      meta: `${overdueTasks.length} ${t('overdue', 'באיחור')}`,
      onClick: () => navigate('tasks')
    },
    {
      label: t('Open Collection', 'גבייה פתוחה'),
      value: `₪${formatMoney(outstandingCollectionTotal)}`,
      meta: `${outstandingAppointments.length} ${t('completed sessions', 'טיפולים שהושלמו')}`,
      onClick: () => navigate('finance')
    }
  ];

  return (
    <div className="space-y-6 text-start font-sans">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">
            {getGreeting(t)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {currentDateFormatted}
          </p>
        </div>

        <div className="text-xs text-slate-500">
          {t('Operational overview', 'סקירה תפעולית')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(card => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="rounded-xl border border-slate-200 bg-white p-4 text-start shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800" dir={String(card.value).startsWith('₪') ? 'ltr' : undefined}>
              {card.value}
            </h3>
            <p className="mt-1 text-xs text-slate-400">{card.meta}</p>
          </button>
        ))}
      </div>

      {actionItemsCount > 0 && (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              {t('Action Required', 'דורש טיפול')}
            </h3>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {actionItemsCount} {t('items', 'פריטים')}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {newLeads.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('leads')}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-start transition-colors hover:bg-slate-100"
              >
                <p className="text-xs font-bold text-slate-800">
                  {t('New Leads Awaiting Response', 'לידים חדשים שממתינים לחזרה')}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-700">{newLeads.length}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {t('Open leads pipeline', 'פתח את צינור הלידים')}
                </p>
              </button>
            )}

            {overdueTasks.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('tasks')}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-start transition-colors hover:bg-slate-100"
              >
                <p className="text-xs font-bold text-slate-800">
                  {t('Overdue Tasks', 'משימות באיחור')}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-700">{overdueTasks.length}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {t('Open work board', 'פתח את לוח העבודה')}
                </p>
              </button>
            )}

            {outstandingAppointments.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('finance')}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-start transition-colors hover:bg-slate-100"
              >
                <p className="text-xs font-bold text-slate-800">
                  {t('Completed Sessions Awaiting Collection', 'טיפולים שהושלמו וממתינים לגבייה')}
                </p>
                <p className="mt-1 text-lg font-bold text-slate-700">
                  {outstandingAppointments.length}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {t('Open finance', 'פתח את הכספים')}
                </p>
              </button>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-sm font-bold text-slate-800">
              {t("Today's Schedule", 'הלו״ז להיום')}
            </h3>
            <button
              type="button"
              onClick={() => navigate('calendar')}
              className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
            >
              {t('Open calendar', 'פתח יומן')}
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                {t('No appointments scheduled for today.', 'אין תורים מתוכננים להיום.')}
              </div>
            ) : (
              todayAppointments.map(appt => (
                <button
                  type="button"
                  key={appt.id}
                  onClick={() => navigate('calendar')}
                  className="flex w-full items-center justify-between p-4 text-start transition-colors hover:bg-slate-50/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700">
                      {appt.appointment_date
                        ? new Date(appt.appointment_date).toLocaleTimeString('he-IL', {
                            timeZone: BUSINESS_TIME_ZONE,
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '--:--'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {getAppointmentClientName(appt)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {getServiceName(appt.service_id) || t('Service', 'שירות')}
                      </p>
                    </div>
                  </div>

                  <span className={`rounded border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(appt.status)}`}>
                    {translateStatus(appt.status)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
            {t('Business Snapshot', 'תמונת מצב עסקית')}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {t('Active Clients', 'לקוחות פעילים')}
              </span>
              <span className="text-sm font-bold text-slate-800">{activeClientsCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {t('Revenue This Month', 'הכנסות החודש')}
              </span>
              <span className="text-sm font-bold text-emerald-600" dir="ltr">
                ₪{formatMoney(revenueThisMonth)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {t('Open Leads', 'לידים פתוחים')}
              </span>
              <span className="text-sm font-bold text-slate-800">{openLeads.length}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardOverview;
