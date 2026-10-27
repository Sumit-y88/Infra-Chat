import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getRoleName } from "../utils/roles";
import RoleGlyph from "./RoleGlyph";

function getInitials(name) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

function InfoPanel({
  user,
  selectedChat,
  members = [],
  onlineUsers = [],
  handleModerationAction,
  refreshSelectedRoomMembers,
  refreshRooms,
  isOpen = true,
  onClose,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roomMessage, setRoomMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setAllUsers(res.data.users || []);
      } catch (error) {
        console.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, []);

  const canModerate = user && user.role >= 2;

  const memberIds = useMemo(
    () => members.map((m) => m._id || m.id),
    [members]
  );

  const addableUsers = allUsers.filter(
    (u) => !memberIds.includes(u._id || u.id)
  );

  const addMember = async () => {
    if (!selectedUserId || selectedChat?.type !== "room") return;

    try {
      await api.post(`/rooms/${selectedChat.data._id}/members`, {
        userId: selectedUserId,
      });

      setRoomMessage("Member added successfully.");
      setSelectedUserId("");

      await refreshSelectedRoomMembers?.(selectedChat.data._id);
      await refreshRooms?.();
    } catch (err) {
      setRoomMessage(err.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async (targetUserId) => {
    if (selectedChat?.type !== "room") return;

    try {
      await api.delete(`/rooms/${selectedChat.data._id}/members/${targetUserId}`);
      setRoomMessage("Member removed successfully.");

      await refreshSelectedRoomMembers?.(selectedChat.data._id);
      await refreshRooms?.();
    } catch (err) {
      setRoomMessage(err.response?.data?.message || "Failed to remove member");
    }
  };

  if (!selectedChat) {
    return (
      <aside className={`panel-right ${isOpen ? "" : "panel-right--hidden"}`} aria-label="Details panel">
        <div className="panel-right__header">
          <span className="panel-right__title">Details</span>
          {onClose && (
            <button className="icon-btn panel-right__close" onClick={onClose} aria-label="Close panel">
              ✕
            </button>
          )}
        </div>
        <div className="panel-right__body">
          <p className="panel-right__empty">Select a conversation to view details.</p>
        </div>
      </aside>
    );
  }

  if (selectedChat.type === "dm") {
    const u = selectedChat.data;
    return (
      <aside className={`panel-right ${isOpen ? "" : "panel-right--hidden"}`} aria-label="User profile">
        <div className="panel-right__header">
          <span className="panel-right__title">User details</span>
          {onClose && (
            <button className="icon-btn panel-right__close" onClick={onClose} aria-label="Close panel">
              ✕
            </button>
          )}
        </div>

        <div className="panel-right__body">
          <div className="panel-right__card">
            <div className="avatar-square avatar-square--lg" aria-hidden="true" style={{ marginBottom: "12px" }}>
              {getInitials(u.username)}
            </div>
            <div className="panel-right__name-row">
              <span className="panel-right__name">{u.username}</span>
              <RoleGlyph level={u.role || 1} />
            </div>
            <span className="panel-right__role-label">{getRoleName(u.role)}</span>
          </div>

          <div className="panel-right__card">
            <div className="panel-right__meta-item">
              <span className="panel-right__meta-label">Email</span>
              <span className="panel-right__meta-value">{u.email || "—"}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const room = selectedChat.data;

  return (
    <aside className={`panel-right ${isOpen ? "" : "panel-right--hidden"}`} aria-label="Room details">
      <div className="panel-right__header">
        <span className="panel-right__title">Room details</span>
        {onClose && (
          <button className="icon-btn panel-right__close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        )}
      </div>

      <div className="panel-right__body">
        {/* Room Info */}
        <div className="panel-right__card">
          <h2 className="panel-right__room-name">#{room.name}</h2>
          {room.description && (
            <p className="panel-right__desc">{room.description}</p>
          )}
          <div className="panel-right__meta-row">
            <span className="panel-right__badge">
              {room.roomType === "broadcast"
                ? "Broadcast"
                : room.isPrivate
                ? "Private"
                : "Public"}
            </span>
            {room.isArchived && (
              <span className="panel-right__badge panel-right__badge--muted">Archived</span>
            )}
          </div>
        </div>

        {roomMessage && (
          <div className="panel-right__notice">{roomMessage}</div>
        )}

        {/* Add Member Form (Moderators only) */}
        {canModerate && (
          <div className="panel-right__card">
            <h3 className="panel-right__section-title">Add member</h3>

            {addableUsers.length === 0 ? (
              <p className="panel-right__empty">No available users to add</p>
            ) : (
              <div className="panel-right__form">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="panel-right__select"
                  aria-label="Select user to add"
                >
                  <option value="">Select a user...</option>
                  {addableUsers.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.username} ({getRoleName(u.role)})
                    </option>
                  ))}
                </select>

                <button
                  className="btn-quiet"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={addMember}
                  disabled={!selectedUserId}
                >
                  Add to room
                </button>
              </div>
            )}
          </div>
        )}

        {/* Online Members */}
        <div className="panel-right__card">
          <h3 className="panel-right__section-title">
            Online ({onlineUsers.length})
          </h3>

          {onlineUsers.length === 0 ? (
            <p className="panel-right__empty">No users currently online</p>
          ) : (
            <div className="panel-right__user-list">
              {onlineUsers.map((u) => (
                <div key={u.userId} className="panel-right__user-row">
                  <span className="presence-dot online" aria-hidden="true" />
                  <div className="avatar-square avatar-square--xs" aria-hidden="true">
                    {getInitials(u.username)}
                  </div>
                  <span className="panel-right__user-name">{u.username}</span>
                  {u.status === "away" && (
                    <span className="panel-right__status-tag">away</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Room Members */}
        <div className="panel-right__card">
          <h3 className="panel-right__section-title">
            Members ({members.length})
          </h3>

          {members.length === 0 ? (
            <p className="panel-right__empty">No members listed</p>
          ) : (
            <div className="panel-right__user-list">
              {members.map((member) => {
                const memberId = member._id || member.id;
                const isSelf = memberId === user?.id;
                const lowerRole = member.role < user?.role;

                return (
                  <div key={memberId} className="panel-right__member-item">
                    <div className="panel-right__member-info">
                      <div className="avatar-square avatar-square--xs" aria-hidden="true">
                        {getInitials(member.username)}
                      </div>
                      <span className="panel-right__user-name">{member.username}</span>
                      <RoleGlyph level={member.role || 1} />
                    </div>

                    {canModerate && !isSelf && (
                      <div className="panel-right__mod-actions">
                        {lowerRole && (
                          <>
                            <button
                              className="quiet-mod-btn danger"
                              onClick={() => handleModerationAction("kick", member.username)}
                            >
                              Kick
                            </button>
                            <button
                              className="quiet-mod-btn"
                              onClick={() => handleModerationAction("mute", member.username)}
                            >
                              Mute
                            </button>
                            <button
                              className="quiet-mod-btn"
                              onClick={() => handleModerationAction("unmute", member.username)}
                            >
                              Unmute
                            </button>
                            <button
                              className="quiet-mod-btn danger"
                              onClick={() => handleModerationAction("ban", member.username)}
                            >
                              Ban
                            </button>
                            <button
                              className="quiet-mod-btn"
                              onClick={() => handleModerationAction("unban", member.username)}
                            >
                              Unban
                            </button>
                          </>
                        )}
                        <button
                          className="quiet-mod-btn danger"
                          onClick={() => removeMember(memberId)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default InfoPanel;
