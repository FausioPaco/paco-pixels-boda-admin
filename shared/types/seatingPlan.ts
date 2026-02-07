export type SeatingPlanItemType =
  | 'Palco'
  | 'DJ'
  | 'Pista'
  | 'Buffet'
  | 'Entrada'
  | 'Parede'
  | 'Saida'
  | 'Drinks'
  | 'Mesa de Honra'
  | 'Bolo'
  | 'Bar'
  | 'Presentes'
  | 'Generic';

export type DeskShape = 'round' | 'rect';

export type DeskLayout = {
  id?: number;
  seatingPlanId?: number;
  deskId: number;
  x: number;
  y: number;
  rotation: number;
  shape: DeskShape;
  width: number;
  height: number;
  locked: boolean;
  modified_At?: Date;
};

export type SeatingPlanItem = {
  id: number;
  seatingPlanId: number;
  type: SeatingPlanItemType;
  label?: string | null;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  created_At: Date;
  modified_At: Date;
};

export type SeatingPlan = {
  id: number;
  eventId: number;
  canvasWidth: number;
  canvasHeight: number;
  version: number;
  created_At: Date;
  modified_At: Date;
  deskLayouts: DeskLayout[];
  items: SeatingPlanItem[];
};

export type UpdateSeatingPlanCanvas = {
  canvasWidth: number;
  canvasHeight: number;
};

export type UpsertDeskLayout = {
  x: number;
  y: number;
  rotation: number;
  shape: DeskShape;
  width: number;
  height: number;
  locked: boolean;
};

export type UpsertSeatingPlanItem = {
  type: SeatingPlanItemType;
  label?: string | null;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
};

export type SeatOccupancy = {
  kind: 'start' | 'cont';
  guestId: number;
  guestName: string;
  peopleCount: number;
  startSeat: number;
  endSeat: number;
};

export type SeatPoint = { seat: number; x: number; y: number };
