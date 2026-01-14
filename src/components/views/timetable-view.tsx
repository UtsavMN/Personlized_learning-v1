'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Calendar, List, Trash2 } from 'lucide-react';
import { parseTimetableAction } from '@/ai/flows/parse-timetable';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const manualEntrySchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  subject: z.string().min(1, "Subject is required"),
  room: z.string().optional(),
  type: z.enum(['Lecture', 'Lab', 'Tutorial', 'Other']).default('Lecture'),
});

export function TimetableView() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Live query for timetable entries
  const schedule = useLiveQuery(() => db.timetable.toArray());

  // Checking if we have any data to determine default view
  const hasData = schedule && schedule.length > 0;
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<z.infer<typeof manualEntrySchema>>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      day: 'Monday',
      startTime: '',
      endTime: '',
      subject: '',
      room: '',
      type: 'Lecture',
    },
  });

  const onManualSubmit = async (data: z.infer<typeof manualEntrySchema>) => {
    try {
      await db.timetable.add({
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        subject: data.subject,
        room: data.room || '',
        type: data.type,
      });
      toast({ title: "Class Added!" });
      form.reset();
      setIsAddOpen(false);
    } catch (error) {
      toast({ title: "Error adding class", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;

        // 2. Send to AI
        const result = await parseTimetableAction({ timetableImageUri: base64 });

        // 3. Save to Dexie
        await db.timetable.clear(); // Clear old schedule first? Or append? User said "first remove content", so clear.
        await db.timetable.bulkAdd(result.entries.map(entry => ({
          ...entry,
          // Ensure types match interface if AI returns slightly different strings, but Zod content should be close
        })));

        toast({
          title: "Timetable Parsed!",
          description: `Successfully added ${result.entries.length} classes.`,
        });
      };
    } catch (error) {
      console.error(error);
      toast({
        title: "Error parsing timetable",
        description: "Could not extract data from the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear your timetable?")) {
      await db.timetable.clear();
      toast({ title: "Timetable cleared" });
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDay = format(new Date(), 'EEEE');

  if (!hasData && !isUploading) {
    return (
      <>
        <Card className="max-w-md mx-auto mt-10">
          <CardHeader>
            <CardTitle>Timetable</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center w-full hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <Label htmlFor="timetable-upload" className="cursor-pointer text-center">
                <span className="font-semibold text-primary">Click to upload</span> an image
                <Input
                  id="timetable-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </Label>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG supported</p>
            </div>

            <div className="flex items-center w-full gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground font-medium uppercase">Or</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <Button variant="outline" className="w-full" onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Class Manually
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Class Manually</DialogTitle>
              <DialogDescription>Enter the details of your class.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onManualSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek && daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Lecture">Lecture</SelectItem>
                            <SelectItem value="Lab">Lab</SelectItem>
                            <SelectItem value="Tutorial">Tutorial</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Class</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-semibold">Analyzing Timetable...</h3>
        <p className="text-muted-foreground">This may take a few moments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">My Timetable</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Class
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" className="w-full flex-1 flex flex-col">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="daily">
              <List className="h-4 w-4 mr-2" /> Daily View
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Calendar className="h-4 w-4 mr-2" /> Weekly View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>{currentDay}'s Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule?.filter(s => s.day === currentDay).length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No classes scheduled for today.</p>
              ) : (
                <div className="space-y-4">
                  {schedule?.filter(s => s.day === currentDay)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((cls, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded text-sm">
                            {cls.startTime}
                          </div>
                          <div>
                            <h4 className="font-semibold">{cls.subject}</h4>
                            <p className="text-sm text-muted-foreground">{cls.type} • {cls.room}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {daysOfWeek.map(day => {
              const classes = schedule?.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (!classes?.length) return null;

              return (
                <Card key={day} className="flex flex-col">
                  <CardHeader className="py-3 bg-muted/50">
                    <CardTitle className="text-base">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex-1">
                    <ul className="space-y-3">
                      {classes.map((cls, j) => (
                        <li key={j} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                          <div className="font-medium text-primary">{cls.startTime} - {cls.endTime}</div>
                          <div className="font-semibold">{cls.subject}</div>
                          <div className="text-xs text-muted-foreground">{cls.room}</div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class Manually</DialogTitle>
            <DialogDescription>Enter the details of your class.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onManualSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Lecture">Lecture</SelectItem>
                          <SelectItem value="Lab">Lab</SelectItem>
                          <SelectItem value="Tutorial">Tutorial</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">Save Class</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
