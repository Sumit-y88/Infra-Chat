import { useEffect, useMemo, useState } from "react";

export const COMMANDS = [
  { name: "/help", hint: "", desc: "List available commands", minRole: 1 },
  { name: "/rooms", hint: "", desc: "List accessible rooms", minRole: 1 },
  { name: "/members", hint: "", desc: "List room members", minRole: 1 },
  { name: "/kick", hint: "<user>", desc: "Remove user from room", minRole: 2 },
  { name: "/ban", hint: "<user>", desc: "Ban user from room", minRole: 2 },
  { name: "/mute", hint: "<user> [minutes]", desc: "Mute a user", minRole: 2 },
  { name: "/unmute", hint: "<user>", desc: "Unmute a user", minRole: 2 },
  { name: "/unban", hint: "<user>", desc: "Unban user from room", minRole: 2 },
  { name: "/announce", hint: "<message>", desc: "Set room announcement", minRole: 2 },
  { name: "/promote", hint: "<user>", desc: "Promote user role", minRole: 3 },
  { name: "/demote", hint: "<user>", desc: "Demote user role", minRole: 3 },
  { name: "/audit", hint: "", desc: "View recent audit logs", minRole: 3 },
];

const ROLE_NAMES = {
  1: "Member",
  2: "Moderator",
  3: "SuperAdmin",
};

function CommandMenu({ filterText, userRole = 1, onSelect, onClose }) {
  const query = filterText.trim().toLowerCase();

  const filteredCommands = useMemo(() => {
    return COMMANDS.filter((cmd) => {
      if (!query || query === "/") return true;
      return (
        cmd.name.toLowerCase().startsWith(query) ||
        cmd.name.toLowerCase().includes(query.replace("/", ""))
      );
    });
  }, [query]);

  // Selectable commands (user has sufficient role)
  const selectableCommands = useMemo(() => {
    return filteredCommands.filter((cmd) => userRole >= cmd.minRole);
  }, [filteredCommands, userRole]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Keep selected index within selectable items
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (selectableCommands.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % selectableCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + selectableCommands.length) % selectableCommands.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        const chosen = selectableCommands[selectedIndex];
        if (chosen) {
          e.preventDefault();
          onSelect(chosen);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectableCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div className="command-menu" role="listbox" aria-label="Command suggestions">
      <div className="command-menu__list">
        {filteredCommands.map((cmd) => {
          const isAllowed = userRole >= cmd.minRole;
          const selectableIndex = selectableCommands.indexOf(cmd);
          const isSelected = isAllowed && selectableIndex === selectedIndex;

          return (
            <div
              key={cmd.name}
              className={`command-menu__row ${isAllowed ? "allowed" : "disabled"} ${
                isSelected ? "selected" : ""
              }`}
              onClick={() => {
                if (isAllowed) {
                  onSelect(cmd);
                }
              }}
              role="option"
              aria-selected={isSelected}
              aria-disabled={!isAllowed}
            >
              <div className="command-menu__main">
                <div className="command-menu__cmd">
                  <span className="command-menu__name">{cmd.name}</span>
                  {cmd.hint && <span className="command-menu__hint"> {cmd.hint}</span>}
                </div>
                <div className="command-menu__desc">{cmd.desc}</div>
              </div>

              <div className="command-menu__meta">
                {!isAllowed && (
                  <svg
                    className="command-menu__lock"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-label="Locked"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
                <span>{ROLE_NAMES[cmd.minRole] || "Member"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="command-menu__footer">
        Greyed commands need a higher role than yours.
      </div>
    </div>
  );
}

export default CommandMenu;
