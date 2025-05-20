import React from 'react';

interface YearSelectorProps {
  selectedYear: number | null;
  availableYears: number[];
  onChange: (year: number | null) => void;
  label?: string;
  className?: string;
}

/**
 * Componente de seleção de ano com opção "Todos os anos"
 */
const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  availableYears,
  onChange,
  label = 'Selecione o ano:',
  className = ''
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className="mr-2 text-sm font-medium text-gray-700">
          {label}
        </span>
      )}
      <select
        value={selectedYear === null ? 'todos' : selectedYear}
        onChange={(e) => onChange(e.target.value === 'todos' ? null : Number(e.target.value))}
        className="px-4 py-1 text-sm rounded-full bg-gray-100 border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
          paddingRight: '2rem'
        }}
      >
        <option value="todos">Todos os anos</option>
        {availableYears.map((year: number) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;
