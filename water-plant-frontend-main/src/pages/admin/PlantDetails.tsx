import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { StatusBadge } from '../../components/StatusBadge';
import { Database, Filter, FileText, MapPin, User, Calendar } from 'lucide-react';

interface PlantDetail {
  id: string;
  location: string;
  type: 'UF' | 'RO';
  assignedEmployee: string;
  tehsil: string;
  currentStatus: 'maintained' | 'pending' | 'warning';
  lastReport: string;
  capacity: number;
  reportsCount: number;
}

const PlantDetails = () => {
  const [plants] = useState<PlantDetail[]>([
    {
      id: '1',
      location: 'Sector 15, Karachi',
      type: 'RO',
      assignedEmployee: 'John Doe',
      tehsil: 'Karachi South',
      currentStatus: 'maintained',
      lastReport: '2 days ago',
      capacity: 1000,
      reportsCount: 15
    },
    {
      id: '2',
      location: 'Phase 2, Lahore',
      type: 'UF',
      assignedEmployee: 'Jane Smith',
      tehsil: 'Lahore Cantt',
      currentStatus: 'pending',
      lastReport: '5 days ago',
      capacity: 2000,
      reportsCount: 8
    },
    {
      id: '3',
      location: 'Block A, Islamabad',
      type: 'RO',
      assignedEmployee: 'Ahmed Ali',
      tehsil: 'Islamabad',
      currentStatus: 'warning',
      lastReport: '18 days ago',
      capacity: 500,
      reportsCount: 3
    },
    {
      id: '4',
      location: 'Garden Town, Lahore',
      type: 'RO',
      assignedEmployee: 'Sarah Khan',
      tehsil: 'Lahore City',
      currentStatus: 'maintained',
      lastReport: '1 day ago',
      capacity: 1000,
      reportsCount: 22
    },
    {
      id: '5',
      location: 'Gulshan, Karachi',
      type: 'UF',
      assignedEmployee: 'Ali Hassan',
      tehsil: 'Karachi East',
      currentStatus: 'warning',
      lastReport: '16 days ago',
      capacity: 2000,
      reportsCount: 5
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tehsilFilter, setTehsilFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const uniqueTehsils = [...new Set(plants.map(plant => plant.tehsil))];
  const uniqueEmployees = [...new Set(plants.map(plant => plant.assignedEmployee))];

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plant.assignedEmployee.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plant.currentStatus === statusFilter;
    const matchesTehsil = tehsilFilter === 'all' || plant.tehsil === tehsilFilter;
    const matchesEmployee = employeeFilter === 'all' || plant.assignedEmployee === employeeFilter;
    
    return matchesSearch && matchesStatus && matchesTehsil && matchesEmployee;
  });

  const statusCounts = {
    maintained: plants.filter(p => p.currentStatus === 'maintained').length,
    pending: plants.filter(p => p.currentStatus === 'pending').length,
    warning: plants.filter(p => p.currentStatus === 'warning').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plant Details</h1>
          <p className="text-muted-foreground mt-1">
            Monitor plant status and access detailed reports
          </p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintained</CardTitle>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{statusCounts.maintained}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="w-3 h-3 bg-warning rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{statusCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="w-3 h-3 bg-danger rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{statusCounts.warning}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search location or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="maintained">Maintained</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tehsil</label>
              <Select value={tehsilFilter} onValueChange={setTehsilFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tehsils</SelectItem>
                  {uniqueTehsils.map(tehsil => (
                    <SelectItem key={tehsil} value={tehsil}>{tehsil}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {uniqueEmployees.map(employee => (
                    <SelectItem key={employee} value={employee}>{employee}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plant Status Overview</CardTitle>
          <CardDescription>
            Showing {filteredPlants.length} of {plants.length} plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned Employee</TableHead>
                <TableHead>Tehsil</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Last Report</TableHead>
                <TableHead>Reports Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlants.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{plant.location}</div>
                        <div className="text-xs text-muted-foreground">
                          {plant.capacity} LPH
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plant.type === 'RO' ? 'default' : 'secondary'}>
                      {plant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {plant.assignedEmployee}
                    </div>
                  </TableCell>
                  <TableCell>{plant.tehsil}</TableCell>
                  <TableCell>
                    <StatusBadge status={plant.currentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {plant.lastReport}
                    </div>
                  </TableCell>
                  <TableCell>{plant.reportsCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Show Reports
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantDetails;