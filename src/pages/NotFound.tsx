
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-crop-light">
      <div className="text-center px-4 animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 text-crop-primary">404</h1>
        <p className="text-xl text-foreground mb-6">Oops! We couldn't find that page</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to={isAuthenticated ? "/dashboard" : "/"}>
          <Button className="bg-crop-primary hover:bg-crop-primary/90">
            <Home className="mr-2 h-4 w-4" />
            {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
