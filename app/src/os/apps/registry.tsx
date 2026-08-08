import type { AppDefinition } from '../types/AppDefinition';
import { ConfigService } from '../services/ConfigService';
import { BooksApp } from '../../apps/books/BooksApp';
import { DriveApp } from '../../apps/drive/DriveApp';

export const installedApps: AppDefinition[] = [
    { ...ConfigService.getApp('drive'), component: DriveApp },
    { ...ConfigService.getApp('books'), component: BooksApp },
];
