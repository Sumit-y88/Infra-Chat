import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE } from "../services/api";
import { formatMessageTime, formatDateDivider, isSameDay } from "../utils/time";
import RoleGlyph from "./RoleGlyph";
import CommandMenu from "./CommandMenu";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getInitials(name) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

function ChatPanel({
  user,
  selectedChat,
  messages = [],
  setMessages,
  text,
  setText,
  sendMessage,
  handleTypingChange,
  typingUsers = [],
  pendingFiles = [],
  setPendingFiles,
  uploading,
  announcement,
  memberCount = 0,
  onlineCount = 0,
  onToggleInfo,
  onToggleSidebar,
  availableRooms = [],
  onSelectRoom,
}) {
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [commandMenuDismissed, setCommandMenuDismissed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, typingUsers]);

  // Reset command menu dismissal when text changes
  useEffect(() => {
    if (!text.startsWith("/")) {
      setCommandMenuDismissed(false);
    }
  }, [text]);

  const showCommandMenu =
    selectedChat?.type === "room" &&
    text.startsWith("/") &&
    !commandMenuDismissed;

  if (!selectedChat) {
    return (
      <main className="center-col empty-center-col" role="main">
        {/* Mobile Header for empty state */}
        <div className="center-col__header empty-center-col__header">
          <div className="center-col__header-left">
            {onToggleSidebar && (
              <button
                className="icon-btn mobile-rail-toggle"
                onClick={onToggleSidebar}
                aria-label="Open navigation channels"
                title="Channels & messages"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
            <span className="center-col__title">Internal Network</span>
          </div>
        </div>

        <div className="empty-state">
          <div className="empty-state__glyph" aria-hidden="true">
            <span style={{ height: "6px" }} />
            <span style={{ height: "10px" }} />
            <span style={{ height: "14px" }} />
          </div>
          <h2 className="empty-state__title">Select a conversation</h2>
          <p className="empty-state__sub">
            Choose a room channel or direct message to begin communicating.
          </p>

          {onToggleSidebar && (
            <button
              className="btn-accent empty-state__open-sidebar-btn"
              onClick={onToggleSidebar}
            >
              Browse channels & chats
            </button>
          )}

          {availableRooms && availableRooms.length > 0 && onSelectRoom && (
            <div className="empty-state__rooms">
              <span className="empty-state__rooms-label">Available rooms:</span>
              <div className="empty-state__chips">
                {availableRooms.slice(0, 5).map((r) => (
                  <button
                    key={r._id}
                    className="room-chip-btn"
                    onClick={() => onSelectRoom(r)}
                  >
                    <span>#</span>
                    <span>{r.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  const startEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;

    try {
      let res;
      if (selectedChat.type === "room") {
        res = await api.patch(`/rooms/messages/${editingMessageId}`, {
          content: editText,
        });
      } else {
        res = await api.patch(`/direct-message-actions/${editingMessageId}`, {
          content: editText,
        });
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === editingMessageId ? res.data.updatedMessage : msg
        )
      );

      setEditingMessageId(null);
      setEditText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to edit message");
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      let res;
      if (selectedChat.type === "room") {
        res = await api.delete(`/rooms/messages/${messageId}`);
      } else {
        res = await api.delete(`/direct-message-actions/${messageId}`);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? res.data.deletedMessage : msg
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removePendingFile = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    // If command menu is active, do not trigger message send on Enter
    if (showCommandMenu && (e.key === "Enter" || e.key === "Tab")) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCommandSelect = (cmd) => {
    const newText = cmd.name + (cmd.hint ? " " : "");
    if (setText) {
      setText(newText);
    } else {
      handleTypingChange(newText);
    }
    setCommandMenuDismissed(true);
    textInputRef.current?.focus();
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...files]);
    }
  };

  const renderAttachment = (att) => {
    const isImage = IMAGE_TYPES.includes(att.type);
    const fileUrl = att.url.startsWith("http") ? att.url : `${API_BASE}${att.url}`;

    if (isImage) {
      return (
        <div key={att.url} className="attachment-chip attachment-chip--image">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <img src={fileUrl} alt={att.name} className="attachment-preview" />
            <div className="attachment-chip__meta">
              <span className="attachment-chip__name">{att.name}</span>
              {att.size && <span className="attachment-chip__size">{formatFileSize(att.size)}</span>}
            </div>
          </a>
        </div>
      );
    }

    return (
      <div key={att.url} className="attachment-chip">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" download>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="attachment-chip__name">{att.name}</span>
          {att.size && <span className="attachment-chip__size">{formatFileSize(att.size)}</span>}
        </a>
      </div>
    );
  };

  const isArchived = selectedChat?.type === "room" && selectedChat?.data?.isArchived;
  const isBroadcast = selectedChat?.type === "room" && selectedChat?.data?.roomType === "broadcast";
  const canSend = !isArchived && (!isBroadcast || (user && user.role >= 2));

  const chatTitle = selectedChat.type === "room"
    ? selectedChat.data.name
    : selectedChat.data.username;

  return (
    <main
      className="center-col"
      role="main"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Dragging Overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-overlay__content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            <span>Drop files here to attach</span>
          </div>
        </div>
      )}

      {/* ── Top Header Row ── */}
      <div className="center-col__header">
        <div className="center-col__header-left">
          {onToggleSidebar && (
            <button
              className="icon-btn mobile-rail-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation rail"
              title="Navigation"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <div className="center-col__title-wrap">
            <h1 className="center-col__title">
              {selectedChat.type === "room" ? `#${chatTitle}` : chatTitle}
            </h1>
            <span className="center-col__meta">
              {selectedChat.type === "room"
                ? `${memberCount} ${memberCount === 1 ? "member" : "members"}, ${onlineCount} online`
                : "Direct message channel"}
            </span>
          </div>
        </div>

        <div className="center-col__header-right">
          {onToggleInfo && (
            <button
              className="icon-btn"
              onClick={onToggleInfo}
              aria-label="Toggle details panel"
              title="Details"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Announcement banner if set */}
      {announcement?.text && selectedChat?.type === "room" && (
        <div className="announcement-row">
          <span className="announcement-row__label">Announcement:</span>
          <span className="announcement-row__text">{announcement.text}</span>
        </div>
      )}

      {/* ── Message Feed ── */}
      <div className="feed" ref={messagesContainerRef}>
        <div className="feed__inner">
          {messages.length === 0 ? (
            <div className="feed-starter">
              <div className="feed-starter__icon">
                {selectedChat.type === "room" ? "#" : "@"}
              </div>
              <h3 className="feed-starter__title">
                {selectedChat.type === "room"
                  ? `Welcome to #${chatTitle}`
                  : `Conversation with ${chatTitle}`}
              </h3>
              <p className="feed-starter__desc">
                {selectedChat.type === "room"
                  ? `This is the start of the #${chatTitle} room channel.`
                  : "Direct messages between you and this member are private and real-time."}
              </p>
              {selectedChat.type === "room" && (
                <div className="feed-starter__chips">
                  <button
                    className="feed-chip"
                    onClick={() => {
                      if (setText) setText("👋 Hello everyone!");
                      textInputRef.current?.focus();
                    }}
                  >
                    👋 Say hello
                  </button>
                  <button
                    className="feed-chip"
                    onClick={() => {
                      if (setText) setText("/help");
                      textInputRef.current?.focus();
                    }}
                  >
                    /help
                  </button>
                  <button
                    className="feed-chip"
                    onClick={() => {
                      if (setText) setText("/rooms");
                      textInputRef.current?.focus();
                    }}
                  >
                    /rooms
                  </button>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, index) => {
              const senderId =
                typeof msg.sender === "string" ? msg.sender : msg.sender?._id;
              const mine = senderId === user?.id;
              const isEditing = editingMessageId === msg._id;
              const senderName = msg.sender?.username || "System";
              const senderRole = msg.sender?.role || 1;
              const isSystemOrCommand = msg.type === "system" || msg.type === "command";

              // Check if date divider should be displayed
              const showDateDivider =
                index === 0 ||
                !isSameDay(messages[index - 1]?.createdAt, msg.createdAt);

              // Check if message is clustered with previous message from same sender within 5 mins
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const prevSenderId =
                typeof prevMsg?.sender === "string"
                  ? prevMsg.sender
                  : prevMsg?.sender?._id;

              const isGrouped =
                !showDateDivider &&
                !isSystemOrCommand &&
                prevMsg &&
                prevMsg.type !== "system" &&
                prevMsg.type !== "command" &&
                prevSenderId === senderId &&
                new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;

              return (
                <div key={msg._id || index} className="msg-wrapper">
                  {showDateDivider && (
                    <div className="date-divider">
                      <span>{formatDateDivider(msg.createdAt)}</span>
                    </div>
                  )}

                  {isSystemOrCommand ? (
                    <div className="ledger-row">
                      <span className="ledger-row__text">{msg.content}</span>
                      <span className="ledger-row__time">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                      {user?.role >= 2 && (
                        <Link to="/audit" className="ledger-row__link">
                          View in audit log
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`msg-row ${mine ? "msg-row--mine" : "msg-row--other"} ${
                        isGrouped ? "msg-row--grouped" : ""
                      }`}
                      tabIndex={0}
                    >
                      <div
                        className={`avatar-square ${mine ? "avatar-square--accent" : ""}`}
                        aria-hidden="true"
                      >
                        {!isGrouped && getInitials(senderName)}
                      </div>

                      <div className="msg-row__content">
                        {!isGrouped && (
                          <div className="msg-row__header">
                            <span className="msg-row__name">{mine ? "You" : senderName}</span>
                            {!mine && <RoleGlyph level={senderRole} />}
                            <span className="msg-row__time">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {msg.edited && (
                              <span className="msg-row__edited">edited</span>
                            )}
                          </div>
                        )}

                        <div className="msg-row__bubble-wrap">
                          {mine && !msg.deletedForEveryone && !isEditing && (
                            <div className="msg-row__hover-actions">
                              <button
                                className="action-pill-btn"
                                onClick={() => startEdit(msg)}
                                title="Edit message"
                                aria-label="Edit message"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>Edit</span>
                              </button>
                              <button
                                className="action-pill-btn action-pill-btn--danger"
                                onClick={() => deleteMessage(msg._id)}
                                title="Delete message"
                                aria-label="Delete message"
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}

                          {isEditing ? (
                            <div className="msg-row__edit-box">
                              <textarea
                                className="msg-row__edit-textarea"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    saveEdit();
                                  }
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                autoFocus
                                rows={2}
                              />
                              <div className="msg-row__edit-actions">
                                <button className="btn-accent btn-sm edit-save-btn" onClick={saveEdit}>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Save
                                </button>
                                <button className="btn-quiet btn-sm edit-cancel-btn" onClick={cancelEdit}>
                                  Cancel
                                </button>
                                <span className="edit-hint">Enter to save • Esc to cancel</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`msg-bubble ${msg.deletedForEveryone ? "msg-bubble--deleted" : ""}`}>
                              {msg.content && (
                                <div
                                  className={`msg-row__body ${
                                    msg.deletedForEveryone ? "msg-row__body--deleted" : ""
                                  }`}
                                >
                                  {msg.content}
                                </div>
                              )}

                              {!msg.deletedForEveryone &&
                                msg.attachments &&
                                msg.attachments.length > 0 && (
                                  <div className="msg-row__attachments">
                                    {msg.attachments.map(renderAttachment)}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Static typing indicator */}
      {selectedChat.type === "room" && typingUsers.length > 0 && (
        <div className="typing-notice">
          {typingUsers.length === 1
            ? `${typingUsers[0]} is typing...`
            : `${typingUsers.join(", ")} are typing...`}
        </div>
      )}

      {/* Pending attachments tray */}
      {pendingFiles && pendingFiles.length > 0 && (
        <div className="pending-tray">
          {pendingFiles.map((file, index) => (
            <div key={index} className="pending-chip">
              <span className="pending-chip__name">{file.name}</span>
              <span className="pending-chip__size">{formatFileSize(file.size)}</span>
              <button
                className="pending-chip__remove"
                onClick={() => removePendingFile(index)}
                aria-label={`Remove ${file.name}`}
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Docked Composer ── */}
      <div className="composer-dock">
        {showCommandMenu && (
          <CommandMenu
            filterText={text}
            userRole={user?.role || 1}
            onSelect={handleCommandSelect}
            onClose={() => setCommandMenuDismissed(true)}
          />
        )}

        {!canSend ? (
          <div className="composer-notice">
            {isArchived
              ? "This room is archived and read-only."
              : "Only moderators and admins can send messages in broadcast rooms."}
          </div>
        ) : (
          <div className="composer">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              multiple
            />

            <button
              className="composer__attach-btn icon-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Attach file"
              title="Attach file (max 10MB)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <textarea
              ref={textInputRef}
              className="composer__input"
              rows={1}
              value={text}
              placeholder={
                selectedChat.type === "room"
                  ? "Message or type / for commands..."
                  : "Message..."
              }
              onChange={(e) => {
                handleTypingChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            <button
              className="composer__send-btn btn-accent"
              onClick={sendMessage}
              disabled={uploading || (!text.trim() && pendingFiles.length === 0)}
              aria-label="Send message"
            >
              {uploading ? "Uploading..." : "Send"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default ChatPanel;
