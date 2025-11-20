import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  error?: string;
  options?: { value: string; label: string }[]; // If present, renders a select
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', options, ...props }) => {
  const baseClass = "w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 bg-white text-slate-800 placeholder-slate-400";
  const errorClass = error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200" : "";

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">
        {label}
      </label>
      {options ? (
        <select className={`${baseClass} ${errorClass} ${className}`} {...(props as any)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input 
          className={`${baseClass} ${errorClass} ${className}`} 
          {...props} 
        />
      )}
      {error && <p className="text-xs text-rose-500 mt-1 ml-1">{error}</p>}
    </div>
  );
};
