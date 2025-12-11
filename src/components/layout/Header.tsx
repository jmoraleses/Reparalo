import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isCustomer, profile } = useUserProfile();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const navigation = isCustomer
    ? [
      { name: "Marketplace", href: "/" },
      { name: "Mis Reparaciones", href: "/mis-reparaciones" },
      { name: "Solicitar reparación", href: "/nueva-solicitud" },
      { name: "Mensajes", href: "/mensajes" },
    ]
    : [
      { name: "Marketplace", href: "/" },
      { name: "Mi Taller", href: "/mi-taller" },
      { name: "Mensajes", href: "/mensajes" },
    ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Repáralo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* User name display */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">
                  {profile?.workshop_name || profile?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <NotificationsDropdown />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:flex" title="Cerrar sesión">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${location.pathname === item.href
                        ? "text-primary"
                        : "text-muted-foreground"
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <hr className="my-4" />
                {user ? (
                  <button
                    onClick={() => { setIsOpen(false); handleSignOut(); }}
                    className="text-lg font-medium text-destructive flex items-center gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </button>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="text-lg font-medium text-primary flex items-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Iniciar Sesión
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
