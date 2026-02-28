import { Loader2 } from 'lucide-react';
import { theme } from '../utils/theme';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'text-white shadow-lg hover:shadow-xl transition-all duration-200',
    secondary: 'hover:shadow-md transition-all duration-200',
    danger: 'text-white hover:shadow-xl transition-all duration-200 shadow-lg',
    outline: 'border-2 hover:shadow-md transition-all duration-200',
  };

  const variantStyles = {
    primary: {
      background: '#039E2F',
      border: 'none',
      color: theme.colors.text.white,
    },
    secondary: {
      backgroundColor: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.light}`,
      color: theme.colors.text.primary,
    },
    outline: {
      borderColor: theme.colors.primary.main,
      backgroundColor: 'transparent',
      color: theme.colors.primary.main,
    },
    danger: {
      backgroundColor: theme.colors.status.error,
      border: 'none',
      color: theme.colors.text.white,
    },
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} rounded-xl font-semibold`}
      style={variantStyles[variant]}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

