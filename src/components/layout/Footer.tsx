import { Link } from "react-router-dom";
import { Wrench, Facebook, Twitter, Instagram, Mail } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-background border-t border-border mt-auto">
            <div className="container py-8 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Wrench className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Reparamos
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            La plataforma líder para reparar tus dispositivos electrónicos de forma segura y rápida.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="/solicitudes" className="hover:text-primary transition-colors">
                                    Buscar Reparaciones
                                </Link>
                            </li>
                            <li>
                                <Link to="/mi-taller" className="hover:text-primary transition-colors">
                                    Para Talleres
                                </Link>
                            </li>
                            <li>
                                <Link to="/auth" className="hover:text-primary transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Términos y Condiciones
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Política de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Cookies
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact & Social */}
                    <div className="col-span-1">
                        <h4 className="font-semibold mb-4">Contacto</h4>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                            <a href="mailto:info@reparamos.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Mail className="h-4 w-4" />
                                info@reparamos.com
                            </a>
                        </div>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                                <Instagram className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Reparamos. Todos los derechos reservados.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <span>Hecho con ❤️ en España</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
