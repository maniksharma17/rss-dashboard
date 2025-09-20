'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { NODE_TYPES } from '@/lib/types';
import api from '@/lib/api';

const schema = z.object({
  nodeType: z.string().min(1, 'Node type is required'),
  nodeCode: z.string().min(1, 'Node ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user?.nodeId) {
      router.replace(`/dashboard/${user.nodeId}`);
    }
  }, [isAuthenticated, user, router]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nodeType: '',
      nodeCode: '',
      password: '',
    },
  });

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      const { data } = response.data;

      login({
        id: data.nodeId,
        nodeType: data.type,
        nodeId: data.nodeCode,
        name: data.name,
      }, data.token);
      
      router.push(`/dashboard/${data.nodeCode}`);
    } catch (error: any) {
      console.error('Login failed:', error);
      form.setError('password', {
        type: 'manual',
        message: error.response?.data?.message || 'Login failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 via-orange-100 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nodeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NODE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nodeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your entity ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                        />  
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-orange-500 text-white hover:bg-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}