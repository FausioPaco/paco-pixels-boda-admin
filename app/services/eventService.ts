import type { NitroFetchRequest, $Fetch } from 'nitropack';
import { fetchWithPagination } from '~/composables/fetchWithPagination';

const RESOURCE = '/Events';

export const getEventService = <T>($fetch: $Fetch<T, NitroFetchRequest>) => ({
  async getAllEvents(
    parameters: EventParameters,
  ): Promise<Pagination<BodaEvent>> {
    return fetchWithPagination<BodaEvent>($fetch, RESOURCE, {
      query: parameters,
    });
  },

  async getEvent(eventId: number | string): Promise<BodaEvent> {
    return $fetch<BodaEvent>(`${RESOURCE}/Get/${eventId}`);
  },

  async createEvent(newEvent: EventInput): Promise<BodaEvent> {
    return $fetch<BodaEvent>(`${RESOURCE}/Create`, {
      method: 'post',
      body: newEvent,
    });
  },

  async updateEvent(
    eventId: number,
    updatedEvent: EventInput,
  ): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Update/${eventId}`, {
      method: 'put',
      body: updatedEvent,
    });
  },

  async removeEvent(eventId: number): Promise<unknown> {
    return $fetch<unknown>(`${RESOURCE}/Remove/${eventId}`, {
      method: 'delete',
    });
  },

  async getEventTypes(): Promise<EventType[]> {
    return $fetch<EventType[]>(`${RESOURCE}/Types`);
  },

  async uploadQRImage({
    file,
    eventId,
  }: FileInput): Promise<QRCodeFileUploadResult> {
    const formData = new FormData();
    formData.append('FileUpload', file);

    return $fetch<QRCodeFileUploadResult>(
      `${RESOURCE}/UploadQrTemplate/${eventId}`,
      {
        method: 'post',
        body: formData,
      },
    );
  },

  async exportQRCards(
    eventId: number,
    color: ExportTextColor,
    clientCode: string,
  ): Promise<Blob> {
    return $fetch<Blob>(
      `${RESOURCE}/ExportQrCards/${eventId}?color=${color}&clientCode=${clientCode}`,
    );
  },

  async startExportQRCards(
    eventId: number,
    color: ExportTextColor,
    clientCode: string,
  ): Promise<{ jobId: string; total: number }> {
    return $fetch<{ jobId: string; total: number }>(
      `${RESOURCE}/ExportQrCards/Start/${eventId}?color=${color}&clientCode=${clientCode}`,
      { method: 'post' },
    );
  },

  async getExportStatus(jobId: string): Promise<{
    jobId: string;
    type: string;
    status: string;
    total: number;
    processed: number;
    percent: number;
    zipUrl?: string | null;
    error?: string | null;
  }> {
    return $fetch(`${RESOURCE}/Exports/Status/${jobId}`);
  },

  async downloadExportQrCards(jobId: string): Promise<{ zipUrl: string }> {
    return $fetch<{ zipUrl: string }>(
      `${RESOURCE}/ExportQrCards/Download/${jobId}`,
    );
  },
});
