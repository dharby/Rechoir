const ProgressBar = ({ value, max = 100, color, showLabel = false }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getColor = () => {
    if (color) return color;
    if (percentage < 40) return '#dc2626';
    if (percentage < 70) return '#f59e0b';
    return '#059669';
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#334155',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(),
            borderRadius: '9999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginTop: '4px',
            display: 'block',
          }}
        >
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
