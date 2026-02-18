import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const reportTypes = [
  { title: "Student Performance", description: "Academic performance reports by student, batch, or subject" },
  { title: "Fee Collection", description: "Revenue and collection reports with pending/overdue analysis" },
  { title: "Attendance Reports", description: "Daily, weekly, and monthly attendance summaries" },
  { title: "Teacher Performance", description: "Teacher workload, attendance, and evaluation reports" },
  { title: "Enrollment Analytics", description: "Student enrollment trends and growth metrics" },
  { title: "Custom Report Builder", description: "Build custom reports with flexible filters" },
];

export default function Reports() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Generate and export detailed reports</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-heading text-base">{report.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button size="sm">View Report</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
