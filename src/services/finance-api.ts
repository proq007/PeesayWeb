import api from "./api";

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  category_id: number;
  amount: number;
  description: string;
  transaction_type: "income" | "expense";
  created_at: string;
  updated_at: string;
}

export interface SavingGoal {
  id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  target_date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  category_id: number;
  budget_amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: number;
  category_id: number;
  expense_name: string;
  amount: number;
  recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_occurrence: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CategoriesResponse {
  categories: Category[];
}

export const financeApi = {
  // Categories
  getCategories: async () => {
    const response = await api.get<ApiResponse<CategoriesResponse>>(
      "/finance/categories"
    );
    console.log(response);
    // Return the actual categories array from the nested structure
    return response.data.data.categories;
  },

  // Transactions
  createTransaction: async (
    data: Omit<Transaction, "id" | "created_at" | "updated_at">
  ) => {
    const response = await api.post<Transaction>("/finance/transactions", data);
    return response.data;
  },
  updateTransaction: async (
    id: number,
    data: Partial<Omit<Transaction, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await api.put<Transaction>(
      `/finance/transactions/${id}`,
      data
    );
    return response.data;
  },
  getTransactions: async (transactionType?: "income" | "expense") => {
    const params = transactionType ? { transaction_type: transactionType } : {};
    const response = await api.get<Transaction[]>(`/finance/transactions`, {
      params,
    });
    return response.data;
  },
  getTransaction: async (id: number) => {
    const response = await api.get<Transaction>(`/finance/transactions/${id}`);
    return response.data;
  },
  deleteTransaction: async (id: number) => {
    await api.delete(`/finance/transactions/${id}`);
  },

  // Saving Goals
  createSavingGoal: async (
    data: Omit<SavingGoal, "id" | "created_at" | "updated_at">
  ) => {
    const response = await api.post<SavingGoal>("/finance/saving-goals", data);
    return response.data;
  },
  updateSavingGoal: async (
    id: number,
    data: Partial<Omit<SavingGoal, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await api.put<SavingGoal>(
      `/finance/saving-goals/${id}`,
      data
    );
    return response.data;
  },
  getSavingGoals: async () => {
    const response = await api.get<SavingGoal[]>("/finance/saving-goals");
    return response.data;
  },
  getSavingGoal: async (id: number) => {
    const response = await api.get<SavingGoal>(`/finance/saving-goals/${id}`);
    return response.data;
  },
  deleteSavingGoal: async (id: number) => {
    await api.delete(`/finance/saving-goals/${id}`);
  },

  // Budgets
  createBudget: async (
    data: Omit<Budget, "id" | "created_at" | "updated_at">
  ) => {
    const response = await api.post<Budget>("/finance/budgets", data);
    return response.data;
  },
  updateBudget: async (
    id: number,
    data: Partial<Omit<Budget, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await api.put<Budget>(`/finance/budgets/${id}`, data);
    return response.data;
  },
  getBudgets: async (params?: {
    category_id?: number;
    min_budget_amount?: number;
    max_budget_amount?: number;
    period_start_from?: string;
    period_start_to?: string;
    period_end_from?: string;
    period_end_to?: string;
  }) => {
    const response = await api.get<Budget[]>("/finance/budgets", { params });
    return response.data;
  },
  getBudget: async (id: number) => {
    const response = await api.get<Budget>(`/finance/budgets/${id}`);
    return response.data;
  },
  deleteBudget: async (id: number) => {
    await api.delete(`/finance/budgets/${id}`);
  },

  // Recurring Expenses
  createRecurringExpense: async (
    data: Omit<RecurringExpense, "id" | "created_at" | "updated_at">
  ) => {
    const response = await api.post<RecurringExpense>(
      "/finance/recurring-expenses",
      data
    );
    return response.data;
  },
  updateRecurringExpense: async (
    id: number,
    data: Partial<Omit<RecurringExpense, "id" | "created_at" | "updated_at">>
  ) => {
    const response = await api.put<RecurringExpense>(
      `/finance/recurring-expenses/${id}`,
      data
    );
    return response.data;
  },
  getRecurringExpenses: async (params?: {
    expense_name?: string;
    category_id?: number;
    recurrence_frequency?: "daily" | "weekly" | "monthly" | "yearly";
    next_occurrence_from?: string;
    next_occurrence_to?: string;
  }) => {
    const response = await api.get<RecurringExpense[]>(
      "/finance/recurring-expenses",
      { params }
    );
    return response.data;
  },
  getRecurringExpense: async (id: number) => {
    const response = await api.get<RecurringExpense>(
      `/finance/recurring-expenses/${id}`
    );
    return response.data;
  },
  deleteRecurringExpense: async (id: number) => {
    await api.delete(`/finance/recurring-expenses/${id}`);
  },
};
