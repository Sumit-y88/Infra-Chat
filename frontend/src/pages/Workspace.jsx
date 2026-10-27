import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import InfoPanel from "../components/InfoPanel";

function Workspace() {
  const { user } = useAuth();
  const { id: routeRoomId, userId: routeUserId } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    isPrivate: false,
    roomType: "public",
  });
  const [message, setMessage] = useState("");

  const [roomUnread, setRoomUnread] = useState({});
  const [dmUnread, setDmUnread] = useState({});
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      const hasRouteChat = Boolean(routeRoomId || routeUserId);
      return isMobile && !hasRouteChat;
    }
    return false;
  });
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 1080;
    }
    return false;
  });

  // Listen for mobile menu toggle from Navbar
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, []);

  const fetchRooms = async () => {
  try {
    const res = await api.get("/rooms");
    const fetchedRooms = res.data.rooms || [];
    setRooms(fetchedRooms);

    const socket = getSocket();
    if (socket && user) {
      const joinedRoomIds = fetchedRooms
        .filter((room) => {
          if (!room.members) return false;

          return room.members.some((member) => {
            const memberId =
              typeof member === "string" ? member : member._id || member.id;
            return memberId === user.id;
          });
        })
        .map((room) => room._id);

      socket.emit("room:subscribe", joinedRoomIds);
    }
  } catch (err) {
    console.error("Failed to fetch rooms", err);
  }
};

      const refreshSelectedRoomMembers = async (roomId) => {
  try {
    const res = await api.get(`/rooms/${roomId}/members`);
    setMembers(res.data.members || []);
  } catch (err) {
    console.error("Failed to refresh room members", err);
  }
};

const refreshRooms = async () => {
  await fetchRooms();
};


  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchRoomMessages = async (roomId) => {
    try {
      const res = await api.get(`/rooms/${roomId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch room messages", err);
      setMessages([]);
    }
  };

  const fetchRoomMembers = async (roomId) => {
    try {
      const res = await api.get(`/rooms/${roomId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch room members", err);
      setMembers([]);
    }
  };

  const fetchDirectMessages = async (userId) => {
    try {
      const res = await api.get(`/direct-messages/${userId}`);
      setMessages(res.data.messages || []);
      setMembers([]);
    } catch (err) {
      console.error("Failed to fetch direct messages", err);
      setMessages([]);
    }
  };



  useEffect(() => {
  if (user) {
    fetchRooms();
    fetchUsers();
  }
}, [user]);

  // Presence heartbeat
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const interval = setInterval(() => {
      socket.emit("presence:heartbeat");
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (incomingMessage) => {
      const roomId =
        typeof incomingMessage.room === "string"
          ? incomingMessage.room
          : incomingMessage.room?._id;

      const isActiveRoom =
        selectedChat?.type === "room" && selectedChat?.data?._id === roomId;

      if (isActiveRoom) {
        setMessages((prev) => [...prev, incomingMessage]);
      } else if (roomId) {
        setRoomUnread((prev) => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1,
        }));
      }
    };

    const handleNewDm = (incomingMessage) => {
      const senderId =
        typeof incomingMessage.sender === "string"
          ? incomingMessage.sender
          : incomingMessage.sender?._id;

      const recipientId =
        typeof incomingMessage.recipient === "string"
          ? incomingMessage.recipient
          : incomingMessage.recipient?._id;

      const otherUserId = senderId === user?.id ? recipientId : senderId;

      const isActiveDm =
        selectedChat?.type === "dm" && selectedChat?.data?._id === otherUserId;

      if (isActiveDm) {
        setMessages((prev) => [...prev, incomingMessage]);
      } else if (otherUserId && senderId !== user?.id) {
        setDmUnread((prev) => ({
          ...prev,
          [otherUserId]: (prev[otherUserId] || 0) + 1,
        }));
      }
    };

    const handleOnlineUsers = (data) => {
      if (
        selectedChat?.type === "room" &&
        data.roomId === selectedChat.data._id
      ) {
        setOnlineUsers(data.users || []);
      }
    };

    const handleTyping = (data) => {
      if (!data?.username) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.includes(data.username)) return prev;
          return [...prev, data.username];
        }
        return prev.filter((name) => name !== data.username);
      });
    };

    const handleMessageDeleted = (data) => {
      const targetId = data.messageId || data.deletedMessage?._id;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === targetId
            ? (data.deletedMessage || {
                ...msg,
                content: "This message was deleted",
                deletedForEveryone: true,
                attachments: [],
              })
            : msg
        )
      );
    };

    const handleMessageUpdated = (data) => {
      const targetId = data.messageId || data.updatedMessage?._id;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === targetId ? data.updatedMessage : msg))
      );
    };

    const handleDmDeleted = (data) => {
      const targetId = data.messageId || data.deletedMessage?._id;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === targetId
            ? (data.deletedMessage || {
                ...msg,
                content: "This message was deleted",
                deletedForEveryone: true,
                attachments: [],
              })
            : msg
        )
      );
    };

    const handleDmUpdated = (data) => {
      const targetId = data.messageId || data.updatedMessage?._id;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === targetId ? data.updatedMessage : msg))
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("dm:new", handleNewDm);
    socket.on("dm:deleted", handleDmDeleted);
    socket.on("dm:updated", handleDmUpdated);
    socket.on("room:onlineUsers", handleOnlineUsers);
    socket.on("typing:update", handleTyping);

    const handleKicked = (data) => {
      if (
        selectedChat?.type === "room" &&
        selectedChat?.data?._id === data.roomId
      ) {
        setSelectedChat(null);
        setMessages([]);
        setMembers([]);
        setOnlineUsers([]);
      }
      setMessage(data.message || `You were removed from ${data.roomName}.`);
      fetchRooms();
    };

    const handleMemberRemoved = (data) => {
      if (
        selectedChat?.type === "room" &&
        selectedChat?.data?._id === data.roomId
      ) {
        refreshSelectedRoomMembers(data.roomId);
      }
    };

    socket.on("room:kicked", handleKicked);
    socket.on("room:member_removed", handleMemberRemoved);

    const handleRoomListUpdated = () => {
      fetchRooms();
    };

    socket.on("room:listUpdated", handleRoomListUpdated);

    const handleAnnouncement = (data) => {
      if (
        selectedChat?.type === "room" &&
        selectedChat?.data?._id === data.roomId
      ) {
        setAnnouncement(data);
      }
    };

    const handleRoleChanged = (data) => {
      if (data.userId === user?.id) {
        // Reload the page to pick up new permissions
        window.location.reload();
      }
      fetchUsers();
    };

    socket.on("room:announcement", handleAnnouncement);
    socket.on("user:role_changed", handleRoleChanged);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("dm:new", handleNewDm);
      socket.off("dm:deleted", handleDmDeleted);
      socket.off("dm:updated", handleDmUpdated);
      socket.off("room:onlineUsers", handleOnlineUsers);
      socket.off("typing:update", handleTyping);
      socket.off("room:kicked", handleKicked);
      socket.off("room:member_removed", handleMemberRemoved);
      socket.off("room:listUpdated", handleRoomListUpdated);
      socket.off("room:announcement", handleAnnouncement);
      socket.off("user:role_changed", handleRoleChanged);
    };
  }, [selectedChat, user?.id]);

  const openRoom = async (room, updateRoute = true) => {
    setSelectedChat({ type: "room", data: room });
    if (updateRoute && routeRoomId !== room._id) {
      navigate(`/rooms/${room._id}`, { replace: true });
    }
    setTypingUsers([]);
    setRoomUnread((prev) => ({ ...prev, [room._id]: 0 }));
    setAnnouncement(
      room.announcement?.text
        ? {
            text: room.announcement.text,
            setBy: room.announcement.setBy,
            setAt: room.announcement.setAt,
          }
        : null
    );
    await fetchRoomMessages(room._id);
    await fetchRoomMembers(room._id);

    const socket = getSocket();
    if (socket) {
      socket.emit("room:join", room._id);
    }
  };

  const openDm = async (selectedUser, updateRoute = true) => {
    setSelectedChat({ type: "dm", data: selectedUser });
    if (updateRoute && routeUserId !== selectedUser._id) {
      navigate(`/dm/${selectedUser._id}`, { replace: true });
    }
    setTypingUsers([]);
    setOnlineUsers([]);
    setDmUnread((prev) => ({ ...prev, [selectedUser._id]: 0 }));
    await fetchDirectMessages(selectedUser._id);
  };

  // Synchronize route with selected chat or default
  useEffect(() => {
    if (routeRoomId) {
      if (selectedChat?.type === "room" && selectedChat?.data?._id === routeRoomId) {
        return;
      }
      if (rooms.length > 0) {
        const targetRoom = rooms.find((r) => r._id === routeRoomId);
        if (targetRoom) {
          openRoom(targetRoom, false);
          return;
        }
      }
      // If rooms list is empty or targetRoom wasn't found in current list, fetch directly
      api
        .get(`/rooms/${routeRoomId}`)
        .then((res) => {
          if (res.data?.room && selectedChat?.data?._id !== routeRoomId) {
            openRoom(res.data.room, false);
          }
        })
        .catch((err) => {
          console.error("Specified room not accessible or found", err);
        });
    } else if (routeUserId) {
      if (selectedChat?.type === "dm" && selectedChat?.data?._id === routeUserId) {
        return;
      }
      if (users.length > 0) {
        const targetUser = users.find((u) => u._id === routeUserId);
        if (targetUser) {
          openDm(targetUser, false);
          return;
        }
      }
      api
        .get("/users")
        .then((res) => {
          const found = (res.data.users || []).find((u) => u._id === routeUserId);
          if (found && selectedChat?.data?._id !== routeUserId) {
            openDm(found, false);
          }
        })
        .catch((err) => {
          console.error("User not found for direct message", err);
        });
    } else if (!selectedChat && rooms.length > 0) {
      const defaultRoom =
        rooms.find((r) => r.name === "general") ||
        rooms.find((r) => isRoomMember(r)) ||
        rooms[0];

      if (defaultRoom) {
        openRoom(defaultRoom, false);
      }
    }
  }, [routeRoomId, routeUserId, rooms, users]);


  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/rooms", roomForm);
      setRoomForm({
        name: "",
        description: "",
        isPrivate: false,
        roomType: "public",
      });
      setMessage("Room created successfully");
      fetchRooms();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async (roomId) => {
    setMessage("");

    try {
      await api.post(`/rooms/${roomId}/join`);
      setMessage("Joined room successfully");
      fetchRooms();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to join room");
    }
  };

  const handleLeaveRoom = async (roomId) => {
    setMessage("");

    try {
      await api.post(`/rooms/${roomId}/leave`);
      setMessage("Left room successfully");

      const socket = getSocket();
      if (socket) {
        socket.emit("room:leave", roomId);
      }

      if (
        selectedChat &&
        selectedChat.type === "room" &&
        selectedChat.data._id === roomId
      ) {
        setSelectedChat(null);
        setMessages([]);
        setMembers([]);
        setOnlineUsers([]);
      }

      fetchRooms();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to leave room");
    }
  };

  const isRoomMember = (room) => {
    if (!room.members || !user) return false;

    return room.members.some((member) => {
      const memberId =
        typeof member === "string" ? member : member._id || member.id;
      return memberId === user.id;
    });
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.file;
  };

  const sendMessage = async () => {
    const socket = getSocket();
    if (!socket || !selectedChat) return;

    const hasText = text.trim().length > 0;
    const hasFiles = pendingFiles.length > 0;

    if (!hasText && !hasFiles) return;

    try {
      let attachments = [];

      if (hasFiles) {
        setUploading(true);
        const uploadPromises = pendingFiles.map((f) => uploadFile(f));
        attachments = await Promise.all(uploadPromises);
        setUploading(false);
      }

      if (selectedChat.type === "room") {
        socket.emit("message:send", {
          roomId: selectedChat.data._id,
          content: text,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        socket.emit("typing:stop", { roomId: selectedChat.data._id });
      } else if (selectedChat.type === "dm") {
        socket.emit("dm:send", {
          recipientId: selectedChat.data._id,
          content: text,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }

      setText("");
      setPendingFiles([]);
    } catch (err) {
      setUploading(false);
      setMessage(err.response?.data?.message || "Failed to upload file");
    }
  };

  const handleTypingChange = (value) => {
    setText(value);

    const socket = getSocket();
    if (!socket || !selectedChat || selectedChat.type !== "room") return;

    if (value.trim()) {
      socket.emit("typing:start", { roomId: selectedChat.data._id });
    } else {
      socket.emit("typing:stop", { roomId: selectedChat.data._id });
    }
  };

  return (
    <div className={`workspace ${showInfo ? "workspace--with-panel" : "workspace--no-panel"}`}>

      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile info panel overlay */}
      <div
        className={`panel-overlay ${showInfo ? 'visible' : ''}`}
        onClick={() => setShowInfo(false)}
        aria-hidden="true"
      />

      <Sidebar
        user={user}
        rooms={rooms}
        users={users}
        selectedChat={selectedChat}
        roomForm={roomForm}
        setRoomForm={setRoomForm}
        handleCreateRoom={handleCreateRoom}
        handleJoinRoom={handleJoinRoom}
        handleLeaveRoom={handleLeaveRoom}
        isRoomMember={isRoomMember}
        openRoom={(room) => { openRoom(room); setSidebarOpen(false); }}
        openDm={(u) => { openDm(u); setSidebarOpen(false); }}
        message={message}
        roomUnread={roomUnread}
        dmUnread={dmUnread}
        sidebarOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      <ChatPanel
        user={user}
        selectedChat={selectedChat}
        messages={messages}
        setMessages={setMessages}
        text={text}
        setText={setText}
        sendMessage={sendMessage}
        handleTypingChange={handleTypingChange}
        typingUsers={typingUsers}
        pendingFiles={pendingFiles}
        setPendingFiles={setPendingFiles}
        uploading={uploading}
        announcement={announcement}
        memberCount={members.length}
        onlineCount={onlineUsers.length}
        onToggleInfo={() => setShowInfo((prev) => !prev)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        availableRooms={rooms}
        onSelectRoom={(room) => { openRoom(room); setSidebarOpen(false); }}
      />


      <InfoPanel
        user={user}
        selectedChat={selectedChat}
        members={members}
        onlineUsers={onlineUsers}
        handleModerationAction={(action, username) => {
          const socket = getSocket();
          if (!socket || !selectedChat || selectedChat.type !== "room") return;

          socket.emit("message:send", {
            roomId: selectedChat.data._id,
            content: `/${action} ${username}`,
          });
        }}
        refreshSelectedRoomMembers={refreshSelectedRoomMembers}
        refreshRooms={refreshRooms}
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
      />



    </div>
  );
}

export default Workspace;
