const EmptyState = ({ icon = '📭', title = 'Aucune donnée', message = '', action = null }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-title">{title}</div>
    {message && <div className="empty-state-text">{message}</div>}
    {action && <div style={{ marginTop: 20 }}>{action}</div>}
  </div>
);

export default EmptyState;
