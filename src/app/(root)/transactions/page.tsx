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
import { X, CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { Edit, Trash2 } from "lucide-react";
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
import { financeApi, Transaction, Category } from "@/services/finance-api";

type SortOrder = "asc" | "desc";

// Extended Transaction interface for display with category name
interface TransactionWithCategory {
  id: number;
  category_id: number;
  amount: number;
  description: string;
  transaction_type: "income" | "expense";
  transaction_date?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  category_name?: string;
  category?: {
    id: number;
    name: string;
    description: string;
  };
}

const sortTransactions = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === "transaction_date" || column === "createdAt") {
      // Handle both transaction_date and createdAt fields
      const dateA = a.transaction_date || a.createdAt || a.created_at;
      const dateB = b.transaction_date || b.createdAt || b.created_at;
      valueA = new Date(dateA);
      valueB = new Date(dateB);
    } else if (column === "amount") {
      valueA = Number(a[column]) || 0;
      valueB = Number(b[column]) || 0;
    } else {
      valueA = (a[column] as string)?.toLowerCase() || "";
      valueB = (b[column] as string)?.toLowerCase() || "";
    }

    if (order === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
};

type DateFilterType = "exact" | "before" | "after" | null;
type AmountFilterType = "exact" | "less" | "more" | null;

const transactionSchema = z.object({
  created_at: z.date({
    required_error: "Please select a transaction date.",
  }),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  category_id: z.number({
    required_error: "Please select a category.",
  }),
  amount: z.coerce.number().min(0.01, {
    message: "Amount must be greater than 0.",
  }),
  transaction_type: z.enum(["income", "expense"], {
    required_error: "Please select a transaction type.",
  }),
});

type TransactionValues = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<
    | "transaction_date"
    | "description"
    | "category_name"
    | "amount"
    | "transaction_type"
    | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // Default to newest first
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithCategory | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [filters, setFilters] = useState({
    date: undefined as Date | undefined,
    dateType: null as DateFilterType,
    amount: undefined as number | undefined,
    amountType: null as AmountFilterType,
    categories: [] as number[],
  });

  const [activeDateType, setActiveDateType] = useState<DateFilterType>(null);
  const [activeAmountType, setActiveAmountType] =
    useState<AmountFilterType>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number | "all">(25);
  const [currentEntriesText, setCurrentEntriesText] = useState("25");

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      created_at: new Date(),
      description: "",
      category_id: 0,
      amount: 0,
      transaction_type: "expense",
    },
  });

  // Error handling function
  const getErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  };

  // Safe date formatting function to avoid hydration issues
  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return dateString;
    }
  };

  // Get the display date from transaction (handles both API formats)
  const getTransactionDate = (transaction: TransactionWithCategory): string => {
    return (
      transaction.transaction_date ||
      transaction.createdAt ||
      transaction.created_at ||
      ""
    );
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

  // Fetch both transactions and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both transactions and categories in parallel
      const [transactionsData, categoriesData] = await Promise.all([
        financeApi.getTransactions(),
        financeApi.getCategories(),
      ]);

      console.log("✅ Transactions response:", transactionsData);
      console.log("✅ Categories response:", categoriesData);

      // Create a map of categories for easy lookup
      const categoryMap = new Map(
        categoriesData.map((cat) => [cat.id, cat.name])
      );

      // Enrich transactions with category names
      const transactionsWithCategories: TransactionWithCategory[] =
        transactionsData.map((transaction: any) => ({
          ...transaction,
          category_name:
            transaction.category?.name ||
            categoryMap.get(transaction.category_id) ||
            "Unknown Category",
        }));

      setTransactions(transactionsWithCategories);
      setCategories(categoriesData);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError(getErrorMessage(error));
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
    }
  }, [mounted]);

  async function onSubmit(values: TransactionValues) {
    try {
      setModalError(null);

      const newTransactionData = {
        category_id: values.category_id,
        amount: values.amount,
        description: values.description,
        transaction_type: values.transaction_type,
      };

      await financeApi.createTransaction(newTransactionData);

      // Refresh the list
      await fetchData();

      setOpenAdd(false);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  }

  const handleEditTransaction = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction);
    setModalError(null);
    const transactionDate = getTransactionDate(transaction);
    form.setValue("created_at", new Date(transactionDate));
    form.setValue("description", transaction.description);
    form.setValue("category_id", transaction.category_id);
    form.setValue("amount", transaction.amount);
    form.setValue("transaction_type", transaction.transaction_type);
    setOpenEdit(true);
  };

  const handleUpdateTransaction = async (values: TransactionValues) => {
    if (!selectedTransaction) return;

    try {
      setModalError(null);

      const updateData = {
        category_id: values.category_id,
        amount: values.amount,
        description: values.description,
        transaction_type: values.transaction_type,
      };

      await financeApi.updateTransaction(selectedTransaction.id, updateData);

      // Refresh the list
      await fetchData();

      setOpenEdit(false);
      setSelectedTransaction(null);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  };

  const handleDeleteConfirmation = (transaction: TransactionWithCategory) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      setError(null);

      await financeApi.deleteTransaction(selectedTransaction.id);

      // Refresh the list
      await fetchData();

      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
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

  const filteredTransactions = transactions.filter((transaction) => {
    const searchText = searchQuery.toLowerCase();
    const descriptionMatch =
      transaction.description &&
      transaction.description.toLowerCase().includes(searchText);
    const categoryMatch =
      transaction.category_name &&
      transaction.category_name.toLowerCase().includes(searchText);

    const dateMatch = () => {
      if (filters.date) {
        const transactionDate = getTransactionDate(transaction);
        const formattedTransactionDate = formatDate(transactionDate);
        const filterDate = format(filters.date, "yyyy-MM-dd");

        if (filters.dateType === "exact") {
          return formattedTransactionDate === filterDate;
        }
        if (filters.dateType === "before") {
          return formattedTransactionDate < filterDate;
        }
        if (filters.dateType === "after") {
          return formattedTransactionDate > filterDate;
        }
      }
      return true;
    };

    const amountMatch = () => {
      if (filters.amount) {
        if (filters.amountType === "exact") {
          return Number(transaction.amount) === filters.amount;
        }
        if (filters.amountType === "less") {
          return Number(transaction.amount) < filters.amount;
        }
        if (filters.amountType === "more") {
          return Number(transaction.amount) > filters.amount;
        }
      }
      return true;
    };

    const categoryFilter = () => {
      if (filters.categories.length === 0) {
        return true;
      }
      return filters.categories.includes(transaction.category_id);
    };

    return (
      (descriptionMatch || categoryMatch) &&
      dateMatch() &&
      amountMatch() &&
      categoryFilter()
    );
  });

  const sortedTransactions = sortTransactions(
    sortColumn,
    sortOrder,
    filteredTransactions
  );

  const handleRemoveFilter = () => {
    setFilters({
      date: undefined,
      dateType: null,
      amount: undefined,
      amountType: null,
      categories: [],
    });
    setActiveDateType(null);
    setActiveAmountType(null);
  };

  const handleCategoryCheckboxChange = (categoryId: number) => {
    setFilters((prevFilters) => {
      const updatedCategories = prevFilters.categories.includes(categoryId)
        ? prevFilters.categories.filter((c) => c !== categoryId)
        : [...prevFilters.categories, categoryId];
      return { ...prevFilters, categories: updatedCategories };
    });
  };

  const handleEntriesPerPageChange = (value: number | "all", text: string) => {
    setEntriesPerPage(value);
    setCurrentEntriesText(text);
  };

  const displayedTransactions =
    entriesPerPage === "all"
      ? sortedTransactions
      : sortedTransactions.slice(0, entriesPerPage);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading transactions...</div>
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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Manage your transactions here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="max-w-md"
                />
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Add Filters</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Filter Transactions</DialogTitle>
                      <DialogDescription>
                        Create filter conditions for the Transactions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Date
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant={"outline"}>
                              {filters.date ? (
                                format(filters.date, "yyyy-MM-dd")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.date}
                              onSelect={(date) =>
                                setFilters({ ...filters, date: date })
                              }
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("2020-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <SelectDateType
                          setFilters={setFilters}
                          filters={filters}
                          activeDateType={activeDateType}
                          setActiveDateType={setActiveDateType}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount
                        </Label>
                        <Input
                          type="number"
                          id="amount"
                          value={filters.amount || ""}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              amount: parseFloat(e.target.value),
                            })
                          }
                        />
                        <SelectAmountType
                          setFilters={setFilters}
                          filters={filters}
                          activeAmountType={activeAmountType}
                          setActiveAmountType={setActiveAmountType}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right">Categories</Label>
                        <div className="col-span-3 flex flex-col space-y-1">
                          {categories.map((category) => (
                            <div
                              className="flex items-center space-x-2"
                              key={category.id}
                            >
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={filters.categories.includes(
                                  category.id
                                )}
                                onCheckedChange={() =>
                                  handleCategoryCheckboxChange(category.id)
                                }
                              />
                              <Label htmlFor={`category-${category.id}`}>
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {(filters.date ||
                  filters.amount ||
                  filters.categories.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFilter}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove Filter
                  </Button>
                )}
              </div>
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
                  <Button variant="outline">Add Transaction</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add Transaction</DialogTitle>
                    <DialogDescription>
                      Add a new transaction to your account.
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
                        name="created_at"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Transaction Date</FormLabel>
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
                                  disabled={(date) => date > new Date()}
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Grocery shopping"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    {field.value
                                      ? categories.find(
                                          (cat) => cat.id === field.value
                                        )?.name || "Select category"
                                      : "Select category"}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                  {categories.map((category) => (
                                    <DropdownMenuItem
                                      key={category.id}
                                      onSelect={() =>
                                        field.onChange(category.id)
                                      }
                                    >
                                      {category.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="50.00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="transaction_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transaction Type</FormLabel>
                            <FormControl>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    {field.value
                                      ? field.value.charAt(0).toUpperCase() +
                                        field.value.slice(1)
                                      : "Select type"}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-full">
                                  <DropdownMenuItem
                                    onSelect={() => field.onChange("income")}
                                  >
                                    Income
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => field.onChange("expense")}
                                  >
                                    Expense
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Add Transaction
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span>Show entries:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {currentEntriesText}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleEntriesPerPageChange(25, "25")}
                    >
                      25
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEntriesPerPageChange(50, "50")}
                    >
                      50
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEntriesPerPageChange(100, "100")}
                    >
                      100
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEntriesPerPageChange("all", "All")}
                    >
                      All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {displayedTransactions.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {searchQuery ||
                filters.date ||
                filters.amount ||
                filters.categories.length > 0
                  ? "No transactions found matching your criteria."
                  : "No transactions available. Create your first transaction!"}
              </div>
            ) : (
              <ScrollArea className="h-[600px] w-full p-3.5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("transaction_date")}
                          className="font-semibold"
                        >
                          Date
                          {sortColumn === "transaction_date" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("description")}
                          className="font-semibold"
                        >
                          Description
                          {sortColumn === "description" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("category_name")}
                          className="font-semibold"
                        >
                          Category
                          {sortColumn === "category_name" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("amount")}
                          className="font-semibold"
                        >
                          Amount
                          {sortColumn === "amount" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("transaction_type")}
                          className="font-semibold"
                        >
                          Type
                          {sortColumn === "transaction_type" && (
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
                    {displayedTransactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={index % 2 === 0 ? "bg-muted/50" : ""}
                      >
                        <TableCell className="font-medium">
                          {formatDate(getTransactionDate(transaction))}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.category_name}</TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            transaction.transaction_type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {transaction.transaction_type === "expense"
                            ? "-"
                            : "+"}
                          ${Number(transaction.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                              transaction.transaction_type === "income"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {transaction.transaction_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
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
                                    handleDeleteConfirmation(transaction)
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
                                    permanently delete the transaction "
                                    {selectedTransaction?.description}" from
                                    your account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteTransaction}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              setSelectedTransaction(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Update your transaction details.
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
                onSubmit={form.handleSubmit(handleUpdateTransaction)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="created_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Transaction Date</FormLabel>
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
                            disabled={(date) => date > new Date()}
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              {field.value
                                ? categories.find(
                                    (cat) => cat.id === field.value
                                  )?.name || "Select category"
                                : "Select category"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            {categories.map((category) => (
                              <DropdownMenuItem
                                key={category.id}
                                onSelect={() => field.onChange(category.id)}
                              >
                                {category.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <FormControl>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              {field.value
                                ? field.value.charAt(0).toUpperCase() +
                                  field.value.slice(1)
                                : "Select type"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            <DropdownMenuItem
                              onSelect={() => field.onChange("income")}
                            >
                              Income
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => field.onChange("expense")}
                            >
                              Expense
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Update Transaction
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function SelectDateType({
  setFilters,
  filters,
  activeDateType,
  setActiveDateType,
}: {
  setFilters: any;
  filters: any;
  activeDateType: DateFilterType;
  setActiveDateType: any;
}) {
  const handleDateTypeChange = (type: DateFilterType) => {
    setFilters((prevFilters: any) => ({ ...prevFilters, dateType: type }));
    setActiveDateType(type);
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange("exact")}
        className={
          activeDateType === "exact" ? "bg-accent text-accent-foreground" : ""
        }
      >
        Exact
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange("before")}
        className={
          activeDateType === "before" ? "bg-accent text-accent-foreground" : ""
        }
      >
        Before
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange("after")}
        className={
          activeDateType === "after" ? "bg-accent text-accent-foreground" : ""
        }
      >
        After
      </Button>
    </div>
  );
}

function SelectAmountType({
  setFilters,
  filters,
  activeAmountType,
  setActiveAmountType,
}: {
  setFilters: any;
  filters: any;
  activeAmountType: AmountFilterType;
  setActiveAmountType: any;
}) {
  const handleAmountTypeChange = (type: AmountFilterType) => {
    setFilters((prevFilters: any) => ({ ...prevFilters, amountType: type }));
    setActiveAmountType(type);
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange("exact")}
        className={
          activeAmountType === "exact" ? "bg-accent text-accent-foreground" : ""
        }
      >
        Exact
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange("less")}
        className={
          activeAmountType === "less" ? "bg-accent text-accent-foreground" : ""
        }
      >
        Less
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange("more")}
        className={
          activeAmountType === "more" ? "bg-accent text-accent-foreground" : ""
        }
      >
        More
      </Button>
    </div>
  );
}
