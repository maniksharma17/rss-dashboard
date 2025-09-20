export interface Entity {
  _id: string;
  name: string;
  type: string;
  totalCollection: number;
  parentId?: string;
  children?: Entity[];
  path?: { id: string; name: string; type: string }[];
}

export interface Node {
  _id: string;
  name: string;
  plainPassword: string;
  type: NodeType;
  parentId: string;
  nodeCode: string;
}

export interface Member {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  occupation: string;
  branchId: string;
  totalPayment: number;
}

export interface Payment {
  _id: string;
  memberId: string;
  amount: number;
  date: string;
  modeOfPayment: 'cash' | 'upi' | 'cheque';
  description: string
}

export const NODE_TYPES = [
  'Bharat',
  'Kshetra',
  'Prant',
  'Vibhag',
  'Jila',
  'Nagar/Khand',
  'Basti/Mandal',
  'Gram/Shakha/Mohalla/Sthaan'
] as const;

export type NodeType = typeof NODE_TYPES[number];

export const CHILD_TYPE_MAP: Record<NodeType, NodeType | null> = {
  Bharat: 'Kshetra',
  Kshetra: 'Prant',
  Prant: 'Vibhag',
  Vibhag: 'Jila',
  Jila: 'Nagar/Khand',
  'Nagar/Khand': 'Basti/Mandal',
  'Basti/Mandal': 'Gram/Shakha/Mohalla/Sthaan',
  'Gram/Shakha/Mohalla/Sthaan': null,
};
1 