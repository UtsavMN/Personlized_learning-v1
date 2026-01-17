import { Card, CardContent } from "@/components/ui/card";

// StatsCard Component
export interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend: string;
}

export function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
