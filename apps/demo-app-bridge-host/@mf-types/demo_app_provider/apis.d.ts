
    export type RemoteKeys = 'demo_app_provider/export-app';
    type PackageType<T> = T extends 'demo_app_provider/export-app' ? typeof import('demo_app_provider/export-app') :any;