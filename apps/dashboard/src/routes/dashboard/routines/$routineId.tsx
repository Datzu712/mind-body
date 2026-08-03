import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import type { PanelImperativeHandle } from 'react-resizable-panels';

import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { ExerciseDetailSheet } from '@/src/features/dashboard/exercises/components/exercise-detail-sheet';
import { ExerciseLibrary } from '@/src/features/dashboard/exercises/components/exercise-library';
import { RoutineEditor } from '@/src/features/dashboard/routines/components/routine-editor';
import {
    BuilderPanelRail,
    BuilderSidePanel,
    type BuilderPanelTab,
} from '@/src/features/dashboard/routines/components/builder-side-panel';
import { useAddExercise, useRoutine } from '@/src/features/dashboard/routines/hooks';
import { useForgeChat } from '@/src/features/dashboard/routines/use-forge-chat';
import { ForgeOrb } from '@/src/features/dashboard/routines/components/forge-orb';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, Plus } from 'lucide-react';

export const Route = createFileRoute('/dashboard/routines/$routineId')({
    component: RoutineBuilderPage,
});

/** El builder cambia de árbol (PanelGroup vs Sheet) según el ancho real. */
function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
    useEffect(() => {
        const mql = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setIsDesktop(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    return isDesktop;
}

function RoutineBuilderPage() {
    const { routineId = '' }: { routineId: string } = Route.useParams();
    const navigate = useNavigate();
    const { data: routine, isLoading, error } = useRoutine(routineId);
    const addExercise = useAddExercise(routineId);
    const chat = useForgeChat(routineId);
    const isDesktop = useIsDesktop();

    const [panelTab, setPanelTab] = useState<BuilderPanelTab>('forge');
    const [panelCollapsed, setPanelCollapsed] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null);
    const panelRef = useRef<PanelImperativeHandle | null>(null);

    useEffect(() => {
        if (error) {
            sileo.error({ title: 'Rutina no encontrada', description: error.message });
            void navigate({ to: '/dashboard/routines' });
        }
    }, [error, navigate]);

    if (isLoading || !routine) {
        return (
            <>
                <DashboardHeader
                    breadcrumbs={[
                        { label: 'Inicio', href: '/dashboard' },
                        { label: 'Rutinas', href: '/dashboard/routines' },
                        { label: 'Rutina' },
                    ]}
                />
                <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Cargando rutina...
                </div>
            </>
        );
    }

    const libraryNode = (
        <ExerciseLibrary
            onExerciseClick={(exercise) => setDetailExerciseId(exercise.id)}
            renderCardAction={(exercise) => (
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 transition-transform active:scale-90"
                    aria-label={`Agregar ${exercise.name}`}
                    disabled={chat.isStreaming || addExercise.isPending}
                    onClick={() => {
                        addExercise
                            .mutateAsync({ exerciseId: exercise.id })
                            .catch((e: Error) => sileo.error({ title: 'No se pudo agregar', description: e.message }));
                    }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            )}
        />
    );

    const editorNode = (
        <div className="relative h-full min-h-0">
            <RoutineEditor routine={routine} disabled={chat.isStreaming} onShowDetail={setDetailExerciseId} />

            {/* Lock de UI: mientras Forge edita, el editor queda bloqueado.
                Se libera en el finally del stream (use-forge-chat). */}
            {chat.isStreaming && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
                        <ForgeOrb state="working" size={20} aria-label="Forge trabajando" />
                        <span className="text-sm text-foreground">Forge está forjando la rutina…</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Inicio', href: '/dashboard' },
                    { label: 'Rutinas', href: '/dashboard/routines' },
                    { label: routine.name },
                ]}
            />
            {/* Altura fija (viewport - header h-16): el scroll vive DENTRO de
                cada zona, la página nunca crece verticalmente. */}
            <div className="h-[calc(100dvh-4rem)] overflow-hidden p-4">
                {isDesktop ? (
                    <ResizablePanelGroup className="h-full">
                        <ResizablePanel minSize="480px">
                            <div className="h-full pr-3">{editorNode}</div>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        {/* Redimensionable arrastrando; mínimo fijo de 360px para
                            que el contenido nunca quede aplastado. Arrastrar por
                            debajo del mínimo colapsa al riel de iconos. */}
                        <ResizablePanel
                            panelRef={panelRef}
                            defaultSize="400px"
                            minSize="360px"
                            maxSize="640px"
                            collapsible
                            collapsedSize="52px"
                            onResize={(size) => setPanelCollapsed(size.inPixels < 100)}
                        >
                            <div className="h-full pl-3">
                                {panelCollapsed ? (
                                    <BuilderPanelRail
                                        onOpen={(tab) => {
                                            setPanelTab(tab);
                                            panelRef.current?.expand();
                                        }}
                                    />
                                ) : (
                                    <div className="h-full rounded-lg border border-border bg-card/50">
                                        <BuilderSidePanel
                                            tab={panelTab}
                                            onTabChange={setPanelTab}
                                            chat={chat}
                                            library={libraryNode}
                                            onCollapse={() => panelRef.current?.collapse()}
                                        />
                                    </div>
                                )}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <>
                        {editorNode}
                        {/* Botón flotante que abre el mismo panel como Sheet */}
                        <Button
                            className="fixed bottom-6 right-6 z-20 h-12 gap-2 rounded-full shadow-lg"
                            onClick={() => setSheetOpen(true)}
                        >
                            <ForgeOrb state={chat.isStreaming ? 'working' : 'listening'} size={20} />
                            Forge
                        </Button>
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Panel del builder</SheetTitle>
                                </SheetHeader>
                                <BuilderSidePanel
                                    tab={panelTab}
                                    onTabChange={setPanelTab}
                                    chat={chat}
                                    library={libraryNode}
                                />
                            </SheetContent>
                        </Sheet>
                    </>
                )}
            </div>

            {/* Detalle del ejercicio (GIF + instrucciones): click en una card de
                la biblioteca o en un ejercicio de la rutina */}
            <ExerciseDetailSheet
                exerciseId={detailExerciseId}
                onOpenChange={(open) => !open && setDetailExerciseId(null)}
            />
        </>
    );
}
