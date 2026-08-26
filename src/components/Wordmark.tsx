export function Wordmark() {
  return (
    <span className="flex items-center gap-1.5">
      <svg
        width="18"
        height="18"
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
      <span className="text-[16px] font-semibold tracking-tight text-ink-100">FlightPowers</span>
    </span>
  );
}
