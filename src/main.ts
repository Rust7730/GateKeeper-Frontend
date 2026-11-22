import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { adoptPreferencesFromUrl } from './app/features/overview/preferences-sync';

// Preferencias que llegan desde la landing (?tema=…): se guardan antes de arrancar.
adoptPreferencesFromUrl();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
