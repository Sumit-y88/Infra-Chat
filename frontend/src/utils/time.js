export const formatMessageTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatDateDivider = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.toDateString() === b.toDateString();
};
