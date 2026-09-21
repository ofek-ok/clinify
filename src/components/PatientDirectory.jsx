import React, { useContext, useState, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import ClientDetailDrawer from './ClientDetailDrawer';
import { Search } from 'lucide-react';

export default function PatientDirectory() {
  const { patients, appointments, payments } = useContext(ClinicContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const clientsData = useMemo(() => {
    return patients.map(p => {
      // Find appointments for client
      const clientAppts = appointments.filter(a => a.patient_id === p.id || a.person_id === p.person_id);
      const now = new Date();

      const futureAppts = clientAppts
        .filter(a => new Date(a.appointment_date) > now && a.status !== 'cancelled')
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
      
      const pastAppts = clientAppts
        .filter(a => new Date(a.appointment_date) <= now || a.status === 'completed')
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

      const nextAppt = futureAppts[0];
      const lastAppt = pastAppts[0];

      // Calculate total paid
      const clientPayments = payments.filter(pay => (pay.patient_id === p.id || pay.person_id === p.person_id) && pay.status === 'paid');
      const totalPaid = clientPayments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0);

      return {
        ...p,
        nextApptDate: nextAppt ? new Date(nextAppt.appointment_date).toLocaleDateString('he-IL') : '-',
        lastApptDate: lastAppt ? new Date(lastAppt.appointment_date).toLocaleDateString('he-IL') : '-',
        totalPaid
      };
    });
  }, [patients, appointments, payments]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientsData;
    const term = searchTerm.toLowerCase();
    return clientsData.filter(c =>
      (c.full_name && c.full_name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }, [clientsData, searchTerm]);

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="חיפוש לקוח לפי שם, טלפון..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          סה״כ לקוחות: <span className="text-white font-bold">{filteredClients.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                <th className="py-3 px-4 text-start">שם</th>
                <th className="py-3 px-4 text-start">טלפון</th>
                <th className="py-3 px-4 text-start">סטטוס</th>
                <th className="py-3 px-4 text-start">תור הבא</th>
                <th className="py-3 px-4 text-start">מפגש אחרון</th>
                <th className="py-3 px-4 text-start">סה"כ ששולם</th>
                <th className="py-3 px-4 text-end">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    אין עדיין לקוחות להצגה.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-white">
                      {client.full_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 dir-ltr text-right">
                      {client.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        (client.status || 'active') === 'active'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {(client.status || 'active') === 'active' ? 'לקוח פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {client.nextApptDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {client.lastApptDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ₪{client.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                        }}
                        className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
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

      {/* Client Detail Drawer */}
      {selectedClient && (
        <ClientDetailDrawer
          item={selectedClient}
          type="patient"
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
