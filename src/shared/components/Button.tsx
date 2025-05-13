import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  const variants = {
    primary: 'bg-congress-primary hover:bg-congress-dark dark:bg-congress-dark-primary dark:hover:bg-congress-dark-accent text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100',
    danger: 'bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white'
  };

  return (
    <button
      className={`
        px-4 py-2 rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2
        ${variants[variant]}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
