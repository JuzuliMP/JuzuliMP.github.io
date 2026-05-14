import { useRef, useState, ReactNode, MouseEvent } from 'react';
import { motion } from 'motion/react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glareColor?: string;
  tiltStrength?: number;
}

export function TiltCard({ children, className = '', glareColor = 'rgba(139, 92, 246, 0.1)', tiltStrength = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouse = (e: MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    setTilt({
      x: (y - 0.5) * tiltStrength,
      y: (x - 0.5) * -tiltStrength,
    });

    setGlare({
      x: x * 100,
      y: y * 100,
      opacity: 0.15,
    });
  };

  const handleLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative overflow-hidden ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {/* Glare */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glareColor}, transparent 60%)`,
          opacity: glare.opacity,
        }}
      />
      {/* Edge glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 30px rgba(139, 92, 246, ${glare.opacity * 0.3})`,
          opacity: glare.opacity > 0 ? 1 : 0,
        }}
      />
    </motion.div>
  );
}
