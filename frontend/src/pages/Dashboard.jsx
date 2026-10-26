import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/roles";
import RoleGlyph from "../components/RoleGlyph";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomSearch, setRoomSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all"); // "all" | "joined" | "public" | "private"
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    roomType: "public",
  });
  const [message, setMessage] = useState({ text: "", type: "info" });

  const fetchRooms = async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data.rooms || []);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "info" });

    if (!roomForm.name.trim()) {
      setMessage({ text: "Room name is required.", type: "danger" });
      return;
    }

    try {
      await api.post("/rooms", roomForm);
      setMessage({ text: `Room #${roomForm.name} created successfully.`, type: "info" });
      setRoomForm({
        name: "",
        description: "",
        isPrivate: false,
        roomType: "public",
      });
      setShowCreateModal(false);
      fetchRooms();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to create room.", type: "danger" });
    }
  };

  const handleJoinRoom = async (roomId, roomName) => {
    setMessage({ text: "", type: "info" });
    try {
      await api.post(`/rooms/${roomId}/join`);
      setMessage({ text: `Joined #${roomName}.`, type: "info" });
      fetchRooms();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to join room.", type: "danger" });
    }
  };

  const handleLeaveRoom = async (roomId, roomName) => {
    setMessage({ text: "", type: "info" });
    try {
      await api.post(`/rooms/${roomId}/leave`);
      setMessage({ text: `Left #${roomName}.`, type: "info" });
      fetchRooms();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Failed to leave room.", type: "danger" });
    }
  };

  const isRoomMember = (room) => {
    if (!room.members || !user) return false;
    return room.members.some((member) => {
      const memberId = typeof member === "string" ? member : member._id || member.id;
      return memberId === user.id;
    });
  };

  const joinedCount = useMemo(() => {
    return rooms.filter((r) => isRoomMember(r)).length;
  }, [rooms, user]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch = room.name?.toLowerCase().includes(roomSearch.toLowerCase()) ||
        room.description?.toLowerCase().includes(roomSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (roomFilter === "joined") return isRoomMember(room);
      if (roomFilter === "public") return !room.isPrivate;
      if (roomFilter === "private") return room.isPrivate;
      return true;
    });
  }, [rooms, roomSearch, roomFilter, user]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = userSearch.toLowerCase();
      return (
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    });
  }, [users, userSearch]);

  const canCreateRoom = user && user.role >= 2;

  return (
    <div className="table-page">
      <div className="dashboard-shell">
        {/* Top Header Row */}
        <div className="dashboard-topbar">
          <div className="dashboard-title-group">
            <h1 className="dashboard-heading">Dashboard</h1>
            <p className="dashboard-subheading">
              System overview, room directory, and user channels.
            </p>
          </div>

          <div className="dashboard-actions">
            {canCreateRoom && (
              <button
                className="btn-quiet"
                onClick={() => setShowCreateModal((prev) => !prev)}
              >
                {showCreateModal ? "Cancel" : "+ New room"}
              </button>
            )}
            <button
              className="btn-accent"
              onClick={() => navigate("/workspace")}
            >
              <span>Open workspace</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`notice-box ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Metrics Strip */}
        <div className="dashboard-metrics">
          <div className="metric-box">
            <span className="metric-box__label">Available rooms</span>
            <span className="metric-box__val">{rooms.length}</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">My memberships</span>
            <span className="metric-box__val">{joinedCount}</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">Directory users</span>
            <span className="metric-box__val">{users.length}</span>
          </div>

          <div className="metric-box">
            <span className="metric-box__label">Access clearance</span>
            <div className="metric-box__role-val">
              <RoleGlyph level={user?.role || 1} />
              <span>{getRoleName(user?.role)}</span>
            </div>
          </div>
        </div>

        {/* Create Room Drawer / Collapsible Box */}
        {canCreateRoom && showCreateModal && (
          <div className="dashboard-create-card">
            <div className="dashboard-create-card__header">
              <span className="dashboard-create-card__title">Create new room channel</span>
              <span className="dashboard-create-card__sub">Channels are partitioned discussion feeds</span>
            </div>

            <form onSubmit={handleCreateRoom} className="dashboard-create-form">
              <div className="field">
                <label className="field__label">Room name</label>
                <input
                  type="text"
                  placeholder="e.g. operations"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label">Description</label>
                <input
                  type="text"
                  placeholder="Purpose of this room channel"
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                />
              </div>

              <div className="dashboard-create-checkboxes">
                <label className="checkbox-row">
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
                  <span>Private room (invite-only)</span>
                </label>

                {user?.role === 3 && (
                  <label className="checkbox-row">
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
                    <span>Broadcast channel (admins only can post)</span>
                  </label>
                )}
              </div>

              <div className="dashboard-create-actions">
                <button type="submit" className="btn-accent">Create room</button>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main 2-Column Split */}
        <div className="dashboard-grid">
          {/* Column 1: Rooms */}
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div className="dashboard-panel__title-wrap">
                <h2 className="dashboard-panel__title">Rooms</h2>
                <span className="dashboard-panel__count">{filteredRooms.length}</span>
              </div>

              <div className="dashboard-panel__controls">
                <input
                  type="text"
                  placeholder="Filter rooms..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="dashboard-search-input"
                  aria-label="Filter rooms"
                />

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="dashboard-filter-select"
                  aria-label="Filter room status"
                >
                  <option value="all">All</option>
                  <option value="joined">Joined</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="dashboard-list">
              {loading ? (
                <div className="dashboard-list__empty">Loading rooms...</div>
              ) : filteredRooms.length === 0 ? (
                <div className="dashboard-list__empty">No matching rooms found</div>
              ) : (
                filteredRooms.map((room) => {
                  const joined = isRoomMember(room);
                  return (
                    <div key={room._id} className="dashboard-row">
                      <div className="dashboard-row__main">
                        <div className="dashboard-row__title-line">
                          <span className="dashboard-row__hash">#</span>
                          <span className="dashboard-row__name">{room.name}</span>
                          {room.isPrivate && (
                            <span className="row-tag">private</span>
                          )}
                          {room.roomType === "broadcast" && (
                            <span className="row-tag">broadcast</span>
                          )}
                          {room.isArchived && (
                            <span className="row-tag archived">archived</span>
                          )}
                        </div>
                        {room.description && (
                          <p className="dashboard-row__desc">{room.description}</p>
                        )}
                        <span className="dashboard-row__members">
                          {room.members?.length || 0} members
                        </span>
                      </div>

                      <div className="dashboard-row__actions">
                        {joined ? (
                          <>
                            <Link
                              to={`/rooms/${room._id}`}
                              className="btn-quiet btn-sm"
                            >
                              Open chat
                            </Link>
                            <button
                              className="text-btn text-btn--danger"
                              onClick={() => handleLeaveRoom(room._id, room.name)}
                            >
                              Leave
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-accent btn-sm"
                            onClick={() => handleJoinRoom(room._id, room.name)}
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

          {/* Column 2: Users */}
          <div className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div className="dashboard-panel__title-wrap">
                <h2 className="dashboard-panel__title">Directory users</h2>
                <span className="dashboard-panel__count">{filteredUsers.length}</span>
              </div>

              <div className="dashboard-panel__controls">
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="dashboard-search-input"
                  aria-label="Filter users"
                />
              </div>
            </div>

            <div className="dashboard-list">
              {loading ? (
                <div className="dashboard-list__empty">Loading directory...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="dashboard-list__empty">No matching users found</div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u._id === user?.id;
                  const initials = u.username ? u.username.slice(0, 2).toUpperCase() : "?";

                  return (
                    <div key={u._id} className="dashboard-row">
                      <div className="dashboard-user-cell">
                        <div className="avatar-square avatar-square--sm">
                          {initials}
                        </div>
                        <div className="dashboard-user-details">
                          <div className="dashboard-user-name-line">
                            <span className="dashboard-user-name">{u.username}</span>
                            {isSelf && <span className="row-tag">you</span>}
                            <RoleGlyph level={u.role} />
                          </div>
                          <span className="dashboard-user-email">{u.email}</span>
                        </div>
                      </div>

                      <div className="dashboard-row__actions">
                        {!isSelf && (
                          <Link
                            to={`/dm/${u._id}`}
                            className="btn-quiet btn-sm"
                          >
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
