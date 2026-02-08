import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-xl">V</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">VacayShare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div 
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 cursor-pointer group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Browse Rentals</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-card rounded-xl shadow-card-hover border border-border p-2 animate-fade-in">
                  <Link 
                    to="/rentals" 
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    All Rentals
                  </Link>
                  <Link 
                    to="/destinations" 
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    By Destination
                  </Link>
                  <Link 
                    to="/rentals?filter=deals" 
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    Last Minute Deals
                  </Link>
                </div>
              )}
            </div>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/list-property" className="text-muted-foreground hover:text-foreground transition-colors">
              List Your Property
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="default" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link 
              to="/rentals" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Rentals
            </Link>
            <Link 
              to="/destinations" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Destinations
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/list-property" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              List Your Property
            </Link>
            <Link 
              to="/faq" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQs
            </Link>
            <div className="flex gap-3 pt-4 border-t border-border">
              <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link to="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                <Button variant="default" className="w-full">Sign Up</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
