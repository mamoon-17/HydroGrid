import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Badge } from '../../components/ui/badge';
import { ScrollArea, ScrollBar } from '../../components/ui/scroll-area';
import { BarChart3, LineChart, Table as TableIcon, Calendar, ChevronDown, Check, MapPin, User, Droplets } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const Analytics = () => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [plantSelectorOpen, setPlantSelectorOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [reportOffset, setReportOffset] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const REPORTS_PAGE_SIZE = 5;

  // --- Fix 1: Parameter History Horizontal Pagination ---
  // Only show a window of 5 reports at a time, fetch more as you scroll right
  const [visibleStart, setVisibleStart] = useState(0);
  const PAGE_SIZE = 5;

  // When reports change, reset visible window
  useEffect(() => {
    setVisibleStart(0);
  }, [reports]);

  // Only show a window of reports (columns)
  const visibleReports = reports.slice(visibleStart, visibleStart + PAGE_SIZE);
  const visibleDates = visibleReports.map(r => r.created_at).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // On scroll right, fetch more and shift window
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10 && hasMore && !isFetchingMore) {
      fetchMoreReports();
      setVisibleStart(prev => prev + PAGE_SIZE);
    }
  };

  // --- Fix 2: Plant Dropdown Robustness (improved) ---
  const safePlants = Array.isArray(plants) ? plants : [];
  const safeCurrentPlant = safePlants.find(plant => plant.id === selectedPlant) || safePlants[0] || {};
  const hasPlants = safePlants.length > 0;

  // --- Fix 3: Status Color Logic ---
  // Green: last report within 7 days, Yellow: 8-15, Red: >15 or never
  let statusColor = 'bg-danger';
  let statusText = 'No recent reports';
  if (reports.length > 0) {
    const lastReportDate = new Date(reports[0].created_at);
    const now = new Date();
    const daysAgo = Math.floor((now.getTime() - lastReportDate.getTime()) / (1000 * 3600 * 24));
    if (daysAgo <= 7) {
      statusColor = 'bg-success';
      statusText = 'Maintained';
    } else if (daysAgo <= 15) {
      statusColor = 'bg-warning';
      statusText = 'Pending';
    } else {
      statusColor = 'bg-danger';
      statusText = 'Warning';
    }
  }

  // Fetch plants on mount
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/plants');
        setPlants(data);
        if (data.length > 0 && !selectedPlant) {
          setSelectedPlant(data[0].id);
        }
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
  }, []);

  // Fetch reports for selected plant with pagination
  useEffect(() => {
    if (!selectedPlant) return;
    setReports([]);
    setReportOffset(0);
    setHasMore(true);
    fetchMoreReports(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlant]);

  const fetchMoreReports = async (reset = false) => {
    if (!selectedPlant) return;
    setIsFetchingMore(true);
    try {
      const data = await apiFetch(`/reports/plant/${selectedPlant}?limit=${REPORTS_PAGE_SIZE}&offset=${reset ? 0 : reportOffset}`);
      if (reset) {
        setReports(data);
        setReportOffset(data.length);
      } else {
        setReports(prev => [...prev, ...data]);
        setReportOffset(prev => prev + data.length);
      }
      setHasMore(data.length === REPORTS_PAGE_SIZE);
    } catch (err) {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const currentPlant = plants.find(plant => plant.id === selectedPlant) || plants[0];

  // Build parameter history from reports
  const parameterKeys = reports.length > 0 ? Object.keys(reports[0]).filter(k =>
    [
      'raw_water_tds', 'permeate_water_tds', 'raw_water_ph', 'permeate_water_ph',
      'product_water_tds', 'product_water_flow', 'product_water_ph', 'reject_water_flow',
      'membrane_inlet_pressure', 'membrane_outlet_pressure', 'raw_water_inlet_pressure',
      'volts_amperes', 'chemical_refill_litres', 'cartridge_filter_replacement', 'membrane_replacement'
    ].includes(k)
  ) : [];

  const parameterLabels: Record<string, string> = {
    raw_water_tds: 'Raw Water TDS (ppm)',
    permeate_water_tds: 'Permeate Water TDS (ppm)',
    raw_water_ph: 'Raw Water pH',
    permeate_water_ph: 'Permeate Water pH',
    product_water_tds: 'Product Water TDS (ppm)',
    product_water_flow: 'Product Water Flow (LPH)',
    product_water_ph: 'Product Water pH',
    reject_water_flow: 'Reject Water Flow (LPH)',
    membrane_inlet_pressure: 'Membrane Inlet Pressure (PSI)',
    membrane_outlet_pressure: 'Membrane Outlet Pressure (PSI)',
    raw_water_inlet_pressure: 'Raw Water Inlet Pressure (PSI)',
    volts_amperes: 'Volts/Amperes',
    chemical_refill_litres: 'Chemical Refill (L)',
    cartridge_filter_replacement: 'Cartridge Filter Replacement',
    membrane_replacement: 'Membrane Replacement',
  };

  const allDates = reports.map(r => r.created_at).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Fix: Popover/plant selector should always be clickable
  const handlePlantSelect = (plantId: string) => {
    setSelectedPlant(plantId);
    setPlantSelectorOpen(false);
  };

  // Chart data: build from reports (fallback to empty if no data)
  const chartData = reports.length > 0 ? reports.map(r => ({
    date: new Date(r.created_at).toLocaleDateString(),
    flowRate: r.product_water_flow,
    tds: r.product_water_tds,
    inletPressure: r.membrane_inlet_pressure,
    outletPressure: r.membrane_outlet_pressure,
  })) : [];

  const getValueChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: '↗', color: 'text-success' };
    if (current < previous) return { icon: '↘', color: 'text-danger' };
    return { icon: '→', color: 'text-muted-foreground' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Historical performance data and parameter tracking
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            className="flex items-center gap-2"
          >
            <TableIcon className="h-4 w-4" />
            Historical Data
          </Button>
          <Button
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            onClick={() => setViewMode('chart')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Chart View
          </Button>
        </div>
      </div>

      {/* Plant Selector */}
      <Card>
        <CardContent className="p-4">
            <div className="flex items-center gap-4">
            <div className="space-y-2 w-full">
                <label className="text-sm font-medium text-muted-foreground">Select Plant</label>
              <Select
                value={selectedPlant}
                onValueChange={(value) => handlePlantSelect(value)}
                disabled={!hasPlants}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plant..." />
                </SelectTrigger>
                <SelectContent>
                  {safePlants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.address} ({plant.type?.toUpperCase?.() || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plant Information Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Droplets className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{safeCurrentPlant?.address}</h2>
                  <p className="text-muted-foreground">{safeCurrentPlant?.type?.toUpperCase()} Plant • {safeCurrentPlant?.capacity?.toLocaleString()} LPH</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{safeCurrentPlant?.address}</p>
                    <p className="text-xs text-muted-foreground">{safeCurrentPlant?.tehsil}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{safeCurrentPlant?.employee?.name || 'Unassigned'}</p>
                    <p className="text-xs text-muted-foreground">Assigned Employee</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{statusText}</p>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">
              {safeCurrentPlant?.type} System
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Parameter History
            </CardTitle>
            <CardDescription>
              Historical values for each parameter with timestamps and reporting details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              ref={scrollAreaRef}
              onScroll={handleScroll}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                maxWidth: '100%',
                minHeight: '16px',
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
              }}
            >
              <table style={{ minWidth: '2000px', tableLayout: 'fixed', borderCollapse: 'separate' }}>
                <thead>
                  <tr className="border-b-2">
                    <th style={{ minWidth: 200, position: 'sticky', left: 0, zIndex: 2, background: '#fff' }} className="font-semibold border-r">Parameter</th>
                    {reports.map((report) => {
                      const date = new Date(report.created_at);
                        return (
                        <th key={report.created_at} style={{ minWidth: 160 }} className="text-center border-l">
                          <div className="flex flex-col">
                            <span className="font-semibold">{date.toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {parameterKeys.map((paramKey) => (
                    <tr key={paramKey} className="hover:bg-muted/30">
                      <td style={{ minWidth: 200, position: 'sticky', left: 0, zIndex: 2, background: '#fff' }} className="font-medium border-r">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{parameterLabels[paramKey]}</span>
                        </div>
                      </td>
                      {reports.map((report) => (
                        <td key={report.created_at} style={{ minWidth: 160 }} className="text-center border-l relative group">
                          {report && report[paramKey] !== undefined ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="font-semibold text-foreground">
                                {report[paramKey]}
                                  </span>
                              {report.submitted_by && (
                                <div
                                  className="absolute left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-lg"
                                  style={{
                                    bottom: '-2.5rem',
                                    top: 'auto',
                                    marginTop: 0,
                                    marginBottom: 0,
                                    // If this is the last row, show above
                                    ...(paramKey === parameterKeys[parameterKeys.length - 1]
                                      ? { bottom: 'auto', top: '-2.5rem' }
                                      : {}),
                                  }}
                                >
                                  <div>Reported by: {report.submitted_by.name || 'Unknown'}</div>
                                </div>
                              )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isFetchingMore && (
                <div className="text-center py-2 text-muted-foreground">Loading more reports...</div>
              )}
              </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="line" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line" className="flex items-center gap-2" onClick={() => setViewMode('chart')}>
                <LineChart className="h-4 w-4" />
                Line Chart
              </TabsTrigger>
              <TabsTrigger value="bar" className="flex items-center gap-2" onClick={() => setViewMode('chart')}>
                <BarChart3 className="h-4 w-4" />
                Bar Chart
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="line" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Flow Rate & TDS Trends</CardTitle>
                    <CardDescription>Monthly performance tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="flowRate" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Flow Rate (LPH)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="tds" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={2}
                          name="TDS (ppm)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pressure Monitoring</CardTitle>
                    <CardDescription>Inlet vs Outlet pressure trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="inletPressure" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          name="Inlet Pressure (PSI)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="outletPressure" 
                          stroke="hsl(var(--warning))" 
                          strokeWidth={2}
                          name="Outlet Pressure (PSI)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="bar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Comparison</CardTitle>
                  <CardDescription>Monthly performance metrics comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="flowRate" fill="hsl(var(--primary))" name="Flow Rate (LPH)" />
                      <Bar dataKey="tds" fill="hsl(var(--accent))" name="TDS (ppm)" />
                      <Bar dataKey="inletPressure" fill="hsl(var(--success))" name="Inlet Pressure (PSI)" />
                      <Bar dataKey="outletPressure" fill="hsl(var(--warning))" name="Outlet Pressure (PSI)" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Analytics;