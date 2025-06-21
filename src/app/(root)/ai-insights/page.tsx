"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, RefreshCw, Lightbulb, ChevronDown } from "lucide-react";
import { financeApi, AIInsight, Transaction } from "@/services/finance-api";
import { toast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FinancialInsightsSummary = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [income, setIncome] = useState<number>(0);
  const [expenses, setExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await financeApi.getTransactions();
        setTransactions(data);

        const totalIncome = data.reduce((sum, transaction) => {
          const amount = Number(transaction.amount) || 0;
          return sum + (transaction.transaction_type === "income" ? amount : 0);
        }, 0);

        const totalExpenses = data.reduce((sum, transaction) => {
          const amount = Number(transaction.amount) || 0;
          return (
            sum + (transaction.transaction_type === "expense" ? amount : 0)
          );
        }, 0);

        setIncome(Number(totalIncome) || 0);
        setExpenses(Number(totalExpenses) || 0);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
        toast({
          title: "Error",
          description: "Failed to fetch transaction data",
          variant: "destructive",
        });
        // Set default values on error
        setIncome(0);
        setExpenses(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Ensure values are numbers and handle edge cases
  const safeIncome = Number(income) || 0;
  const safeExpenses = Number(expenses) || 0;
  const netIncome = safeIncome - safeExpenses;
  const savingsRate =
    safeIncome > 0 ? ((netIncome / safeIncome) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>
          Here&apos;s a summary of your current financial situation:
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <p>Loading financial data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700">
                ${safeIncome.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-xl sm:text-2xl font-bold text-red-700">
                ${safeExpenses.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-blue-600">Savings Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                {savingsRate}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const GeneratedInsightsTable = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState<string>("");

  // Helper function to safely format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Component to render insight data with expand/collapse for multiple suggestions
  const InsightDataCell = ({ insight }: { insight: AIInsight }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (typeof insight.insight_data === "string") {
      return (
        <div className="w-full min-w-0">
          <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
            {insight.insight_data}
          </p>
        </div>
      );
    }

    if (insight.insight_data && typeof insight.insight_data === "object") {
      // Handle spending_trend insights
      if (
        "income" in insight.insight_data &&
        "budget_summary" in insight.insight_data &&
        "spending_category" in insight.insight_data
      ) {
        const { income, budget_summary, spending_category } =
          insight.insight_data as {
            income: { amount: number; transactions: any[] };
            budget_summary: {
              spent_amount: number;
              total_budget: number;
              remaining_amount: number;
            };
            spending_category: Record<
              string,
              { amount: number; transactions: any[] }
            >;
          };
        const categoryEntries = Object.entries(spending_category || {});

        return (
          <div className="w-full min-w-0">
            <div className="space-y-3">
              {/* Income & Budget Summary */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-green-600 font-medium">
                    Total Income
                  </p>
                  <p className="text-green-800 font-semibold">
                    ${income.amount?.toLocaleString() || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {income.transactions?.length || 0} transaction(s)
                  </p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-blue-600 font-medium">
                    Total Budget
                  </p>
                  <p className="text-blue-800 font-semibold">
                    ${budget_summary.total_budget?.toLocaleString() || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    $
                    {budget_summary.remaining_amount?.toLocaleString() || "N/A"}{" "}
                    remaining
                  </p>
                </div>
              </div>

              {/* Spending Categories */}
              {categoryEntries.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Spending by Category
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {categoryEntries.map(
                      ([categoryName, categoryData]: [string, any]) => (
                        <div
                          key={categoryName}
                          className="bg-orange-50 border border-orange-100 p-2 rounded"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-orange-600 capitalize">
                              {categoryName}
                            </span>
                            <span className="text-orange-800 font-semibold">
                              ${categoryData.amount?.toLocaleString() || "N/A"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {categoryData.transactions?.length || 0}{" "}
                            transaction(s)
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Handle financial_health insights
      if ("financial_health" in insight.insight_data) {
        const healthData = insight.insight_data.financial_health as {
          monthly_budget: number;
          current_balance: number;
          remaining_budget: number;
          savings_goal_progress: number;
        };
        return (
          <div className="w-full min-w-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-xs text-blue-600 font-medium">
                  Monthly Budget
                </p>
                <p className="text-blue-800 font-semibold">
                  ${healthData.monthly_budget?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="text-xs text-green-600 font-medium">
                  Current Balance
                </p>
                <p className="text-green-800 font-semibold">
                  ${healthData.current_balance?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <p className="text-xs text-orange-600 font-medium">
                  Remaining Budget
                </p>
                <p className="text-orange-800 font-semibold">
                  ${healthData.remaining_budget?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <p className="text-xs text-purple-600 font-medium">
                  Savings Progress
                </p>
                <p className="text-purple-800 font-semibold">
                  {healthData.savings_goal_progress || 0}%
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Handle finance_summary insights (for "other" type)
      if ("finance_summary" in insight.insight_data) {
        const summaryData = insight.insight_data.finance_summary as {
          income: number;
          expenses: number;
          net_worth: number;
          total_budget: number;
          goal_progress: number;
        };
        return (
          <div className="w-full min-w-0">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-emerald-50 p-2 rounded">
                <p className="text-xs text-emerald-600 font-medium">Income</p>
                <p className="text-emerald-800 font-semibold">
                  ${summaryData.income?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <p className="text-xs text-red-600 font-medium">Expenses</p>
                <p className="text-red-800 font-semibold">
                  ${summaryData.expenses?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div
                className={`p-2 rounded ${
                  summaryData.net_worth >= 0 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    summaryData.net_worth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  Net Worth
                </p>
                <p
                  className={`font-semibold ${
                    summaryData.net_worth >= 0
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  ${summaryData.net_worth?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-xs text-blue-600 font-medium">
                  Total Budget
                </p>
                <p className="text-blue-800 font-semibold">
                  ${summaryData.total_budget?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div className="bg-indigo-50 p-2 rounded col-span-2">
                <p className="text-xs text-indigo-600 font-medium">
                  Goal Progress
                </p>
                <p className="text-indigo-800 font-semibold">
                  ${summaryData.goal_progress?.toLocaleString() || "N/A"}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Handle suggestions-based insights
      if (
        "suggestions" in insight.insight_data &&
        Array.isArray(insight.insight_data.suggestions)
      ) {
        const suggestions = insight.insight_data.suggestions;

        if (suggestions.length === 0) {
          return (
            <div className="w-full min-w-0">
              <p className="text-sm text-muted-foreground">
                No suggestions available
              </p>
            </div>
          );
        }

        // Helper function to safely get message text
        const getSafeMessage = (suggestion: any): string => {
          return (
            suggestion?.suggestion ||
            suggestion?.message ||
            "No message available"
          );
        };

        // Helper function to safely get category text
        const getSafeCategory = (suggestion: any): string => {
          // Handle category_id by converting to string, or use category, or fallback
          if (suggestion?.category_id) {
            return `Category ${suggestion.category_id}`;
          }
          return suggestion?.category || "General";
        };

        // Helper function to truncate text smartly
        const getTruncatedMessage = (
          message: string,
          maxLength: number = 100
        ): string => {
          if (message.length <= maxLength) return message;
          const truncated = message.substring(0, maxLength);
          const lastSpace = truncated.lastIndexOf(" ");
          return (
            (lastSpace > maxLength * 0.7
              ? truncated.substring(0, lastSpace)
              : truncated) + "..."
          );
        };

        if (suggestions.length === 1) {
          return (
            <div className="w-full min-w-0">
              <div className="text-sm space-y-1">
                <span className="inline-block font-medium text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded">
                  {getSafeCategory(suggestions[0])}
                </span>
                <p className="text-gray-700 break-words whitespace-pre-wrap leading-relaxed">
                  {getSafeMessage(suggestions[0])}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="w-full min-w-0">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <div className="space-y-3">
                <div className="text-sm space-y-1">
                  <span className="inline-block font-medium text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded">
                    {getSafeCategory(suggestions[0])}
                  </span>
                  <p className="text-gray-700 break-words whitespace-pre-wrap leading-relaxed">
                    {isExpanded
                      ? getSafeMessage(suggestions[0])
                      : getTruncatedMessage(getSafeMessage(suggestions[0]))}
                  </p>
                </div>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs hover:bg-gray-100 w-full sm:w-auto"
                  >
                    <ChevronDown
                      className={`h-3 w-3 mr-1 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                    {isExpanded
                      ? "Show less"
                      : `+${suggestions.length - 1} more suggestion${
                          suggestions.length > 2 ? "s" : ""
                        }`}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-3">
                  {suggestions.slice(1).map((suggestion, index) => (
                    <div
                      key={index}
                      className="text-sm border-l-2 border-blue-200 pl-3 ml-1 space-y-1"
                    >
                      <span className="inline-block font-medium text-blue-600 text-xs px-2 py-1 bg-blue-50 rounded">
                        {getSafeCategory(suggestion)}
                      </span>
                      <p className="text-gray-700 break-words whitespace-pre-wrap leading-relaxed">
                        {getSafeMessage(suggestion)}
                      </p>
                    </div>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>
        );
      }
    }

    return (
      <div className="w-full min-w-0">
        <p className="text-sm text-muted-foreground">
          No insight data available
        </p>
      </div>
    );
  };

  const insightTypes = [
    { value: "spending_trend", label: "Spending Trends" },
    { value: "budget_suggestions", label: "Budget Suggestions" },
    { value: "investment_advice", label: "Investment Advice" },
    { value: "financial_health", label: "Financial Health" },
    { value: "other", label: "Other Insights" },
  ];

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await financeApi.getInsights();
      setInsights(data);
    } catch (error) {
      console.error("Failed to fetch insights", error);
      toast({
        title: "Error",
        description: "Failed to fetch AI insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerateInsight = async () => {
    if (!selectedInsightType) {
      toast({
        title: "Please select an insight type",
        description: "Choose what type of insight you'd like to generate",
        variant: "destructive",
      });
      return;
    }

    try {
      setGeneratingInsight(true);
      const newInsight = await financeApi.generateInsight({
        insight_type: selectedInsightType,
      });
      setInsights((prev) => [newInsight, ...prev]);
      setSelectedInsightType("");
      toast({
        title: "Insight Generated",
        description: "New AI insight has been generated successfully",
      });
    } catch (error) {
      console.error("Failed to generate insight", error);
      toast({
        title: "Error",
        description: "Failed to generate AI insight",
        variant: "destructive",
      });
    } finally {
      setGeneratingInsight(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await financeApi.markInsightAsRead(id);
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === id ? { ...insight, is_read: true } : insight
        )
      );
      toast({
        title: "Marked as Read",
        description: "Insight has been marked as read",
      });
    } catch (error) {
      console.error("Failed to mark as read", error);
      toast({
        title: "Error",
        description: "Failed to mark insight as read",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInsight = async (id: number) => {
    try {
      await financeApi.deleteInsight(id);
      setInsights((prev) => prev.filter((insight) => insight.id !== id));
      toast({
        title: "Insight Deleted",
        description: "AI insight has been deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete insight", error);
      toast({
        title: "Error",
        description: "Failed to delete insight",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Insights History
        </CardTitle>
        <CardDescription>
          Generated insights to help improve your financial health
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2">
          <Select
            value={selectedInsightType}
            onValueChange={setSelectedInsightType}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select insight type" />
            </SelectTrigger>
            <SelectContent>
              {insightTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateInsight}
            disabled={generatingInsight}
            size="sm"
            className="w-full sm:w-auto"
          >
            {generatingInsight ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Insight
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading insights...</span>
          </div>
        ) : insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No insights generated yet</p>
            <p className="text-sm text-muted-foreground">
              Generate your first insight to get started!
            </p>
          </div>
        ) : (
          <div className="w-full">
            <ScrollArea className="h-[400px] w-full">
              <div className="min-w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] sm:w-[120px]">
                        Date
                      </TableHead>
                      <TableHead className="w-[120px] sm:w-[140px]">
                        Type
                      </TableHead>
                      <TableHead className="min-w-[200px] sm:min-w-[300px]">
                        Insight
                      </TableHead>
                      <TableHead className="w-[80px] sm:w-[100px]">
                        Status
                      </TableHead>
                      <TableHead className="w-[100px] sm:w-[120px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insights.map((insight) => (
                      <TableRow key={insight.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs sm:text-sm font-mono">
                          {formatDate(insight.generated_date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs whitespace-nowrap"
                          >
                            {insight.insight_type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <InsightDataCell insight={insight} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={insight.is_read ? "secondary" : "default"}
                            className="text-xs whitespace-nowrap"
                          >
                            {insight.is_read ? "Read" : "New"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            {!insight.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(insight.id)}
                                className="h-8 w-8 p-0"
                                title="Mark as read"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Delete insight"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Insight?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The insight
                                    will be permanently deleted.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteInsight(insight.id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AiInsightsPage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Get personalized financial insights powered by artificial intelligence
        </p>
      </div>
      <FinancialInsightsSummary />
      <GeneratedInsightsTable />
    </div>
  );
}
