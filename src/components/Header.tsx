import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, ListChecks, Clapperboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";

const Header = () => {
  const location = useLocation();
  const { role, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  // Don't render header on login or confirmation pages
  if (!role) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">EAD Gravações</span>
        </Link>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <>
              <Link
                to="/"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                  isActive("/") && "bg-accent"
                )}
                aria-label="Agendar"
                title="Agendar"
              >
                <CalendarCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Agendar</span>
              </Link>
              <Link
                to="/agendados"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                  isActive("/agendados") && "bg-accent"
                )}
                aria-label="Agendados"
                title="Agendados"
              >
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">Agendados</span>
              </Link>
            </>
          )}
          {role === 'editor' && (
            <Link
              to="/editor"
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                isActive("/editor") && "bg-accent"
              )}
              aria-label="Edição"
              title="Edição"
            >
              <Clapperboard className="h-4 w-4" />
              <span className="hidden sm:inline">Edição</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
