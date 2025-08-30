'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Copy } from 'lucide-react';
import clsx from 'clsx';

interface LoginCredentialsCardProps {
  nodeCode: string;
  plainPassword: string;
  className?: string;
}

export const LoginCredentialsCard: React.FC<LoginCredentialsCardProps> = ({
  nodeCode,
  plainPassword,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={clsx(
          'relative w-full rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">
            Login Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Node Code */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Login ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">{nodeCode}</span>
              <button
                onClick={() => copyToClipboard(nodeCode)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Password:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">
                {showPassword ? plainPassword : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
              <button
                onClick={() => copyToClipboard(plainPassword)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
