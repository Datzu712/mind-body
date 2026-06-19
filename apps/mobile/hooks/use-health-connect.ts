import { useCallback, useEffect, useState } from 'react';
import { initialize, requestPermission, getGrantedPermissions } from 'react-native-health-connect';

const PERMISSIONS = [
    { accessType: 'read' as const, recordType: 'Steps' as const },
    { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
    { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
    { accessType: 'read' as const, recordType: 'Weight' as const },
    { accessType: 'read' as const, recordType: 'BodyFat' as const },
    { accessType: 'write' as const, recordType: 'Weight' as const },
    { accessType: 'write' as const, recordType: 'BodyFat' as const },
];

export function useHealthConnect() {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const ok = await initialize();
                if (!ok) {
                    setIsLoading(false);
                    return;
                }
                const granted = await getGrantedPermissions();
                setIsConnected(granted.length > 0);
            } catch {
                // Health Connect not available
            }
            setIsLoading(false);
        })();
    }, []);

    const connect = useCallback(async () => {
        setIsLoading(true);
        try {
            const ok = await initialize();
            if (!ok) {
                setIsLoading(false);
                return;
            }
            const granted = await requestPermission(PERMISSIONS);
            setIsConnected(granted.length > 0);
        } catch {
            // permission denied or HC unavailable
        }
        setIsLoading(false);
    }, []);

    return { isConnected, isLoading, connect };
}
