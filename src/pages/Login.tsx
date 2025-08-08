import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const LoginPage = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') navigate('/');
    if (role === 'editor') navigate('/editor');
  }, [role, navigate]);

  const handleLogin = (selectedRole: 'admin' | 'editor') => {
    login(selectedRole);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Selecione seu perfil para continuar</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button size="lg" onClick={() => handleLogin('admin')}>
            Entrar como Administrador
          </Button>
          <Button size="lg" variant="secondary" onClick={() => handleLogin('editor')}>
            Entrar como Editor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
