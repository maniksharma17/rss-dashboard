'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMembers } from '@/hooks/use-members';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  memberName?: string;
  onDeleted?: () => void; 
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberName,
  onDeleted,
}) => {
  const { deleteMember, loading } = useMembers();

  const handleDelete = async () => {
    if (!memberId) return;
    try {
      const result = await deleteMember(memberId);
      if (result) {
        onDeleted?.(); 
        onClose();
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">{memberName || 'this member'}</span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
