import {
  getTimetableAction,
  addTimetableItemAction,
  deleteTimetableItemAction,
  getTimetableMetaAction,
  updateTimetableMetaAction,
  clearTimetableAction
} from "@/app/actions/study";
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Calendar, List, Trash2, Plus, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDelete } from '@/hooks/use-delete';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Progress } from '@/components/ui/progress';

const manualEntrySchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  subject: z.string().min(1, "Subject is required"),
  room: z.string().optional(),
  type: z.enum(['Lecture', 'Lab', 'Tutorial', 'Other']).default('Lecture'),
});

export function TimetableView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  /* 
     NOTE: Disabling AI OCR for now as per user request (Pivot to Manual + Image Reference)
     We will keep the 'isUploading' state for the image save process, just removal of Tesseract + LLM calls.
  */
  const [isUploading, setIsUploading] = useState(false);
  // const [progressValue, setProgressValue] = useState(0);
  // const [statusMessage, setStatusMessage] = useState("");
  const { toast } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [timetableMeta, setTimetableMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshTimetable = async () => {
    const sRes = await getTimetableAction();
    if (sRes.success) setSchedule(sRes.items);

    const mRes = await getTimetableMetaAction();
    if (mRes.success) setTimetableMeta(mRes.meta);

    setLoading(false);
  };

  useEffect(() => {
    refreshTimetable();
  }, []);

  // Sync imageSrc with DB data (Base64)
  useEffect(() => {
    if (timetableMeta?.imageBase64) {
      setImageSrc(timetableMeta.imageBase64);
    } else {
      setImageSrc(null);
    }
  }, [timetableMeta]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const form = useForm<z.infer<typeof manualEntrySchema>>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      type: 'Lecture',
    }
  });

  const onManualSubmit = async (values: z.infer<typeof manualEntrySchema>) => {
    const res = await addTimetableItemAction(values);
    if (res.success) {
      setIsAddOpen(false);
      toast({ title: "Class added successfully" });
      form.reset();
      refreshTimetable();
    }
  };

  // Helper to extract progress percentage from WebLLM messages
  const extractProgress = (msg: string) => {
    // WebLLM messages often look like "Fetch param cache [15/30MB]" or similar
    // Heuristic: If "Initializing", set 10%. If "Fetch", calculate range 20-80%.
    if (msg.includes("Initializing")) return 10;
    if (msg.includes("Fetching param cache")) return 30; // Static estimate if regex fails
    if (msg.includes("Loading model")) return 60;
    if (msg.includes("Parsing schedule")) return 90;
    return 0;
  };

  /* 
     LOCAL AI IMPLEMENTATION: TIMETABLE OCR 
     Using Tesseract.js to process images entirely in the browser.
  */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // setProgressValue(0);
    // setStatusMessage("Saving image...");

    try {
      // Convert to Base64 for robust storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const res = await updateTimetableMetaAction({ imageBase64: base64String });
        if (res.success) {
          toast({
            title: "Schedule Image Saved",
            description: "Your timetable reference has been updated.",
          });
          refreshTimetable();
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error(error);
      toast({ title: "Error saving image", variant: "destructive" });
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear your timetable and remove the image?")) {
      const res = await clearTimetableAction();
      if (res.success) {
        toast({ title: "Timetable cleared" });
        refreshTimetable();
      }
    }
  };

  const { deleteItem } = useDelete();

  const handleDeleteClass = (id?: number) => {
    if (!id) return;
    deleteItem(
      async () => {
        const res = await deleteTimetableItemAction(id);
        if (res.success) {
          refreshTimetable();
        }
      },
      { successMessage: "Class removed" }
    );
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDay = format(new Date(), 'EEEE');

  // ... (render logic)

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 px-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-center space-y-2 w-full max-w-md">
          <h3 className="text-xl font-semibold">Saving Image...</h3>
          <p className="text-muted-foreground text-sm">Please wait while we update your reference.</p>
        </div>
      </div>
    );
  }
  // ...

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">My Timetable</h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload Image
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Class
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>



      {
        (timetableMeta?.imageBase64 || timetableMeta?.imageBlob) ? (
          <div className="relative">
            <Card className="overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-primary/10">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Reference Schedule</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt="Timetable Reference"
                      className="w-full max-h-[500px] object-contain rounded-md border bg-white/50 dark:bg-black/50 backdrop-blur"
                    />
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsFullScreen(true)} className="gap-2">
                  <Maximize2 className="w-4 h-4" /> View Full Image
                </Button>
              </CardFooter>
            </Card>

            {/* Full Screen Modal Overlay */}
            {isFullScreen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsFullScreen(false)}>
                <div className="relative max-w-5xl max-h-screen w-full flex flex-col items-center">
                  <div className="absolute -top-14 right-0 flex gap-2">
                    <Button
                      variant="secondary"
                      className="rounded-full bg-white/10 hover:bg-white/20 text-white gap-2"
                      onClick={() => setIsFullScreen(false)}
                    >
                      <X className="w-4 h-4" /> Close
                    </Button>
                  </div>

                  {imageSrc && (
                    <img
                      src={imageSrc}
                      alt="Full Timetable"
                      className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain bg-black"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 gap-2 hover:bg-muted/10 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-8 h-8 opacity-50" />
            <p className="font-medium">Upload Manual Schedule Image</p>
            <p className="text-xs">Keeps your reference handy while you study</p>
          </div>
        )
      }

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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                        <li key={j} className="text-sm border-b last:border-0 pb-2 last:pb-0 flex justify-between items-start group">
                          <div>
                            <div className="font-medium text-primary">{cls.startTime} - {cls.endTime}</div>
                            <div className="font-semibold">{cls.subject}</div>
                            <div className="text-xs text-muted-foreground">{cls.room}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClass(cls.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
    </div >
  );
}
