const waypoints = [
  { x: 86, y: 84, label: "I" },
  { x: 198, y: 55, label: "II" },
  { x: 333, y: 96, label: "III" },
  { x: 378, y: 196, label: "IV" },
  { x: 276, y: 264, label: "V" },
  { x: 126, y: 238, label: "VI" },
] as const;

export function CelestialRouteMap() {
  return (
    <figure className="route-map" aria-labelledby="route-map-title">
      <svg viewBox="0 0 460 320" role="img">
        <title id="route-map-title">An original celestial navigation map with orbital routes and six waypoints</title>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="48%" r="55%">
            <stop offset="0" stopColor="#174b68" stopOpacity=".72" />
            <stop offset=".55" stopColor="#0a2549" stopOpacity=".3" />
            <stop offset="1" stopColor="#030914" stopOpacity="0" />
          </radialGradient>
          <filter id="mapRoughness">
            <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="17" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="table" tableValues="0 .14" /></feComponentTransfer>
          </filter>
        </defs>
        <rect width="460" height="320" fill="url(#mapGlow)" />
        <g className="route-map__grid">
          {Array.from({ length: 12 }, (_, i) => <line key={`v-${i}`} x1={i * 42} y1="0" x2={i * 42} y2="320" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h-${i}`} x1="0" y1={i * 40} x2="460" y2={i * 40} />)}
        </g>
        <g className="route-map__orbit">
          <ellipse cx="230" cy="160" rx="176" ry="112" />
          <ellipse cx="230" cy="160" rx="128" ry="78" />
          <circle cx="230" cy="160" r="37" />
          <path d="M42 211C87 143 134 116 197 127s102 80 218-5" />
          <path d="M31 103c77 52 128 79 196 68 73-12 108-69 206-65" />
        </g>
        <path className="route-map__current" d="M22 264c54-49 85-18 125-50 31-25 18-61 59-79 42-19 68 25 104 3 28-18 16-54 80-73" />
        <path className="route-map__path" d="M86 84 198 55 333 96 378 196 276 264 126 238 86 84" />
        <g className="route-map__waypoints">
          {waypoints.map((point) => (
            <g key={point.label} transform={`translate(${point.x} ${point.y})`}>
              <circle r="14" /><circle r="4" /><text y="-21">{point.label}</text>
            </g>
          ))}
        </g>
        <g className="route-map__coordinates" aria-hidden="true">
          <text x="14" y="20">MERIDIAN 00</text><text x="350" y="305">FIELD 12 / 12</text>
        </g>
        <rect width="460" height="320" filter="url(#mapRoughness)" />
      </svg>
      <figcaption><span>Celestial field</span><span>Routes are symbolic · positions are calculated</span></figcaption>
    </figure>
  );
}
