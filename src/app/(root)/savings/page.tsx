"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, CalendarIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { financeApi, SavingGoal } from "@/services/finance-api";

type SortOrder = "asc" | "desc";

// API Response types for nested response structure
interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

interface SavingGoalsResponse {
  savingGoals?: SavingGoal[];
  saving_goals?: SavingGoal[];
}

const sortSavingsGoals = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === "target_date" || column === "start_date") {
      valueA = new Date(a[column]);
      valueB = new Date(b[column]);
    } else if (column === "target_amount" || column === "current_amount") {
      valueA = a[column];
      valueB = b[column];
    } else {
      valueA = (a[column] as string).toLowerCase();
      valueB = (b[column] as string).toLowerCase();
    }

    if (order === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
};

const savingGoalSchema = z
  .object({
    goal_name: z.string().min(3, {
      message: "Goal name must be at least 3 characters.",
    }),
    target_amount: z.coerce.number().min(0.01, {
      message: "Target amount must be greater than 0.",
    }),
    current_amount: z.coerce.number().min(0, {
      message: "Current amount must be 0 or greater.",
    }),
    target_date: z.date({
      required_error: "Please select a target date.",
    }),
    description: z.string().optional(),
  })
  .refine((data) => data.current_amount <= data.target_amount, {
    message: "Current amount cannot exceed target amount",
    path: ["current_amount"],
  });

type SavingGoalValues = z.infer<typeof savingGoalSchema>;

export default function SavingsPage() {
  const [savingsGoals, setSavingsGoals] = useState<SavingGoal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<
    "goal_name" | "target_amount" | "current_amount" | "target_date" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedSavingGoal, setSelectedSavingGoal] =
    useState<SavingGoal | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [entriesPerPage, setEntriesPerPage] = useState<number | "all">(25);

  const form = useForm<SavingGoalValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: {
      goal_name: "",
      target_amount: 0,
      current_amount: 0,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      description: "",
    },
  });

  // Enhanced error handling function
  const getErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  };
  const fetchSavingsGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await financeApi.getSavingGoals();
      console.log("✅ Savings Goals response:", response);

      // Handle different response structures
      let savingsData: SavingGoal[] = [];

      if (Array.isArray(response)) {
        savingsData = response;
      } else if (response && typeof response === "object") {
        const apiResponse = response as
          | SavingGoal[]
          | ApiResponse<SavingGoalsResponse>;

        if ("success" in apiResponse && apiResponse.data) {
          if (apiResponse.data.savingGoals) {
            savingsData = apiResponse.data.savingGoals;
          } else if (apiResponse.data.saving_goals) {
            savingsData = apiResponse.data.saving_goals;
          }
        } else if ("savingGoals" in apiResponse) {
          savingsData = (apiResponse as any).savingGoals;
        } else if ("saving_goals" in apiResponse) {
          savingsData = (apiResponse as any).saving_goals;
        }
      }

      setSavingsGoals(Array.isArray(savingsData) ? savingsData : []);
    } catch (error) {
      console.error("❌ Error fetching savings goals:", error);
      setError("Failed to load savings goals. Please try again.");
      setSavingsGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSavingsGoals();
    }
  }, [mounted]);

  async function onSubmit(values: SavingGoalValues) {
    try {
      setModalError(null);

      const newSavingGoalData = {
        goal_name: values.goal_name,
        target_amount: values.target_amount,
        current_amount: values.current_amount,
        start_date: new Date().toISOString(),
        target_date: values.target_date.toISOString(),
        description: values.description || "",
      };

      const createdGoal = await financeApi.createSavingGoal(newSavingGoalData);

      // Refresh the list or add the new goal locally
      await fetchSavingsGoals();

      setOpenAdd(false);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  }

  const handleEditSavingGoal = (savingGoal: SavingGoal) => {
    setSelectedSavingGoal(savingGoal);
    setModalError(null); // Clear any previous modal errors
    form.setValue("goal_name", savingGoal.goal_name);
    form.setValue("target_amount", savingGoal.target_amount);
    form.setValue("current_amount", savingGoal.current_amount);
    form.setValue("target_date", new Date(savingGoal.target_date));
    form.setValue("description", savingGoal.description || "");
    setOpenEdit(true);
  };

  const handleUpdateSavingGoal = async (values: SavingGoalValues) => {
    if (!selectedSavingGoal) return;

    try {
      setModalError(null);

      const updateData = {
        goal_name: values.goal_name,
        target_amount: values.target_amount,
        current_amount: values.current_amount,
        target_date: values.target_date.toISOString(),
        description: values.description || "",
      };

      await financeApi.updateSavingGoal(selectedSavingGoal.id, updateData);

      // Refresh the list
      await fetchSavingsGoals();

      setOpenEdit(false);
      setSelectedSavingGoal(null);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  };

  const handleDeleteConfirmation = (savingGoal: SavingGoal) => {
    setSelectedSavingGoal(savingGoal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSavingGoal = async () => {
    if (!selectedSavingGoal) return;

    try {
      setError(null);

      await financeApi.deleteSavingGoal(selectedSavingGoal.id);

      // Refresh the list
      await fetchSavingsGoals();

      setDeleteDialogOpen(false);
      setSelectedSavingGoal(null);
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const filteredSavingsGoals = savingsGoals.filter((savingGoal) => {
    const searchText = searchQuery.toLowerCase();
    const goalNameMatch =
      savingGoal.goal_name &&
      savingGoal.goal_name.toLowerCase().includes(searchText);
    const descriptionMatch =
      savingGoal.description &&
      savingGoal.description.toLowerCase().includes(searchText);

    return goalNameMatch || descriptionMatch;
  });

  const sortedSavingsGoals = sortSavingsGoals(
    sortColumn,
    sortOrder,
    filteredSavingsGoals
  );
  const displayedSavingsGoals =
    entriesPerPage === "all"
      ? sortedSavingsGoals
      : sortedSavingsGoals.slice(0, entriesPerPage);

  // Safe date formatting function to avoid hydration issues
  const formatDate = (dateString: string) => {
    if (!mounted) return dateString; // Return raw string during SSR
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Safe date formatting for forms
  const formatDateForInput = (date: Date | null) => {
    if (!mounted || !date) return "";
    try {
      return format(date, "PPP");
    } catch (error) {
      return "";
    }
  };
  const getProgressPercentage = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading savings goals...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>Manage your savings goals here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search savings goals..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="max-w-md"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Dialog
                  open={openAdd}
                  onOpenChange={(open) => {
                    setOpenAdd(open);
                    if (!open) {
                      setModalError(null);
                      form.reset();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">Add Savings Goal</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Add Savings Goal</DialogTitle>
                      <DialogDescription>
                        Add a new savings goal to your account.
                      </DialogDescription>
                    </DialogHeader>

                    {modalError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {modalError}
                        </div>
                      </div>
                    )}

                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                      >
                        <FormField
                          control={form.control}
                          name="goal_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Emergency Fund"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="target_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Amount ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="10000.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="current_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Amount ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="target_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Target Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        formatDateForInput(field.value)
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional details about your savings goal..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          Add Savings Goal
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <span className="text-sm text-muted-foreground">
                {filteredSavingsGoals.length} of {savingsGoals.length} goals
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            {displayedSavingsGoals.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {searchQuery
                  ? "No savings goals found matching your search."
                  : "No savings goals available. Create your first goal!"}
              </div>
            ) : (
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("goal_name")}
                          className="font-semibold"
                        >
                          Goal Name
                          {sortColumn === "goal_name" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("target_amount")}
                          className="font-semibold"
                        >
                          Target Amount
                          {sortColumn === "target_amount" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("current_amount")}
                          className="font-semibold"
                        >
                          Progress
                          {sortColumn === "current_amount" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("target_date")}
                          className="font-semibold"
                        >
                          Target Date
                          {sortColumn === "target_date" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSavingsGoals.map((savingGoal, index) => {
                      const progressPercentage = getProgressPercentage(
                        savingGoal.current_amount,
                        savingGoal.target_amount
                      );

                      return (
                        <TableRow
                          key={savingGoal.id}
                          className={index % 2 === 0 ? "bg-muted/50" : ""}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">
                                {savingGoal.goal_name}
                              </div>
                              {savingGoal.description && (
                                <div className="text-sm text-muted-foreground">
                                  {savingGoal.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            ${Number(savingGoal.target_amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>
                                  $
                                  {Number(
                                    savingGoal.current_amount || 0
                                  ).toFixed(2)}
                                </span>
                                <span>{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress
                                value={progressPercentage}
                                className="w-[100px]"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(savingGoal.target_date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSavingGoal(savingGoal)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog
                                open={isDeleteDialogOpen}
                                onOpenChange={setDeleteDialogOpen}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteConfirmation(savingGoal)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the savings goal "
                                      {selectedSavingGoal?.goal_name}" from your
                                      account.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex justify-end gap-2">
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteSavingGoal}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={openEdit}
          onOpenChange={(open) => {
            setOpenEdit(open);
            if (!open) {
              setModalError(null);
              setSelectedSavingGoal(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Savings Goal</DialogTitle>
              <DialogDescription>
                Update your savings goal details.
              </DialogDescription>
            </DialogHeader>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {modalError}
                </div>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleUpdateSavingGoal)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="goal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Goal Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Target Amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="current_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Current Amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDateForInput(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Update Savings Goal
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
