import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/roles";
import { formatMessageTime } from "../utils/time";
import RoleGlyph from "../components/RoleGlyph";

function isDangerAction(action) {
  return action === "USER_KICKED" || action === "USER_BANNED";
}

function formatActionText(action) {
  const map = {
    USER_KICKED: "Kicked user",
    USER_BANNED: "Banned user",
    USER_UNBANNED: "Unbanned user",
    USER_MUTED: "Muted user",
    USER_UNMUTED: "Unmuted user",
    USER_PROMOTED: "Promoted user",
    USER_DEMOTED: "Demoted user",
    ROOM_CREATED: "Created room",
    ROOM_DELETED: "Deleted room",
    ROOM_ARCHIVED: "Archived room",
    ROOM_UNARCHIVED: "Unarchived room",
    ROOM_ANNOUNCEMENT: "Posted announcement",
    MESSAGE_DELETED: "Deleted message",
  };
  return map[action] || action;
}

function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/audit");
      setLogs(res.data.logs || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (!user || user.role < 2) {
    return (
      <div className="table-page">
        <div className="table-page__inner">
          <div className="notice-box danger">
            <h2>Access denied</h2>
            <p>Moderator or SuperAdmin privileges are required to view audit logs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-page">
      <div className="table-page__inner">
        <div className="table-page__header">
          <h1 className="table-page__title">Audit log</h1>
          <p className="table-page__subtitle">
            Append-only record of privileged moderation and room operations.
          </p>
        </div>

        {message && <div className="notice-box danger">{message}</div>}

        <div className="data-table-container">
          {loading ? (
            <div className="table-page__loading">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="table-page__loading">No audit records found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Target</th>
                  <th scope="col">Room</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isDanger = isDangerAction(log.action);
                  const actorRole = log.performedBy?.role || 1;

                  return (
                    <tr key={log._id}>
                      <td>
                        <span className={`data-table__action ${isDanger ? "danger" : ""}`}>
                          {formatActionText(log.action)}
                        </span>
                        {log.details && (
                          <span className="data-table__details">{log.details}</span>
                        )}
                      </td>

                      <td>
                        <div className="data-table__role-cell">
                          <RoleGlyph level={actorRole} />
                          <span>{log.performedBy?.username || "System"}</span>
                        </div>
                      </td>

                      <td>
                        {log.targetUser ? (
                          <span className="data-table__cell-text">
                            {log.targetUser.username}
                          </span>
                        ) : (
                          <span className="data-table__cell-muted">—</span>
                        )}
                      </td>

                      <td>
                        {log.room ? (
                          <span className="data-table__cell-text">
                            #{log.room.name}
                          </span>
                        ) : (
                          <span className="data-table__cell-muted">—</span>
                        )}
                      </td>

                      <td>
                        <span className="data-table__cell-time">
                          {formatMessageTime(log.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
