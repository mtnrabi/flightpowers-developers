/**
 * The FlightPowers lockup: the blue robot mascot (the same mark the demo
 * engine wears) next to the wordmark. The robot IS the brand: an AI travel
 * agent with an airplane on its chest. Raster asset, served at 1x/2x from
 * /public/brand; the favicon set is cut from the same source image.
 */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/robot-mark-28.png"
        srcSet="/brand/robot-mark-28.png 1x, /brand/robot-mark-56.png 2x"
        width={23}
        height={28}
        alt=""
        aria-hidden="true"
        className="h-7 w-auto translate-y-[1px] select-none"
      />
      <span className="text-[16px] font-semibold tracking-tight text-ink-100">FlightPowers</span>
    </span>
  );
}
