const { withAndroidManifest } = require('expo/config-plugins');

const HEALTH_PERMISSIONS = [
    'android.permission.health.READ_STEPS',
    'android.permission.health.WRITE_STEPS',
    'android.permission.health.READ_DISTANCE',
    'android.permission.health.READ_TOTAL_CALORIES_BURNED',
    'android.permission.health.READ_HEART_RATE',
    'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
    'android.permission.health.READ_EXERCISE',
    'android.permission.health.WRITE_EXERCISE',
    'android.permission.health.WRITE_TOTAL_CALORIES_BURNED',
    'android.permission.health.WRITE_DISTANCE',
    'android.permission.health.READ_WEIGHT',
    'android.permission.health.READ_BODY_FAT',
    'android.permission.health.WRITE_WEIGHT',
    'android.permission.health.WRITE_BODY_FAT',
];

module.exports = function withHealthPermissions(config) {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults.manifest;

        if (!manifest['uses-permission']) {
            manifest['uses-permission'] = [];
        }

        const existing = new Set(manifest['uses-permission'].map((p) => p.$['android:name']));

        for (const perm of HEALTH_PERMISSIONS) {
            if (!existing.has(perm)) {
                manifest['uses-permission'].push({ $: { 'android:name': perm } });
            }
        }

        return config;
    });
};
