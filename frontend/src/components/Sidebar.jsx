import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/roles";
import RoleGlyph from "./RoleGlyph";

function ThemeIcon({ theme }) {
  if (theme === "dark") {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" /><path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" /><path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Sidebar({
  user,
  rooms = [],
  users = [],
  selectedChat,
  roomForm,
  setRoomForm,
  handleCreateRoom,
  handleJoinRoom,
  handleLeaveRoom,
  isRoomMember,
  openRoom,
  openDm,
  message,
  roomUnread = {},
  dmUnread = {},
  sidebarOpen,
  closeSidebar,
}) {
  const { logout } = useAuth();
  const canCreateRoom = user && user.role >= 2;

  const [roomSearch, setRoomSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.name?.toLowerCase().includes(roomSearch.toLowerCase())
    );
  }, [rooms, roomSearch]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.username?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";

  return (
    <aside className={`rail ${sidebarOpen ? "rail--open" : ""}`} aria-label="Main navigation">
      {/* ── Brand Header ── */}
      <div className="rail__header">
        <div className="rail__brand">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark__bar" style={{ height: "6px" }} />
            <span className="brand-mark__bar" style={{ height: "10px" }} />
            <span className="brand-mark__bar" style={{ height: "14px" }} />
          </div>
          <span className="rail__brand-title">Internal Network</span>
        </div>

        <button
          className="icon-btn rail__close-btn"
          onClick={closeSidebar}
          aria-label="Close navigation"
          title="Close navigation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {message && <div className="rail__notice">{message}</div>}

      {/* ── Scrollable Lists ── */}
      <div className="rail__body">
        {/* Rooms Group */}
        <div className="rail__group">
          <div className="rail__group-header">
            <span className="rail__group-title">Rooms</span>
            {canCreateRoom && (
              <button
                className="rail__action-btn"
                onClick={() => setShowCreateForm((prev) => !prev)}
                aria-label={showCreateForm ? "Cancel create room" : "Create new room"}
                title={showCreateForm ? "Cancel" : "New room"}
              >
                {showCreateForm ? "Cancel" : "+ New"}
              </button>
            )}
          </div>

          {/* Collapsible Create Room Form */}
          {canCreateRoom && showCreateForm && (
            <form
              onSubmit={(e) => {
                handleCreateRoom(e);
                setShowCreateForm(false);
              }}
              className="rail__create-form"
            >
              <input
                type="text"
                placeholder="Room name"
                value={roomForm.name}
                onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
              />
              <label className="rail__checkbox">
                <input
                  type="checkbox"
                  checked={roomForm.isPrivate}
                  onChange={(e) =>
                    setRoomForm({
                      ...roomForm,
                      isPrivate: e.target.checked,
                      roomType: e.target.checked ? "private" : "public",
                    })
                  }
                />
                <span>Private</span>
              </label>

              {user?.role === 3 && (
                <label className="rail__checkbox">
                  <input
                    type="checkbox"
                    checked={roomForm.roomType === "broadcast"}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        roomType: e.target.checked ? "broadcast" : "public",
                        isPrivate: e.target.checked ? false : roomForm.isPrivate,
                      })
                    }
                  />
                  <span>Broadcast only</span>
                </label>
              )}

              <button type="submit" className="btn-accent" style={{ width: "100%", justifyContent: "center" }}>
                Create room
              </button>
            </form>
          )}

          <div className="rail__search-wrap">
            <input
              type="text"
              placeholder="Search rooms..."
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              className="rail__search-input"
              aria-label="Search rooms"
            />
          </div>

          <div className="rail__list" role="list">
            {filteredRooms.length === 0 ? (
              <div className="rail__empty">No matching rooms</div>
            ) : (
              filteredRooms.map((room) => {
                const joined = isRoomMember(room);
                const isSelected =
                  selectedChat?.type === "room" && selectedChat?.data?._id === room._id;
                const unread = roomUnread?.[room._id] || 0;

                return (
                  <div
                    key={room._id}
                    className={`rail__row ${isSelected ? "rail__row--active" : ""}`}
                    role="listitem"
                  >
                    <button
                      className="rail__row-main"
                      onClick={() => {
                        if (joined) {
                          openRoom(room);
                        } else {
                          handleJoinRoom(room._id);
                        }
                      }}
                      title={joined ? `Open ${room.name}` : `Join ${room.name}`}
                    >
                      <span className="rail__row-prefix">#</span>
                      <span className="rail__row-name">{room.name}</span>
                      {room.isArchived && <span className="rail__row-tag">archived</span>}
                      {unread > 0 && <span className="rail__unread">{unread}</span>}
                    </button>

                    <div className="rail__row-action">
                      {joined ? (
                        <button
                          className="rail__mini-btn danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveRoom(room._id);
                          }}
                          aria-label={`Leave ${room.name}`}
                          title="Leave room"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          className="rail__mini-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinRoom(room._id);
                          }}
                          aria-label={`Join ${room.name}`}
                          title="Join room"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Direct Messages Group */}
        <div className="rail__group">
          <div className="rail__group-header">
            <span className="rail__group-title">Direct messages</span>
          </div>

          <div className="rail__search-wrap">
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rail__search-input"
              aria-label="Search users"
            />
          </div>

          <div className="rail__list" role="list">
            {filteredUsers.length === 0 ? (
              <div className="rail__empty">No matching users</div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected =
                  selectedChat?.type === "dm" && selectedChat?.data?._id === u._id;
                const unread = dmUnread?.[u._id] || 0;
                const isSelf = u._id === user?.id;

                return (
                  <button
                    key={u._id}
                    className={`rail__row rail__row--button ${isSelected ? "rail__row--active" : ""}`}
                    onClick={() => openDm(u)}
                    role="listitem"
                  >
                    <div className="rail__dm-prefix">
                      <div className="avatar-square avatar-square--xs" aria-hidden="true">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="presence-dot offline" aria-hidden="true" />
                    </div>
                    <span className="rail__row-name">{u.username}</span>
                    {isSelf && <span className="rail__row-tag">you</span>}
                    {unread > 0 && <span className="rail__unread">{unread}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Pinned Footer ── */}
      <div className="rail__footer">
        <div className="rail__user-info">
          <div className="avatar-square avatar-square--sm" aria-hidden="true">
            {initials}
          </div>
          <div className="rail__user-details">
            <span className="rail__username">{user?.username || "Guest"}</span>
            <div className="rail__role-wrap">
              <span className="rail__role">{getRoleName(user?.role)}</span>
              <RoleGlyph level={user?.role || 1} />
            </div>
          </div>
        </div>

        <div className="rail__footer-actions">

          <Link
            to="/dashboard"
            className="icon-btn"
            aria-label="Dashboard overview"
            title="Dashboard"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </Link>

          {user?.role >= 2 && (
            <Link
              to="/audit"
              className="icon-btn"
              aria-label="Audit log"
              title="Audit log"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </Link>
          )}

          {user?.role === 3 && (
            <Link
              to="/admin"
              className="icon-btn"
              aria-label="Admin panel"
              title="Admin panel"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          )}

          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Switch theme"
            title="Switch theme"
          >
            <ThemeIcon theme={theme} />
          </button>

          {user && (
            <button
              className="icon-btn"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
