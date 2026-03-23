import React from "react";

interface User {
  id: string;
  email: string;
  role: string;
  account_status: string;
  registration_date: string;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-row">
            <label>Email:</label>
            <span>{user.email}</span>
          </div>

          <div className="detail-row">
            <label>Role:</label>
            <span className={`role-badge ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>
          <div className="detail-row">
            <label>Status:</label>
            <span
              className={`status-badge ${user.account_status.toLowerCase().replace(" ", "-")}`}
            >
              {user.account_status}
            </span>
          </div>

          <div className="detail-row">
            <label>Registration Date:</label>
            <span>{new Date(user.registration_date).toLocaleString()}</span>
          </div>
          <div className="detail-row">
            <label>User ID:</label>
            <span className="user-id">{user.id}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
