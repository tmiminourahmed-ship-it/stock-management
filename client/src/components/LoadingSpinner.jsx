const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = { sm: 24, md: 40, lg: 56 };
  const px = sizes[size] || 40;
  return (
    <div className="loading-overlay" style={{ flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: px, height: px }} />
      {message && <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
