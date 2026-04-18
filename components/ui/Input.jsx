import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const Input = ({
  label,
  error,
  type = 'text',
  style = {},
  ...props
}) => {
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: colors.text,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        style={{
          padding: '12px 14px',
          borderRadius: '10px',
          border: `1px solid ${error ? colors.error : colors.border}`,
          backgroundColor: colors.bg,
          color: colors.text,
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.2s ease',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
          e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? colors.error : colors.border;
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: colors.error }}>{error}</span>
      )}
    </div>
  );
};

export default Input;