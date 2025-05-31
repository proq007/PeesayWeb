'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Mock data for the AI insights
const mockInsights = [
  'Your spending on food is higher compared to the previous month.',
  'Consider setting a budget for entertainment expenses.',
  'You have a good savings rate, keep it up!',
];

const recentTransactions = [
  { id: 1, date: '2024-07-08', description: 'Grocery shopping', amount: -50.00, category: 'Food' },
  { id: 2, date: '2024-07-07', description: 'Salary deposit', amount: 2000.00, category: 'Income' },
  { id: 3, date: '2024-07-06', description: 'Dinner with friends', amount: -35.50, category: 'Food' },
  { id: 4, date: '2024-07-05', description: 'Online purchase', amount: -120.00, category: 'Shopping' },
  { id: 5, date: '2024-07-04', description: 'Freelance income', amount: 500.00, category: 'Income' },
];


const mockGeneratedInsights = [
  {
    insight_id: 'i1',
    user_id: 'u1',
    insight_data: 'Reduce dining out expenses.',
    insight_type: 'budget_suggestions',
    generated_date: '2024-07-22T10:00:00Z',
    is_read: false,
  },
  {
    insight_id: 'i2',
    user_id: 'u1',
    insight_data: 'Consider investing in high-yield savings account.',
    insight_type: 'spending_trend',
    generated_date: '2024-07-21T15:30:00Z',
    is_read: true,
  },
  {
    insight_id: 'i3',
    user_id: 'u1',
    insight_data: 'Increase savings rate by 5%.',
    insight_type: 'budget_suggestions',
    generated_date: '2024-07-20T08:45:00Z',
    is_read: false,
  },
];


const FinancialInsightsSummary = () => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    const totalIncome = recentTransactions.reduce(
      (sum, transaction) => sum + (transaction.amount > 0 ? transaction.amount : 0),
      0
    );
    const totalExpenses = recentTransactions.reduce(
      (sum, transaction) => sum + (transaction.amount < 0 ? transaction.amount : 0),
      0
    );

    setIncome(totalIncome);
    setExpenses(totalExpenses);
  }, []);

  useEffect(() => {
    const userId = uuidv4();
    const aiInput = {
      userId: userId,
      income: income,
      expenses: expenses,
      savings: 1000,
      transactions: recentTransactions.map(t => ({
        transaction_id: uuidv4(),
        user_id: userId,
        category_id: uuidv4(),
        amount: t.amount,
        transaction_date: new Date().toISOString(),
        description: t.description,
        transaction_type: t.amount > 0 ? 'income' : 'expense',
        created_at: new Date().toISOString(),
      })),
    };

    const getAiSummary = async () => {
      try {
        const summary = await generateFinancialSummary(aiInput);
        setAiSummary(summary.summary);
      } catch (error) {
        console.error('Failed to generate AI summary', error);
        setAiSummary('Failed to generate summary.');
      }
    };

    getAiSummary();
  }, [income, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Insights Summary</CardTitle>
        <CardDescription>
          Here&apos;s a summary of your financial situation:
        </CardDescription>
      </CardHeader>
      <CardContent>
        {aiSummary ? (
          <p>{aiSummary}</p>
        ) : (
          <p>Generating financial summary...</p>
        )}
      </CardContent>
    </Card>
  );
};

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<
    { text: string; isUser: boolean }[]
  >([
    {
      text: 'Hello! How can I help you with your finances today?',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim() !== '') {
      const userMessage = { text: input, isUser: true };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setInput('');

      try {
        const aiResponse = await chatbot({ message: input, chatHistory: messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })) });
        const botMessage = {
          text: aiResponse.response,
          isUser: false,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } catch (error: any) {
        console.error('Failed to generate AI response', error);
        const botMessage = {
          text: 'Sorry, I am having trouble connecting to the server. Please try again later.',
          isUser: false,
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      }
    }
    // Scroll to the bottom after sending a message
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleResetChat = () => {
    setIsResetting(true);
  };

  const confirmResetChat = () => {
    setMessages([
      {
        text: 'Hello! How can I help you with your finances today?',
        isUser: false,
      },
    ]);
    setIsResetting(false);
    // Scroll to the bottom after resetting the chat
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const cancelResetChat = () => {
    setIsResetting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Chatbot</CardTitle>
        <CardDescription>
          Ask me anything about your finances!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[400px]">
        <ScrollArea className="flex-grow">
          <div className="flex flex-col space-y-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${message.isUser
                  ? 'bg-muted text-right self-end'
                  : 'bg-secondary text-left self-start'
                  }`}
              >
                {message.text}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        </ScrollArea>
        <div className="flex flex-row items-center mt-4">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            className="flex-grow mr-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage}>Send</Button>
          <AlertDialog open={isResetting} onOpenChange={setIsResetting}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Reset Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogCancel onClick={cancelResetChat}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResetChat}>Confirm</AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

const GeneratedInsightsTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated AI Insights</CardTitle>
        <CardDescription>
          Here&apos;s a history of the AI insights generated for you:
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Generated</TableHead>
                <TableHead>Insight Type</TableHead>
                <TableHead>Insight Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockGeneratedInsights.map((insight) => (
                <TableRow key={insight.insight_id}>
                  <TableCell>{format(new Date(insight.generated_date), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell>{insight.insight_type}</TableCell>
                  <TableCell>{insight.insight_data}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


export default function AiInsightsPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <FinancialInsightsSummary />
      <ChatbotInterface />
      <GeneratedInsightsTable />
    </div>
  );
}
