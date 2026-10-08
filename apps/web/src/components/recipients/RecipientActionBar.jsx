import React from 'react';

export function RecipientActionBar({ onCancel, onSaveAndBook, isSubmitting }) {
  return (
    <div className="rf-action-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--rf-text-secondary)', fontSize: '13px', fontWeight: 500 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--rf-surface-tint)' }}>
          verified
        </span>
        <span>Information is private to your family account</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', width: '100%', maxWidth: '600px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rf-btn-secondary"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSaveAndBook}
          disabled={isSubmitting}
          className="rf-btn-outline"
        >
          {isSubmitting ? 'Saving…' : 'Save & Immediately Request Care'}
        </button>

        <button
          type="submit"
          form="recipientForm"
          disabled={isSubmitting}
          className="rf-btn-primary"
        >
          <span>{isSubmitting ? 'Saving…' : 'Save & Add Recipient'}</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}
