import { NavLink } from "@/components/NavLink";
import { Shield, Activity, Network, MessageSquare } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold">Splitstream</span>
            </div>
            
            <div className="flex gap-1">
              <NavLink
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="!text-primary !bg-secondary"
              >
                <Activity className="h-4 w-4" />
                Dashboard
              </NavLink>
              
              <NavLink
                to="/graph"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="!text-primary !bg-secondary"
              >
                <Network className="h-4 w-4" />
                Graph
              </NavLink>
              
              <NavLink
                to="/chat"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeClassName="!text-primary !bg-secondary"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </NavLink>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground font-mono">
            v1.0.0-alpha
          </div>
        </div>
      </div>
    </nav>
  );
};
