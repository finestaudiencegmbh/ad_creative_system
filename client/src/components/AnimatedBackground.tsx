export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orb 1 - purple accent */}
      <div
        className="absolute w-[650px] h-[650px] rounded-full opacity-[0.25] blur-[100px] animate-float"
        style={{
          background: "radial-gradient(circle, oklch(0.42 0.18 290) 0%, transparent 70%)",
          top: "10%",
          left: "5%",
          animationDelay: "0s",
        }}
      />

      {/* Animated gradient orb 2 - lighter purple */}
      <div
        className="absolute w-[550px] h-[550px] rounded-full opacity-[0.22] blur-[80px] animate-float-slow"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.15 290) 0%, transparent 70%)",
          top: "60%",
          right: "10%",
          animationDelay: "2s",
        }}
      />

      {/* Animated gradient orb 3 - subtle gray */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.15] blur-[70px] animate-float-slower"
        style={{
          background: "radial-gradient(circle, oklch(0.5 0 0) 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
          animationDelay: "4s",
        }}
      />

      {/* Additional orb for more movement */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full opacity-[0.18] blur-[90px] animate-float"
        style={{
          background: "radial-gradient(circle, oklch(0.48 0.16 290) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          animationDelay: "6s",
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(oklch(0.3 0 0) 1px, transparent 1px),
                           linear-gradient(90deg, oklch(0.3 0 0) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
