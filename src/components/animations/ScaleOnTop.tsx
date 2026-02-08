'use client';

import { motion } from "motion/react"
import { ReactNode } from 'react';

interface ScaleOnTapProps {
  children: ReactNode;
  className?: string;
  scale?: number;
}

export function ScaleOnTap({ 
  children, 
  className = '',
  scale = 0.95 
}: ScaleOnTapProps) {
  return (
    <motion.div
      whileTap={{ scale }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}