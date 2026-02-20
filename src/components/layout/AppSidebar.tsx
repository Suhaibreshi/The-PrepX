import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  ChevronLeft,
  UserCog,
  X,
  BookOpen,
  CheckSquare,
  UserPlus,
} from "lucide-react";
import prepxLogo from "/prepx-logo.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Students", icon: GraduationCap, path: "/students" },
  { label: "Leads", icon: UserPlus, path: "/leads" },
  { label: "Parents", icon: Users, path: "/parents" },
  { label: "Teachers", icon: UserCog, path: "/teachers" },
  { label: "Courses", icon: BookOpen, path: "/courses" },
  { label: "Batches", icon: Layers, path: "/batches" },
  { label: "Attendance", icon: CalendarCheck, path: "/attendance" },
  { label: "Exams", icon: ClipboardList, path: "/exams" },
  { label: "Fees", icon: DollarSign, path: "/fees" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const location = useLocation();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-[68px]" : "lg:w-60"}
        w-64
      `}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <img src={prepxLogo} alt="PREPX IQ" className="h-9 w-9 rounded-lg shrink-0" />
        {(!collapsed || mobileOpen) && (
          <span className="font-heading text-lg font-bold text-sidebar-primary-foreground tracking-tight">
            PREPX IQ
          </span>
        )}
        {/* Desktop collapse */}
        <button
          onClick={onToggle}
          className="ml-auto text-sidebar-muted hover:text-sidebar-foreground transition-colors hidden lg:block"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="ml-auto text-sidebar-muted hover:text-sidebar-foreground transition-colors lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const showLabel = !collapsed || mobileOpen;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } ${!showLabel ? "justify-center" : ""}`}
              title={!showLabel ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {showLabel && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {(!collapsed || mobileOpen) && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-[10px] text-sidebar-muted text-center leading-tight">
            <span className="font-medium text-sidebar-foreground">DESIGNED AND DEVELOPED BY SUHAIB REYAZ & SHAHEEN NAZIR</span>
          </p>
        </div>
      )}
    </aside>
  );
}
