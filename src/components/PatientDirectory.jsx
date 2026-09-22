import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import ClientDetailDrawer from './ClientDetailDrawer';
import { Search } from 'lucide-react';

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('he-IL', {
    timeZone: BUSINESS_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('he-IL', {
    timeZone: BUSINESS_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function PatientDirectory() {
  const { people = [], patients = [], leads = [], appointments = [], payments = [] } = useContext(ClinicContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const clientsData = useMemo(() => {
    const patientByPerson = new Map(patients.map(patient => [patient.person_id, patient]));
    const leadByPerson = new Map(leads.map(lead => [lead.person_id, lead]));
    const now = new Date();

    return people
      .filter(person => person?.client_status === 'customer')
      .map(person => {
        const patient = patientByPerson.get(person.id) || null;
        const lead = leadByPerson.get(person.id) || null;
        const clientAppointments = appointments.filter(
          appointment =>
            appointment?.person_id === person.id ||
            (patient?.id && appointment?.patient_id === patient.id)
        );

        const futureAppointments = clientAppointments
          .filter(appointment => {
            const appointmentDate = new Date(appointment.appointment_date);
            return (
              !Number.isNaN(appointmentDate.getTime()) &&
              appointmentDate > now &&
              !['cancelled', 'rescheduled', 'completed'].includes(appointment.status)
            );
          })
          .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        const completedAppointments = clientAppointments
          .filter(appointment => appointment?.status === 'completed')
          .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

        const clientPayments = payments.filter(
          payment =>
            payment?.status === 'paid' &&
            (payment.person_id === person.id || (patient?.id && payment.patient_id === patient.id))
        );

        const totalPaid = clientPayments.reduce(
          (sum, payment) => sum + Number(payment.amount || 0),
          0
        );

        return {
          ...person,
          source: lead?.source || person.source || null,
          campaign: lead?.campaign || null,
          patient,
          nextAppointment: futureAppointments[0] || null,
          lastCompletedAppointment: completedAppointments[0] || null,
          totalPaid
        };
      })
      .sort((a, b) => {
        const aDate = a.customer_since ? new Date(a.customer_since).getTime() : 0;
        const bDate = b.customer_since ? new Date(b.customer_since).getTime() : 0;
        return bDate - aDate;
      });
  }, [people, patients, leads, appointments, payments]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clientsData;

    return clientsData.filter(client =>
      client.full_name?.toLowerCase().includes(term) ||
      client.phone?.includes(searchTerm.trim()) ||
      client.email?.toLowerCase().includes(term)
    );
  }, [clientsData, searchTerm]);

  return (
    <div className="space-y-4 text-start font-sans" dir="rtl">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="חיפוש לפי שם, טלפון או אימייל..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-9 pl-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="text-xs font-medium text-slate-500">
          {searchTerm ? (
            <>
              מוצגים: <span className="font-bold text-slate-900">{filteredClients.length}</span> מתוך {clientsData.length}
            </>
          ) : (
            <>
              סה״כ לקוחות: <span className="font-bold text-slate-900">{clientsData.length}</span>
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-start">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500">
                <th className="px-4 py-3 text-start">לקוח</th>
                <th className="px-4 py-3 text-start">קשר</th>
                <th className="px-4 py-3 text-start">לקוח מאז</th>
                <th className="px-4 py-3 text-start">תיק טיפולי</th>
                <th className="px-4 py-3 text-start">תור הבא</th>
                <th className="px-4 py-3 text-start">טיפול אחרון</th>
                <th className="px-4 py-3 text-start">סה״כ שולם</th>
                <th className="px-4 py-3 text-end">פעולה</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    {searchTerm ? 'לא נמצאו לקוחות התואמים לחיפוש.' : 'אין עדיין לקוחות להצגה.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{client.full_name}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {client.source || 'ללא מקור'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-slate-700" dir="ltr">
                        {client.phone || '-'}
                      </div>
                      {client.email && (
                        <div className="mt-0.5 max-w-[210px] truncate text-[10px] text-slate-500" dir="ltr">
                          {client.email}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      {formatDate(client.customer_since)}
                    </td>

                    <td className="px-4 py-3.5">
                      {client.patient ? (
                        <span className="inline-flex rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          קיים
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          טרם נפתח
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {formatDateTime(client.nextAppointment?.appointment_date)}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500">
                      {formatDateTime(client.lastCompletedAppointment?.appointment_date)}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-violet-600" dir="ltr">
                      ₪{client.totalPaid.toLocaleString('he-IL')}
                    </td>

                    <td className="px-4 py-3.5 text-end">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          setSelectedClient(client);
                        }}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-violet-700 transition-colors hover:bg-slate-200"
                      >
                        פרטים
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedClient && (
        <ClientDetailDrawer
          item={selectedClient}
          type="person"
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
