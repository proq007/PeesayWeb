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
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from 'uuid';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Mock transaction data based on the schema
const mockTransactions = [
  {
    transaction_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
    category_id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef12',
    amount: 50.00,
    transaction_date: '2024-07-15T12:00:00Z',
    description: 'Grocery shopping',
    transaction_type: 'expense',
    created_at: '2024-07-15T12:30:00Z',
    category_name: 'Food',
  },
  {
    transaction_id: '1234abcd-5678-9012-3456-7890abcdef1234',
    user_id: 'uvwxyz01-2345-6789-0abc-defghijklmno01',
    category_id: 'c3d4e5f6-7a8b-9012-3456-7890abcdef123c',
    amount: 2000.00,
    transaction_date: '2024-07-14T09:00:00Z',
    description: 'Salary deposit',
    transaction_type: 'income',
    created_at: '2024-07-14T09:30:00Z',
    category_name: 'Income',
  },
  {
    transaction_id: 'bcdefa12-3456-7890-abcd-ef1234567890ab',
    user_id: 'pqrstu12-3456-7890-bcde-fghijklmnopq23',
    category_id: 'd4e5f6a7-8b9c-0123-4567-890abcdef123d',
    amount: 35.50,
    transaction_date: '2024-07-13T18:00:00Z',
    description: 'Dinner with friends',
    transaction_type: 'expense',
    created_at: '2024-07-13T18:45:00Z',
    category_name: 'Food',
  },
  {
    transaction_id: '7890efab-cdef-1234-5678-90abcdef123456',
    user_id: 'klmno345-6789-0abc-defg-hijklmnopqr34',
    category_id: 'e5f6a7b8-9c0d-1234-5678-90abcdef123e',
    amount: 120.00,
    transaction_date: '2024-07-12T15:00:00Z',
    description: 'Online purchase',
    transaction_type: 'expense',
    created_at: '2024-07-12T15:15:00Z',
    category_name: 'Shopping',
  },
  {
    transaction_id: 'efabcd78-9012-3456-789a-bcdefa12345678',
    user_id: 'defghi56-7890-abcd-efgh-ijklmnopqr56',
    category_id: 'f6a7b8c9-0d1e-2345-6789-0abcdef123f',
    amount: 500.00,
    transaction_date: '2024-07-11T10:00:00Z',
    description: 'Freelance income',
    transaction_type: 'income',
    created_at: '2024-07-11T10:20:00Z',
    category_name: 'Income',
  },
  {
    transaction_id: 'ghijk789-0123-4567-89ab-cdefghijk78901',
    user_id: 'qrstuv78-9012-3456-7890-abcdefghijkl78',
    category_id: '1a2b3c4d-5e6f-7890-1234-567890abcdef1a',
    amount: 75.00,
    transaction_date: '2024-07-10T14:00:00Z',
    description: 'Movie tickets',
    transaction_type: 'expense',
    created_at: '2024-07-10T14:30:00Z',
    category_name: 'Entertainment',
  },
  {
    transaction_id: 'lmnop123-4567-89ab-cdef-ghijklmnop123456',
    user_id: 'uvwxy901-2345-6789-0abc-defghijklmnopqr90',
    category_id: '2b3c4d5e-6f7a-8901-2345-67890abcdef2b',
    amount: 60.00,
    transaction_date: '2024-07-09T11:00:00Z',
    description: 'Gym membership',
    transaction_type: 'expense',
    created_at: '2024-07-09T11:45:00Z',
    category_name: 'Health',
  },
  {
    transaction_id: 'zyxwvuts-9876-5432-10ab-cdefzyxwvuts9876',
    user_id: 'rstuvwxy-6543-2109-bacd-efghijklmnopqr65',
    category_id: '3c4d5e6f-7a8b-9012-3456-7890abcdef3c',
    amount: 150.00,
    transaction_date: '2024-07-08T16:00:00Z',
    description: 'Car insurance',
    transaction_type: 'expense',
    created_at: '2024-07-08T16:20:00Z',
    category_name: 'Transportation',
  },
  {
    transaction_id: 'ponmlkjh-3456-7890-abcd-efghijklmponmlkj',
    user_id: 'lmnopqrs-2345-6789-bcde-fghijklmnopqr23',
    category_id: '4d5e6f7a-8b9c-0123-4567-890abcdef4d',
    amount: 80.00,
    transaction_date: '2024-07-07T13:00:00Z',
    description: 'Electricity bill',
    transaction_type: 'expense',
    created_at: '2024-07-07T13:30:00Z',
    category_name: 'Utilities',
  },
  {
    transaction_id: 'srqponml-8901-2345-6789-abcdefghijsrqpon',
    user_id: 'klmnopqrst-7654-3210-fedc-bahijklmnopqr76',
    category_id: '5e6f7a8b-9c0d-1234-5678-90abcdef5e',
    amount: 400.00,
    transaction_date: '2024-07-06T17:00:00Z',
    description: 'Rent payment',
    transaction_type: 'expense',
    created_at: '2024-07-06T17:10:00Z',
    category_name: 'Housing',
  },
  {
    transaction_id: 'f1a2b3c4-d5e6-7890-1a2b-c3d4e5f6a7b8',
    user_id: 'g9h0i1j2-k3l4-m5n6-o7p8-q9r0s1t2u3v4',
    category_id: 'b8c7d6e5-f4a3-2109-8b7c-6d5e4f3a2109',
    amount: 25.00,
    transaction_date: '2024-07-05T08:00:00Z',
    description: 'Morning coffee',
    transaction_type: 'expense',
    created_at: '2024-07-05T08:15:00Z',
    category_name: 'Food',
  },
  {
    transaction_id: 'c2d3e4f5-a6b7-8901-2c3d-e4f5a6b7c8d9',
    user_id: 'i2j3k4l5-m6n7-o8p9-q0r1-s2t3u4v5w6x7',
    category_id: 'd7e6f5a4-b3c2-0198-7d6e-5f4a3b2c1098',
    amount: 300.00,
    transaction_date: '2024-07-04T19:00:00Z',
    description: 'Consulting fee',
    transaction_type: 'income',
    created_at: '2024-07-04T19:45:00Z',
    category_name: 'Income',
  },
  {
    transaction_id: 'e3f4a5b6-c7d8-9012-3e4f-a5b6c7d8e9f0',
    user_id: 'k3l4m5n6-o7p8-q9r0-s1t2-u3v4w5x6y7z8',
    category_id: 'f8a7b6c5-d4e3-2345-9f8a-7b6c5d4e3210',
    amount: 90.00,
    transaction_date: '2024-07-03T15:00:00Z',
    description: 'New shoes',
    transaction_type: 'expense',
    created_at: '2024-07-03T15:30:00Z',
    category_name: 'Shopping',
  },
  {
    transaction_id: 'a4b5c6d7-e8f9-0123-4a5b-c6d7e8f9a0b1',
    user_id: 'm4n5o6p7-q8r9-s0t1-u2v3-w4x5y6z7a8b9',
    category_id: '9a8b7c6d-5e4f-3456-ab9c-8d7e6f5a4321',
    amount: 45.00,
    transaction_date: '2024-07-02T12:00:00Z',
    description: 'Lunch with colleagues',
    transaction_type: 'expense',
    created_at: '2024-07-02T12:20:00Z',
    category_name: 'Food',
  },
  {
    transaction_id: '5b6c7d8e-f9a0-1234-5c6d-7e8f9a0b1c2d',
    user_id: 'o5p6q7r8-s9t0-u1v2-w3x4-y5z6a7b8c9d0',
    category_id: 'c0d9e8f7-a6b5-4567-bc0d-9e8f7a6b5432',
    amount: 1800.00,
    transaction_date: '2024-07-01T09:00:00Z',
    description: 'Investment return',
    transaction_type: 'income',
    created_at: '2024-07-01T09:10:00Z',
    category_name: 'Investment',
  },
];

type SortOrder = 'asc' | 'desc';

const sortTransactions = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === 'transaction_date') {
      valueA = new Date(a[column]);
      valueB = new Date(b[column]);
    } else if (column === 'amount') {
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

const transactionSchema = z.object({
  transaction_date: z.date(),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  category_name: z.string().min(1, {
    message: "Category must be selected.",
  }),
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense']),
});

type TransactionValues = z.infer<typeof transactionSchema>

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<
    'transaction_date' | 'description' | 'category_name' | 'amount' | 'transaction_type' | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [filters, setFilters] = useState({
    date: undefined,
    dateType: null as DateFilterType,
    amount: undefined,
    amountType: null as AmountFilterType,
    categories: [],
  });

  // New states for active filter types
  const [activeDateType, setActiveDateType] = useState<DateFilterType>(null);
  const [activeAmountType, setActiveAmountType] = useState<AmountFilterType>(null);

  const [entriesPerPage, setEntriesPerPage] = useState<number | 'all'>(25); // Default to 25 entries per page
  const [currentEntriesText, setCurrentEntriesText] = useState('25');

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_date: new Date(),
      description: "",
      category_name: "",
      amount: 0,
      transaction_type: "expense",
    },
  })

  function onSubmit(values: TransactionValues) {
    const newTransaction = {
      transaction_id: uuidv4(),
      user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
      category_id: uuidv4(),
      amount: values.amount,
      transaction_date: values.transaction_date.toISOString(),
      description: values.description,
      transaction_type: values.transaction_type,
      created_at: new Date().toISOString(),
      category_name: values.category_name,
    };
    setTransactions([...transactions, newTransaction]);
    setOpenAdd(false);
    form.reset();
  }

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    form.setValue('transaction_date', new Date(transaction.transaction_date));
    form.setValue('description', transaction.description);
    form.setValue('category_name', transaction.category_name);
    form.setValue('amount', transaction.amount);
    form.setValue('transaction_type', transaction.transaction_type);
    setOpenEdit(true);
  };

  const handleUpdateTransaction = (values: TransactionValues) => {
    if (selectedTransaction) {
      const updatedTransactions = transactions.map((transaction) =>
        transaction.transaction_id === selectedTransaction.transaction_id
          ? {
            ...transaction,
            transaction_date: values.transaction_date.toISOString(),
            description: values.description,
            category_name: values.category_name,
            amount: values.amount,
            transaction_type: values.transaction_type,
          }
          : transaction
      );
      setTransactions(updatedTransactions);
      setOpenEdit(false);
      setSelectedTransaction(null);
      form.reset();
    }
  };

  const handleDeleteConfirmation = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction) {
      const updatedTransactions = transactions.filter(
        (transaction) => transaction.transaction_id !== selectedTransaction.transaction_id
      );
      setTransactions(updatedTransactions);
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      //const data = await fetch('/api/transactions'); // Update the API endpoint
      //In this example since we dont have a backend, we are using mock data.
      const transactions = mockTransactions;
      //const transactions = await data.json();
      setTransactions(transactions);
    };
    fetchTransactions();
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

  const filteredTransactions = transactions.filter((transaction) => {
    const searchText = searchQuery.toLowerCase();
    const descriptionMatch = transaction.description && transaction.description.toLowerCase().includes(searchText);
    const categoryMatch = transaction.category_name && transaction.category_name.toLowerCase().includes(searchText);

    const dateMatch = () => {
      if (filters.date) {
        const transactionDate = format(new Date(transaction.transaction_date), 'yyyy-MM-dd');
        const filterDate = format(filters.date, 'yyyy-MM-dd');

        if (filters.dateType === 'exact') {
          return transactionDate === filterDate;
        }
        if (filters.dateType === 'before') {
          return transactionDate < filterDate;
        }
        if (filters.dateType === 'after') {
          return transactionDate > filterDate;
        }
      }
      return true;
    };

    const amountMatch = () => {
      if (filters.amount) {
        if (filters.amountType === 'exact') {
          return transaction.amount === filters.amount;
        }
        if (filters.amountType === 'less') {
          return transaction.amount < filters.amount;
        }
        if (filters.amountType === 'more') {
          return transaction.amount > filters.amount;
        }
      }
      return true;
    };

    const categoryFilter = () => {
      if (filters.categories.length === 0) {
        return true;
      }
      return filters.categories.includes(transaction.category_name);
    };

    return (descriptionMatch || categoryMatch) && dateMatch() && amountMatch() && categoryFilter();
  });


  const sortedTransactions = sortTransactions(sortColumn, sortOrder, filteredTransactions);

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

  // Function to handle changing the number of entries per page
  const handleEntriesPerPageChange = (value: number | 'all', text: string) => {
    setEntriesPerPage(value);
    setCurrentEntriesText(text);
  };

  const displayedTransactions = entriesPerPage === 'all' ? sortedTransactions : sortedTransactions.slice(0, entriesPerPage);


  return (<>
    <div className="flex flex-col gap-4 p-4">
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
                  <Button variant="outline">
                    Add Filters
                  </Button>
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
                          <Button variant={'outline'}>
                            {filters.date ? (
                              format(filters.date, 'yyyy-MM-dd')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={filters.date}
                            onSelect={(date) => setFilters({ ...filters, date: date })}
                            disabled={(date) =>
                              date > new Date() || date < new Date('2020-01-01')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <SelectDateType setFilters={setFilters} filters={filters} activeDateType={activeDateType} setActiveDateType={setActiveDateType} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        Amount
                      </Label>
                      <Input
                        type="number"
                        id="amount"
                        value={filters.amount || ''}
                        onChange={(e) => setFilters({ ...filters, amount: parseFloat(e.target.value) })}
                      />
                      <SelectAmountType setFilters={setFilters} filters={filters} activeAmountType={activeAmountType} setActiveAmountType={setActiveAmountType} />
                    </div>
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
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Add a new transaction to your account.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="transaction_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Date</FormLabel>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Amount" {...field} />
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
                                <Button variant="outline" className="w-[180px] justify-start">
                                  {field.value ? field.value : "Select type"}

                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[180px]">
                                <DropdownMenuItem onSelect={() => field.onChange('income')}>
                                  Income
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => field.onChange('expense')}>
                                  Expense
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Add Transaction</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
                    <Button variant="ghost" onClick={() => handleSort('transaction_date')}>Date</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('description')}>Description</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('category_name')}>Category</Button>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('amount')}>Amount</Button>
                  </TableHead>
                  <TableHead className="w-[80px]">
                    <Button variant="ghost" onClick={() => handleSort('transaction_type')}>Type</Button>
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedTransactions.map((transaction, index) => (
                  <TableRow key={transaction.transaction_id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{format(new Date(transaction.transaction_date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category_name}</TableCell>
                    <TableCell className="text-right">{transaction.transaction_type === 'expense' ? '-' : ''}${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.transaction_type}</TableCell>
                    <TableCell className="text-right flex flex-row gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onClick={() => handleDeleteConfirmation(transaction)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this transaction from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteTransaction}>Continue</AlertDialogAction>
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
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Edit an existing transaction in your account.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateTransaction)} className="space-y-8">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Amount" {...field} />
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
                          <Button variant="outline" className="w-[180px] justify-start">
                            {field.value ? field.value : "Select type"}

                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[180px]">
                          <DropdownMenuItem onSelect={() => field.onChange('income')}>
                            Income
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => field.onChange('expense')}>
                            Expense
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Update Transaction</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  </>
  );
}

function SelectDateType({ setFilters, filters, activeDateType, setActiveDateType }: { setFilters: any, filters: any, activeDateType: DateFilterType, setActiveDateType: any }) {
  const handleDateTypeChange = (type: DateFilterType) => {
    setFilters(prevFilters => ({ ...prevFilters, dateType: type }));
    setActiveDateType(type); // Set the active state
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange('exact')}
        className={activeDateType === 'exact' ? "bg-accent text-accent-foreground" : ""}
      >
        Exact
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange('before')}
        className={activeDateType === 'before' ? "bg-accent text-accent-foreground" : ""}
      >
        Before
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDateTypeChange('after')}
        className={activeDateType === 'after' ? "bg-accent text-accent-foreground" : ""}
      >
        After
      </Button>
    </div>
  );
}

function SelectAmountType({ setFilters, filters, activeAmountType, setActiveAmountType }: { setFilters: any, filters: any, activeAmountType: AmountFilterType, setActiveAmountType: any }) {
  const handleAmountTypeChange = (type: AmountFilterType) => {
    setFilters(prevFilters => ({ ...prevFilters, amountType: type }));
    setActiveAmountType(type); // Set the active state
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange('exact')}
        className={activeAmountType === 'exact' ? "bg-accent text-accent-foreground" : ""}
      >
        Exact
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange('less')}
        className={activeAmountType === 'less' ? "bg-accent text-accent-foreground" : ""}
      >
        Less
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAmountTypeChange('more')}
        className={activeAmountType === 'more' ? "bg-accent text-accent-foreground" : ""}
      >
        More
      </Button>
    </div>
  );
}

