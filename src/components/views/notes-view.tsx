'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, NoteEntry } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, MoreVertical, Trash2, Palette, Tag, PenLine, StickyNote, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
    { name: 'Default', value: 'bg-card' },
    { name: 'Red', value: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20' },
    { name: 'Orange', value: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/20' },
    { name: 'Yellow', value: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/20' },
    { name: 'Green', value: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20' },
    { name: 'Blue', value: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20' },
    { name: 'Purple', value: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/20' },
    { name: 'Pink', value: 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-900/20' },
];

export function NotesView() {
    const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray());
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Editor State
    const [editingNote, setEditingNote] = useState<NoteEntry | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [subject, setSubject] = useState('');

    const filteredNotes = notes?.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async () => {
        if (!title.trim() && !content.trim()) return;

        const noteData = {
            title,
            content,
            subject: subject || 'General',
            color: selectedColor,
            updatedAt: new Date(),
            createdAt: editingNote ? editingNote.createdAt : new Date(),
        };

        if (editingNote && editingNote.id) {
            await db.notes.update(editingNote.id, noteData);
        } else {
            await db.notes.add(noteData as NoteEntry);
        }

        handleClose();
    };

    const handleClose = () => {
        setIsCreateOpen(false);
        setEditingNote(null);
        setTitle('');
        setContent('');
        setSubject('');
        setSelectedColor(COLORS[0].value);
    };

    const handleEdit = (note: NoteEntry) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setSubject(note.subject);
        setSelectedColor(note.color || COLORS[0].value);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id?: number) => {
        if (id) await db.notes.delete(id);
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
                    <p className="text-muted-foreground">Capture ideas, summaries, and quick thoughts.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            className="pl-9 bg-card"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Create Bar (Like Google Keep) */}
            <div className="w-full max-w-2xl mx-auto">
                <div
                    className="bg-card border shadow-sm rounded-lg p-3 cursor-text text-muted-foreground flex items-center gap-2 hover:shadow-md transition-shadow"
                    onClick={() => { setIsCreateOpen(true); }}
                >
                    <Plus className="w-5 h-5 mx-2" />
                    <span className="font-medium">Take a note...</span>
                </div>
            </div>

            {/* Notes Grid */}
            <ScrollArea className="flex-1 -mx-4 px-4">
                {filteredNotes && filteredNotes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <StickyNote className="w-12 h-12 mb-4 opacity-20" />
                        <p>No notes found.</p>
                    </div>
                )}

                <div className={viewMode === 'grid' ? "columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4" : "flex flex-col gap-3 max-w-3xl mx-auto"}>
                    <AnimatePresence>
                        {filteredNotes?.map(note => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`break-inside-avoid-column rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${note.color} ${viewMode === 'grid' ? 'mb-4' : ''}`}
                                onClick={() => handleEdit(note)}
                            >
                                <div className="mb-2 flex justify-between items-start">
                                    <h3 className="font-semibold text-lg leading-tight">{note.title || (<span className="text-muted-foreground italic">Untitled</span>)}</h3>
                                    {note.subject && <Badge variant="secondary" className="text-[10px] h-5 opacity-70">{note.subject}</Badge>}
                                </div>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-[10]">{note.content}</p>

                                <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-muted-foreground">{format(note.updatedAt, 'MMM d')}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </ScrollArea>

            {/* Edit/Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) handleSave(); }}>
                <DialogContent className={`sm:max-w-xl p-0 overflow-hidden gap-0 border-0 shadow-2xl ${selectedColor} transition-colors duration-300`}>
                    <DialogTitle className="sr-only">Edit Note</DialogTitle>
                    <div className="p-6 flex flex-col gap-4">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0 bg-transparent placeholder:text-muted-foreground/50"
                        />
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Take a note..."
                            className="min-h-[200px] resize-none border-none shadow-none focus-visible:ring-0 px-0 bg-transparent text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="p-4 bg-background/50 backdrop-blur-sm border-t flex justify-between items-center">
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                        <Palette className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <div className="grid grid-cols-4 gap-2 p-2">
                                        {COLORS.map(c => (
                                            <div
                                                key={c.name}
                                                className={`w-8 h-8 rounded-full border cursor-pointer hover:scale-110 transition-transform ${c.value.split(' ')[0]}`}
                                                title={c.name}
                                                onClick={() => setSelectedColor(c.value)}
                                            />
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                        <Tag className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40">
                                    {['General', 'Math', 'Physics', 'Chemistry', 'CS', 'Ideas'].map(s => (
                                        <DropdownMenuItem key={s} onClick={() => setSubject(s)}>
                                            {s}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {subject && <Badge variant="outline" className="ml-2">{subject}</Badge>}
                        </div>


                        <Button onClick={handleSave} variant="ghost" className="font-semibold">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
