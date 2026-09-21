import React from 'react';

export default function PageHeader({ title, actionButton, tabs, filters }) {
  return (
    <div className="space-y-4 mb-6 border-b border-slate-800/80 pb-4 dir-rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {actionButton && <div>{actionButton}</div>}
      </div>

      {(tabs || filters) && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {tabs && (
            <div className="flex items-center space-x-1 space-x-reverse bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {tabs}
            </div>
          )}
          {filters && (
            <div className="flex items-center space-x-3 space-x-reverse">
              {filters}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
