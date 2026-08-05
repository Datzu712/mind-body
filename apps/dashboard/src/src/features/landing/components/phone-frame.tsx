import { ImagePlaceholder } from './image-placeholder';

/**
 * The member app, as a device outline with the screen left blank. The chassis
 * still says "there is a phone app"; the screen does not invent classes,
 * trainers and step counts that no gym ever had.
 */
export function PhoneFrame() {
    return (
        <div className="w-[272px] shrink-0 rounded-[2.75rem] border border-white/10 bg-[#141416] p-2.5 shadow-[0_40px_90px_-40px_oklch(0_0_0/90%)]">
            {/* #0A0A0A is the member app's background token (apps/mobile/constants/theme.ts). */}
            <div className="overflow-hidden rounded-[2.15rem] bg-[#0A0A0A]">
                <ImagePlaceholder className="h-[556px]" label="App del miembro" />
            </div>
        </div>
    );
}
