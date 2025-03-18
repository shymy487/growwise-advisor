
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { Home, BarChart3, FileInput, FileSpreadsheet, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavLink = ({ href, icon, label, active }: NavLinkProps) => {
  return (
    <Link to={href}>
      <Button
        variant="ghost"
        className={cn(
          "flex items-center gap-2 w-full justify-start",
          active && "bg-accent text-accent-foreground"
        )}
      >
        {icon}
        <span>{label}</span>
      </Button>
    </Link>
  );
};

interface NavbarProps {
  authenticated?: boolean;
}

const Navbar = ({ authenticated = false }: NavbarProps) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only show full navbar when authenticated
  if (!authenticated) {
    return (
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-6",
          scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="animate-fade-in" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="ghost" size="sm" className="animate-fade-in">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 px-6",
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo className="animate-fade-in" />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            href="/dashboard"
            icon={<Home className="w-4 h-4" />}
            label="Home"
            active={location.pathname === "/dashboard"}
          />
          <NavLink
            href="/input"
            icon={<FileInput className="w-4 h-4" />}
            label="Input Data"
            active={location.pathname === "/input"}
          />
          <NavLink
            href="/results"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="Results"
            active={location.pathname === "/results"}
          />
          <NavLink
            href="/analysis"
            icon={<BarChart3 className="w-4 h-4" />}
            label="Analysis"
            active={location.pathname === "/analysis"}
          />
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/signout">
            <Button variant="ghost" size="icon" className="animate-fade-in">
              <LogOut className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
