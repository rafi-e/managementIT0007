"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    const result = await forgotPassword(formData);

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-0 shadow-2xl">
        <CardHeader className="text-center space-y-1 pb-2">
          <div className="mx-auto rounded-full bg-green-100 dark:bg-green-900/20 p-3 w-fit mb-2">
            <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-sm">
            If an account exists with that email, we&apos;ve sent a password reset
            link to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <Button
            variant="outline"
            onClick={() => setIsSuccess(false)}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 inline mr-1" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="text-center space-y-1 pb-2">
        <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send reset link
                <Send className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-6">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 inline mr-1" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
