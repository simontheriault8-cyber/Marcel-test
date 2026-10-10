import unitsJson from "./units-list.json";

export interface UnitSession {
  id: string;
  uic: string;
  abbrevCFR: string;
  officialName: string;
  addressHtml: string;
  addressPlain: string;
}

export const UNITS_LIST: UnitSession[] = unitsJson as UnitSession[];
