'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { v4 as uuidv4 } from 'uuid';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Mock budget data based on the schema
const mockBudgets = [
  {
    budget_id: 'b1b2c3d4-e5f6-7890-1234-567890abcdef',
    user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
    category_id: 'c1c2c3d4-e5f6-7890-1234-567890abcdef',
    budget_amount: 500.00,
    period_start: '2024-07-01T00:00:00Z',
    period_end: '2024-07-31T23:59:59Z',
    created_at: '2024-07-01T00:30:00Z',
    category_name: 'Food',
  },
  {
    budget_id: '2234abcd-5678-9012-3456-7890abcdef1234',
    user_id: 'uvwxyz01-2345-6789-0abc-defghijklmno01',
    category_id: 'd4e5f6a7-8b9c-0123-4567-890abcdef123d',
    budget_amount: 1000.00,
    period_start: '2024-07-01T00:00:00Z',
    period_end: '2024-07-31T23:59:59Z',
    created_at: '2024-07-01T09:30:00Z',
    category_name: 'Travel',
  },
  {
    budget_id: 'bcdefa12-3456-7890-abcd-ef1234567890ab',
    user_id: 'pqrstu12-3456-7890-bcde-fghijklmnopq23',
    category_id: 'e5f6a7b8-9c0d-1234-5678-90abcdef123e',
    budget_amount: 200.00,
    period_start: '2024-07-01T00:00:00Z',
    period_end: '2024-07-31T23:59:59Z',
    created_at: '2024-07-01T18:45:00Z',
    category_name: 'Entertainment',
  },
];

type SortOrder = 'asc' | 'desc';

const sortBudgets = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === 'period_start' || column === 'period_end') {
      valueA = new Date(a[column]);
      valueB = new Date(b[column]);
    } else if (column === 'budget_amount') {
      valueA = a[column];
      valueB = b[column];
    } else {
      valueA = (a[column] as string).toLowerCase();
      valueB = (b[column] as string).toLowerCase();
    }

    if (order === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
};

const mockCategories = [
  "Food",
  "Income",
  "Shopping",
  "Entertainment",
  "Health",
  "Transportation",
  "Utilities",
  "Housing",
  "Investment",
];

type DateFilterType = 'exact' | 'before' | 'after' | null;
type AmountFilterType = 'exact' | 'less' | 'more' | null;

const budgetSchema = z.object({
  period_start: z.date(),
  period_end: z.date(),
  category_name: z.string().min(1, {
    message: "Category must be selected.",
  }),
  budget_amount: z.number(),
});

type BudgetValues = z.infer<typeof budgetSchema>

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState(mockBudgets);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<
    'category_name' | 'budget_amount' | 'period_start' | 'period_end' | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    date: undefined,
    dateType: null as DateFilterType,
    amount: undefined,
    amountType: null as AmountFilterType,
    categories: [],
  });

  const [activeDateType, setActiveDateType] = useState<DateFilterType>(null);
  const [activeAmountType, setActiveAmountType] = useState<AmountFilterType>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number | 'all'>(25);
  const [currentEntriesText, setCurrentEntriesText] = useState('25');

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      period_start: new Date(),
      period_end: new Date(),
      category_name: "",
      budget_amount: 0,
    },
  })

  function onSubmit(values: BudgetValues) {
    const newBudget = {
      budget_id: uuidv4(),
      user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
      category_id: uuidv4(),
      budget_amount: values.budget_amount,
      period_start: values.period_start.toISOString(),
      period_end: values.period_end.toISOString(),
      created_at: new Date().toISOString(),
      category_name: values.category_name,
    };
    setBudgets([...budgets, newBudget]);
    setOpenAdd(false);
    form.reset();
  }

  const handleEditBudget = (budget: any) => {
    setSelectedBudget(budget);
    form.setValue('period_start', new Date(budget.period_start));
    form.setValue('period_end', new Date(budget.period_end));
    form.setValue('category_name', budget.category_name);
    form.setValue('budget_amount', budget.budget_amount);
    setOpenEdit(true);
  };

  const handleUpdateBudget = (values: BudgetValues) => {
    if (selectedBudget) {
      const updatedBudgets = budgets.map((budget) =>
        budget.budget_id === selectedBudget.budget_id
          ? {
            ...budget,
            budget_amount: values.budget_amount,
            period_start: values.period_start.toISOString(),
            period_end: values.period_end.toISOString(),
            category_name: values.category_name,
          }
          : budget
      );
      setBudgets(updatedBudgets);
      setOpenEdit(false);
      setSelectedBudget(null);
      form.reset();
    }
  };


  const handleDeleteConfirmation = (budget: any) => {
    setSelectedBudget(budget);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBudget = () => {
    if (selectedBudget) {
      const updatedBudgets = budgets.filter(
        (budget) => budget.budget_id !== selectedBudget.budget_id
      );
      setBudgets(updatedBudgets);
      setDeleteDialogOpen(false);
      setSelectedBudget(null);
    }
  };

  useEffect(() => {
    const fetchBudgets = async () => {
      //const data = await fetch('/api/budgets'); // Update the API endpoint
      const budgets = mockBudgets;
      //const budgets = await data.json();
      setBudgets(budgets);
    };
    fetchBudgets();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const searchText = searchQuery.toLowerCase();
    const categoryMatch = budget.category_name && budget.category_name.toLowerCase().includes(searchText);

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

  const handleCategoryCheckboxChange = (category: string) => {
    setFilters((prevFilters) => {
      const updatedCategories = prevFilters.categories.includes(category)
        ? prevFilters.categories.filter((c) => c !== category)
        : [...prevFilters.categories, category];
      return { ...prevFilters, categories: updatedCategories };
    });
  };

  const handleEntriesPerPageChange = (value: number | 'all', text: string) => {
    setEntriesPerPage(value);
    setCurrentEntriesText(text);
  };

  const displayedBudgets = entriesPerPage === 'all' ? sortedBudgets : sortedBudgets.slice(0, entriesPerPage);

  return (<>
    <div className="flex flex-col gap-4 p-4">
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
                  <Button variant="outline">
                    Add Filters
                  </Button>
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
                      <Label className="text-right">
                        Categories
                      </Label>
                      <div className="col-span-3 flex flex-col space-y-1">
                        {mockCategories.map((category) => (
                          <div className="flex items-center space-x-2" key={category}>
                            <Checkbox
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={() => handleCategoryCheckboxChange(category)}
                            />
                            <Label htmlFor={`category-${category}`}>{category}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {Object.keys(filters).some(key => filters[key]) && (
                <Button variant="ghost" size="sm" onClick={handleRemoveFilter}>
                  <X className="mr-2 h-4 w-4" />
                  Remove Filter
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Add Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add Budget</DialogTitle>
                    <DialogDescription>
                      Add a new budget to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <FormField
                        control={form.control}
                        name="period_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period Start</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "yyyy-MM-dd")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("2020-01-01")
                                  }
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
                          <FormItem>
                            <FormLabel>Period End</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "yyyy-MM-dd")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("2020-01-01")
                                  }
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
                        name="category_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-[180px] justify-start">
                                    {field.value ? field.value : "Select category"}

                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[180px]">
                                  {mockCategories.map((category) => (
                                    <DropdownMenuItem key={category} onSelect={() => field.onChange(category)}>
                                      {category}
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
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Amount" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Add Budget</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!selectedBudget}>
                    Edit Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Edit Budget</DialogTitle>
                    <DialogDescription>
                      Edit an existing budget in your account.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateBudget)} className="space-y-8">
                      <FormField
                        control={form.control}
                        name="period_start"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period Start</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "yyyy-MM-dd")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("2020-01-01")
                                  }
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
                          <FormItem>
                            <FormLabel>Period End</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "yyyy-MM-dd")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("2020-01-01")
                                  }
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
                        name="category_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-[180px] justify-start">
                                    {field.value ? field.value : "Select category"}

                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[180px]">
                                  {mockCategories.map((category) => (
                                    <DropdownMenuItem key={category} onSelect={() => field.onChange(category)}>
                                      {category}
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
                            <FormLabel>Budget Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Amount" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Update Budget</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <span>Show entries:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {currentEntriesText} <span className="ml-2"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => handleEntriesPerPageChange(25, "25")}>
                  25
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEntriesPerPageChange(50, "50")}>
                  50
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEntriesPerPageChange(100, "100")}>
                  100
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEntriesPerPageChange('all', "All")}>
                  All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" onClick={() => handleSort('period_start')}>Period Start</Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button variant="ghost" onClick={() => handleSort('period_end')}>Period End</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('category_name')}>Category</Button>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('budget_amount')}>Budget Amount</Button>
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedBudgets.map((budget, index) => (
                  <TableRow key={budget.budget_id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{format(new Date(budget.period_start), 'yyyy-MM-dd')}</TableCell>
                    <TableCell className="font-medium">{format(new Date(budget.period_end), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{budget.category_name}</TableCell>
                    <TableCell className="text-right">${budget.budget_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right flex flex-row gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onClick={() => handleDeleteConfirmation(budget)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this budget from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteBudget}>Continue</AlertDialogAction>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card >
    </div >
  </>
  );
}

