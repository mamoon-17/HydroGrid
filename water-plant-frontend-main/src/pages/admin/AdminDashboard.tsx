import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Users, 
  Database, 
  FileText, 
  AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
  // Mock data - replace with real data from API
  const stats = {
    totalPlants: 24,
    warningPlants: 3,
    totalEmployees: 8,
    recentReports: 12
  };

  const warningPlants = [
    { id: 1, location: 'Sector 15, Karachi', lastReport: '18 days ago', type: 'RO' },
    { id: 2, location: 'Phase 2, Lahore', lastReport: '16 days ago', type: 'UF' },
    { id: 3, location: 'Block A, Islamabad', lastReport: '20 days ago', type: 'RO' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your RO/UF plant maintenance system
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalPlants}</div>
            <p className="text-xs text-muted-foreground">Across all regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Plants</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{stats.warningPlants}</div>
            <p className="text-xs text-muted-foreground">No report in 15+ days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active maintenance staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.recentReports}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Plants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Plants Requiring Attention
          </CardTitle>
          <CardDescription>
            Plants that haven't submitted reports in 15+ days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {warningPlants.map((plant) => (
              <div key={plant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-danger rounded-full"></div>
                  <div>
                    <p className="font-medium">{plant.location}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {plant.type} • Last Report: {plant.lastReport}
                    </p>
                  </div>
                </div>
                <StatusBadge status="warning" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;