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
import { Progress } from "@/components/ui/progress"


const mockSavingsGoals = [
  {
    goal_id: 'g1g2c3d4-e5f6-7890-1234-567890abcdef',
    user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
    goal_name: 'New Car',
    target_amount: 25000.00,
    current_amount: 5000.00,
    start_date: '2024-07-01T00:00:00Z',
    target_date: '2025-12-31T23:59:59Z',
    description: 'Save for a new electric vehicle',
    created_at: '2024-07-01T00:30:00Z',
    updated_at: '2024-07-01T00:30:00Z',
  },
  {
    goal_id: '3334abcd-5678-9012-3456-7890abcdef1234',
    user_id: 'uvwxyz01-2345-6789-0abc-defghijklmno01',
    goal_name: 'Home Down Payment',
    target_amount: 50000.00,
    current_amount: 10000.00,
    start_date: '2024-07-01T00:00:00Z',
    target_date: '2027-12-31T23:59:59Z',
    description: 'Save for a down payment on a house',
    created_at: '2024-07-01T09:30:00Z',
    updated_at: '2024-07-01T09:30:00Z',
  },
  {
    goal_id: 'bcdefa12-3456-7890-abcd-ef1234567890ab',
    user_id: 'pqrstu12-3456-7890-bcde-fghijklmnopq23',
    goal_name: 'Dream Vacation',
    target_amount: 10000.00,
    current_amount: 2000.00,
    start_date: '2024-07-01T00:00:00Z',
    target_date: '2025-06-30T23:59:59Z',
    description: 'Save for a dream vacation to Europe',
    created_at: '2024-07-01T18:45:00Z',
    updated_at: '2024-07-01T18:45:00Z',
  },
];

type SortOrder = 'asc' | 'desc';

const sortSavingsGoals = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;
    if (column === 'target_date' || column === 'start_date') {
      valueA = new Date(a[column]);
      valueB = new Date(b[column]);
    } else if (column === 'target_amount' || column === 'current_amount') {
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

const savingGoalSchema = z.object({
  goal_name: z.string().min(3, {
    message: "Goal name must be at least 3 characters.",
  }),
  target_amount: z.number(),
  current_amount: z.number(),
  target_date: z.date(),
  description: z.string().optional(),
});

type SavingGoalValues = z.infer<typeof savingGoalSchema>

export default function SavingsPage() {
  const [savingsGoals, setSavingsGoals] = useState(mockSavingsGoals);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<
    'goal_name' | 'target_amount' | 'current_amount' | 'target_date' | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedSavingGoal, setSelectedSavingGoal] = useState<any>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [entriesPerPage, setEntriesPerPage] = useState<number | 'all'>(25);
  const [currentEntriesText, setCurrentEntriesText] = useState('25');

  const form = useForm<SavingGoalValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: {
      goal_name: "",
      target_amount: 0,
      current_amount: 0,
      target_date: new Date(),
      description: "",
    },
  })

  function onSubmit(values: SavingGoalValues) {
    const newSavingGoal = {
      goal_id: uuidv4(),
      user_id: 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0tuv',
      goal_name: values.goal_name,
      target_amount: values.target_amount,
      current_amount: values.current_amount,
      start_date: new Date().toISOString(),
      target_date: values.target_date.toISOString(),
      description: values.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSavingsGoals([...savingsGoals, newSavingGoal]);
    setOpenAdd(false);
    form.reset();
  }

  const handleEditSavingGoal = (savingGoal: any) => {
    setSelectedSavingGoal(savingGoal);
    form.setValue('goal_name', savingGoal.goal_name);
    form.setValue('target_amount', savingGoal.target_amount);
    form.setValue('current_amount', savingGoal.current_amount);
    form.setValue('target_date', new Date(savingGoal.target_date));
    form.setValue('description', savingGoal.description);
    setOpenEdit(true);
  };

  const handleUpdateSavingGoal = (values: SavingGoalValues) => {
    if (selectedSavingGoal) {
      const updatedSavingsGoals = savingsGoals.map((savingGoal) =>
        savingGoal.goal_id === selectedSavingGoal.goal_id
          ? {
            ...savingGoal,
            goal_name: values.goal_name,
            target_amount: values.target_amount,
            current_amount: values.current_amount,
            target_date: values.target_date.toISOString(),
            description: values.description,
            updated_at: new Date().toISOString(),
          }
          : savingGoal
      );
      setSavingsGoals(updatedSavingsGoals);
      setOpenEdit(false);
      setSelectedSavingGoal(null);
      form.reset();
    }
  };


  const handleDeleteConfirmation = (savingGoal: any) => {
    setSelectedSavingGoal(savingGoal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSavingGoal = () => {
    if (selectedSavingGoal) {
      const updatedSavingsGoals = savingsGoals.filter(
        (savingGoal) => savingGoal.goal_id !== selectedSavingGoal.goal_id
      );
      setSavingsGoals(updatedSavingsGoals);
      setDeleteDialogOpen(false);
      setSelectedSavingGoal(null);
    }
  };

  useEffect(() => {
    const fetchSavingsGoals = async () => {
      //const data = await fetch('/api/savings-goals'); // Update the API endpoint
      const savingsGoals = mockSavingsGoals;
      //const savingsGoals = await data.json();
      setSavingsGoals(savingsGoals);
    };
    fetchSavingsGoals();
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

  const filteredSavingsGoals = savingsGoals.filter((savingGoal) => {
    const searchText = searchQuery.toLowerCase();
    const goalNameMatch = savingGoal.goal_name && savingGoal.goal_name.toLowerCase().includes(searchText);
    const descriptionMatch = savingGoal.description && savingGoal.description.toLowerCase().includes(searchText);

    return goalNameMatch || descriptionMatch;
  });

  const sortedSavingsGoals = sortSavingsGoals(sortColumn, sortOrder, filteredSavingsGoals);

  const handleEntriesPerPageChange = (value: number | 'all', text: string) => {
    setEntriesPerPage(value);
    setCurrentEntriesText(text);
  };

  const displayedSavingsGoals = entriesPerPage === 'all' ? sortedSavingsGoals : sortedSavingsGoals.slice(0, entriesPerPage);

  return (<>
    <div className="flex flex-col gap-4 p-4">
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
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Add Savings Goal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Add Savings Goal</DialogTitle>
                    <DialogDescription>
                      Add a new savings goal to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            <FormLabel>Target Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Target Amount" {...field} />
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
                            <FormLabel>Current Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Current Amount" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="target_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Date</FormLabel>
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
                              <Textarea placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Add Savings Goal</Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <span>Show entries:</span>

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
                    <Button variant="ghost" onClick={() => handleSort('goal_name')}>Goal Name</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('target_amount')}>Target Amount</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('current_amount')}>Current Amount</Button>
                  </TableHead>
                  <TableHead className="text-right w-[120px]">
                    <Button variant="ghost" onClick={() => handleSort('target_date')}>Target Date</Button>
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSavingsGoals.map((savingGoal, index) => (
                  <TableRow key={savingGoal.goal_id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{savingGoal.goal_name}</TableCell>
                    <TableCell>${savingGoal.target_amount.toFixed(2)}</TableCell>
                    <TableCell>${savingGoal.current_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{format(new Date(savingGoal.target_date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell className="text-right flex flex-row gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSavingGoal(savingGoal)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onClick={() => handleDeleteConfirmation(savingGoal)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this savings goal from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSavingGoal}>Continue</AlertDialogAction>
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
            <form onSubmit={form.handleSubmit(handleUpdateSavingGoal)} className="space-y-8">
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
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Target Amount" {...field} />
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
                    <FormLabel>Current Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Current Amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
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
                      <Textarea placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Update Savings Goal</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div >
  </>
  );
}
