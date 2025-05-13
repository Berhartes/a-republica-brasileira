import React from 'react';

// Tabs Component
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className = '', children }) => {
  return (
    <div className={`tabs ${className}`}>
      {children}
    </div>
  );
};

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export const TabsList: React.FC<TabsListProps> = ({ className = '', children }) => {
  return (
    <div className={`tabs-list ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children, onClick }) => {
  return (
    <button 
      className={`tabs-trigger ${className}`} 
      data-value={value}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children }) => {
  return (
    <div 
      className={`tabs-content ${className}`} 
      data-value={value}
    >
      {children}
    </div>
  );
};

// Table Component
interface TableProps {
  className?: string;
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ className = '', children }) => {
  return (
    <table className={`table ${className}`}>
      {children}
    </table>
  );
};

interface TableHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ className = '', children }) => {
  return (
    <thead className={`table-header ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  className?: string;
  children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ className = '', children }) => {
  return (
    <tbody className={`table-body ${className}`}>
      {children}
    </tbody>
  );
};

interface TableRowProps {
  className?: string;
  children: React.ReactNode;
}

export const TableRow: React.FC<TableRowProps> = ({ className = '', children }) => {
  return (
    <tr className={`table-row ${className}`}>
      {children}
    </tr>
  );
};

interface TableHeadProps {
  className?: string;
  children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ className = '', children }) => {
  return (
    <th className={`table-head ${className}`}>
      {children}
    </th>
  );
};

interface TableCellProps {
  className?: string;
  children: React.ReactNode;
  title?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ className = '', children, title }) => {
  return (
    <td className={`table-cell ${className}`} title={title}>
      {children}
    </td>
  );
};

// Badge Component
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  className = '', 
  children 
}) => {
  const variantClasses = {
    default: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    destructive: 'bg-red-500 text-white',
    outline: 'bg-transparent border border-gray-300 text-gray-700',
    success: 'bg-green-500 text-white'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Alert Component
type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default', 
  className = '', 
  children 
}) => {
  const variantClasses = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    success: 'bg-green-50 text-green-800 border-green-200'
  };

  return (
    <div className={`p-4 rounded-md border ${variantClasses[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
};

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <h5 className={`font-medium mb-1 ${className}`}>
      {children}
    </h5>
  );
};

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  return (
    <div
      role="status"
      className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${className || ''}`}
      {...props}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  )
}

// Card Component
interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`p-4 border-b ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <h3 className={`font-semibold text-lg ${className}`}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

// Button Component
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default',
  className = '', 
  children,
  ...props
}) => {
  const variantClasses = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    link: 'text-blue-500 underline hover:text-blue-600'
  };

  const sizeClasses = {
    default: 'py-2 px-4',
    sm: 'py-1 px-2 text-sm',
    lg: 'py-3 px-6 text-lg',
    icon: 'p-2'
  };

  return (
    <button 
      className={`rounded font-medium transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  ...props
}) => {
  return (
    <input 
      className={`border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
};

// Skeleton Component
interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '' 
}) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};
