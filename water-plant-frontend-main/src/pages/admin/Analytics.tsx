import { useState } from 'react';
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

const Analytics = () => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [selectedPlant, setSelectedPlant] = useState('plant-1');
  const [plantSelectorOpen, setPlantSelectorOpen] = useState(false);

  // Mock plants data
  const plants = [
    {
      id: 'plant-1',
      name: 'RO Plant Alpha',
      location: 'Sector 15, Karachi',
      type: 'RO',
      capacity: '2000 LPH',
      assignedEmployee: 'John Doe',
      tehsil: 'Gulshan',
      coordinates: '24.8607° N, 67.0011° E',
      status: 'maintained'
    },
    {
      id: 'plant-2',
      name: 'UF Plant Beta',
      location: 'Block A, Lahore',
      type: 'UF',
      capacity: '1000 LPH',
      assignedEmployee: 'Jane Smith',
      tehsil: 'Model Town',
      coordinates: '31.5204° N, 74.3587° E',
      status: 'warning'
    },
    {
      id: 'plant-3',
      name: 'RO Plant Gamma',
      location: 'Industrial Area, Islamabad',
      type: 'RO',
      capacity: '500 LPH',
      assignedEmployee: 'Mike Johnson',
      tehsil: 'I-9',
      coordinates: '33.6844° N, 73.0479° E',
      status: 'pending'
    }
  ];

  // Get current plant data
  const currentPlant = plants.find(plant => plant.id === selectedPlant) || plants[0];

  // Mock historical data - plant-specific
  const getHistoricalDataForPlant = (plantId: string) => {
    const baseData = [
      {
        parameter: 'Flow Rate',
        unit: 'LPH',
        records: [
          { date: '2024-01-15', time: '14:30', value: 1250, reportedBy: 'John Doe' },
          { date: '2024-01-10', time: '09:15', value: 1180, reportedBy: 'Jane Smith' },
          { date: '2024-01-05', time: '16:45', value: 1220, reportedBy: 'Mike Johnson' },
          { date: '2024-01-01', time: '11:20', value: 1150, reportedBy: 'Sarah Wilson' },
          { date: '2023-12-28', time: '13:10', value: 1190, reportedBy: 'John Doe' },
          { date: '2023-12-25', time: '10:30', value: 1160, reportedBy: 'Jane Smith' }
        ]
      },
      {
        parameter: 'TDS',
        unit: 'ppm',
        records: [
          { date: '2024-01-15', time: '14:30', value: 42, reportedBy: 'John Doe' },
          { date: '2024-01-10', time: '09:15', value: 48, reportedBy: 'Jane Smith' },
          { date: '2024-01-05', time: '16:45', value: 45, reportedBy: 'Mike Johnson' },
          { date: '2024-01-01', time: '11:20', value: 52, reportedBy: 'Sarah Wilson' },
          { date: '2023-12-28', time: '13:10', value: 38, reportedBy: 'John Doe' },
          { date: '2023-12-25', time: '10:30', value: 44, reportedBy: 'Jane Smith' }
        ]
      },
      {
        parameter: 'Membrane Inlet Pressure',
        unit: 'PSI',
        records: [
          { date: '2024-01-15', time: '14:30', value: 185, reportedBy: 'John Doe' },
          { date: '2024-01-10', time: '09:15', value: 190, reportedBy: 'Jane Smith' },
          { date: '2024-01-05', time: '16:45', value: 188, reportedBy: 'Mike Johnson' },
          { date: '2024-01-01', time: '11:20', value: 192, reportedBy: 'Sarah Wilson' },
          { date: '2023-12-28', time: '13:10', value: 183, reportedBy: 'John Doe' },
          { date: '2023-12-25', time: '10:30', value: 187, reportedBy: 'Jane Smith' }
        ]
      },
      {
        parameter: 'Membrane Outlet Pressure',
        unit: 'PSI',
        records: [
          { date: '2024-01-15', time: '14:30', value: 95, reportedBy: 'John Doe' },
          { date: '2024-01-10', time: '09:15', value: 92, reportedBy: 'Jane Smith' },
          { date: '2024-01-05', time: '16:45', value: 94, reportedBy: 'Mike Johnson' },
          { date: '2024-01-01', time: '11:20', value: 89, reportedBy: 'Sarah Wilson' },
          { date: '2023-12-28', time: '13:10', value: 97, reportedBy: 'John Doe' },
          { date: '2023-12-25', time: '10:30', value: 91, reportedBy: 'Jane Smith' }
        ]
      }
    ];

    // Modify values slightly based on plant ID for variety
    if (plantId === 'plant-2') {
      baseData[0].records = baseData[0].records.map(r => ({ ...r, value: r.value * 0.5 })); // UF plant has lower flow
      baseData[1].records = baseData[1].records.map(r => ({ ...r, value: r.value + 5 })); // Slightly higher TDS
    } else if (plantId === 'plant-3') {
      baseData[0].records = baseData[0].records.map(r => ({ ...r, value: r.value * 0.25 })); // 500LPH plant
      baseData[2].records = baseData[2].records.map(r => ({ ...r, value: r.value - 10 })); // Lower pressure
    }

    return baseData;
  };

  const historicalData = getHistoricalDataForPlant(selectedPlant);

  // Mock chart data (kept for chart view)
  const chartData = [
    { month: 'Jan', flowRate: 1180, tds: 48, inletPressure: 190, outletPressure: 92 },
    { month: 'Feb', flowRate: 1220, tds: 45, inletPressure: 188, outletPressure: 94 },
    { month: 'Mar', flowRate: 1190, tds: 52, inletPressure: 192, outletPressure: 89 },
    { month: 'Apr', flowRate: 1250, tds: 42, inletPressure: 185, outletPressure: 95 },
    { month: 'May', flowRate: 1280, tds: 38, inletPressure: 183, outletPressure: 97 },
    { month: 'Jun', flowRate: 1250, tds: 42, inletPressure: 185, outletPressure: 95 }
  ];

  // Get all unique dates across all parameters and sort them (latest first)
  const getAllDates = () => {
    const allDates = new Set<string>();
    historicalData.forEach(param => {
      param.records.forEach(record => {
        allDates.add(`${record.date} ${record.time}`);
      });
    });
    return Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const allDates = getAllDates();

  // Create timeline data matrix
  const getTimelineData = () => {
    return historicalData.map(parameter => {
      const parameterData: any = {
        parameter: parameter.parameter,
        unit: parameter.unit,
        values: {}
      };
      
      // Map values to their corresponding dates
      parameter.records.forEach(record => {
        const dateKey = `${record.date} ${record.time}`;
        parameterData.values[dateKey] = {
          value: record.value,
          reportedBy: record.reportedBy
        };
      });
      
      return parameterData;
    });
  };

  const timelineData = getTimelineData();

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Select Plant</label>
                <Popover open={plantSelectorOpen} onOpenChange={setPlantSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={plantSelectorOpen}
                      className="w-[280px] justify-between mt-1"
                    >
                      {currentPlant.name}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Search plants..." />
                      <CommandEmpty>No plant found.</CommandEmpty>
                      <CommandGroup>
                        {plants.map((plant) => (
                          <CommandItem
                            key={plant.id}
                            value={plant.id}
                            onSelect={(currentValue) => {
                              setSelectedPlant(currentValue);
                              setPlantSelectorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedPlant === plant.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{plant.name}</span>
                              <span className="text-sm text-muted-foreground">{plant.location}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
                  <h2 className="text-2xl font-bold text-foreground">{currentPlant.name}</h2>
                  <p className="text-muted-foreground">{currentPlant.type} Plant • {currentPlant.capacity}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{currentPlant.location}</p>
                    <p className="text-xs text-muted-foreground">{currentPlant.tehsil}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{currentPlant.assignedEmployee}</p>
                    <p className="text-xs text-muted-foreground">Assigned Engineer</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      currentPlant.status === 'maintained' ? 'bg-success' :
                      currentPlant.status === 'warning' ? 'bg-warning' : 'bg-danger'
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{currentPlant.status}</p>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="capitalize">
              {currentPlant.type} System
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
            <ScrollArea className="w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="sticky left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-w-[200px] font-semibold">
                        Parameter
                      </TableHead>
                      {allDates.map((dateTime) => {
                        const [date, time] = dateTime.split(' ');
                        return (
                          <TableHead key={dateTime} className="text-center min-w-[140px] border-l">
                            <div className="flex flex-col">
                              <span className="font-semibold">{date}</span>
                              <span className="text-xs text-muted-foreground">{time}</span>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timelineData.map((paramData) => (
                      <TableRow key={paramData.parameter} className="hover:bg-muted/30">
                        <TableCell className="sticky left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 font-medium border-r">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{paramData.parameter}</span>
                            <span className="text-xs text-muted-foreground">({paramData.unit})</span>
                          </div>
                        </TableCell>
                        {allDates.map((dateTime, index) => {
                          const cellData = paramData.values[dateTime];
                          const nextDateTime = allDates[index + 1];
                          const nextCellData = nextDateTime ? paramData.values[nextDateTime] : null;
                          
                          return (
                            <TableCell key={dateTime} className="text-center border-l relative group">
                              {cellData ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="font-semibold text-foreground">
                                    {cellData.value}
                                  </span>
                                  {nextCellData && (
                                    <div className="flex items-center gap-1">
                                      {(() => {
                                        const indicator = getValueChangeIndicator(cellData.value, nextCellData.value);
                                        return (
                                          <span className={`text-xs ${indicator.color}`}>
                                            {indicator.icon}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  )}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-popover border rounded-md p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                                    <div>Reported by: {cellData.reportedBy}</div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="line" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Line Chart
              </TabsTrigger>
              <TabsTrigger value="bar" className="flex items-center gap-2">
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
                        <XAxis dataKey="month" />
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
                        <XAxis dataKey="month" />
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
                      <XAxis dataKey="month" />
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