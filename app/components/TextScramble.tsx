import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface TextScrambleProps {
  text: string;
  className?: string;
  delay?: number;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

export function TextScramble({ text, className = '', delay = 0 }: TextScrambleProps) {
  const [displayed, setDisplayed] = useState(text);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    const timeout = setTimeout(() => {
      let iteration = 0;
      const totalIterations = text.length * 3;

      const interval = setInterval(() => {
        setDisplayed(
          text.split('').map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration / 3) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );

        iteration++;
        if (iteration >= totalIterations) {
          setDisplayed(text);
          setHasAnimated(true);
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isInView, text, delay, hasAnimated]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.3 }}
      className={`inline-block font-mono ${className}`}
    >
      {displayed}
    </motion.span>
  );
}
