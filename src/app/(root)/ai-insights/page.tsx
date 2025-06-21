"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  EyeOff,
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-700">
                ${safeIncome.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                ${safeExpenses.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Savings Rate</p>
              <p className="text-2xl font-bold text-blue-700">{savingsRate}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    [
      {
        text: "Hello! I can help you understand your financial insights. Try asking about your spending patterns, budget recommendations, or savings goals!",
        isUser: false,
      },
    ]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim() !== "") {
      const userMessage = { text: input, isUser: true };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      const currentInput = input;
      setInput("");
      setIsLoading(true);

      try {
        // For now, provide some basic financial guidance based on input
        let response = "I'm here to help with your finances! ";

        if (currentInput.toLowerCase().includes("budget")) {
          response +=
            "Based on your spending patterns, consider setting monthly limits for discretionary expenses like dining out and entertainment.";
        } else if (currentInput.toLowerCase().includes("saving")) {
          response +=
            "A good savings goal is 20% of your income. Consider automating transfers to your savings account.";
        } else if (currentInput.toLowerCase().includes("expense")) {
          response +=
            "Review your largest expense categories and look for opportunities to reduce spending without impacting your quality of life.";
        } else if (currentInput.toLowerCase().includes("income")) {
          response +=
            "Consider diversifying your income sources through side projects, investments, or skill development for career advancement.";
        } else {
          response +=
            "I can help you with budgeting, saving strategies, expense analysis, and general financial planning. What specific area would you like to focus on?";
        }

        const botMessage = { text: response, isUser: false };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error: any) {
        console.error("Failed to generate AI response", error);
        const botMessage = {
          text: "Sorry, I'm having trouble right now. Please try again later or contact support if the issue persists.",
          isUser: false,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } finally {
        setIsLoading(false);
      }
    }

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const confirmResetChat = () => {
    setMessages([
      {
        text: "Hello! I can help you understand your financial insights. Try asking about your spending patterns, budget recommendations, or savings goals!",
        isUser: false,
      },
    ]);
    setIsResetting(false);
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Financial Assistant</CardTitle>
        <CardDescription>Ask me anything about your finances!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[400px]">
        <ScrollArea className="flex-grow">
          <div className="flex flex-col space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-md max-w-[80%] ${
                  message.isUser
                    ? "bg-primary text-primary-foreground self-end ml-auto"
                    : "bg-muted self-start mr-auto"
                }`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 self-start mr-auto p-3">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        </ScrollArea>
        <div className="flex flex-row items-center gap-2 mt-4">
          <Input
            type="text"
            placeholder="Ask about your finances..."
            value={input}
            onChange={handleInputChange}
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoading) {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={isLoading}>
            Send
          </Button>
          <AlertDialog open={isResetting} onOpenChange={setIsResetting}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Chat History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all messages in the current conversation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetChat}>
                Reset
              </AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
        <div className="max-w-xs">
          <p className="truncate text-sm">{insight.insight_data}</p>
        </div>
      );
    }

    if (
      insight.insight_data &&
      typeof insight.insight_data === "object" &&
      "suggestions" in insight.insight_data &&
      Array.isArray(insight.insight_data.suggestions)
    ) {
      const suggestions = insight.insight_data.suggestions;

      if (suggestions.length === 0) {
        return (
          <div className="max-w-xs">
            <p className="text-sm text-muted-foreground">
              No suggestions available
            </p>
          </div>
        );
      }

      if (suggestions.length === 1) {
        return (
          <div className="max-w-xs">
            <div className="text-sm">
              <span className="font-medium text-blue-600">
                {suggestions[0].category}:
              </span>
              <p className="mt-1 text-gray-700">{suggestions[0].message}</p>
            </div>
          </div>
        );
      }

      return (
        <div className="max-w-xs">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-blue-600">
                  {suggestions[0].category}:
                </span>
                <p className="mt-1 text-gray-700">
                  {isExpanded
                    ? suggestions[0].message
                    : suggestions[0].message.substring(0, 50) + "..."}
                </p>
              </div>

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <ChevronDown
                    className={`h-3 w-3 mr-1 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  {isExpanded
                    ? "Show less"
                    : `+${suggestions.length - 1} more suggestions`}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2">
                {suggestions.slice(1).map((suggestion, index) => (
                  <div
                    key={index}
                    className="text-sm border-l-2 border-gray-200 pl-3"
                  >
                    <span className="font-medium text-blue-600">
                      {suggestion.category}:
                    </span>
                    <p className="mt-1 text-gray-700">{suggestion.message}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      );
    }

    return (
      <div className="max-w-xs">
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
        <div className="flex items-center gap-2 pt-2">
          <Select
            value={selectedInsightType}
            onValueChange={setSelectedInsightType}
          >
            <SelectTrigger className="w-[200px]">
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
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell className="text-sm">
                      {formatDate(insight.generated_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {insight.insight_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <InsightDataCell insight={insight} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={insight.is_read ? "secondary" : "default"}
                      >
                        {insight.is_read ? "Read" : "New"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!insight.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(insight.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Insight?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The insight will
                                be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteInsight(insight.id)}
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">AI Insights</h1>
        <p className="text-muted-foreground">
          Get personalized financial insights powered by artificial intelligence
        </p>
      </div>
      <FinancialInsightsSummary />
      <ChatbotInterface />
      <GeneratedInsightsTable />
    </div>
  );
}
