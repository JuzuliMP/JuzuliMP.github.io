import { useEffect, useRef } from 'react';

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
      { x: 0.3, y: 0.3, r: 400, color: [139, 92, 246], speed: 0.0003 },
      { x: 0.7, y: 0.6, r: 350, color: [6, 182, 212], speed: 0.0004 },
      { x: 0.5, y: 0.8, r: 300, color: [236, 72, 153], speed: 0.0005 },
      { x: 0.2, y: 0.7, r: 250, color: [59, 130, 246], speed: 0.0003 },
    ];

    function animate() {
      if (!ctx || !canvas) return;
      time++;

      ctx.fillStyle = '#06060e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((blob, i) => {
        const x = canvas.width * (blob.x + 0.15 * Math.sin(time * blob.speed + i));
        const y = canvas.height * (blob.y + 0.15 * Math.cos(time * blob.speed * 1.3 + i));
        const r = blob.r * (1 + 0.1 * Math.sin(time * blob.speed * 0.5));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${blob.color.join(',')}, 0.15)`);
        gradient.addColorStop(0.5, `rgba(${blob.color.join(',')}, 0.05)`);
        gradient.addColorStop(1, `rgba(${blob.color.join(',')}, 0)`);

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
