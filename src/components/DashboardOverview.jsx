import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, CalendarDays, Mountain, Sparkles } from 'lucide-react';

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

const HERO_SCENES = [
  {
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=82',
    eyebrow: 'DRIVE',
    title: 'Keep moving toward the next peak.',
    subtitle: 'Clarity on what matters. Momentum on what comes next.'
  },
  {
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82',
    eyebrow: 'CALM',
    title: 'Create space for better decisions.',
    subtitle: 'A clear system gives you room to focus.'
  },
  {
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=82',
    eyebrow: 'FOCUS',
    title: 'One direction. Fewer distractions.',
    subtitle: 'Turn the noise into a clear next action.'
  },
  {
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=82',
    eyebrow: 'PROGRESS',
    title: 'Build momentum, one move at a time.',
    subtitle: 'See the business clearly and keep moving.'
  }
];

const DashboardOverview = ({ navigate }) => {
  const {
    patients = [],
    leads = [],
    appointments = [],
    services = [],
    tasks = [],
    payments = [],
    expenses = [],
    getPatientName = () => '',
    getPersonName = () => '',
    getServiceName = () => ''
  } = useContext(ClinicContext) || {};

  const { t } = useContext(LanguageContext);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex(current => (current + 1) % HERO_SCENES.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, []);

  const hero = HERO_SCENES[heroIndex];

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


  const financialTrendData = useMemo(() => {
    const nowParts = getDateParts();
    const baseMonth = new Date(
      Date.UTC(Number(nowParts.year), Number(nowParts.month) - 1, 1, 12)
    );

    return Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index;
      const monthDate = new Date(
        Date.UTC(baseMonth.getUTCFullYear(), baseMonth.getUTCMonth() - offset, 1, 12)
      );
      const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = monthDate.toLocaleDateString('he-IL', {
        month: 'short',
        timeZone: 'UTC'
      });

      const income = payments
        .filter(payment => {
          if (!payment || payment.status !== 'paid' || !payment.payment_date) return false;
          return getMonthKey(payment.payment_date) === key;
        })
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      const spend = expenses
        .filter(expense => {
          if (!expense?.expense_date) return false;
          return getMonthKey(expense.expense_date) === key;
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        key,
        label,
        income,
        expenses: spend
      };
    });
  }, [payments, expenses]);

  const leadStageData = useMemo(() => {
    const stages = [
      { id: 'new', label: t('New', 'חדש') },
      { id: 'contacted', label: t('Contacted', 'יצרנו קשר') },
      { id: 'qualified', label: t('Qualified', 'מתאים') },
      { id: 'scheduled', label: t('Scheduled', 'נקבע תור') },
      { id: 'won', label: t('Client', 'לקוח') },
      { id: 'lost', label: t('Lost', 'אבוד') }
    ];

    return stages.map(stage => ({
      stage: stage.label,
      value: leads.filter(lead => lead?.status === stage.id).length
    }));
  }, [leads, t]);

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
      <section className="group relative min-h-[280px] overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        {HERO_SCENES.map((scene, index) => (
          <img
            key={scene.image}
            src={scene.image}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${index === heroIndex ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/88 via-slate-950/48 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

        <div className="relative z-10 flex min-h-[280px] flex-col justify-between p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-white backdrop-blur-md">
              <Mountain className="h-3.5 w-3.5 text-cyan-300" />
              {hero.eyebrow}
            </div>
            <div className="flex items-center gap-1.5">
              {HERO_SCENES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Hero ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${index === heroIndex ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/75">
              <CalendarDays className="h-4 w-4" />
              {currentDateFormatted}
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{getGreeting(t)}</h2>
            <p className="mt-3 text-lg font-bold leading-tight text-white sm:text-xl">{hero.title}</p>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/70">{hero.subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('work')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                {t('Open work', 'פתח עבודה')}
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('calendar')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4 text-violet-300" />
                {t('View today', 'היום שלי')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(card => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-start shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_40px_rgba(79,70,229,0.10)]"
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


      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t('Revenue vs. Expenses — 6 Months', 'הכנסות מול הוצאות — 6 חודשים')}
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                {t('Based only on recorded payments and expenses', 'מבוסס רק על תשלומים והוצאות שנרשמו במערכת')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('finance')}
              className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              {t('Open finance', 'פתח כספים')}
            </button>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialTrendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => `₪${Number(value).toLocaleString('he-IL')}`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `₪${formatMoney(value)}`,
                    name === 'income' ? t('Revenue', 'הכנסות') : t('Expenses', 'הוצאות')
                  ]}
                  labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#059669" fill="#10b981" fillOpacity={0.12} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#e11d48" fill="#fb7185" fillOpacity={0.08} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t('Leads by Current Stage', 'לידים לפי שלב נוכחי')}
              </h3>
              <p className="mt-1 text-[11px] text-slate-500">
                {t('Live CRM status — no estimated or synthetic data', 'מצב ה-CRM בפועל — ללא נתונים משוערים או נתוני דמה')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('leads')}
              className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              {t('Open CRM', 'פתח CRM')}
            </button>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadStageData} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(value) => [value, t('Leads', 'לידים')]}
                  labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                  contentStyle={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
            <h3 className="text-sm font-bold text-slate-800">
              {t("Today's Schedule", 'הלו״ז להיום')}
            </h3>
            <button
              type="button"
              onClick={() => navigate('calendar')}
              className="text-xs font-semibold text-violet-600 transition-colors hover:text-violet-700"
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
