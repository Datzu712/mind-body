import { MeasurementsSection } from './measurements-section';
import { ActivitySection } from './activity-section';

/**
 * Read-only "Progreso" tab for a member's profile: body measurements followed by
 * general activity. Each section fetches and renders independently (own empty/loading
 * states), so a member with measurements but no activity (or vice versa) still works.
 */
export function MemberProgressTab({ userId }: { userId: string }) {
    return (
        <div className="flex flex-col gap-3">
            <MeasurementsSection userId={userId} />
            <ActivitySection userId={userId} />
        </div>
    );
}
