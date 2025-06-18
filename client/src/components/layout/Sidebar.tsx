import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  DollarSign, 
  MessageCircle, 
  MessageSquare, 
  FileText, 
  Gamepad2, 
  Info, 
  Cake, 
  Settings, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType } from "@shared/schema";

interface SidebarProps {
  user: UserType | null;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
}

export default function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jadwal", label: "Jadwal Pelajaran", icon: Calendar },
    { href: "/piket", label: "Jadwal Piket", icon: ClipboardList },
    { href: "/kas", label: "Kas Kelas", icon: DollarSign },
    { href: "/chat", label: "Chat Kelas", icon: MessageCircle, badge: 3 },
    { href: "/diskusi", label: "Diskusi", icon: MessageSquare },
    { href: "/pr", label: "PR & Tugas", icon: FileText },
    { href: "/games", label: "Games", icon: Gamepad2 },
    { href: "/info", label: "Info Kelas", icon: Info },
    { href: "/ucapan-ultah", label: "Ucapan Ultah", icon: Cake },
  ];

  const bottomNavItems: NavItem[] = [
    { href: "/admin", label: "Admin Panel", icon: Settings, adminOnly: true },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) => location === href;

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive(item.href)
          ? "text-primary bg-primary/10 dark:bg-primary/20"
          : "text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10"
      )}
      onClick={() => onClose?.()}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.label}
      {item.badge && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "pt-16 lg:pt-0"
      )}>
        <nav className="px-4 py-6 space-y-2 h-full overflow-y-auto">
          {/* Main Navigation */}
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Admin Section */}
          {user?.isAdmin && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {bottomNavItems
                .filter((item) => item.adminOnly)
                .map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
            </div>
          )}

          {/* Profile Section */}
          <div className="pt-4">
            {bottomNavItems
              .filter((item) => !item.adminOnly)
              .map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
