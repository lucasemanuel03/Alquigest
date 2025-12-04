"use client"

import { Moon, Sun, UserCircle2Icon, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthProvider";
import { useEffect, useState } from "react";

export default function PildoraUsuario({
  username = "",
  isDarkMode,
  toggleTheme,
  onLoginClick,
}: { username: string; isDarkMode: boolean; toggleTheme: () => void; onLoginClick?: () => void }) {
  const { logout, hasRole } = useAuth();
  
  const handleLogout = () => {
    logout(); // Llama al método logout del AuthProvider (ya maneja la redirección)
  };

  const handleLoginOrLogout = () => {
    if (username === "" && onLoginClick) {
      onLoginClick(); // Abre el modal de login
    } else {
      handleLogout();// Cierra sesión
      window.location.reload(); 
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isRoleAdmin = hasRole("ROLE_ADMINISTRADOR");
  
  var gradientVar = "bg-muted text-primary"
  if(isRoleAdmin){
    gradientVar = "bg-gradient-to-r from-yellow-400 via-orange-500 to-blue-500 text-black animate-gradient-diagonal"
  }
  

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Dropdown Menu para el usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`md:flex max-w-27 md:max-w-120 flex-col p-1 rounded-4xl ${gradientVar} hover:bg-accent hover:text-muted transition cursor-pointer`}
            >
              <div className="flex items-center space-x-2">
                <UserCircle2Icon className="h-8 w-8 rounded-full" />
                <p className=" font-bold pr-2 truncate">{username || "Inicie sesión"}</p>
                {mounted && isRoleAdmin && <p className="hidden md:block">| Modo Administrador</p>}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleLoginOrLogout(); }}>
              {(username === "") ? <div className="flex"> <LogIn className="h-4 w-4 mr-2"/> Iniciar Sesión </div> : <div className="flex"> <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión</div> }
              
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Botón para alternar el tema */}
        <div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-muted hover:bg-muted-foreground transition"
          >
            {!isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-yellow-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}