import React from 'react';

export default function LeaveRequests({ requests, onApprove, onReject }) {
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="leave-container">
      <h1>📋 Leave Requests</h1>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
          ⏳ Pending Requests ({pendingRequests.length})
        </h2>
        <div className="leave-list">
          {pendingRequests.length === 0 ? (
            <p style={{ color: '#999', fontSize: '14px' }}>No pending leave requests</p>
          ) : (
            pendingRequests.map(request => (
              <div key={request.id} className="leave-item" style={{ borderLeftColor: request.color }}>
                <div className="leave-avatar" style={{ '--leave-color': request.color }}>
                  {request.initials}
                </div>
                <div className="leave-details">
                  <div className="leave-name">{request.name}</div>
                  <div className="leave-type">{request.type}</div>
                  <div className="leave-dates">{request.dates}</div>
                </div>
                <div className="leave-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => onApprove(request)}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => onReject(request)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
          ✓ Processed Requests ({processedRequests.length})
        </h2>
        <div className="leave-list">
          {processedRequests.map(request => (
            <div key={request.id} className="leave-item" style={{ borderLeftColor: request.color }}>
              <div className="leave-avatar" style={{ '--leave-color': request.color }}>
                {request.initials}
              </div>
              <div className="leave-details">
                <div className="leave-name">{request.name}</div>
                <div className="leave-type">{request.type}</div>
                <div className="leave-dates">{request.dates}</div>
              </div>
              <div className={`leave-status status-${request.status}`}>
                {request.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
