import { useEffect, useRef } from 'react';

export function CodeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const codeSnippets = [
      'Widget build()',
      'setState()',
      'async/await',
      'Provider<T>',
      'StreamBuilder',
      'FutureBuilder',
      'Navigator.push',
      'BlocBuilder',
      'final dynamic',
      'class extends',
      '@override',
      'void initState',
      'MaterialApp',
      'Scaffold',
      'Column()',
      'Row()',
      'Container()',
      'ListView.builder'
    ];

    class CodeParticle {
      x: number;
      y: number;
      text: string;
      speed: number;
      opacity: number;
      fontSize: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        this.speed = 0.2 + Math.random() * 0.3;
        this.opacity = 0.1 + Math.random() * 0.2;
        this.fontSize = 12 + Math.random() * 4;
      }

      update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.font = `${this.fontSize}px monospace`;
        ctx.fillStyle = `rgba(20, 184, 166, ${this.opacity})`;
        ctx.fillText(this.text, this.x, this.y);
      }
    }

    const particles: CodeParticle[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push(new CodeParticle());
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10"
      style={{ zIndex: 0 }}
    />
  );
}
