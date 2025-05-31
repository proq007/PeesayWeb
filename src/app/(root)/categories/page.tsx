"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { financeApi, Category } from "@/services/finance-api";

type SortOrder = "asc" | "desc";

// Type for the nested API response
interface ApiResponse {
  success?: boolean;
  data?: {
    categories?: Category[];
  };
  categories?: Category[];
}

const sortCategories = <T extends { [key: string]: any }>(
  column: keyof T | null,
  order: SortOrder,
  data: T[]
): T[] => {
  return [...data].sort((a, b) => {
    if (column === null) return 0;
    let valueA, valueB;

    if (column === "id") {
      valueA = a[column] || 0;
      valueB = b[column] || 0;
    } else {
      valueA = (a[column] as string)?.toLowerCase() || "";
      valueB = (b[column] as string)?.toLowerCase() || "";
    }

    if (order === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<"name" | "id" | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("📡 Fetching categories...");
        setLoading(true);
        setError(null);

        const response = await financeApi.getCategories();
        console.log("✅ Categories response:", response);

        // Handle the nested response structure with proper typing
        let categoriesData: Category[] = [];

        // Cast response to handle both array and object cases
        const apiResponse = response as Category[] | ApiResponse;

        if (Array.isArray(apiResponse)) {
          // Response is already a Category array
          categoriesData = apiResponse;
        } else if (apiResponse && typeof apiResponse === "object") {
          // Handle nested structure
          if (apiResponse.success && apiResponse.data?.categories) {
            categoriesData = apiResponse.data.categories;
          } else if (apiResponse.categories) {
            categoriesData = apiResponse.categories;
          }
        }

        console.log("📊 Parsed categories:", categoriesData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        setError("Failed to load categories. Please try again.");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const searchText = searchQuery.toLowerCase();
    const nameMatch =
      category.name && category.name.toLowerCase().includes(searchText);
    const descriptionMatch =
      category.description &&
      category.description.toLowerCase().includes(searchText);

    return nameMatch || descriptionMatch;
  });

  const sortedCategories = sortCategories(
    sortColumn,
    sortOrder,
    filteredCategories
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading categories...</div>
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
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            View all your transaction categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-md"
            />
            <div className="text-sm text-muted-foreground">
              {filteredCategories.length} of {categories.length} categories
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {sortedCategories.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              {searchQuery
                ? "No categories found matching your search."
                : "No categories available."}
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("id")}
                        className="font-semibold"
                      >
                        ID
                        {sortColumn === "id" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("name")}
                        className="font-semibold"
                      >
                        Category Name
                        {sortColumn === "name" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          #{category.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "No description"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
