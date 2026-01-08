export type InvitationSettingsStatus = 'Draft' | 'Ready';

export interface InvitationTemplate {
  id: number;
  eventTypeId: number;
  partnerId?: number | null | undefined;

  code: string;
  name: string;

  background_Url: string;
  thumbnail_Url: string;

  showLogo: boolean;
  logo_Url?: string | null | undefined;
}

export interface EventInvitationSettings {
  id: number;
  eventId: number;

  activeTemplateId?: number | null | undefined;
  settingsJson: string; // vem como string do backend (JSON do bloco do tipo)
  coverImage_Url?: string | null | undefined;

  status: InvitationSettingsStatus;
  validationErrorsJson?: string | null | undefined;
}

// -----------------------
// Details por tipo
// -----------------------

export interface PreWeddingInvitationDetails {
  location?: string | null | undefined;
  time?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface FamilyInvitationDetails {
  location?: string | null | undefined;
  time?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface CorporateInvitationDetails {
  title?: string | null | undefined;
  description?: string | null | undefined;
  location?: string | null | undefined;
  time?: string | null | undefined;
}

export interface KidsCelebrationInvitationDetails {
  location?: string | null | undefined;
  time?: string | null | undefined;
  contact?: string | null | undefined;
  notes?: string | null | undefined;
}
export type BirthdayInvitationDetails = KidsCelebrationInvitationDetails;
export type GraduationInvitationDetails = KidsCelebrationInvitationDetails;

export interface WeddingInvitationDetails {
  civilLocation?: string | null | undefined;
  civilTime?: string | null | undefined;

  partyLocation?: string;
  partyTime?: string;

  notes?: string | null | undefined;
}

export type InvitationEventTypeSlug =
  | 'casamento'
  | 'pre-casamento'
  | 'evento-corporativo'
  | 'evento-familiar'
  | 'celebracao-infantil'
  | 'aniversario'
  | 'graduacao';

export type InvitationDetailsBySlug =
  | WeddingInvitationDetails
  | PreWeddingInvitationDetails
  | CorporateInvitationDetails
  | FamilyInvitationDetails
  | KidsCelebrationInvitationDetails
  | BirthdayInvitationDetails
  | GraduationInvitationDetails;

export type InvitationDetailsMap = {
  casamento: WeddingInvitationDetails;
  'pre-casamento': PreWeddingInvitationDetails;
  'evento-corporativo': CorporateInvitationDetails;
  'evento-familiar': FamilyInvitationDetails;
  'celebracao-infantil': KidsCelebrationInvitationDetails;
  aniversario: BirthdayInvitationDetails;
  graduacao: GraduationInvitationDetails;
};

// payload para update settings
export interface EventInvitationSettingsForUpdateInput {
  coverImage_Url?: string | null | undefined;

  wedding?: WeddingInvitationDetails | null | undefined;
  preWedding?: PreWeddingInvitationDetails | null | undefined;
  corporate?: CorporateInvitationDetails | null | undefined;
  family?: FamilyInvitationDetails | null | undefined;
  kidsCelebration?: KidsCelebrationInvitationDetails | null | undefined;
  birthday?: BirthdayInvitationDetails | null | undefined;
  graduation?: GraduationInvitationDetails | null | undefined;
}

// respostas “utilitárias”
export interface InvitationRenderGuestResult {
  fileUrl: string;
  fromCache: boolean;
}

export interface InvitationExportAllResult {
  zipUrl: string;
  total: number;
  fromCache: boolean;
  generated: number;
}

export interface InvitationUploadResult {
  url: string;
}
