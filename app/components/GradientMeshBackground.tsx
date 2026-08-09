import { useEffect, useRef } from 'react';

function parseColor(colorStr: string): [number, number, number] {
  colorStr = (colorStr || '').trim();
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  const match = colorStr.match(/\d+/g);
  if (match && match.length >= 3) {
    return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
  }
  return [139, 92, 246];
}

export function GradientMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const blobs = [
      { x: 0.3, y: 0.3, r: 400, speed: 0.0003 },
      { x: 0.7, y: 0.6, r: 350, speed: 0.0004 },
      { x: 0.5, y: 0.8, r: 300, speed: 0.0005 },
      { x: 0.2, y: 0.7, r: 250, speed: 0.0003 },
    ];

    function animate() {
      if (!ctx || !canvas) return;
      time++;

      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--background').trim() || '#06060e';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const c1 = parseColor(style.getPropertyValue('--neon-purple') || '#8b5cf6');
      const c2 = parseColor(style.getPropertyValue('--neon-cyan') || '#06b6d4');
      const c3 = parseColor(style.getPropertyValue('--neon-pink') || '#ec4899');
      const c4 = parseColor(style.getPropertyValue('--primary') || '#8b5cf6');
      const colors = [c1, c2, c3, c4];

      blobs.forEach((blob, i) => {
        const color = colors[i % colors.length];
        const x = canvas.width * (blob.x + 0.15 * Math.sin(time * blob.speed + i));
        const y = canvas.height * (blob.y + 0.15 * Math.cos(time * blob.speed * 1.3 + i));
        const r = blob.r * (1 + 0.1 * Math.sin(time * blob.speed * 0.5));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${color.join(',')}, 0.15)`);
        gradient.addColorStop(0.5, `rgba(${color.join(',')}, 0.05)`);
        gradient.addColorStop(1, `rgba(${color.join(',')}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animId = requestAnimationFrame(animate);
    }

    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
