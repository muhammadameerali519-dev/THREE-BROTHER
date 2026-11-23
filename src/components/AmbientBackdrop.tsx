import React from 'react';

export function AmbientBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-gradient-to-br from-[#E4EAF5] via-[#EEF2FA] to-[#DDE6F4]"
    >
      {/* Top-Left Sapphire Glass Orb */}
      <div
        className="animate-ambient-slow absolute -top-36 -left-32 w-[460px] h-[460px] sm:w-[680px] sm:h-[680px] rounded-full opacity-75"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.22), rgba(96, 165, 250, 0.08) 50%, transparent 72%)',
        }}
      />

      {/* Top-Right Crystalline Ice Orb */}
      <div
        className="animate-ambient-reverse absolute -top-24 -right-32 w-[420px] h-[420px] sm:w-[620px] sm:h-[620px] rounded-full opacity-80"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.16), rgba(148, 163, 184, 0.14) 52%, transparent 74%)',
        }}
      />

      {/* Mid-Page Architectural Refraction */}
      <div
        className="animate-ambient-slow absolute top-[38%] left-[22%] w-[480px] h-[480px] sm:w-[760px] sm:h-[760px] rounded-full opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.75), rgba(191, 219, 254, 0.18) 45%, transparent 72%)',
        }}
      />

      {/* Lower-Right Titanium Glow */}
      <div
        className="animate-ambient-reverse absolute -bottom-40 -right-24 w-[460px] h-[460px] sm:w-[660px] sm:h-[660px] rounded-full opacity-70"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.16), rgba(100, 116, 139, 0.12) 52%, transparent 75%)',
        }}
      />

      {/* Subtle Frosted Mesh Refraction Grid */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, black 20%, transparent 75%)',
        }}
      />
    </div>
  );
}
