import { memo } from "react";

const ROLE_LABELS = {
  1: "Member",
  2: "Moderator",
  3: "SuperAdmin",
};

function RoleGlyph({ level = 1, className = "" }) {
  const numericLevel = Number(level) || 1;
  const label = ROLE_LABELS[numericLevel] || "Member";

  const isBar1Filled = numericLevel >= 1;
  const isBar2Filled = numericLevel >= 2;
  const isBar3Filled = numericLevel >= 3;

  return (
    <span
      className={`role-glyph ${className}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <span
        className={`role-glyph__bar ${isBar1Filled ? "filled" : "unfilled"}`}
        style={{ height: "4px" }}
      />
      <span
        className={`role-glyph__bar ${isBar2Filled ? "filled" : "unfilled"}`}
        style={{ height: "7px" }}
      />
      <span
        className={`role-glyph__bar ${isBar3Filled ? "filled" : "unfilled"}`}
        style={{ height: "10px" }}
      />
    </span>
  );
}

export default memo(RoleGlyph);
