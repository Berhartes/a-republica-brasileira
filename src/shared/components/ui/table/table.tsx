import React from 'react';

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
}

export const TableCell: React.FC<TableCellProps> = ({ className = '', children }) => {
  return (
    <td className={`table-cell ${className}`}>
      {children}
    </td>
  );
};
