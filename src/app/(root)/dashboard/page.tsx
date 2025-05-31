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
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { format, isValid, parseISO } from "date-fns";

import { useAuth } from "@/context/auth-provider";
import { Button } from "@/components/ui/button";
import { financeApi } from "@/services/finance-api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

// API Response interfaces based on your actual API structure
interface TransactionWithCategory {
  id: number;
  user_id: number;
  category_id: number;
  amount: string | number;
  transaction_date?: string;
  description: string;
  transaction_type: "income" | "expense";
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
    description: string;
  };
}

interface BudgetWithCategory {
  id: number;
  category_id: number;
  budget_amount: string | number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

interface SavingGoalData {
  id: number;
  goal_name: string;
  target_amount: string | number;
  current_amount: string | number;
  start_date: string;
  target_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CategoryData {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

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

interface BudgetProgress {
  id: number;
  category: string;
  budgeted: number;
  spent: number;
  percentage: number;
}

export default function DashboardPage() {
  // State for financial data
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [balance, setBalance] = useState(0);

  // State for API data
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(
    []
  );
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoalData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);

  // State for processed data
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseByCategoryData, setExpenseByCategoryData] = useState<
    ExpenseByCategoryData[]
  >([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionWithCategory[]
  >([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Helper function to safely parse dates
  const safeParsDate = (dateString: string | Date): Date => {
    if (dateString instanceof Date) return dateString;

    try {
      let date = new Date(dateString);
      if (isValid(date)) return date;

      date = parseISO(dateString);
      if (isValid(date)) return date;
    } catch (e) {
      console.warn("Failed to parse date:", dateString);
    }

    return new Date();
  };

  // Helper to safely convert to number
  const safeNumber = (value: string | number): number => {
    if (typeof value === "number") return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to get transaction date
  const getTransactionDate = (transaction: TransactionWithCategory): string => {
    return transaction.transaction_date || transaction.createdAt;
  };

  // Process transactions to get monthly data
  const processMonthlyData = (
    transactions: TransactionWithCategory[]
  ): MonthlyData[] => {
    console.log("🔄 Processing monthly data...");

    if (!transactions || transactions.length === 0) {
      return [];
    }

    try {
      const monthlyMap = new Map<string, { income: number; expense: number }>();

      transactions.forEach((transaction) => {
        const dateStr = getTransactionDate(transaction);
        const date = safeParsDate(dateStr);
        const monthKey = format(date, "MMMM yyyy");

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { income: 0, expense: 0 });
        }

        const monthData = monthlyMap.get(monthKey)!;
        const amount = safeNumber(transaction.amount);

        if (transaction.transaction_type === "income") {
          monthData.income += amount;
        } else if (transaction.transaction_type === "expense") {
          monthData.expense += amount;
        }
      });

      const result = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month: month.split(" ")[0], // Get just the month name
          ...data,
        }))
        .slice(-6); // Get last 6 months

      console.log("✅ Monthly data processed:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in processMonthlyData:", error);
      return [];
    }
  };

  // Process expenses by category
  const processExpensesByCategory = (
    transactions: TransactionWithCategory[],
    categories: CategoryData[]
  ): ExpenseByCategoryData[] => {
    console.log("🔄 Processing expenses by category...");

    if (
      !transactions ||
      transactions.length === 0 ||
      !categories ||
      categories.length === 0
    ) {
      return [];
    }

    try {
      const categoryMap = new Map<number, number>();

      const expenseTransactions = transactions.filter(
        (t) => t && t.transaction_type === "expense"
      );

      expenseTransactions.forEach((transaction) => {
        const amount = safeNumber(transaction.amount);
        const current = categoryMap.get(transaction.category_id) || 0;
        categoryMap.set(transaction.category_id, current + amount);
      });

      const result = Array.from(categoryMap.entries())
        .map(([categoryId, amount], index) => {
          const category = categories.find((cat) => cat.id === categoryId);
          return {
            category: category?.name || "Unknown",
            amount: Number(amount),
            color: COLORS[index % COLORS.length],
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories

      console.log("✅ Expense by category processed:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in processExpensesByCategory:", error);
      return [];
    }
  };

  // Calculate budget progress
  const calculateBudgetProgress = (
    budgets: BudgetWithCategory[],
    transactions: TransactionWithCategory[],
    categories: CategoryData[]
  ): BudgetProgress[] => {
    console.log("🔄 Calculating budget progress...");

    if (!budgets || budgets.length === 0) {
      return [];
    }

    try {
      const result = budgets
        .map((budget) => {
          const categoryExpenses = transactions
            .filter(
              (t) =>
                t &&
                t.transaction_type === "expense" &&
                t.category_id === budget.category_id &&
                safeParsDate(getTransactionDate(t)) >=
                  safeParsDate(budget.period_start) &&
                safeParsDate(getTransactionDate(t)) <=
                  safeParsDate(budget.period_end)
            )
            .reduce((sum, t) => sum + safeNumber(t.amount), 0);

          const category = categories.find(
            (cat) => cat.id === budget.category_id
          );
          const budgetAmount = safeNumber(budget.budget_amount);
          const percentage =
            budgetAmount > 0 ? (categoryExpenses / budgetAmount) * 100 : 0;

          return {
            id: budget.id,
            category: category?.name || "Unknown",
            budgeted: budgetAmount,
            spent: categoryExpenses,
            percentage: Math.min(percentage, 100),
          };
        })
        .slice(0, 3); // Top 3 budgets

      console.log("✅ Budget progress calculated:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in calculateBudgetProgress:", error);
      return [];
    }
  };

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!mounted) return;

      try {
        console.log("🚀 Starting data fetch...");
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        const results = await Promise.allSettled([
          financeApi.getCategories(),
          financeApi.getTransactions(),
          financeApi.getBudgets(),
          financeApi.getSavingGoals(),
        ]);

        console.log("✅ API calls completed!", results);

        // Extract successful results or use empty arrays as fallbacks
        const categoriesData =
          results[0].status === "fulfilled" ? results[0].value : [];
        const transactionsData =
          results[1].status === "fulfilled" ? results[1].value : [];
        const budgetsData =
          results[2].status === "fulfilled" ? results[2].value : [];
        const savingGoalsData =
          results[3].status === "fulfilled" ? results[3].value : [];

        // Log any failed API calls
        results.forEach((result, index) => {
          const apiNames = [
            "Categories",
            "Transactions",
            "Budgets",
            "Saving Goals",
          ];
          if (result.status === "rejected") {
            console.error(`❌ ${apiNames[index]} API failed:`, result.reason);
          }
        });

        console.log("📊 Processing API data...");

        // Process transactions with category enrichment
        const enrichedTransactions: TransactionWithCategory[] =
          transactionsData.map((transaction: any) => ({
            ...transaction,
            category_name:
              transaction.category?.name ||
              categoriesData.find(
                (cat: any) => cat.id === transaction.category_id
              )?.name ||
              "Unknown",
          }));

        // Process budgets with category enrichment
        const enrichedBudgets: BudgetWithCategory[] = budgetsData.map(
          (budget: any) => ({
            ...budget,
            category_name:
              categoriesData.find((cat: any) => cat.id === budget.category_id)
                ?.name || "Unknown",
          })
        );

        // Set the raw data
        setCategories(categoriesData);
        setTransactions(enrichedTransactions);
        setBudgets(enrichedBudgets);
        setSavingGoals(savingGoalsData);

        // Process data for charts and calculations
        const processedMonthlyData = processMonthlyData(enrichedTransactions);
        setMonthlyData(processedMonthlyData);

        const expenseData = processExpensesByCategory(
          enrichedTransactions,
          categoriesData
        );
        setExpenseByCategoryData(expenseData);

        const budgetProgressData = calculateBudgetProgress(
          enrichedBudgets,
          enrichedTransactions,
          categoriesData
        );
        setBudgetProgress(budgetProgressData);

        // Calculate totals
        const incomeTransactions = enrichedTransactions.filter(
          (t) => t.transaction_type === "income"
        );
        const expenseTransactions = enrichedTransactions.filter(
          (t) => t.transaction_type === "expense"
        );

        const totalIncome = incomeTransactions.reduce(
          (sum, t) => sum + safeNumber(t.amount),
          0
        );
        const totalExpenses = expenseTransactions.reduce(
          (sum, t) => sum + safeNumber(t.amount),
          0
        );

        setIncome(totalIncome);
        setExpenses(totalExpenses);
        setBalance(totalIncome - totalExpenses);

        // Set recent transactions (last 5)
        const sortedTransactions = [...enrichedTransactions]
          .sort((a, b) => {
            const dateA = safeParsDate(getTransactionDate(a));
            const dateB = safeParsDate(getTransactionDate(b));
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5);

        setRecentTransactions(sortedTransactions);

        console.log("✅ All data processing completed!");
      } catch (error) {
        console.error("❌ Error in fetchAllData:", error);
        setError(`Failed to load dashboard data: ${getErrorMessage(error)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [mounted]);

  // Generate AI summary
  useEffect(() => {
    if (!loading && transactions.length > 0 && mounted) {
      const generateAISummary = (
        income: number,
        expenses: number,
        transactionCount: number
      ) => {
        try {
          const savings = income - expenses;
          const savingsRate =
            income > 0 ? ((savings / income) * 100).toFixed(1) : "0";

          const summary = `Based on your financial data: You've earned $${income.toFixed(
            2
          )} and spent $${expenses.toFixed(
            2
          )} across ${transactionCount} transactions. Your current savings rate is ${savingsRate}%. ${
            savings > 0
              ? `Great job saving $${savings.toFixed(
                  2
                )}! Consider increasing your emergency fund or investing the surplus.`
              : savings < 0
              ? `You're spending $${Math.abs(savings).toFixed(
                  2
                )} more than you earn. Review your expenses and consider creating a budget.`
              : "You're breaking even. Try to save at least 10-20% of your income for financial security."
          }`;

          setAiSummary(summary);
        } catch (error) {
          console.error("❌ Error generating AI summary:", error);
        }
      };

      generateAISummary(income, expenses, transactions.length);
    }
  }, [income, expenses, transactions.length, loading, mounted]);

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

  return (
    <>
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Income</CardTitle>
              <CardDescription>All time income</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-600">
                +${income.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
              <CardDescription>All time expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-red-600">
                -${expenses.toFixed(2)}
              </div>
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
              <div
                className={`text-xl md:text-2xl font-bold ${
                  balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
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
                  <Progress
                    value={budget.percentage}
                    className={
                      budget.percentage > 90
                        ? "bg-red-100"
                        : budget.percentage > 70
                        ? "bg-yellow-100"
                        : "bg-green-100"
                    }
                  />
                  <div className="text-xs text-muted-foreground">
                    {budget.percentage.toFixed(1)}% used
                  </div>
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
              {savingGoals.slice(0, 3).map((goal) => {
                const currentAmount = safeNumber(goal.current_amount);
                const targetAmount = safeNumber(goal.target_amount);
                const percentage =
                  targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

                return (
                  <div key={goal.id} className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>{goal.goal_name}</span>
                      <span>
                        ${currentAmount.toFixed(2)} / ${targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} />
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% complete
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expenses by Category Pie Chart */}
          {expenseByCategoryData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Expenses by Category</CardTitle>
                <CardDescription className="text-sm">
                  Top 5 expense categories
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={expenseByCategoryData}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ category, percent }) =>
                          `${category} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {expenseByCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${Number(value).toFixed(2)}`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                  {expenseByCategoryData.slice(0, 4).map((entry, index) => (
                    <div
                      key={entry.category}
                      className="flex items-center gap-1"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="truncate">
                        {entry.category}: ${entry.amount.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Net Worth Trend Area Chart */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Net Worth Trend</CardTitle>
                <CardDescription className="text-sm">
                  Monthly balance trend
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={monthlyData.map((item) => ({
                        ...item,
                        balance: item.income - item.expense,
                      }))}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickFormatter={(value) =>
                          `${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value: any) =>
                          `${Number(value).toFixed(2)}`
                        }
                        contentStyle={{ fontSize: "12px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="hsl(var(--chart-3))"
                        fill="hsl(var(--chart-3))"
                        fillOpacity={0.3}
                        name="Net Balance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Transaction Type Distribution */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Transaction Distribution
                </CardTitle>
                <CardDescription className="text-sm">
                  Income vs Expense transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            type: "Income",
                            count: transactions.filter(
                              (t) => t.transaction_type === "income"
                            ).length,
                            amount: transactions
                              .filter((t) => t.transaction_type === "income")
                              .reduce(
                                (sum, t) => sum + safeNumber(t.amount),
                                0
                              ),
                          },
                          {
                            type: "Expense",
                            count: transactions.filter(
                              (t) => t.transaction_type === "expense"
                            ).length,
                            amount: transactions
                              .filter((t) => t.transaction_type === "expense")
                              .reduce(
                                (sum, t) => sum + safeNumber(t.amount),
                                0
                              ),
                          },
                        ]}
                        dataKey="amount"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        label={({ type, count }) => `${type} (${count})`}
                      >
                        <Cell fill="hsl(var(--chart-1))" />
                        <Cell fill="hsl(var(--chart-2))" />
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${Number(value).toFixed(2)}`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-1))]" />
                    <span>
                      Income:{" "}
                      {
                        transactions.filter(
                          (t) => t.transaction_type === "income"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                    <span>
                      Expense:{" "}
                      {
                        transactions.filter(
                          (t) => t.transaction_type === "expense"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(
                            safeParsDate(getTransactionDate(transaction)),
                            "MMM dd, yyyy"
                          )}{" "}
                          •{" "}
                          {transaction.category?.name ||
                            categories.find(
                              (cat) => cat.id === transaction.category_id
                            )?.name ||
                            "Unknown"}
                        </div>
                      </div>
                      <div
                        className={
                          transaction.transaction_type === "income"
                            ? "text-green-500 font-medium"
                            : "text-red-500 font-medium"
                        }
                      >
                        {transaction.transaction_type === "income" ? "+" : "-"}$
                        {safeNumber(transaction.amount).toFixed(2)}
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
              <p className="text-sm leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-muted-foreground">
                Generating financial summary...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
