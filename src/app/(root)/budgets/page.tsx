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
import { financeApi, Budget, Category } from "@/services/finance-api";

type SortOrder = "asc" | "desc";

// Extended Budget interface for display with category name
interface BudgetWithCategory extends Budget {
  category_name?: string;
}

const sortBudgets = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === "period_start" || column === "period_end") {
      valueA = new Date(a[column]);
      valueB = new Date(b[column]);
    } else if (column === "budget_amount") {
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

const budgetSchema = z
  .object({
    period_start: z.date({
      required_error: "Please select a start date.",
    }),
    period_end: z.date({
      required_error: "Please select an end date.",
    }),
    category_id: z.number({
      required_error: "Please select a category.",
    }),
    budget_amount: z.coerce.number().min(0.01, {
      message: "Budget amount must be greater than 0.",
    }),
  })
  .refine((data) => data.period_end >= data.period_start, {
    message: "End date must be after or equal to start date",
    path: ["period_end"],
  });

type BudgetValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<
    "category_name" | "budget_amount" | "period_start" | "period_end" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedBudget, setSelectedBudget] =
    useState<BudgetWithCategory | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [filters, setFilters] = useState({
    date: undefined,
    dateType: null as DateFilterType,
    amount: undefined,
    amountType: null as AmountFilterType,
    categories: [] as number[],
  });

  const [activeDateType, setActiveDateType] = useState<DateFilterType>(null);
  const [activeAmountType, setActiveAmountType] =
    useState<AmountFilterType>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number | "all">(25);
  const [currentEntriesText, setCurrentEntriesText] = useState("25");

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      period_start: new Date(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      category_id: 0,
      budget_amount: 0,
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

  // Fetch both budgets and categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both budgets and categories in parallel
      const [budgetsData, categoriesData] = await Promise.all([
        financeApi.getBudgets(),
        financeApi.getCategories(),
      ]);

      console.log("✅ Budgets response:", budgetsData);
      console.log("✅ Categories response:", categoriesData);

      // Create a map of categories for easy lookup
      const categoryMap = new Map(
        categoriesData.map((cat) => [cat.id, cat.name])
      );

      // Enrich budgets with category names
      const budgetsWithCategories: BudgetWithCategory[] = budgetsData.map(
        (budget) => ({
          ...budget,
          category_name:
            categoryMap.get(budget.category_id) || "Unknown Category",
        })
      );

      setBudgets(budgetsWithCategories);
      setCategories(categoriesData);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setError(getErrorMessage(error));
      setBudgets([]);
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

  async function onSubmit(values: BudgetValues) {
    try {
      setModalError(null);

      const newBudgetData = {
        category_id: values.category_id,
        budget_amount: values.budget_amount,
        period_start: values.period_start.toISOString(),
        period_end: values.period_end.toISOString(),
      };

      await financeApi.createBudget(newBudgetData);

      // Refresh the list
      await fetchData();

      setOpenAdd(false);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  }

  const handleEditBudget = (budget: BudgetWithCategory) => {
    setSelectedBudget(budget);
    setModalError(null);
    form.setValue("period_start", new Date(budget.period_start));
    form.setValue("period_end", new Date(budget.period_end));
    form.setValue("category_id", budget.category_id);
    form.setValue("budget_amount", budget.budget_amount);
    setOpenEdit(true);
  };

  const handleUpdateBudget = async (values: BudgetValues) => {
    if (!selectedBudget) return;

    try {
      setModalError(null);

      const updateData = {
        category_id: values.category_id,
        budget_amount: values.budget_amount,
        period_start: values.period_start.toISOString(),
        period_end: values.period_end.toISOString(),
      };

      await financeApi.updateBudget(selectedBudget.id, updateData);

      // Refresh the list
      await fetchData();

      setOpenEdit(false);
      setSelectedBudget(null);
      form.reset();
      setModalError(null);
    } catch (error) {
      setModalError(getErrorMessage(error));
    }
  };

  const handleDeleteConfirmation = (budget: BudgetWithCategory) => {
    setSelectedBudget(budget);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    try {
      setError(null);

      await financeApi.deleteBudget(selectedBudget.id);

      // Refresh the list
      await fetchData();

      setDeleteDialogOpen(false);
      setSelectedBudget(null);
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

  const filteredBudgets = budgets.filter((budget) => {
    const searchText = searchQuery.toLowerCase();
    const categoryMatch =
      budget.category_name &&
      budget.category_name.toLowerCase().includes(searchText);

    // Apply category filter
    if (filters.categories.length > 0) {
      return categoryMatch && filters.categories.includes(budget.category_id);
    }

    return categoryMatch;
  });

  const sortedBudgets = sortBudgets(sortColumn, sortOrder, filteredBudgets);

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

  const displayedBudgets =
    entriesPerPage === "all"
      ? sortedBudgets
      : sortedBudgets.slice(0, entriesPerPage);

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
        <div className="text-lg">Loading budgets...</div>
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
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Manage your budgets here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search budgets..."
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
                      <DialogTitle>Filter Budgets</DialogTitle>
                      <DialogDescription>
                        Create filter conditions for the Budgets
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
                {filters.categories.length > 0 && (
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
                    <Button variant="outline">Add Budget</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Add Budget</DialogTitle>
                      <DialogDescription>
                        Add a new budget to your account.
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
                          name="period_start"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Period Start</FormLabel>
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
                                        format(field.value, "PPP")
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
                          name="period_end"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Period End</FormLabel>
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
                                        format(field.value, "PPP")
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
                          name="budget_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Amount ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="1000.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          Add Budget
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
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
                {filteredBudgets.length} of {budgets.length} budgets
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {displayedBudgets.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {searchQuery
                  ? "No budgets found matching your search."
                  : "No budgets available. Create your first budget!"}
              </div>
            ) : (
              <ScrollArea className="h-[600px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("period_start")}
                          className="font-semibold"
                        >
                          Period Start
                          {sortColumn === "period_start" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("period_end")}
                          className="font-semibold"
                        >
                          Period End
                          {sortColumn === "period_end" && (
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
                          onClick={() => handleSort("budget_amount")}
                          className="font-semibold"
                        >
                          Budget Amount
                          {sortColumn === "budget_amount" && (
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
                    {displayedBudgets.map((budget, index) => (
                      <TableRow
                        key={budget.id}
                        className={index % 2 === 0 ? "bg-muted/50" : ""}
                      >
                        <TableCell className="font-medium">
                          {formatDate(budget.period_start)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDate(budget.period_end)}
                        </TableCell>
                        <TableCell>{budget.category_name}</TableCell>
                        <TableCell>
                          ${Number(budget.budget_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
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
                                    handleDeleteConfirmation(budget)
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
                                    permanently delete the budget for "
                                    {selectedBudget?.category_name}" from your
                                    account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex justify-end gap-2">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteBudget}
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
              setSelectedBudget(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>Update your budget details.</DialogDescription>
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
                onSubmit={form.handleSubmit(handleUpdateBudget)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="period_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period Start</FormLabel>
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
                                format(field.value, "PPP")
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
                  name="period_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period End</FormLabel>
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
                                format(field.value, "PPP")
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
                  name="budget_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Budget Amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Update Budget
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
