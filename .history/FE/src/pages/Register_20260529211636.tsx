// src/pages/Register.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { register as registerAPI } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [username,    setUsername]    = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    // 🟢 Chặn hành vi reload mặc định của form
    e.preventDefault(); 
    setValidationError("");

    setLoading(true);
    try {
      const res = await registerAPI({ username, email, password, displayName });

      if (res.success) {
        const { accessToken, refreshToken, user } = res.data;
        login(user, accessToken, refreshToken);
        toast.success("Account created! Welcome to CineStream.");
        navigate("/home");
      } else {
        const errorMsg = res.message || "Registration failed";
        toast.error(errorMsg);
        setValidationError(errorMsg);
      }
    } catch (err: any) {
      console.error("Chi tiết lỗi Đăng ký từ Hệ thống:", err);
      const errorMsg = err.message || "Registration failed. Please check your data.";
      toast.error(errorMsg); 
      setValidationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Sign up to start using CineStream</CardDescription>
          </CardHeader>

          <CardContent>
            {/* 🟢 QUAN TRỌNG: Form nhận sự kiện onSubmit để trình duyệt kiểm tra lỗi popup trước khi gửi đi */}
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  disabled={loading}
                  required // 🟢 Popup: "Please fill out this field" (Must not be blank)
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email" // 🟢 Kích hoạt popup kiểm tra định dạng chứa ký tự "@"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                  required // 🟢 Bắt buộc không được để trống
                />
              </div>

              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  required // 🟢 Popup: "Please fill out this field" (Must not be blank)
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required // 🟢 Bắt buộc không được để trống
                  minLength={6}   // 🟢 Popup báo lỗi nếu dưới 6 chữ
                  maxLength={100} // 🟢 Giới hạn tối đa 100 chữ đúng chuẩn DTO của Backend
                />
              </div>

              {/* Hệ thống thông báo lỗi từ Backend ném về */}
              {validationError && (
                <p className="text-sm text-red-500 font-medium bg-red-500/10 p-2.5 rounded-md border border-red-500/20">
                  {validationError}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign up"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <span
                  className="text-primary cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  Login
                </span>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}