"use client";
export const dynamic = "force-dynamic";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Plus,
  Eye,
  Users,
  Copy,
  X,
  BarChart2,
  Edit2,
  Delete,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { SummaryCard } from "@/components/ui/summary-card";
import { AddEntityModal } from "@/components/modals/add-entity-modal";
import { AddMemberModal } from "@/components/modals/add-member-modal";
import { useCollections } from "@/hooks/use-collections";
import { useMembers } from "@/hooks/use-members";
import { useNodes } from "@/hooks/use-nodes";
import { useAuth } from "@/lib/auth";
import { Node, Entity, Member, CHILD_TYPE_MAP, NodeType } from "@/lib/types";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { LoginCredentialsCard } from "@/components/ui/LoginCredentials";
import { EditEntityModal } from "@/components/modals/edit-entity-modal";
import { DeleteEntityModal } from "@/components/modals/delete-entity-modal";

type CollectionReportDTO = {
  current: Entity;
  children: Entity[];
};

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const nodeId = params.nodeId as string;
  const [nodeCode, setNodeCode] = useState(nodeId);

  const { user, isAuthenticated } = useAuth();
  const {
    getCollectionReport,
    loading: collectionsBusy,
    getNodeTotalCollection,
  } = useCollections();
  const { getBranchMembers, loading: membersBusy } = useMembers();
  const { getNodeChildren, getNodeByCode } = useNodes();

  // Local state
  const [children, setChildren] = useState<Node[] | null>(null);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [node, setNode] = useState<Node | null>(null);
  const [path, setPath] = useState<Node[]>([]);
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [totalCollection, setTotalCollection] = useState<number | null>(0);

  const [collectionsData, setCollectionsData] =
    useState<CollectionReportDTO | null>(null);
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Pagination + search state
  const [entityPage, setEntityPage] = useState(1);
  const [entityLimit, setEntityLimit] = useState(10);
  const [entitySearch, setEntitySearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [memberLimit, setMemberLimit] = useState(10);
  const [memberSearch, setMemberSearch] = useState("");

  // Login Information Card
  const [showCard, setShowCard] = useState(false);

  const handleCopy = () => {
    if (node?.nodeCode && node?.plainPassword) {
      const textToCopy = `Region: ${node.name}\nID: ${node.nodeCode}\nPassword: ${node.plainPassword}`;
      navigator.clipboard.writeText(textToCopy);
    }
  };

  // Guards
  useEffect(() => {
    if (user && !isAuthenticated) router.push("/login");
  }, [user, isAuthenticated, router]);

  const canAddChild =
    node?.type && CHILD_TYPE_MAP[node.type as keyof typeof CHILD_TYPE_MAP];
  const isBranch = node?.type === "Gram/Shakha/Mohalla/Sthaan";

  // Fetch Children
  const fetchChildren = useCallback(
    async (id: string) => {
      try {
        const children = await getNodeChildren(id);
        setChildren(children);
      } catch (e: any) {
        console.log(e);
      }
    },
    [getNodeChildren]
  );

  // Fetch Node
  const fetchNode = useCallback(
    async (nodeCode: string) => {
      try {
        const data = await getNodeByCode(nodeCode);
        setNode(data?.data ?? null);
        setPath(data?.path || []);
        setTotalMembers(data?.totalMembers ?? 0);
        setMembers(data?.members || []);
        setChildren(data?.children || null);
      } catch (e: any) {
        console.log(e);
      }
    },
    [getNodeByCode]
  );

  // Fetch total collection
  const fetchCollection = useCallback(
    async (id: string) => {
      try {
        const res = await getNodeTotalCollection(id);
        if (res) setTotalCollection(res);
      } catch (e: any) {
        console.log(e);
      }
    },
    [getNodeTotalCollection]
  );

  useEffect(() => {
    if (!nodeCode) return;
    fetchNode(nodeCode);
  }, [nodeCode, fetchNode]);

  useEffect(() => {
    if (!node?._id) return;
    fetchCollection(node._id);

    setEntityPage(1);
    setMemberPage(1);
  }, [node?._id, fetchCollection]);

  // Refetch after modals close
  useEffect(() => {
    if (!entityModalOpen && !editModalOpen && !deleteModalOpen && nodeCode ) fetchNode(nodeCode);
  }, [entityModalOpen, editModalOpen, deleteModalOpen, nodeCode, fetchNode]);

  // ---------- Columns ----------
  const entityColumns: Column<Node>[] = [
    { key: "name", header: "Name" },
    {
      key: "_id",
      header: "Actions",
      render: (_, row) => (
        <div className="flex flex-row gap-2 float-right">
          <Button
            onClick={() => router.push(`/dashboard/${row.nodeCode}`)}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>

          <Button
            onClick={() => router.push(`/collection/${row._id}`)}
            variant="outline"
            size="sm"
          >
            <BarChart2 className="h-4 w-4 mr-1" /> Collection Report
          </Button>
        </div>
      ),
    },
  ];

  const memberColumns: Column<Member>[] = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "age", header: "Age" },
    { key: "occupation", header: "Occupation" },
    
    {
      key: "_id",
      header: "Actions",
      render: (_, row) => (
        <Link href={`/members/${row._id}`}>
          <Button variant="outline" size="sm" className="hover:bg-gray-100">
            <Eye className="h-4 w-4 mr-1" /> View
          </Button>
        </Link>
      ),
    },
  ];

  // ---------- Filtering & Pagination ----------

  const filteredEntities = useMemo(() => {
    if (!entitySearch) return children;
    const q = entitySearch.toLowerCase().trim();
    return children?.filter((e) => e.name.toLowerCase().includes(q));
  }, [children, entitySearch]);

  const paginatedEntities = useMemo(() => {
    const startIndex = (entityPage - 1) * entityLimit;
    return filteredEntities?.slice(startIndex, startIndex + entityLimit);
  }, [filteredEntities, entityPage, entityLimit]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch) return members;
    const q = memberSearch.toLowerCase().trim();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m?.phone?.toLowerCase().includes(q) ||
        (m.occupation || "").toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (memberPage - 1) * memberLimit;
    return filteredMembers.slice(startIndex, startIndex + memberLimit);
  }, [filteredMembers, memberPage, memberLimit]);

  // ---------- Derived values ----------

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex justify-center items-center">
        <Spinner />
      </main>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-gray-50 flex flex-col">
      {/* Sticky header (compact) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white border-b shadow-sm"
      >
        <div className="mx-auto px-4 md:px-10 py-4 flex items-center justify-between gap-2">
          {/* Left: node label + type */}

          <div className="flex flex-col justify-start gap-2">
            {/* Breadcrumb row */}
            <div>
              {path.length > 0 && path[0].nodeCode != node?.nodeCode && (
                <nav className="flex items-center text-xs text-black w-fit rounded-full">
                  {path
                    .filter((p) => p.nodeCode !== node?.nodeCode)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p._id}>
                        <Link
                          href={`/dashboard/${p.nodeCode}`}
                          className="hover:text-orange-600 font-medium transition-colors"
                        >
                          {p.name}
                        </Link>
                        {idx < arr.length && (
                          <span className="mx-2 text-gray-400">&gt;</span>
                        )}
                      </React.Fragment>
                    ))}
                </nav>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-xl font-semibold text-gray-800 leading-tight">
                  {node?.name}
                </h1>
                {node?.type && (
                  <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                    {node.type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {canAddChild && node?.type!='Bharat' && (
              <Button
                variant={"secondary"}
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                <span>
                  Edit
                </span>
              </Button>
            )}

            {canAddChild && node?.type!='Bharat' && (
              <Button
              variant={"secondary"}
                onClick={() => setDeleteModalOpen(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                <span>
                  Delete
                </span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main content area */}
      <main className="w-full mx-auto px-4 md:px-6 py-8 space-y-4">
        {/* Overview / Summary cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-300 p-4 md:p-6 mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <SummaryCard
              title="Total Collection"
              value={(totalCollection as number) || 0}
              prefix="₹"
              icon={<IndianRupee className="h-5 w-5 text-orange-600" />}
              className="lg:col-span-1"
            />
            <SummaryCard
              title={`Total Members`}
              value={totalMembers as number}
              icon={<Users className="h-5 w-5 text-orange-600" />}
              className="lg:col-span-1"
            />

            {(canAddChild || isBranch) && (
              <div className="space-y-4">
                {!showCard && (
                  <div className="flex items-center gap-2 m-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCard(true)}
                      className="px-2 text-xs"
                    >
                      View Login Info
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      title="Copy ID & Password"
                      className="w-auto flex flex-row gap-2 px-2 text-xs"
                    >
                      <p>Copy</p> <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {showCard && (canAddChild || isBranch) && (
                  <div className="relative">
                    {/* Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setShowCard(false)}
                      title="Close"
                    >
                      <X className="w-4 h-4 z-50" />
                    </Button>

                    <LoginCredentialsCard
                      nodeCode={node?.nodeCode}
                      plainPassword={node?.plainPassword}
                      className="lg:col-span-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Error banner */}
        {(collectionsError || membersError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
            {collectionsError && (
              <p className="mb-1">Collections: {collectionsError}</p>
            )}
            {membersError && <p>Members: {membersError}</p>}
          </div>
        )}

        {/* Children Entities Table */}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {canAddChild && (
            <Button
              onClick={() => setEntityModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">
                Add {CHILD_TYPE_MAP[node?.type as keyof typeof CHILD_TYPE_MAP]}
              </span>
            </Button>
          )}

          {isBranch && (
            <Button
              onClick={() => setMemberModalOpen(true)}
              variant="default"
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-transform"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">Add Member</span>
            </Button>
          )}
        </div>

        {canAddChild && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg md:text-xl font-semibold">
                {CHILD_TYPE_MAP[node?.type as keyof typeof CHILD_TYPE_MAP]}s
              </h2>
            </div>

            {/* Table */}
            <div className="p-4 md:p-6">
              <DataTable
                columns={entityColumns}
                data={paginatedEntities || []}
                totalItems={filteredEntities?.length || 0}
                page={entityPage}
                limit={entityLimit}
                onPageChange={setEntityPage}
                onLimitChange={(l) => {
                  setEntityLimit(l);
                  setEntityPage(1);
                }}
                onSearch={(q) => {
                  setEntitySearch(q);
                  setEntityPage(1);
                }}
                loading={collectionsBusy}
              />
            </div>
          </motion.div>
        )}

        {/* Members Table */}
        {isBranch && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden"
          >
            <div className="px-6 py-3 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Members</h3>
            </div>

            <div className="p-4 md:p-6">
              <DataTable
                columns={memberColumns}
                data={paginatedMembers}
                totalItems={filteredMembers.length}
                page={memberPage}
                limit={memberLimit}
                onPageChange={setMemberPage}
                onLimitChange={(l) => {
                  setMemberLimit(l);
                  setMemberPage(1);
                }}
                onSearch={(q) => {
                  setMemberSearch(q);
                  setMemberPage(1);
                }}
                loading={membersBusy}
                searchPlaceholder="Search members..."
              />
            </div>
          </motion.section>
        )}
      </main>

      {/* Modals */}
      {canAddChild && node && (
        <AddEntityModal
          isOpen={entityModalOpen}
          onClose={() => setEntityModalOpen(false)}
          parentId={node?._id as string}
          parentType={node?.type as any}
        />
      )}
      {isBranch && (
        <AddMemberModal
          isOpen={memberModalOpen}
          onClose={() => setMemberModalOpen(false)}
          branchId={node?._id}
        />
      )}
      {node?.type!='Bharat' && 
        <EditEntityModal 
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          node={{
            id: node?._id as string,
            name: node?.name as string,
            type: node?.type as NodeType
          }}
        />
      }
      {node?.type!='Bharat' && 
        <DeleteEntityModal 
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          node={{
            id: node?._id as string,
            name: node?.name as string,
            type: node?.type as NodeType
          }}
        />
      }
    </div>
  );
}
