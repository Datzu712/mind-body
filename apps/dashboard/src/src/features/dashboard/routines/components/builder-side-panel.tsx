import { type ReactNode } from 'react';
import { BookOpen, ChevronsRight, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ForgePanel } from './forge-panel';
import type { ForgeChat } from '../use-forge-chat';

export type BuilderPanelTab = 'forge' | 'library';

interface BuilderSidePanelProps {
    tab: BuilderPanelTab;
    onTabChange: (tab: BuilderPanelTab) => void;
    chat: ForgeChat;
    /** ExerciseLibrary ya configurada (con su botón "+" por card). */
    library: ReactNode;
    /** Presente solo en el dock de desktop; el Sheet usa su propio cierre. */
    onCollapse?: () => void;
}

/** Panel lateral único del builder: un solo espacio que alterna entre Forge
 *  y la biblioteca — nunca hay tres paneles a la vez. */
export function BuilderSidePanel({ tab, onTabChange, chat, library, onCollapse }: BuilderSidePanelProps) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex shrink-0 items-center gap-1 border-b border-border p-2">
                <div className="grid flex-1 grid-cols-2 gap-1">
                    <Button
                        size="sm"
                        variant={tab === 'forge' ? 'secondary' : 'ghost'}
                        onClick={() => onTabChange('forge')}
                    >
                        <Sparkles className="h-4 w-4" /> Forge
                    </Button>
                    <Button
                        size="sm"
                        variant={tab === 'library' ? 'secondary' : 'ghost'}
                        onClick={() => onTabChange('library')}
                    >
                        <BookOpen className="h-4 w-4" /> Biblioteca
                    </Button>
                </div>
                {onCollapse && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={onCollapse}
                        aria-label="Colapsar panel"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {tab === 'forge' ? (
                <div className="min-h-0 flex-1">
                    <ForgePanel chat={chat} />
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto p-3">{library}</div>
            )}
        </div>
    );
}

/** Riel de iconos cuando el panel está colapsado: un clic abre el tab elegido. */
export function BuilderPanelRail({ onOpen }: { onOpen: (tab: BuilderPanelTab) => void }) {
    return (
        <div className="flex h-full flex-col items-center gap-1 rounded-lg border border-border bg-card/50 p-1.5">
            <Button size="icon" variant="ghost" onClick={() => onOpen('forge')} aria-label="Abrir Forge">
                <Sparkles className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onOpen('library')} aria-label="Abrir biblioteca">
                <BookOpen className="h-4 w-4" />
            </Button>
        </div>
    );
}
