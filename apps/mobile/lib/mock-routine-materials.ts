export interface RoutineMaterialMock {
    id: string;
    routineNameIncludes: string;
    title: string;
    type: string;
    size: string;
    url: string;
}

export const mockRoutineMaterials: RoutineMaterialMock[] = [
    {
        id: 'mat-pecho-triceps-tecnica',
        routineNameIncludes: 'pecho',
        title: 'Guia tecnica de empuje',
        type: 'PDF',
        size: '1.8 MiB',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
        id: 'mat-rutina-movilidad',
        routineNameIncludes: 'rutina',
        title: 'Movilidad previa',
        type: 'WEBP',
        size: '620 KiB',
        url: 'https://www.gstatic.com/webp/gallery/1.webp',
    },
];

export function getMockRoutineMaterials(routineName: string) {
    const normalized = routineName.toLowerCase();
    return mockRoutineMaterials.filter((item) => normalized.includes(item.routineNameIncludes));
}
