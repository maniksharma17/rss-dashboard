import { useState, useCallback } from "react";
import api from "@/lib/api";
import { Member } from "@/lib/types";

export type Mode = "cash" | "upi" | "cheque";
export type PaymentRow = {
  _id: string;
  amount: number;
  modeOfPayment: Mode;
  date: string;
  description?: string;
};

export type MemberResponse = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  age?: number;
  occupation?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  branchId?: { name?: string; type?: string };
  totalPaid: number;
  payments: PaymentRow[];
};

export function useMembers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create
  const createMember = useCallback(
    async (
      data: Omit<Member, "_id" | "totalPayment" | "branchId"> & { branchId: string }
    ): Promise<Member | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.post<{ data: Member }>("/members", data);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to create member";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Edit
  const editMember = useCallback(
    async (id: string, data: Partial<Member>): Promise<Member | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.put<{ data: Member }>(`/members/${id}`, data);
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to edit member";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete
  const deleteMember = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        await api.delete(`/members/${id}`);
        return true;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to delete member";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get my members
  const getMyMembers = useCallback(async (): Promise<Member[] | null> => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Member[] }>("/members/my-members");
      return res.data.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to fetch my members";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get branch members
  const getBranchMembers = useCallback(
    async (branchId: string): Promise<Member[] | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ data: Member[] }>(`/members/${branchId}`);
        return res.data.data;
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Failed to fetch branch members";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get single member details
  const getMember = useCallback(
    async (id: string): Promise<MemberResponse | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<{ data: MemberResponse }>(
          `/members/detail/${id}`
        );
        return res.data.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to fetch member";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createMember,
    editMember,
    deleteMember,
    getMyMembers,
    getBranchMembers,
    getMember,
    loading,
    error,
  };
}
