"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";
import { ListChecks, Coins, Tag, Lightbulb } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format, isValid, parseISO } from "date-fns";

import { useAuth } from '@/context/auth-provider';
import { Button } from "@/components/ui/button";
import { financeApi, Transaction, Budget, SavingGoal, Category } from "@/services/finance-api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface ExpenseByCategoryData {
  category: string;
  amount: number;
  color: string;
}

export default function DashboardPage() {
  // State for financial data
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);
  
  // State for API data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // State for processed data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseByCategoryData, setExpenseByCategoryData] = useState<ExpenseByCategoryData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Helper function to safely parse dates
  const safeParsDate = (dateString: string | Date): Date => {
    if (dateString instanceof Date) return dateString;
    
    // Try different date parsing methods
    let date = new Date(dateString);
    if (isValid(date)) return date;
    
    // Try ISO parsing
    try {
      date = parseISO(dateString);
      if (isValid(date)) return date;
    } catch (e) {
      console.warn("Failed to parse date:", dateString);
    }
    
    // Fallback to current date
    return new Date();
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  // Process transactions to get monthly data with better error handling
  const processMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
    console.log("🔄 Processing monthly data...");
    console.log("📊 Transactions to process:", transactions.length);
    
    if (!transactions || transactions.length === 0) {
      console.log("⚠️ No transactions to process");
      return [];
    }
    
    try {
      const monthlyMap = new Map<string, { income: number; expense: number }>();
      
      transactions.forEach((transaction, index) => {
        console.log(`📝 Processing transaction ${index + 1}:`, transaction);
        
        // Validate required fields
        if (!transaction.created_at || typeof transaction.amount !== 'number' || !transaction.transaction_type) {
          console.warn(`⚠️ Invalid transaction data at index ${index}:`, transaction);
          return; // Skip this transaction
        }
        
        const date = safeParsDate(transaction.created_at);
        console.log("📅 Parsed date:", date);
        
        const monthKey = format(date, 'MMMM yyyy');
        console.log("🗓️ Month key:", monthKey);
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { income: 0, expense: 0 });
          console.log("🆕 Created new month entry:", monthKey);
        }
        
        const monthData = monthlyMap.get(monthKey)!;
        if (transaction.transaction_type === 'income') {
          monthData.income += Number(transaction.amount);
          console.log("💰 Added income:", transaction.amount);
        } else if (transaction.transaction_type === 'expense') {
          monthData.expense += Number(transaction.amount);
          console.log("💸 Added expense:", transaction.amount);
        }
      });

      const result = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: month.split(' ')[0], // Get just the month name
          ...data
        }))
        .slice(-6); // Get last 6 months
      
      console.log("✅ Monthly data processed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in processMonthlyData:", error);
      return []; // Return empty array instead of throwing
    }
  };

  // Process expenses by category with better error handling
  const processExpensesByCategory = (transactions: Transaction[], categories: Category[]): ExpenseByCategoryData[] => {
    console.log("🔄 Processing expenses by category...");
    console.log("📊 Transactions:", transactions.length, "Categories:", categories.length);
    
    if (!transactions || transactions.length === 0 || !categories || categories.length === 0) {
      console.log("⚠️ Missing data for expense processing");
      return [];
    }
    
    try {
      const categoryMap = new Map<number, number>();
      
      const expenseTransactions = transactions.filter(t => 
        t && 
        t.transaction_type === 'expense' && 
        typeof t.amount === 'number' && 
        typeof t.category_id === 'number'
      );
      console.log("💸 Expense transactions found:", expenseTransactions.length);
      
      expenseTransactions.forEach((transaction, index) => {
        console.log(`📝 Processing expense ${index + 1}:`, transaction);
        const current = categoryMap.get(transaction.category_id) || 0;
        categoryMap.set(transaction.category_id, current + Number(transaction.amount));
      });

      const result = Array.from(categoryMap.entries())
        .map(([categoryId, amount], index) => {
          const category = categories.find(cat => cat.id === categoryId);
          console.log(`🏷️ Category ${categoryId}: ${category?.name || 'Unknown'} - $${amount}`);
          return {
            category: category?.name || 'Unknown',
            amount: Number(amount),
            color: COLORS[index % COLORS.length]
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories
      
      console.log("✅ Expense by category processed successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in processExpensesByCategory:", error);
      return []; // Return empty array instead of throwing
    }
  };

  // Calculate budget progress with better error handling
  const calculateBudgetProgress = (budgets: Budget[], transactions: Transaction[], categories: Category[]) => {
    console.log("🔄 Calculating budget progress...");
    console.log("📊 Budgets:", budgets.length, "Transactions:", transactions.length, "Categories:", categories.length);
    
    if (!budgets || budgets.length === 0) {
      console.log("⚠️ No budgets to process");
      return [];
    }
    
    try {
      const result = budgets
        .map(budget => {
          console.log("📝 Processing budget:", budget);
          
          // Validate budget data
          if (!budget.category_id || !budget.budget_amount || !budget.period_start || !budget.period_end) {
            console.warn("⚠️ Invalid budget data:", budget);
            return null;
          }
          
          const categoryExpenses = transactions
            .filter(t => 
              t && 
              t.transaction_type === 'expense' && 
              t.category_id === budget.category_id &&
              t.created_at &&
              safeParsDate(t.created_at) >= safeParsDate(budget.period_start) &&
              safeParsDate(t.created_at) <= safeParsDate(budget.period_end)
            )
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          const category = categories.find(cat => cat.id === budget.category_id);
          
          const budgetProgress = {
            id: budget.id,
            category: category?.name || 'Unknown',
            budgeted: Number(budget.budget_amount),
            spent: Number(categoryExpenses)
          };
          
          console.log("📊 Budget progress:", budgetProgress);
          return budgetProgress;
        })
        .filter((budget): budget is NonNullable<typeof budget> => budget !== null) // Type-safe filter
        .slice(0, 3); // Top 3 budgets
      
      console.log("✅ Budget progress calculated successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in calculateBudgetProgress:", error);
      return []; // Return empty array instead of throwing
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log("🚀 Starting data fetch...");
        setLoading(true);
        setError(null);

        // Fetch all data concurrently with individual error handling
        console.log("📡 Making API calls...");
        
        const results = await Promise.allSettled([
          financeApi.getCategories(),
          financeApi.getTransactions(),
          financeApi.getBudgets(),
          financeApi.getSavingGoals()
        ]);

        console.log("✅ API calls completed!");
        console.log("📊 Results:", results);

        // Extract successful results or use empty arrays as fallbacks
        const categoriesData = results[0].status === 'fulfilled' ? results[0].value : [];
        const transactionsData = results[1].status === 'fulfilled' ? results[1].value : [];
        const budgetsData = results[2].status === 'fulfilled' ? results[2].value : [];
        const savingGoalsData = results[3].status === 'fulfilled' ? results[3].value : [];

        // Log any failed API calls
        results.forEach((result, index) => {
          const apiNames = ['Categories', 'Transactions', 'Budgets', 'Saving Goals'];
          if (result.status === 'rejected') {
            console.error(`❌ ${apiNames[index]} API failed:`, result.reason);
          }
        });

        console.log("📊 Final data:");
        console.log("  - Categories:", categoriesData);
        console.log("  - Transactions:", transactionsData);
        console.log("  - Budgets:", budgetsData);
        console.log("  - Saving Goals:", savingGoalsData);

        // Set the raw data
        console.log("💾 Setting raw data to state...");
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
        setSavingGoals(Array.isArray(savingGoalsData) ? savingGoalsData : []);

        // Process data for charts and calculations
        console.log("🔄 Processing monthly data...");
        const processedMonthlyData = processMonthlyData(transactionsData);
        setMonthlyData(processedMonthlyData);

        // Process expense data if we have categories
        if (categoriesData && categoriesData.length > 0) {
          console.log("🔄 Processing expense data...");
          const expenseData = processExpensesByCategory(transactionsData, categoriesData);
          setExpenseByCategoryData(expenseData);
        } else {
          console.log("⚠️ No categories found, skipping expense processing");
        }

        // Calculate totals with safe filtering
        console.log("🧮 Calculating totals...");
        const incomeTransactions = transactionsData.filter(t => 
          t && t.transaction_type === 'income' && typeof t.amount === 'number'
        );
        const expenseTransactions = transactionsData.filter(t => 
          t && t.transaction_type === 'expense' && typeof t.amount === 'number'
        );
        
        console.log("💰 Income transactions:", incomeTransactions.length);
        console.log("💸 Expense transactions:", expenseTransactions.length);
        
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        console.log("💰 Total income:", totalIncome);
        console.log("💸 Total expenses:", totalExpenses);
        console.log("💰 Balance:", totalIncome - totalExpenses);

        setIncome(totalIncome);
        setExpenses(totalExpenses);
        setBalance(totalIncome - totalExpenses);

        // Set recent transactions (last 5) with safe sorting
        console.log("📝 Processing recent transactions...");
        const validTransactions = transactionsData.filter(t => t && t.created_at);
        const sortedTransactions = [...validTransactions]
          .sort((a, b) => {
            const dateA = safeParsDate(a.created_at);
            const dateB = safeParsDate(b.created_at);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);
        
        console.log("📝 Recent transactions:", sortedTransactions);
        setRecentTransactions(sortedTransactions);

        console.log("✅ All data processing completed successfully!");

      } catch (error) {
        console.error('❌ Error in fetchAllData:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
        setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        console.log("🏁 Setting loading to false");
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Process expense data when categories are loaded
  useEffect(() => {
    console.log("🔄 Categories/transactions length changed...");
    console.log("📊 Categories length:", categories.length);
    console.log("📊 Transactions length:", transactions.length);
    
    if (categories.length > 0 && transactions.length > 0) {
      console.log("🔄 Re-processing expense data...");
      try {
        const expenseData = processExpensesByCategory(transactions, categories);
        setExpenseByCategoryData(expenseData);
      } catch (error) {
        console.error("❌ Error in expense data re-processing:", error);
      }
    }
  }, [categories.length, transactions.length]);

  // Generate AI summary with current financial data
  useEffect(() => {
    console.log("🤖 AI Summary effect triggered...");
    console.log("📊 Loading:", loading, "Transactions:", transactions.length);
    
    if (!loading && transactions.length > 0) {
      console.log("🤖 Generating AI summary...");
      
      const generateAISummary = (income: number, expenses: number, transactionCount: number) => {
        try {
          const savings = income - expenses;
          const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : '0';
          
          const summary = `Based on your financial data: You've earned $${income.toFixed(2)} and spent $${expenses.toFixed(2)} across ${transactionCount} transactions. Your current savings rate is ${savingsRate}%. ${
            savings > 0 
              ? `Great job saving $${savings.toFixed(2)}! Consider increasing your emergency fund or investing the surplus.`
              : savings < 0
              ? `You're spending $${Math.abs(savings).toFixed(2)} more than you earn. Review your expenses and consider creating a budget.`
              : 'You\'re breaking even. Try to save at least 10-20% of your income for financial security.'
          }`;
          
          console.log("🤖 AI Summary generated:", summary);
          setAiSummary(summary);
        } catch (error) {
          console.error("❌ Error generating AI summary:", error);
        }
      };

      generateAISummary(income, expenses, transactions.length);
    }
  }, [income, expenses, transactions.length, loading]);

  console.log("🖥️ Render state:", { loading, error, hasTransactions: transactions.length > 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const budgetProgress = budgets.length > 0 ? calculateBudgetProgress(budgets, transactions, categories) : [];

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Button className="hidden md:flex items-center justify-center bg-blue-500 text-white rounded-lg p-2" onClick={handleLogout}>
            <span>Logout</span>
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Total Income</CardTitle>
              <CardDescription>All time income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">${income.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
              <CardDescription>All time expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">${expenses.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Balance</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString("default", { month: "long" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-xl md:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {budgetProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>Current budget performance</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {budgetProgress.map((budget) => (
                <div key={budget.id} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>{budget.category}</span>
                    <span>
                      ${budget.spent.toFixed(2)} / ${budget.budgeted.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={(budget.spent / budget.budgeted) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {savingGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Savings Progress</CardTitle>
              <CardDescription>Your savings goals</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {savingGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>{goal.goal_name}</span>
                    <span>
                      ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={(goal.current_amount / goal.target_amount) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {expenseByCategoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>
                Distribution of expenses across categories
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={expenseByCategoryData} 
                      dataKey="amount" 
                      nameKey="category"
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80}
                    >
                      {expenseByCategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`$${value}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Monthly Income and Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--chart-1))"
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="hsl(var(--chart-2))"
                      name="Expense"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] w-full">
                <div className="p-4">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(safeParsDate(transaction.created_at), "MMM dd, yyyy")} • {
                            categories.find(cat => cat.id === transaction.category_id)?.name || 'Unknown'
                          }
                        </div>
                      </div>
                      <div
                        className={
                          transaction.transaction_type === 'income'
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}${Number(transaction.amount || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>Summary of your financial data</CardDescription>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <p>{aiSummary}</p>
            ) : (
              <p>Generating financial summary...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}