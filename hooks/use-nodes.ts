import { useState, useCallback } from "react";
import api from "@/lib/api";
import { Entity, Member, Node } from "@/lib/types";

type NodeResponse = {
  data: Node;      
  path: Node[];    
  success: boolean;
  totalMembers: number;
  members?: Member[];
  children: Node[];
};

export function useNodes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNode = useCallback(
    async (data: { name: string; type: string; parentId?: string }): Promise<Entity | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post<{ data: Entity }>("/nodes", data);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to create node";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const editNode = useCallback(
    async (id: string, data: { name: string }): Promise<Entity | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.put<{ data: Entity }>(`/nodes/${id}`, data);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to edit node";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteNode = useCallback(
    async (id: string, data: { password: string }): Promise<Entity | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.delete(`/nodes/${id}`, { data });
        return res.data
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to edit node";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getNode = useCallback(async (id: string): Promise<Node | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Node }>(`/nodes/${id}`);
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch node";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNodeByCode = useCallback(async (id: string): Promise<NodeResponse | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<NodeResponse>(`/nodes/code/${id}`);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch node";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNodeChildren = useCallback(async (id: string): Promise<Node[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Node[] }>(`/nodes/${id}/children`);
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch children";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyChildren = useCallback(async (): Promise<Entity[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Entity[] }>("/nodes/my-children");
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch my children";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createNode,
    getNode,
    getNodeChildren,
    getMyChildren,
    getNodeByCode,
    deleteNode,
    editNode,
    loading,
    error,
  };
}
