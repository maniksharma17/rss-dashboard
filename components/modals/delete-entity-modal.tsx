'use client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNodes } from '@/hooks/use-nodes';
import { NodeType } from '@/lib/types';

const schema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

interface DeleteEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    name: string;
    type: NodeType;
  } | null;
}

export const DeleteEntityModal: React.FC<DeleteEntityModalProps> = ({
  isOpen,
  onClose,
  node,
}) => {
  const { deleteNode, loading } = useNodes();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
    },
  });

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({ password: '' });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: FormData) => {
    if (!node) return;

    try {
      await deleteNode(node.id, data); 
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to delete entity:', error);
    }
  };

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Do you want to delete {node.type} &quot;{node.name}&quot;?
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This action is permanent and cannot be undone.  
              Please enter your password to confirm deletion.
            </p>

            {/* Password confirmation */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
