import { useState, useCallback } from "react";
import api from "@/lib/api";
import { Payment } from "@/lib/types";

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(
    async (
      data: Omit<Payment, "_id" | "memberId"> & { memberId: string }
    ): Promise<Payment | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post<{ data: Payment }>("/payments", data);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to create payment";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getMyBranchPayments = useCallback(async (): Promise<Payment[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Payment[] }>("/payments/my-branch");
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch branch payments";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMemberPayments = useCallback(
    async (memberId: string): Promise<Payment[] | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ data: Payment[] }>(`/payments/${memberId}`);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to fetch member payments";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPayment = useCallback(async (id: string): Promise<Payment | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Payment }>(`/payments/detail/${id}`);
      return res.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to fetch payment";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPayment,
    getMyBranchPayments,
    getMemberPayments,
    getPayment,
    loading,
    error,
  };
}
