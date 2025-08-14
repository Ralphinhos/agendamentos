import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const LoginPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@ead.com");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect if user is already logged in
    if (auth.user) {
      if (auth.user.role === 'admin') navigate('/');
      if (auth.user.role === 'editor') navigate('/editor');
    }
  }, [auth.user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await auth.login(email, password);
      // The useEffect above will handle the redirect
      toast.success("Login bem-sucedido!");
    } catch (error) {
      toast.error("Falha no login", {
        description: "Email ou senha inválidos. Tente novamente.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorLogin = () => {
    setEmail("editor@ead.com");
    setPassword("editor123");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com suas credenciais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
             <Button type="button" size="sm" variant="link" onClick={handleEditorLogin}>
              Logar como Editor
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
