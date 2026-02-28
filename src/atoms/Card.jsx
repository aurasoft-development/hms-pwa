import { theme } from '../utils/theme';

export const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  gradient = false,
  ...props
}) => {
  return (
    <div
      className={`
        rounded-2xl shadow-lg border
        ${padding ? 'p-4 sm:p-6' : ''}
        ${hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backgroundColor: theme.colors.background.primary,
        borderColor: theme.colors.border.light,
        ...(gradient && {
          background: theme.colors.gradients.card,
        }),
      }}
      {...props}
    >
      {children}
    </div>
  );
};

