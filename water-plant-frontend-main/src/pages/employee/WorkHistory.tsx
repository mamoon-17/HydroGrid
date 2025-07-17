import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { History, Calendar, MapPin, Eye, Filter, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WorkReport {
  id: string;
  plantLocation: string;
  plantType: 'RO' | 'UF';
  submittedDate: string;
  submittedTime: string;
  rawTds: number;
  productTds: number;
  ph: number;
  flowRate: number;
  status: 'submitted' | 'reviewed' | 'approved';
  notes: string;
}

const WorkHistory = () => {
  const { user } = useAuth();

  const [reports] = useState<WorkReport[]>([
    {
      id: '1',
      plantLocation: 'Sector 15, Karachi',
      plantType: 'RO',
      submittedDate: '2024-01-15',
      submittedTime: '14:30',
      rawTds: 850,
      productTds: 35,
      ph: 7.2,
      flowRate: 950,
      status: 'approved',
      notes: 'All parameters within normal range. Membrane pressure stable.'
    },
    {
      id: '2',
      plantLocation: 'Phase 2, Lahore',
      plantType: 'UF',
      submittedDate: '2024-01-12',
      submittedTime: '10:15',
      rawTds: 920,
      productTds: 42,
      ph: 6.8,
      flowRate: 1850,
      status: 'reviewed',
      notes: 'Flow rate slightly below target. Cleaned filters and checked pumps.'
    },
    {
      id: '3',
      plantLocation: 'Block A, Islamabad',
      plantType: 'RO',
      submittedDate: '2024-01-10',
      submittedTime: '16:45',
      rawTds: 780,
      productTds: 28,
      ph: 7.5,
      flowRate: 480,
      status: 'submitted',
      notes: 'Performed routine maintenance. All systems functioning properly.'
    },
    {
      id: '4',
      plantLocation: 'Sector 15, Karachi',
      plantType: 'RO',
      submittedDate: '2024-01-08',
      submittedTime: '13:20',
      rawTds: 890,
      productTds: 38,
      ph: 7.0,
      flowRate: 920,
      status: 'approved',
      notes: 'Replaced cartridge filter. TDS levels improved significantly.'
    },
    {
      id: '5',
      plantLocation: 'Phase 2, Lahore',
      plantType: 'UF',
      submittedDate: '2024-01-05',
      submittedTime: '11:30',
      rawTds: 950,
      productTds: 45,
      ph: 6.9,
      flowRate: 1900,
      status: 'approved',
      notes: 'Monthly deep cleaning completed. System performance optimal.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [plantFilter, setPlantFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);

  const uniquePlants = [...new Set(reports.map(report => report.plantLocation))];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.plantLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlant = plantFilter === 'all' || report.plantLocation === plantFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const reportDate = new Date(report.submittedDate);
      const now = new Date();
      switch (dateFilter) {
        case 'week':
          matchesDate = (now.getTime() - reportDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          matchesDate = reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          const reportQuarter = Math.floor(reportDate.getMonth() / 3);
          matchesDate = quarter === reportQuarter && reportDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesPlant && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'reviewed': return 'secondary';
      case 'submitted': return 'outline';
      default: return 'secondary';
    }
  };

  const stats = {
    totalReports: reports.length,
    thisMonth: reports.filter(r => new Date(r.submittedDate).getMonth() === new Date().getMonth()).length,
    approved: reports.filter(r => r.status === 'approved').length,
    averagePerWeek: Math.round((reports.length / 4) * 10) / 10
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work History</h1>
          <p className="text-muted-foreground mt-1">
            View and track all your submitted reports
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Reports submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Successfully reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.averagePerWeek}</div>
            <p className="text-xs text-muted-foreground">Reports per week</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search location or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plant</label>
              <Select value={plantFilter} onValueChange={setPlantFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  {uniquePlants.map(plant => (
                    <SelectItem key={plant} value={plant}>{plant}</SelectItem>
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submitted Reports</CardTitle>
          <CardDescription>
            Showing {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plant Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Key Metrics</TableHead>
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
                    <Badge variant={report.plantType === 'RO' ? 'default' : 'secondary'}>
                      {report.plantType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{new Date(report.submittedDate).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{report.submittedTime}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div>pH: {report.ph}</div>
                      <div>Flow: {report.flowRate} LPH</div>
                      <div>TDS: {report.productTds} ppm</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
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
                          <DialogTitle>Report Details</DialogTitle>
                          <DialogDescription>
                            Detailed view of submitted report
                          </DialogDescription>
                        </DialogHeader>
                        {selectedReport && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <strong>Report Information</strong>
                                <div className="text-sm space-y-1">
                                  <div>Plant: {selectedReport.plantLocation}</div>
                                  <div>Type: {selectedReport.plantType}</div>
                                  <div>Date: {new Date(selectedReport.submittedDate).toLocaleDateString()}</div>
                                  <div>Time: {selectedReport.submittedTime}</div>
                                  <div>Status: {selectedReport.status}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <strong>Quality Measurements</strong>
                                <div className="text-sm space-y-1">
                                  <div>Raw TDS: {selectedReport.rawTds} ppm</div>
                                  <div>Product TDS: {selectedReport.productTds} ppm</div>
                                  <div>pH Level: {selectedReport.ph}</div>
                                  <div>Flow Rate: {selectedReport.flowRate} LPH</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <strong>Notes</strong>
                              <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                                {selectedReport.notes || 'No additional notes'}
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
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

export default WorkHistory;