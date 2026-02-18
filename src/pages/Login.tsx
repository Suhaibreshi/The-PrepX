import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import prepxLogo from "/prepx-logo.png";
import { getSafeErrorMessage } from "@/lib/utils";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (showForgotPassword) {
      const { error } = await resetPassword(email);
      if (error) setError(getSafeErrorMessage(error));
      else setSuccess("Password reset link has been sent to your email.");
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(getSafeErrorMessage(error));
      else navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <CardContent className="pt-8 pb-8 px-4 sm:px-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <img src={prepxLogo} alt="PREPX IQ" className="h-16 w-16 rounded-2xl mb-4 shadow-lg" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-800">PREPX IQ</h1>
            <p className="text-sm text-muted-foreground mt-1">Education Management Portal</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium mb-1.5 block text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@prepxiq.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            
            {!showForgotPassword && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <Button 
              className="w-full" 
              size="lg" 
              disabled={loading}
              type="submit"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showForgotPassword ? "Send Reset Link" : "Sign In"}
              {!loading && !showForgotPassword && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          {!showForgotPassword ? (
            <div className="text-center mt-6">
              <button
                onClick={() => { setShowForgotPassword(true); setError(""); setSuccess(""); }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot your password?
              </button>
            </div>
          ) : (
            <div className="text-center mt-6">
              <button
                onClick={() => { setShowForgotPassword(false); setError(""); setSuccess(""); }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-xs text-slate-500">
              © 2024 PREPX IQ Nexus. All rights reserved.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
