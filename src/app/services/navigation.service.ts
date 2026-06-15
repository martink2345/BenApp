import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';


@Injectable({ providedIn: 'root' })
export class NavigationService {
  async navigateTo(lat: number, lng: number, label?: string): Promise<void> {
    const platform = Capacitor.getPlatform();
    const name = label ? encodeURIComponent(label) : '';
    let url: string;

    if (platform === 'android') {
      // samotné geo:lat,long jen vycentruje.
      url = `geo:${lat},${lng}?q=${lat},${lng}(${name})`;
    } else if (platform === 'ios') {
      url = `https://maps.apple.com/?daddr=${lat},${lng}&q=${name}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    try {
      await AppLauncher.openUrl({ url });
    } catch {
      const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(platform === 'web' ? url : web, '_system');
    }
  }
}
