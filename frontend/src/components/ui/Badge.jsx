const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: { backgroundColor: '#334155', color: '#f8fafc' },
    primary: { backgroundColor: '#1e40af', color: '#ffffff' },
    success: { backgroundColor: '#059669', color: '#ffffff' },
    warning: { backgroundColor: '#f59e0b', color: '#000000' },
    danger: { backgroundColor: '#dc2626', color: '#ffffff' },
    secondary: { backgroundColor: '#d97706', color: '#ffffff' },
  };

  return (
    <span
      style={{
        ...variants[variant],
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      className={className}
    >
      {children}
    </span>
  );
};

export default Badge;
