import { useState, useCallback } from "react";
import api from "@/lib/api";
import { NodeType } from "@/lib/types";

export interface CollectionReport {
  nodeId: string;
  name: string;
  type: NodeType;
  year: string;
  totalCollection: number;
  averageCollectionPerUser: number;
  monthlyCollection: number[];
  totalMembers: number;
  topPerformingChildren: [{
    name: string;
    total: number
  }];
  worstPerformingChildren: [{
    name: string;
    total: number
  }];
  childPerformances: [{
    name: string;
    total: number
  }];
  collectionsToday: number
}

export function useCollections() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMyCollectionSummary = useCallback(async (): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: any }>("/collections/my-summary");
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch collection summary";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCollectionReport = useCallback(async (nodeId: string, year?: string): Promise<CollectionReport | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<CollectionReport>(`/collections/${nodeId}?year=${year}`);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch collection report";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNodeTotalCollection = useCallback(async (nodeId: string): Promise<number | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<number>(`/collections/total/${nodeId}`);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch collection report";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getMyCollectionSummary,
    getCollectionReport,
    getNodeTotalCollection,
    loading,
    error,
  };
}
