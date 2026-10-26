import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/roles";
import RoleGlyph from "../components/RoleGlyph";

function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId, newRole) => {
    setMessage("");

    try {
      await api.patch(`/users/${userId}/role`, {
        role: Number(newRole),
      });

      setMessage("User role updated successfully.");
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update role");
    }
  };

  if (!user || user.role < 3) {
    return (
      <div className="table-page">
        <div className="table-page__inner">
          <div className="notice-box danger">
            <h2>Access denied</h2>
            <p>SuperAdmin privileges are required to access this panel.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-page">
      <div className="table-page__inner">
        <div className="table-page__header">
          <h1 className="table-page__title">User roles</h1>
          <p className="table-page__subtitle">
            Manage permissions and access levels across the platform.
          </p>
        </div>

        {message && <div className="notice-box info">{message}</div>}

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Current role</th>
                <th scope="col">Change role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = u._id || u.id;
                const isSelf = user.id === id;

                return (
                  <tr key={id}>
                    <td>
                      <div className="data-table__user-cell">
                        <span className="data-table__username">{u.username}</span>
                        <span className="data-table__email">{u.email}</span>
                      </div>
                    </td>

                    <td>
                      <div className="data-table__role-cell">
                        <RoleGlyph level={u.role} />
                        <span>{getRoleName(u.role)}</span>
                      </div>
                    </td>

                    <td>
                      <div className="data-table__action-cell">
                        <select
                          className="table-select"
                          value={u.role}
                          onChange={(e) => updateRole(id, e.target.value)}
                          disabled={isSelf}
                          aria-label={`Change role for ${u.username}`}
                        >
                          <option value={1}>Member</option>
                          <option value={2}>Moderator</option>
                          <option value={3}>SuperAdmin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
