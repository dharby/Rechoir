import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const Card = ({
  children,
  style = {},
  ...props
}) => {
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  
  return (
    <div
      style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        padding: '24px',
        transition: 'all 0.3s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;