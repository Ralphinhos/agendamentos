import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, Shield, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
          <Link
            to="/admin"
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
              isActive("/admin") && "bg-accent"
            )}
            aria-label="Administração"
            title="Administração"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
