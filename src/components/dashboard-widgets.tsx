import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <Card className="shadow-sm border-muted/40 hover:shadow-md transition-all hover:border-sidebar-primary/50 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}

export function ActionItem({ title, desc, type }: any) {
    return (
        <div className={`p-3 border rounded-lg transition-colors ${type === 'urgent' ? 'bg-red-500/5 border-red-200 dark:border-red-900/30' : 'bg-muted/30 hover:bg-muted/50'}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{title}</h4>
                {type === 'urgent' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
    )
}
