import { Loader2 } from 'lucide-react';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style = {},
  ...props
}) => {
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled ? '0.5' : '1',
    border: 'none',
    outline: 'none',
    ...style,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
      color: '#ffffff',
      boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `2px solid ${colors.border}`,
    },
    danger: {
      backgroundColor: colors.error,
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.textSecondary,
    },
    success: {
      backgroundColor: colors.success,
      color: '#ffffff',
    },
  };

  const sizes = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 20px', fontSize: '14px' },
    lg: { padding: '14px 28px', fontSize: '16px' },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variants[variant],
        ...sizes[size],
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;