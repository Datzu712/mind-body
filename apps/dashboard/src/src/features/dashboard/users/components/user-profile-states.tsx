import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/** Loading placeholder mirroring the two-column layout of UserProfileDetail. */
export function UserProfileDetailSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card className="border-border bg-card h-fit">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Separator />
                    <div className="flex w-full flex-col gap-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </CardContent>
            </Card>
            <Card className="border-border bg-card">
                <CardContent className="flex flex-col gap-4 p-6">
                    <Skeleton className="h-5 w-40" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/** Centered state message for empty/error/not-found situations. */
export function UserProfileMessage({
    icon: Icon,
    title,
    description,
}: {
    icon: LucideIcon;
    title: string;
    description?: string;
}) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <Icon className="h-10 w-10 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                    <p className="font-medium text-foreground">{title}</p>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
