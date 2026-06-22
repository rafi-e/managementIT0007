"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { User, Lock, Eye, EyeOff, KeyRound, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/auth-actions";

const REQUIRED_CODE = "0007";

export default function LoginPage() {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pn, setPn] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code !== REQUIRED_CODE) {
      toast.error("Invalid verification code");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("pn", pn);
      formData.append("password", password);

      const result = await login(formData);

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else if (result?.success) {
        await update();
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        toast.error("Something went wrong");
        setIsLoading(false);
      }
    } catch {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-2xl w-full max-w-sm">
      <CardHeader className="text-center space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Personal Number"
              className="pl-10"
              value={pn}
              onChange={(e) => setPn(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Verification code"
              className="pl-10 font-mono tracking-widest"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              required
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
