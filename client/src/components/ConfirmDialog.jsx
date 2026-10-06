const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Supprimer', confirmVariant = 'btn-danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">⚠️ {title}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>Annuler</button>
          <button className={`btn ${confirmVariant}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
