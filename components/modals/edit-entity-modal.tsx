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
import { NodeType, CHILD_TYPE_MAP } from '@/lib/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string(), // keep type here, but we won’t send it in update since your editNode only accepts {name}
});

type FormData = z.infer<typeof schema>;

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    name: string;
    type: NodeType;
  } | null;
}

export const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  node,
}) => {
  const { editNode, loading } = useNodes();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: node?.name || '',
      type: node?.type || '',
    },
  });

  // Reset form whenever node changes
  useEffect(() => {
    if (node) {
      form.reset({
        name: node.name,
        type: node.type,
      });
    }
  }, [node, form]);

  const onSubmit = async (data: FormData) => {
    if (!node) return;

    try {
      await editNode(node.id, { name: data.name });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to update entity:', error);
    }
  };

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {node.type}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type (just shown, not editable since API doesn’t update it) */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Input value={field.value} disabled />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
