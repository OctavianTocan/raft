import type { PRDetails, PRPanelData } from "./types"
import { getCachedPRDetails, cachePRDetails, getCachedPRPanelData, cachePRPanelData } from "./db"

export class PRCache {
  // In-memory backing for immediate synchronous reads during renders
  private details = new Map<string, PRDetails>()
  private panelData = new Map<string, PRPanelData>()

  getDetails(url: string): PRDetails | undefined {
    if (this.details.has(url)) return this.details.get(url);
    const fromDb = getCachedPRDetails(url);
    if (fromDb) {
      this.details.set(url, fromDb);
      return fromDb;
    }
    return undefined;
  }

  setDetails(url: string, data: PRDetails): void {
    this.details.set(url, data);
    cachePRDetails(url, data);
  }

  hasDetails(url: string): boolean {
    return this.details.has(url) || getCachedPRDetails(url) !== null;
  }

  getPanelData(url: string): PRPanelData | undefined {
    if (this.panelData.has(url)) return this.panelData.get(url);
    const fromDb = getCachedPRPanelData(url);
    if (fromDb) {
      this.panelData.set(url, fromDb);
      return fromDb;
    }
    return undefined;
  }

  setPanelData(url: string, data: PRPanelData): void {
    this.panelData.set(url, data);
    cachePRPanelData(url, data);
  }

  hasPanelData(url: string): boolean {
    return this.panelData.has(url) || getCachedPRPanelData(url) !== null;
  }
}
