'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import clsx from 'clsx';

interface SummaryCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  className?: string;
  accentColor?: string; // for icon bg (default blue)
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  className,
  accentColor = 'bg-orange-100 text-orange-600',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={clsx(
          'rounded-2xl h-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            {title}
          </CardTitle>
          {icon && (
            <div
              className={clsx(
                'h-10 w-10 flex items-center justify-center rounded-full',
                accentColor
              )}
            >
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight text-gray-900">
            {prefix}
            {displayValue.toLocaleString()}
            {suffix}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
