'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportToJson, exportToExcel } from '@/services/export-data';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast"

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, {
    message: "Old password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmNewPassword: z.string().min(6, {
    message: "Confirm new password must be at least 6 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

const deleteAccountSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type DeleteAccountValues = z.infer<typeof deleteAccountSchema>


const mockUserData = [
  {
    user_id: uuidv4(),
    username: 'johndoe',
    email: 'john.doe@example.com',
    password_hash: 'hashed_password',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    user_id: uuidv4(),
    username: 'janedoe',
    email: 'jane.doe@example.com',
    password_hash: 'hashed_password',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function SettingsPage() {
  const [username, setUsername] = useState('JohnDoe'); // Example default username
  const [email, setEmail] = useState('john.doe@example.com'); // Example default email
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [openPasswordChange, setOpenPasswordChange] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const { toast } = useToast()

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  const deleteForm = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
    },
  })

  useEffect(() => {
    // Initialize dark mode based on system preference
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemDarkMode);
    if (systemDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Listen for changes in system preference
    const handleThemeChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches);
      if (event.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleThemeChange);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSaveChanges = () => {
    // In a real application, you would send these changes to a backend server.
    toast({
      title: "Changes saved!",
      description: "Your account settings have been updated.",
    })
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const onSubmit = (data: ChangePasswordValues) => {
    // Here you would handle the password change logic
    console.log(data);
    setOpenPasswordChange(false);
    form.reset();
  }

  const handleDeleteConfirmation = () => {
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    deleteForm.reset();
  };

  const handleDeleteAccount = (data: DeleteAccountValues) => {
    // In a real application, you would verify the password against the stored hash.
    // For this example, we'll just check if the password is not empty.
    if (data.password) {
      setDeleteDialogOpen(false);
      deleteForm.reset();
      toast({
        title: "Account deleted!",
        description: "Your account has been permanently deleted.",
      })
    } else {
      toast({
        title: "Error",
        description: "Please enter your password to confirm deletion.",
      })
    }
  };

  const handleExportData = async () => {
    let dataUrl;
    if (exportFormat === 'json') {
      dataUrl = await exportToJson(mockUserData);
    } else if (exportFormat === 'excel') {
      dataUrl = await exportToExcel(mockUserData);
      if (dataUrl === 'EXCEL_EXPORT_NOT_IMPLEMENTED') {
        toast({
          title: "Export to Excel is not implemented yet.",
          description: "This feature will be available soon.",
        })
        return;
      }
    } else {
      toast({
        title: "Invalid export format.",
        description: "Please select a valid export format.",
      })
      return;
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `user_data.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences and update your information.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={handleUsernameChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
              />
            </div>
          </div>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Choose your preferred currency.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency">Currency</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleCurrencyChange('USD')}>USD</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleCurrencyChange('EUR')}>EUR</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleCurrencyChange('GBP')}>GBP</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <AlertDialog open={openPasswordChange} onOpenChange={setOpenPasswordChange}>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  Change Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter your old password and new password to change your password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                      control={form.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Old Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Old Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="New Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmNewPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm New Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Change Password</Button>
                  </form>
                </Form>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export your data or delete your account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="export-format">Export Format</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {exportFormat === 'json' ? 'JSON' : 'Excel'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setExportFormat('json')}>JSON</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setExportFormat('excel')}>Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleExportData}>
              Export Data
            </Button>
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers. To continue, please enter your password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Form {...deleteForm}>
                <form onSubmit={deleteForm.handleSubmit(handleDeleteAccount)} className="space-y-2">
                  <FormField
                    control={deleteForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
                    <Button type="submit" variant="destructive">Continue</Button>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Read our terms of service and privacy policy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="terms-of-service">
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>
            </Label>
            <Label htmlFor="privacy-policy">
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sm:flex sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"
