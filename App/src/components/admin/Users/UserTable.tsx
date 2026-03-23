import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDetailModal from "./UserDetailModal";

interface User {
  id: string;
  email: string;
  role: string;
  account_status: string;
  registration_date: string;
}

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onRefresh }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status.toLowerCase().replace(" ", "-");
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };
  const getRoleBadge = (role: string) => {
    const roleClass = role.toLowerCase();
    return <span className={`role-badge ${roleClass}`}>{role}</span>;
  };

  return (
    <>
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="email-cell">{user.email}</td>
                <td>{getRoleBadge(user.role)}</td>
                <td>{getStatusBadge(user.account_status)}</td>
                <td>{new Date(user.registration_date).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(user)}
                    title="View details"
                  >
                    👁️ View
                  </button>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    title="Edit user"
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedUser && (
        <UserDetailModal user={selectedUser} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default UserTable;
