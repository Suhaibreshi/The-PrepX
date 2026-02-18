import { ReactNode } from "react";
import { LucideIcon, Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  addLabel?: string;
  onAdd?: () => void;
  children: ReactNode;
}

export default function DataPage({ title, subtitle, icon: Icon, addLabel, onAdd, children }: DataPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="page-subtitle">{subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 w-full sm:w-56 bg-card" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          {addLabel && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
