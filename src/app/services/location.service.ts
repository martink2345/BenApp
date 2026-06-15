import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface UserPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
  Poloha uživatele přes Capacitor Geolocation (na Androidu nativní GPS (cap.)).
  V prohlížeči Geolocation API prohlížeče.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  async getCurrent(): Promise<UserPosition | null> {
    try {
      if (!(await this.ensurePermission())) return null;
      const pos: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      });
      return this.toUserPosition(pos);
    } catch {
      return null;
    }
  }

  async watch(callback: (p: UserPosition) => void): Promise<string | null> {
    try {
      if (!(await this.ensurePermission())) return null;
      return await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 20000 },
        (pos, err) => {
          if (err || !pos) return;
          callback(this.toUserPosition(pos));
        },
      );
    } catch {
      return null;
    }
  }

  async clearWatch(id: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id });
    } catch {
      /* noop */
    }
  }

  private async ensurePermission(): Promise<boolean> {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      }
      return perm.location === 'granted' || perm.coarseLocation === 'granted';
    } catch {
      // Na webu checkPermissions nemusí být podporováno – zkusíme rovnou číst polohu.
      return true;
    }
  }

  private toUserPosition(pos: Position): UserPosition {
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy ?? 0,
    };
  }
}
