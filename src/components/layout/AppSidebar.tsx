import { LayoutDashboard, Users, AlertTriangle, FileText, BarChart3, FlaskConical, LogIn, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "إدارة الطلاب", url: "/students", icon: Users },
  { title: "الإنذارات", url: "/alerts", icon: AlertTriangle },
  { title: "الخطط العلاجية", url: "/plans", icon: FileText },
  { title: "التقارير", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  return (
    <Sidebar side="right" className="border-l-0" collapsible="icon">
      <div className="gradient-sidebar h-full flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-sidebar-foreground">ChemTrack Pro</h1>
              <p className="text-[10px] text-sidebar-foreground/60">أ. عبدالله محمد حمدي</p>
            </div>
          )}
        </div>

        <SidebarContent className="pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Auth button */}
        <div className="p-3 border-t border-sidebar-border mt-auto">
          {session ? (
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={async () => { await signOut(); }}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="mr-2">تسجيل الخروج</span>}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-5 w-5" />
              {!collapsed && <span className="mr-2">دخول المشرف</span>}
            </Button>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
