'use client';
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreadcrumbComponent } from '@/components/ui/breadcrumb-component';
import { UserMenu } from '@/components/layout/user-menu';
import { useAuth } from '@/lib/auth';

interface NavbarProps {
  onSidebarToggle: () => void;
  breadcrumbs?: { id: string; name: string; type: string }[];
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle, breadcrumbs = [] }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <BreadcrumbComponent items={breadcrumbs} />
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.nodeType}</p>
        </div>
        <UserMenu />
      </div>
    </header>
  );
};