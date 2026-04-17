export function DecagonLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer hexagon */}
        <polygon
          points="30,2 55,16 55,44 30,58 5,44 5,16"
          fill="none"
          stroke="#0A0A0B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Inner box lines — 3D wireframe cube effect */}
        {/* Top face */}
        <polygon
          points="30,10 48,20 30,30 12,20"
          fill="none"
          stroke="#0A0A0B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Left face vertical */}
        <line x1="12" y1="20" x2="12" y2="40" stroke="#0A0A0B" strokeWidth="2.5" />
        {/* Right face vertical */}
        <line x1="48" y1="20" x2="48" y2="40" stroke="#0A0A0B" strokeWidth="2.5" />
        {/* Bottom face */}
        <polygon
          points="30,50 48,40 30,30 12,40"
          fill="none"
          stroke="#0A0A0B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Center vertical */}
        <line x1="30" y1="10" x2="30" y2="30" stroke="#0A0A0B" strokeWidth="2" strokeDasharray="0" />
      </svg>
    </div>
  );
}
