import { createFileRoute } from '@tanstack/react-router';
import { sileo } from 'sileo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, UserRound } from 'lucide-react';

export const Route = createFileRoute('/playground')({
    component: PlaygroundPage,
});

const options = [
    {
        name: 'A) Warning / Amber',
        card: 'border-warning/40 bg-warning/[0.04] shadow-sm shadow-warning/10',
        badge: 'border-warning/30 bg-warning/10 text-warning',
    },
    {
        name: 'B) Primary / Gold (actual)',
        card: 'border-primary/40 bg-primary/[0.02] shadow-sm shadow-primary/10',
        badge: 'border-primary/30 bg-primary/10 text-primary',
    },
    {
        name: 'C) Muted / Gris sutil',
        card: 'border-muted-foreground/30 bg-muted/30 shadow-sm',
        badge: 'border-muted-foreground/30 bg-muted text-muted-foreground',
    },
    {
        name: 'D) Chart-2 / Dorado fuerte',
        card: 'border-chart-2/40 bg-chart-2/[0.04] shadow-sm shadow-chart-2/10',
        badge: 'border-chart-2/30 bg-chart-2/10 text-chart-2',
    },
    {
        name: 'E) Success / Verde',
        card: 'border-success/40 bg-success/[0.04] shadow-sm shadow-success/10',
        badge: 'border-success/30 bg-success/10 text-success',
    },
    {
        name: 'F) Destructive / Rojo suave',
        card: 'border-destructive/30 bg-destructive/[0.03] shadow-sm shadow-destructive/10',
        badge: 'border-destructive/30 bg-destructive/10 text-destructive',
    },
];

function PlaygroundPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Opciones de estilo: Modo Edicion</h1>
                    <p className="text-muted-foreground">
                        Compara como se ve cada opcion de color para el estado de edicion.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {options.map((opt) => (
                        <div key={opt.name} className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{opt.name}</p>
                            <Card className={`transition-all duration-300 ${opt.card}`}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-foreground text-base">
                                        <UserRound className="h-5 w-5" />
                                        Informacion personal
                                    </CardTitle>
                                    <Badge variant="outline" className={`text-xs ${opt.badge}`}>
                                        Editando
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 grid-cols-2">
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-muted-foreground text-xs">Fecha de nacimiento</Label>
                                            <Input
                                                defaultValue="1995-06-15"
                                                className="bg-secondary/50 border-border"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-muted-foreground text-xs">Contacto emergencia</Label>
                                            <Input
                                                defaultValue="Jose Gomez"
                                                className="bg-secondary/50 border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <Button type="button" size="sm">
                                            <Save className="mr-2 h-4 w-4" />
                                            Guardar cambios
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Original toasts section */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Sileo Toasts</h2>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() =>
                                sileo.success({
                                    title: 'Operacion exitosa',
                                    description: 'Los cambios se guardaron correctamente.',
                                })
                            }
                        >
                            Success
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                sileo.error({
                                    title: 'Algo salio mal',
                                    description: 'No se pudo completar la operacion.',
                                })
                            }
                        >
                            Error
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
