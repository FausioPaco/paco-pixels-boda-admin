import type { NitroFetchRequest, $Fetch } from 'nitropack';

const INVITATIONS_RESOURCE = '/Invitations';

export const getInvitationService = <T>(
  $fetch: $Fetch<T, NitroFetchRequest>,
) => ({
  async getTemplates(eventId: number): Promise<InvitationTemplate[]> {
    return $fetch<InvitationTemplate[]>(`${INVITATIONS_RESOURCE}/Templates`, {
      query: { eventId },
    });
  },

  async getSettings(eventId: number): Promise<EventInvitationSettings> {
    return $fetch<EventInvitationSettings>(`${INVITATIONS_RESOURCE}/Settings`, {
      query: { eventId },
    });
  },

  async updateSettings(
    eventId: number,
    input: EventInvitationSettingsForUpdateInput,
  ): Promise<{ status: string }> {
    return $fetch<{ status: string }>(`${INVITATIONS_RESOURCE}/Settings`, {
      method: 'post',
      query: { eventId },
      body: input,
    });
  },

  async setActiveTemplate(
    eventId: number,
    templateId: number,
  ): Promise<{ message: string }> {
    return $fetch<{ message: string }>(
      `${INVITATIONS_RESOURCE}/ActiveTemplate`,
      {
        method: 'post',
        query: { eventId, templateId },
      },
    );
  },

  async uploadCoverImage(input: {
    eventId: number;
    file: File;
  }): Promise<InvitationUploadResult> {
    const form = new FormData();
    form.append('file', input.file);

    return $fetch<InvitationUploadResult>(
      `${INVITATIONS_RESOURCE}/Cover/Upload`,
      {
        method: 'post',
        query: { eventId: input.eventId },
        body: form,
      },
    );
  },

  async renderGuest(
    eventId: number,
    guestId: number,
    force = false,
  ): Promise<InvitationRenderGuestResult> {
    return $fetch<InvitationRenderGuestResult>(
      `${INVITATIONS_RESOURCE}/Render/Guest`,
      { query: { eventId, guestId, force } },
    );
  },

  async exportAll(
    eventId: number,
    force = false,
  ): Promise<InvitationExportAllResult> {
    return $fetch<InvitationExportAllResult>(
      `${INVITATIONS_RESOURCE}/Export/All`,
      {
        query: { eventId, force },
      },
    );
  },
});
