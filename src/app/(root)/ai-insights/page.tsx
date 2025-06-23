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
import {
  Trash2,
  Eye,
  RefreshCw,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
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
    (async () => {
      try {
        setLoading(true);
        const data = await financeApi.getTransactions();
        setTransactions(data);

        const totalIncome = data.reduce(
          (sum, tx) =>
            sum + (tx.transaction_type === "income"
              ? Number(tx.amount) || 0
              : 0),
          0
        );
        const totalExpenses = data.reduce(
          (sum, tx) =>
            sum + (tx.transaction_type === "expense"
              ? Number(tx.amount) || 0
              : 0),
          0
        );

        setIncome(totalIncome);
        setExpenses(totalExpenses);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to fetch transaction data",
          variant: "destructive",
        });
        setIncome(0);
        setExpenses(0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeFormat = (n?: number | null) =>
    typeof n === "number" && !isNaN(n)
      ? n.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";

  const safeIncome = Number(income) || 0;
  const safeExpenses = Number(expenses) || 0;
  const netIncome = safeIncome - safeExpenses;
  const savingsRate =
    safeIncome > 0
      ? ((netIncome / safeIncome) * 100).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>Your current financial snapshot:</CardDescription>
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
              <p className="text-xl font-bold text-green-700">
                ${safeFormat(safeIncome)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-xl font-bold text-red-700">
                ${safeFormat(safeExpenses)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Savings Rate</p>
              <p className="text-xl font-bold text-blue-700">
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

  const safeFormat = (n?: number | null) =>
    typeof n === "number" && !isNaN(n)
      ? n.toLocaleString("en-US", {
          minimumFractionDigits: 0,
        })
      : "N/A";

  const formatDateSafe = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? "Invalid Date" : format(d, "MMM dd, yyyy");
  };

  const InsightDataCell = ({ insight }: { insight: AIInsight }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const data = insight.insight_data as any;

    // 1) Normalized schema branch
    if (
      data &&
      typeof data === "object" &&
      ("summary" in data ||
        "recommendations" in data ||
        "metrics" in data)
    ) {
      const { summary, recommendations, metrics } = data;
      return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          {summary && (
            <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
              {summary}
            </p>
          )}

          {Array.isArray(recommendations) && recommendations.length > 0 && (
            <ul className="list-disc list-inside space-y-2 text-base text-gray-800">
              {recommendations.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}

          {metrics && typeof metrics === "object" && (
            <div className="space-y-2 text-base text-gray-800">
              {Object.entries(metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <span>{safeFormat(v as number | null | undefined)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 2) String fallback
    if (typeof data === "string") {
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
            {data}
          </p>
        </div>
      );
    }

    // 3) Type-specific branches (example: spending_trend)
    if (
      data &&
      typeof data === "object" &&
      "income" in data &&
      "budget_summary" in data &&
      "spending_category" in data
    ) {
      const { income, budget_summary, spending_category } = data as any;
      const categories = Object.entries(spending_category || {});
      return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-2 text-base">
            <div className="bg-green-50 p-2 rounded">
              <p className="text-xs text-green-600 font-medium">Income</p>
              <p className="font-semibold">
                ${safeFormat(income.amount)}
              </p>
              <p className="text-xs text-gray-500">
                {income.transactions?.length || 0} txns
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <p className="text-xs text-blue-600 font-medium">Budget</p>
              <p className="font-semibold">
                ${safeFormat(budget_summary.total_budget)}
              </p>
              <p className="text-xs text-gray-500">
                ${safeFormat(budget_summary.remaining_amount)} left
              </p>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase">
                By Category
              </p>
              <div className="grid grid-cols-1 gap-2 text-base">
                {categories.map(([cat, cd]: any) => (
                  <div
                    key={cat}
                    className="bg-orange-50 border-orange-100 p-2 rounded"
                  >
                    <div className="flex justify-between">
                      <span className="capitalize text-xs font-medium text-orange-600">
                        {cat}
                      </span>
                      <span className="font-semibold text-orange-800">
                        ${safeFormat(cd.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {cd.transactions?.length || 0} txns
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // 4) Fallback final
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-base leading-relaxed text-gray-500">
          No insight data available
        </p>
      </div>
    );
  };

  const insightTypes = [
    { value: "spending_trend", label: "Spending Trends" },
    { value: "budget_suggestions", label: "Budget Suggestions" },
    { value: "investment_advice", label: "Investment Advice" },
    // { value: "financial_health", label: "Financial Health" },
    { value: "other", label: "Other Insights" },
  ];

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await financeApi.getInsights();
      setInsights(data);
    } catch (error) {
      console.error(error);
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
      return toast({
        title: "Select an insight type",
        description: "Please choose which insight to generate",
        variant: "destructive",
      });
    }
    try {
      setGeneratingInsight(true);
      const newOne = await financeApi.generateInsight({
        insight_type: selectedInsightType,
      });
      setInsights((prev) => [newOne, ...prev]);
      setSelectedInsightType("");
      toast({
        title: "Insight Generated",
        description: "A new AI insight is now available",
      });
    } catch (error) {
      console.error(error);
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
        prev.map((i) => (i.id === id ? { ...i, is_read: true } : i))
      );
      toast({ title: "Marked as Read" });
    } catch {
      toast({
        title: "Error",
        description: "Could not mark as read",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInsight = async (id: number) => {
    try {
      await financeApi.deleteInsight(id);
      setInsights((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Insight Deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Could not delete insight",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" /> AI Insights History
        </CardTitle>
        <CardDescription>
          Generated insights to help improve your financial health
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Select
            value={selectedInsightType}
            onValueChange={setSelectedInsightType}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {insightTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
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
          <ScrollArea className="h-[400px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Insight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell className="font-mono text-xs">
                      {formatDateSafe(ins.generated_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ins.insight_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4">
                      <InsightDataCell insight={ins} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ins.is_read ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {ins.is_read ? "Read" : "New"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!ins.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(ins.id)}
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
                                This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteInsight(ins.id)}
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default function AiInsightsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Personalized financial insights powered by AI
        </p>
      </div>
      <FinancialInsightsSummary />
      <GeneratedInsightsTable />
    </div>
  );
}
