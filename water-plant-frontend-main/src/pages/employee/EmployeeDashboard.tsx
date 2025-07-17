import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Database, 
  ClipboardList, 
  History, 
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();

  // Mock data for assigned plants
  const assignedPlants = [
    {
      id: '1',
      location: 'Sector 15, Karachi',
      type: 'RO',
      capacity: 1000,
      lastReport: '2024-01-15',
      status: 'maintained' as const,
      daysAgo: 2
    },
    {
      id: '2',
      location: 'Phase 2, Lahore',
      type: 'UF',
      capacity: 2000,
      lastReport: '2024-01-10',
      status: 'pending' as const,
      daysAgo: 7
    },
    {
      id: '3',
      location: 'Block A, Islamabad',
      type: 'RO',
      capacity: 500,
      lastReport: '2023-12-28',
      status: 'warning' as const,
      daysAgo: 20
    }
  ];

  const stats = {
    totalAssigned: assignedPlants.length,
    reportsThisMonth: 8,
    overdueReports: assignedPlants.filter(p => p.daysAgo > 15).length,
    averageReportTime: 3.2
  };

  const recentActivity = [
    {
      id: '1',
      action: 'Submitted quality report',
      plant: 'Sector 15, Karachi',
      timestamp: '2 hours ago',
      type: 'report'
    },
    {
      id: '2',
      action: 'Updated maintenance log',
      plant: 'Phase 2, Lahore',
      timestamp: '1 day ago',
      type: 'maintenance'
    },
    {
      id: '3',
      action: 'Completed inspection',
      plant: 'Block A, Islamabad',
      timestamp: '3 days ago',
      type: 'inspection'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your assigned plants and recent activity
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Under your maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports This Month</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.reportsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{stats.overdueReports}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Report Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.averageReportTime}d</div>
            <p className="text-xs text-muted-foreground">Between reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/employee/fill-report">
              <Button className="w-full justify-start" size="lg">
                <ClipboardList className="h-4 w-4 mr-2" />
                Fill Out New Report
              </Button>
            </Link>
            <Link to="/employee/work-history">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <History className="h-4 w-4 mr-2" />
                View Work History
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg border">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.plant}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Plants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Your Assigned Plants
          </CardTitle>
          <CardDescription>
            Plants under your maintenance responsibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedPlants.map((plant) => (
              <Card key={plant.id} className={`${plant.status === 'warning' ? 'border-danger' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{plant.location}</CardTitle>
                    </div>
                    <StatusBadge status={plant.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{plant.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{plant.capacity} LPH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Report:</span>
                      <span className={`font-medium ${plant.daysAgo > 15 ? 'text-danger' : plant.daysAgo > 7 ? 'text-warning' : 'text-success'}`}>
                        {plant.daysAgo} days ago
                      </span>
                    </div>
                  </div>
                  
                  {plant.status === 'warning' && (
                    <div className="mt-3 p-2 bg-danger/10 border border-danger/20 rounded">
                      <p className="text-xs text-danger">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Report overdue - immediate attention required
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <Link to="/employee/fill-report">
                      <Button size="sm" className="w-full">
                        Submit Report
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;