"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMembers } from "@/hooks/use-members";
import { Label } from "../ui/label";
import { usePayments } from "@/hooks/use-payments";

// Training options
const trainingOptions = [
  "प्रारंभिक",
  "प्राथमिक",
  "संघ शिक्षा वर्ग-१",
  "संघ शिक्षा वर्ग-२",
];

// -------------------
// Validation Schema
// -------------------
const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address").or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    address: z.string().min(1, "Address is required"),
    age: z.number().min(0),

    occupation: z.string().optional(),
    otherOccupation: z.string().optional(),
    educationLevel: z.string().optional(),
    college: z.string().optional(),

    birthYear: z.string().optional(),
    sanghYears: z.coerce.number().optional(),
    role: z.string().optional(),
    training: z.string().optional(),
    uniform: z.boolean().optional(),

    amount: z.string().optional(),
  });

type FormData = z.infer<typeof schema>;

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  branchId,
}) => {
  const { createMember, loading } = useMembers();
  const { createPayment } = usePayments();
  const [amount, setAmount] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      age: 0,
      occupation: "",
      otherOccupation: "",
      educationLevel: "",
      college: "",
      birthYear: "",
      sanghYears: undefined,
      role: "",
      training: "",
      uniform: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const finalOccupation =
        data.occupation === "Other" ? data.otherOccupation : data.occupation;

      const result = await createMember({
        ...data,
        occupation: finalOccupation || "",
        branchId,
      });

      const memberId = result?._id as string;

      if (Number(data.amount) > 0) {
        await createPayment({
          memberId,
          amount: Number(data.amount) as number,
          modeOfPayment: "cash",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
      }

      if (result) {
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create member:", error);
    }
  };

  const occupationValue = form.watch("occupation");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age */}
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter age"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Occupation Dropdown */}
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                      <SelectContent>
                        {occupations.map((job) => (
                          <SelectItem key={job} value={job}>
                            {job}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Occupation Field */}
            {occupationValue === "Other" && (
              <FormField
                control={form.control}
                name="otherOccupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter occupation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Student Fields */}
            {occupationValue === "Student" && (
              <>
                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education Level</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. B.Tech, 12th, MBA"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Birth Year */}
            <FormField
              control={form.control}
              name="birthYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Birth Year</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter birth year" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sangh Years */}
            <FormField
              control={form.control}
              name="sanghYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>संघ आयु</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter years"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>दायित्व</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Training Dropdown */}
            <FormField
              control={form.control}
              name="training"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>परशिक्षण</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Uniform */}
            <FormField
              control={form.control}
              name="uniform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mr-2">गणवेश</FormLabel>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
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
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Member"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const occupations = [
  "Other",

  // Agriculture & Labour
  "Farmer",
  "Daily Wage Worker",
  "Agricultural Worker",
  "Fisherman",
  "Construction Worker",
  "Factory Worker",
  "Miner",

  // Transport & Services
  "Driver",
  "Auto Rickshaw Driver",
  "Truck Driver",
  "Delivery Person",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Mechanic",
  "Tailor",
  "Barber",
  "Cook / Chef",
  "Housekeeping Staff",
  "Security Guard",
  "Sanitation Worker",

  // Small Business & Trade
  "Shopkeeper",
  "Street Vendor",
  "Small Business Owner",
  "Trader",
  "Business",
  "Entrepreneur",

  // Clerical & Support
  "Clerk",
  "Office Assistant",
  "Receptionist",
  "Data Entry Operator",
  "Call Center Employee",

  // Education
  "Teacher",
  "Professor",
  "Tutor",
  "Researcher",

  // Healthcare
  "Nurse",
  "Doctor",
  "Pharmacist",
  "Lab Technician",
  "Healthcare Worker",
  "AYUSH Practitioner",

  // Engineering & Tech
  "Engineer",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Software Developer",
  "IT Professional",
  "Technician",

  // Finance & Administration
  "Bank Employee",
  "Accountant",
  "Chartered Accountant",
  "Auditor",
  "Financial Analyst",

  // Govt & Public Service
  "Government Employee",
  "Police",
  "Armed Forces",
  "Post Office Employee",
  "Railway Employee",

  // Arts & Media
  "Artist",
  "Musician",
  "Actor",
  "Journalist",
  "Designer",

  // Others
  "Homemaker",
  "Student",
  "Retired",
  "Unemployed",
];
