import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ServicesCatalog = () => {
  const { services = [], addService, updateService, deleteService, t } = useContext(ClinicContext);
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  const safeServices = Array.isArray(services) ? services : [];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: '45',
    default_price: '',
    type: 'service', // 'service', 'package', 'product', 'subscription'
    session_count: '10'
  });

  const openCreateModal = () => {
    setEditingItemId(null);
    setFormData({
      name: '',
      description: '',
      duration_minutes: '45',
      default_price: '',
      type: 'service',
      session_count: '10'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    if (!item) return;
    setEditingItemId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      duration_minutes: item.duration_minutes !== undefined && item.duration_minutes !== null ? String(item.duration_minutes) : '45',
      default_price: item.default_price !== undefined && item.default_price !== null ? String(item.default_price) : (item.price !== undefined ? String(item.price) : ''),
      type: item.type || 'service',
      session_count: item.session_count !== undefined && item.session_count !== null ? String(item.session_count) : '10'
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm(t('Are you sure you want to delete this catalog item?', 'האם אתה בטוח שברצונך למחוק פריט זה מהקטלוג?'))) {
      await deleteService(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.default_price) {
      alert(t('Please enter item name and price.', 'אנא מלא שם פריט ומחיר.'));
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || '',
      duration_minutes: formData.type === 'product' ? 0 : parseInt(formData.duration_minutes || 0),
      default_price: parseFloat(formData.default_price || 0),
      type: formData.type || 'service',
      session_count: formData.type === 'package' ? parseInt(formData.session_count || 10) : null
    };

    if (editingItemId) {
      updateService(editingItemId, payload);
    } else {
      addService(payload);
    }

    setIsModalOpen(false);
    setEditingItemId(null);
  };

  const filteredItems = safeServices.filter(item => {
    if (!item) return false;
    if (activeTypeFilter === 'all') return true;
    const itemType = item.type || 'service';
    return itemType === activeTypeFilter;
  });

  const translateType = (type) => {
    const map = {
      'service': t('Single Treatment', 'טיפול בודד'),
      'package': t('Punch Card / Package', 'כרטיסייה / חבילה'),
      'product': t('Physical Product', 'מוצר פיזי'),
      'subscription': t('Mentorship / Subscription', 'תוכנית ליווי / מנוי')
    };
    return map[type] || t('Treatment', 'טיפול');
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'package':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'product':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'subscription':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6 text-start">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0 gap-1">
          <button 
            onClick={() => setActiveTypeFilter('all')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTypeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('All Items', 'הכל')} ({safeServices.length})
          </button>
          <button 
            onClick={() => setActiveTypeFilter('service')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTypeFilter === 'service' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('Treatments', 'טיפולים בודדים')}
          </button>
          <button 
            onClick={() => setActiveTypeFilter('package')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTypeFilter === 'package' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('Packages & Punch Cards', 'כרטיסיות וחבילות')}
          </button>
          <button 
            onClick={() => setActiveTypeFilter('product')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTypeFilter === 'product' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('Products', 'מוצרים פיזיים')}
          </button>
          <button 
            onClick={() => setActiveTypeFilter('subscription')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTypeFilter === 'subscription' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {t('Subscriptions', 'תוכניות ליווי ומנויים')}
          </button>
        </div>

        <button 
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          {t('Add New Item / Service', 'הוסף מוצר / שירות / חבילה')}
        </button>
      </div>

      {/* Offerings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
            {t('No catalog items found matching this filter.', 'לא נמצאו פריטים בקטלוג תחת קטגוריה זו.')}
          </div>
        ) : (
          filteredItems.map(item => {
            if (!item) return null;
            const itemType = item.type || 'service';
            const priceVal = item.default_price !== undefined && item.default_price !== null ? item.default_price : (item.price || 0);

            return (
              <div key={item.id || Math.random()} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group relative">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getTypeBadge(itemType)}`}>
                      {translateType(itemType)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-slate-800" dir="ltr">₪{parseFloat(priceVal).toFixed(0)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-emerald-600 transition-colors">{item.name || 'ללא שם'}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description || '-'}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                  {itemType === 'package' ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      🎟️ {item.session_count || 10} {t('sessions included', 'טיפולים כלולים')}
                    </span>
                  ) : itemType === 'product' ? (
                    <span>📦 {t('Physical product', 'מוצר למכירה')}</span>
                  ) : itemType === 'subscription' ? (
                    <span className="text-purple-600 font-bold">♾️ {t('Monthly retainer', 'מנוי מתמשך')}</span>
                  ) : (
                    <span>⏱️ {item.duration_minutes || 30} {t('minutes', 'דקות')}</span>
                  )}

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title={t('Edit Item', 'ערוך פריט')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title={t('Delete Item', 'מחק פריט')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">{editingItemId ? t('Edit Offering', 'עריכת פריט בקטלוג') : t('Add Offering to Catalog', 'הוספת פריט/שירות לקטלוג')}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{t('Define a service, package, product or subscription.', 'צור טיפול בודד, כרטיסייה, מוצר פיזי או תוכנית ליווי.')}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-start">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Item Type', 'סוג הפריט')}</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                  <option value="service">🩺 {t('Single Treatment', 'טיפול / שירות בודד')}</option>
                  <option value="package">🎟️ {t('Punch Card / Package', 'כרטיסייה / חבילת טיפולים')}</option>
                  <option value="product">📦 {t('Physical Product', 'מוצר פיזי (משחות/ציוד)')}</option>
                  <option value="subscription">⭐ {t('Mentorship / Subscription', 'תוכנית ליווי / מנוי חודשי')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Item Name', 'שם הפריט / השירות')} *</label>
                <input 
                  type="text" 
                  required
                  placeholder={t('e.g. 10-Session Therapy Package', 'למשל: כרטיסיית 10 טיפולים, משחת שיקום')}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Price (₪)', 'מחיר (₪)')} *</label>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.default_price}
                    onChange={e => setFormData({ ...formData, default_price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>

                {formData.type === 'package' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Number of Sessions', 'מספר טיפולים בחבילה')}</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.session_count}
                      onChange={e => setFormData({ ...formData, session_count: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Duration (Mins)', 'משך בדקות')}</label>
                    <input 
                      type="number" 
                      disabled={formData.type === 'product'}
                      value={formData.duration_minutes}
                      onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold disabled:bg-slate-100 outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{t('Description', 'תיאור קצר')}</label>
                <textarea 
                  rows="2"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-colors text-xs"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition-colors text-xs"
                >
                  {editingItemId ? t('Update Item', 'עדכן פריט') : t('Save Item', 'שמור פריט לקטלוג')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServicesCatalog;
