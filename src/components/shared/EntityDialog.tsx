import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "select" | "date" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface EntityDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  initialData?: Record<string, any> | null;
  onSubmit: (data: Record<string, any>) => void;
  loading?: boolean;
}

export default function EntityDialog({ open, onClose, title, fields, initialData, onSubmit, loading }: EntityDialogProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        const value = initialData?.[f.key];
        // Convert value to string, handling null/undefined and objects
        if (value === null || value === undefined) {
          initial[f.key] = "";
        } else if (typeof value === "object") {
          initial[f.key] = "";
        } else {
          initial[f.key] = String(value);
        }
      });
      setForm(initial);
    }
  }, [open, initialData, fields]);

  const processFormData = () => {
    const processedData: Record<string, any> = { id: initialData?.id };
    fields.forEach((f) => {
      const value = form[f.key];
      if (f.type === "number") {
        const numValue = value ? parseFloat(value) : undefined;
        processedData[f.key] = numValue;
      } else if (f.type === "date") {
        processedData[f.key] = value || undefined;
      } else if (f.type === "select") {
        processedData[f.key] = value || undefined;
      } else {
        processedData[f.key] = value || undefined;
      }
    });
    return processedData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(processFormData());
  };

  const handleButtonClick = () => {
    onSubmit(processFormData());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 overflow-y-auto flex-1 min-h-0">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
              {f.type === "select" ? (
                <Select value={form[f.key] || ""} onValueChange={(v) => setForm((p) => ({ ...p, [f.key]: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={f.placeholder || `Select ${f.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  placeholder={f.placeholder}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                  className="min-h-[80px]"
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                />
              )}
            </div>
          ))}
        </form>
        <div className="flex justify-end gap-2 pt-2 flex-shrink-0 border-t mt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={loading} onClick={handleButtonClick}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData?.id ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
