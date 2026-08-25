export function Wordmark() {
  return (
    <span className="flex items-baseline gap-2">
      <span className="flex items-center gap-1.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="text-signal-500 translate-y-[1px]"
        >
          <path
            d="M1 9.2 15 2 9.6 15l-2-5.1L1 9.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[15px] font-semibold tracking-tight text-ink-100">
          FlightPowers
        </span>
      </span>
      <span className="hidden sm:inline font-mono text-[11px] tracking-[0.16em] uppercase text-ink-400">
        developers
      </span>
    </span>
  );
}
