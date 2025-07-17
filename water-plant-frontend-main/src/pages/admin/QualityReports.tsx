import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { FileText, Search, Eye, Trash2, Calendar, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface QualityReport {
  id: string;
  plantLocation: string;
  employeeName: string;
  tehsil: string;
  submittedDate: string;
  rawTds: number;
  permateTds: number;
  productTds: number;
  ph: number;
  flowRate: number;
  status: 'complete' | 'pending' | 'issues';
}

const QualityReports = () => {
  const [reports, setReports] = useState<QualityReport[]>([
    {
      id: '1',
      plantLocation: 'Sector 15, Karachi',
      employeeName: 'John Doe',
      tehsil: 'Karachi South',
      submittedDate: '2024-01-15',
      rawTds: 850,
      permateTds: 45,
      productTds: 35,
      ph: 7.2,
      flowRate: 950,
      status: 'complete'
    },
    {
      id: '2',
      plantLocation: 'Phase 2, Lahore',
      employeeName: 'Jane Smith',
      tehsil: 'Lahore Cantt',
      submittedDate: '2024-01-14',
      rawTds: 920,
      permateTds: 52,
      productTds: 42,
      ph: 6.8,
      flowRate: 1850,
      status: 'issues'
    },
    {
      id: '3',
      plantLocation: 'Block A, Islamabad',
      employeeName: 'Ahmed Ali',
      tehsil: 'Islamabad',
      submittedDate: '2024-01-12',
      rawTds: 780,
      permateTds: 38,
      productTds: 28,
      ph: 7.5,
      flowRate: 480,
      status: 'complete'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [tehsilFilter, setTehsilFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<QualityReport | null>(null);

  const uniqueEmployees = [...new Set(reports.map(report => report.employeeName))];
  const uniqueTehsils = [...new Set(reports.map(report => report.tehsil))];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.plantLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = employeeFilter === 'all' || report.employeeName === employeeFilter;
    const matchesTehsil = tehsilFilter === 'all' || report.tehsil === tehsilFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesEmployee && matchesTehsil && matchesStatus;
  });

  const handleDelete = (id: string) => {
    setReports(prev => prev.filter(report => report.id !== id));
    toast.success('Report deleted successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'pending': return 'secondary';
      case 'issues': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quality Reports</h1>
          <p className="text-muted-foreground mt-1">
            Browse and analyze quality reports from all plants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {reports.filter(r => r.status === 'complete').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <div className="w-3 h-3 bg-danger rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              {reports.filter(r => r.status === 'issues').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {reports.filter(r => new Date(r.submittedDate).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
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
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="issues">Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Reports</CardTitle>
          <CardDescription>
            Showing {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plant Location</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Tehsil</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>TDS Values</TableHead>
                <TableHead>pH</TableHead>
                <TableHead>Flow Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {report.plantLocation}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {report.employeeName}
                    </div>
                  </TableCell>
                  <TableCell>{report.tehsil}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(report.submittedDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div>Raw: {report.rawTds}</div>
                      <div>Product: {report.productTds}</div>
                    </div>
                  </TableCell>
                  <TableCell>{report.ph}</TableCell>
                  <TableCell>{report.flowRate} LPH</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Quality Report Details</DialogTitle>
                            <DialogDescription>
                              Detailed view of quality report for {report.plantLocation}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <strong>Plant Information</strong>
                                <div className="text-sm space-y-1">
                                  <div>Location: {selectedReport.plantLocation}</div>
                                  <div>Employee: {selectedReport.employeeName}</div>
                                  <div>Tehsil: {selectedReport.tehsil}</div>
                                  <div>Date: {new Date(selectedReport.submittedDate).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <strong>Quality Measurements</strong>
                                <div className="text-sm space-y-1">
                                  <div>Raw TDS: {selectedReport.rawTds} ppm</div>
                                  <div>Permeate TDS: {selectedReport.permateTds} ppm</div>
                                  <div>Product TDS: {selectedReport.productTds} ppm</div>
                                  <div>pH Level: {selectedReport.ph}</div>
                                  <div>Flow Rate: {selectedReport.flowRate} LPH</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(report.id)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default QualityReports;