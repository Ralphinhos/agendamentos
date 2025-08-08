import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-4">Oops! Página não encontrada</p>
        <a href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 transition-colors">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
