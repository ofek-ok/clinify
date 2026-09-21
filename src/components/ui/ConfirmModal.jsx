import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'אישור', cancelText = 'ביטול', isDanger = false, inputField }) {
  const [inputValue, setInputValue] = React.useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputField) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    setInputValue('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dir-rtl">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {message && <p className="text-xs text-slate-300 leading-relaxed">{message}</p>}

        {inputField && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">{inputField.label}</label>
            <input
              type="text"
              required={inputField.required}
              placeholder={inputField.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
              isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
