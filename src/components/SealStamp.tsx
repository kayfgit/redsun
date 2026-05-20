export function SealStamp({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className="flex-shrink-0"
    >
      {/* Outer border */}
      <rect
        x="2"
        y="2"
        width="56"
        height="56"
        rx="3"
        fill="#C41E1E"
        stroke="#8B1414"
        strokeWidth="2"
      />
      {/* Inner border */}
      <rect
        x="6"
        y="6"
        width="48"
        height="48"
        rx="2"
        fill="none"
        stroke="#F5F0E8"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* 红 character (top) */}
      <text
        x="30"
        y="28"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#F5F0E8"
        fontSize="18"
        fontWeight="bold"
        style={{ fontFamily: 'serif' }}
      >
        红
      </text>
      {/* 日 character (bottom) */}
      <text
        x="30"
        y="46"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#F5F0E8"
        fontSize="18"
        fontWeight="bold"
        style={{ fontFamily: 'serif' }}
      >
        日
      </text>
    </svg>
  );
}
