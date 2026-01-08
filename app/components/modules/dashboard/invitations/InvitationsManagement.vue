<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { getInvitationService } from '~/services/invitationService';

const toast = useToast();

const nuxtApp = useNuxtApp();
const invitationService = getInvitationService(nuxtApp.$api);

const eventStore = useEventStore();
const eventId = eventStore.ensureSelected();

const { apiImageUrl } = useRuntimeConfig().public;

/**
 * data
 */
const {
  templates,
  refreshTemplates,
  isRefreshing: isRefreshingTemplates,
} = await useInvitationTemplates();

const {
  settings,
  refreshSettings,
  isRefreshing: isRefreshingSettings,
} = await useInvitationSettings();

const activeTemplateId = computed(
  () => settings.value?.activeTemplateId ?? null,
);

/**
 * Preview modal
 */
const showPreviewModal = ref(false);
const previewTemplate = ref<InvitationTemplate | null>(null);

const openPreview = (t: InvitationTemplate) => {
  previewTemplate.value = t;
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewTemplate.value = null;
};

const previewImageUrl = computed(() => {
  if (!previewTemplate.value?.thumbnail_Url) return null;
  // assumimos URL relativa
  return `${apiImageUrl}${previewTemplate.value.thumbnail_Url}`;
});

/**
 * Set active template
 */
const isSettingTemplate = ref(false);
const useTemplate = async (templateId: number) => {
  try {
    isSettingTemplate.value = true;
    await invitationService.setActiveTemplate(eventId, templateId);

    closePreview();

    await refreshSettings({ force: true });
    await refreshTemplates({ force: true });

    toast.success('Modelo actualizado com sucesso!');
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao activar o modelo.');
  } finally {
    isSettingTemplate.value = false;
  }
};

/**
 * Upload cover image (clique, sem dropzone) – padrão GuestsQRCode.vue
 */
const fileInputRef = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const fileToUpload = ref<File | null>(null);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const openFileDialog = () => fileInputRef.value?.click();

const coverImageUrl = computed(() => {
  const url = settings.value?.coverImage_Url;
  return url ? `${apiImageUrl}${url}` : null;
});

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploadError.value = null;

  const maxSizeBytes = 8 * 1024 * 1024; // 8MB
  const allowed = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!allowed.includes(file.type)) {
    uploadError.value = 'Por favor seleccione um ficheiro PNG ou JPG.';
    target.value = '';
    return;
  }

  if (file.size > maxSizeBytes) {
    uploadError.value = 'O tamanho máximo permitido é 8MB.';
    target.value = '';
    return;
  }

  fileToUpload.value = file;

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
};

const saveCoverImage = async () => {
  if (!fileToUpload.value) return;

  isUploading.value = true;
  uploadError.value = null;

  try {
    const result = await invitationService.uploadCoverImage({
      eventId,
      file: fileToUpload.value,
    });

    // backend devolve url relativa (padrão do QR)
    // agora guardamos nas settings via updateSettings (ou se o endpoint já actualizar, ainda assim mantemos consistente)
    await invitationService.updateSettings(
      eventId,
      buildSettingsPayload({ coverImage_Url: result.url }),
    );

    // refresh
    await refreshSettings({ force: true });

    // limpar preview
    fileToUpload.value = null;
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = null;
    }

    toast.success('Imagem do convite actualizada com sucesso!');
  } catch (err) {
    console.error(err);
    uploadError.value =
      'Ocorreu um erro ao carregar a imagem. Por favor tente novamente.';
  } finally {
    isUploading.value = false;
  }
};

const eventTypeSlug = computed(
  () => eventStore.eventTypeSlug as InvitationEventTypeSlug | null,
);

const invitationSlug = computed(
  () => eventTypeSlug.value as keyof InvitationDetailsMap | null,
);

function safeParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Valores iniciais por tipo
 */
const initialDetails = computed(() => {
  const parsed = safeParse(settings.value?.settingsJson);
  return parsed ?? {};
});

/**
 * Schema dinâmico por tipo
 * - Wedding: partyLocation/partyTime required + regra do par Civil*
 * - outros: campos opcionais (podes apertar depois)
 */

type InvitationFormValues = {
  // wedding
  civilLocation: string | null;
  civilTime: string | null;
  partyLocation: string | null;
  partyTime: string | null;

  // corporate
  title: string | null;
  description: string | null;

  // common
  location: string | null;
  time: string | null;
  contact: string | null;
  notes: string | null;
};

const schema = computed(() => {
  const slug = eventTypeSlug.value;

  if (slug === 'casamento') {
    return toTypedSchema(
      object({
        civilLocation: string().nullable(),
        civilTime: string().nullable(),
        partyLocation: string().required('Preencha o local da festa.'),
        partyTime: string().required('Preencha a hora da festa.'),
        notes: string().nullable(),
      }).test(
        'civil-pair',
        'Se preencher o local do civil, deve preencher também a hora (e vice-versa).',
        (value) => {
          const hasLoc = !!value?.civilLocation?.trim?.();
          const hasTime = !!value?.civilTime?.trim?.();
          return (hasLoc && hasTime) || (!hasLoc && !hasTime);
        },
      ),
    );
  }

  if (slug === 'evento-corporativo') {
    return toTypedSchema(
      object({
        title: string().nullable(),
        description: string().nullable(),
        location: string().nullable(),
        time: string().nullable(),
      }),
    );
  }

  return toTypedSchema(
    object({
      location: string().nullable(),
      time: string().nullable(),
      contact: string().nullable(),
      notes: string().nullable(),
    }),
  );
});

const { handleSubmit, values, errors, setValues, defineField, isSubmitting } =
  useForm<InvitationFormValues>({
    validationSchema: schema,
    initialValues: buildInitialFormValues(), // função tua (abaixo)
  });

function buildInitialFormValues(): InvitationFormValues {
  const slug = eventTypeSlug.value;
  const details = initialDetails.value;

  const base: InvitationFormValues = {
    civilLocation: null,
    civilTime: null,
    partyLocation: null,
    partyTime: null,
    title: null,
    description: null,
    location: null,
    time: null,
    contact: null,
    notes: null,
  };

  if (!slug) return base;

  switch (slug) {
    case 'casamento': {
      const d = details as InvitationDetailsMap['casamento'];
      base.civilLocation = d.civilLocation ?? null;
      base.civilTime = d.civilTime ?? null;
      base.partyLocation = d.partyLocation ?? null;
      base.partyTime = d.partyTime ?? null;
      base.notes = d.notes ?? null;
      break;
    }
    case 'evento-corporativo': {
      const d = details as InvitationDetailsMap['evento-corporativo'];
      base.title = d.title ?? null;
      base.description = d.description ?? null;
      base.location = d.location ?? null;
      base.time = d.time ?? null;
      break;
    }
    default: {
      const d = details as
        | InvitationDetailsMap['pre-casamento']
        | InvitationDetailsMap['evento-familiar']
        | InvitationDetailsMap['celebracao-infantil']
        | InvitationDetailsMap['aniversario']
        | InvitationDetailsMap['graduacao'];
      base.location = d.location ?? null;
      base.time = d.time ?? null;
      base.contact = 'contact' in d ? (d.contact ?? null) : null;
      base.notes = d.notes ?? null;
      break;
    }
  }

  return base;
}

const [civilLocation, civilLocationAttrs] = defineField('civilLocation');
const [civilTime, civilTimeAttrs] = defineField('civilTime');
const [partyLocation, partyLocationAttrs] = defineField('partyLocation');
const [partyTime, partyTimeAttrs] = defineField('partyTime');

const [title, titleAttrs] = defineField('title');
const [description, descriptionAttrs] = defineField('description');

const [location, locationAttrs] = defineField('location');
const [time, timeAttrs] = defineField('time');
const [contact, contactAttrs] = defineField('contact');
const [notes, notesAttrs] = defineField('notes');

// manter sincronizado quando settings carregarem
watch(
  () => settings.value?.settingsJson,
  () => {
    setValues(initialDetails.value ?? {});
  },
);

/**
 * Construir payload respeitando o backend:
 * só 1 bloco preenchido conforme slug.
 */

function buildSettingsPayload(extra?: { coverImage_Url?: string | null }) {
  const s = invitationSlug.value;

  const base: EventInvitationSettingsForUpdateInput = {
    coverImage_Url:
      extra?.coverImage_Url ?? settings.value?.coverImage_Url ?? null,
    wedding: null,
    preWedding: null,
    corporate: null,
    family: null,
    kidsCelebration: null,
    birthday: null,
    graduation: null,
  };

  if (!s) return base;

  switch (s) {
    case 'casamento': {
      const v = values as InvitationDetailsMap['casamento'];

      base.wedding = {
        civilLocation: v.civilLocation ?? null,
        civilTime: v.civilTime ?? null,
        partyLocation: v.partyLocation,
        partyTime: v.partyTime,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'pre-casamento': {
      const v = values as InvitationDetailsMap['pre-casamento'];
      base.preWedding = {
        location: v.location ?? null,
        time: v.time ?? null,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'evento-corporativo': {
      const v = values as InvitationDetailsMap['evento-corporativo'];
      base.corporate = {
        title: v.title ?? null,
        description: v.description ?? null,
        location: v.location ?? null,
        time: v.time ?? null,
      };
      break;
    }
    case 'evento-familiar': {
      const v = values as InvitationDetailsMap['evento-familiar'];
      base.family = {
        location: v.location ?? null,
        time: v.time ?? null,
        notes: v.notes ?? null,
      };
      break;
    }
    case 'celebracao-infantil': {
      const v = values as InvitationDetailsMap['celebracao-infantil'];
      base.kidsCelebration = {
        location: v.location ?? null,
        time: v.time ?? null,
        contact: v.contact ?? null,
        notes: v.notes ?? null,
      };
      break;
    }
    case 'aniversario': {
      const v = values as InvitationDetailsMap['aniversario'];
      base.birthday = {
        location: v.location ?? null,
        time: v.time ?? null,
        contact: v.contact ?? null,
        notes: v.notes ?? null,
      };
      break;
    }
    case 'graduacao': {
      const v = values as InvitationDetailsMap['graduacao'];
      base.graduation = {
        location: v.location ?? null,
        time: v.time ?? null,
        contact: v.contact ?? null,
        notes: v.notes ?? null,
      };
      break;
    }
  }

  return base;
}

const onSubmit = handleSubmit(async () => {
  try {
    await invitationService.updateSettings(eventId, buildSettingsPayload());

    await refreshSettings({ force: true });
    toast.success('Definições guardadas com sucesso!');
  } catch (err: unknown) {
    console.error(err);
    if (isFetchErrorLike(err)) {
      toast.error(getServerErrors(err.data));
    } else {
      toast.error(
        'Não foi possível guardar as definições. Verifique os dados e tente novamente.',
      );
    }
  }
});

/**
 * Exportar todos (ZIP) – devolve zipUrl
 */
const isExporting = ref(false);
const exportAll = async () => {
  try {
    isExporting.value = true;
    const result = await invitationService.exportAll(eventId, false);

    const url = `${apiImageUrl}${result.zipUrl}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `CONVITES_EVENTO_${eventStore.eventInitials}.zip`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Exportação iniciada!');
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao exportar os convites.');
  } finally {
    isExporting.value = false;
  }
};
</script>

<template>
  <section class="space-y-6">
    <BaseCard
      title="Escolher modelo"
      description="Seleccione um modelo de convite para este evento."
      outline
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="t in templates"
          :key="t.id"
          class="rounded-2xl border p-3"
          :class="
            activeTemplateId === t.id ? 'border-primary-500' : 'border-grey-200'
          "
        >
          <div class="bg-grey-50 overflow-hidden rounded-xl border">
            <img
              v-if="t.thumbnail_Url"
              :src="`${apiImageUrl}${t.thumbnail_Url}`"
              class="block w-full"
              alt="Template"
            />
            <div v-else class="text-grey-500 p-6 text-sm">Sem imagem</div>
          </div>

          <div class="mt-3 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="text-grey-900 truncate text-sm font-semibold">
                {{ t.name }}
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <BaseButton
                btn-size="sm"
                btn-type="outline-primary"
                @click="openPreview(t)"
              >
                Pré-visualizar
              </BaseButton>

              <BaseButton
                btn-size="sm"
                :btn-type="
                  activeTemplateId === t.id ? 'primary' : 'outline-primary'
                "
                :disabled="activeTemplateId === t.id || isSettingTemplate"
                @click="useTemplate(t.id)"
              >
                {{ activeTemplateId === t.id ? 'Seleccionado' : 'Usar' }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <p v-if="isRefreshingTemplates" class="text-grey-500 mt-3 text-xs">
        A actualizar modelos...
      </p>
    </BaseCard>

    <!-- 2) Carregar imagem do convite -->
    <BaseCard
      title="Carregar imagem do convite"
      description="Carregue a imagem (cover) que será utilizada na composição do convite."
      outline
    >
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-2">
          <p class="text-grey-600 text-sm">
            Formatos: <b>PNG ou JPG</b> · Tamanho máximo: <b>8MB</b>
          </p>

          <div v-if="uploadError" class="text-xs text-red-600">
            {{ uploadError }}
          </div>

          <div
            v-if="fileToUpload && previewUrl && !isUploading"
            class="text-primary-700 flex gap-2 text-xs"
          >
            <IconCheckmark :font-controlled="false" class="block size-[18px]" />
            <p>Pré-visualização pronta. Clique em <b>“Guardar imagem”</b>.</p>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <BaseButton
              btn-type="outline-primary"
              :disabled="isUploading"
              @click="openFileDialog"
            >
              {{ coverImageUrl ? 'Alterar imagem' : 'Carregar imagem' }}
            </BaseButton>

            <BaseButton
              v-if="fileToUpload && previewUrl"
              btn-type="primary"
              :loading="isUploading"
              :disabled="isUploading"
              @click="saveCoverImage"
            >
              Guardar imagem
            </BaseButton>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg"
            class="hidden"
            @change="onFileSelected"
          />
        </div>

        <div class="w-full md:w-[360px]">
          <div class="bg-grey-50 overflow-hidden rounded-2xl border">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              class="block w-full"
              alt="Pré-visualização cover"
            />
            <img
              v-else-if="coverImageUrl"
              :src="coverImageUrl"
              class="block w-full"
              alt="Cover actual"
            />
            <div v-else class="text-grey-500 p-6 text-sm">
              Ainda não foi carregada nenhuma imagem.
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- 3) Definições do convite -->
    <BaseCard
      title="Definições do convite"
      description="Preencha os dados do convite conforme o tipo de evento."
      outline
    >
      <form class="space-y-4" @submit.prevent="onSubmit">
        <!-- Wedding -->
        <div
          v-if="eventTypeSlug === 'casamento'"
          class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <BaseInput
            id="invitationCivilLocation"
            v-model="civilLocation"
            v-bind="civilLocationAttrs"
            :error-message="errors.civilLocation"
            name="civilLocation"
            label="Local (Civil)"
            placeholder="Ex: Conservatória..."
          />
          <BaseInput
            id="invitationCivilLocationTime"
            v-model="civilTime"
            name="civilTime"
            v-bind="civilTimeAttrs"
            :error-message="errors.civilTime"
            label="Hora (Civil)"
            placeholder="Ex: 11:00"
          />

          <BaseInput
            id="invitationPartyLocation"
            v-model="partyLocation"
            v-bind="partyLocationAttrs"
            :error-message="errors.partyLocation"
            name="partyLocation"
            label="Local da festa"
            placeholder="Ex: Salão..."
          />
          <BaseInput
            id="invitationPartyTime"
            v-model="partyTime"
            v-bind="partyTimeAttrs"
            :error-message="errors.partyTime"
            name="partyTime"
            label="Hora da festa"
            placeholder="Ex: 15:00"
          />

          <div class="md:col-span-2">
            <BaseInput
              id="invitationNotes"
              v-model="notes"
              name="notes"
              v-bind="notesAttrs"
              :error-message="errors.notes"
              label="Notas"
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <!-- Corporate -->
        <div
          v-else-if="eventTypeSlug === 'evento-corporativo'"
          class="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <BaseInput
            id="invitationTitle"
            v-model="title"
            v-bind="titleAttrs"
            :error-message="errors.title"
            name="title"
            label="Título"
            placeholder="Ex: Conferência..."
          />
          <BaseInput
            id="invitationTime"
            v-model="time"
            v-bind="timeAttrs"
            :error-message="errors.time"
            name="time"
            label="Hora"
            placeholder="Ex: 09:00"
          />
          <BaseInput
            id="invitationLocation"
            v-model="location"
            v-bind="locationAttrs"
            :error-message="errors.location"
            name="location"
            label="Local"
            placeholder="Ex: Hotel..."
          />
          <div class="md:col-span-2">
            <BaseInput
              id="invitationDescription"
              v-model="description"
              v-bind="descriptionAttrs"
              :error-message="errors.description"
              name="description"
              label="Descrição"
              placeholder="Breve descrição do evento..."
            />
          </div>
        </div>

        <!-- Default (pre-wedding / family / kids / birthday / graduation) -->
        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            id="invitationLocation"
            v-model="location"
            v-bind="locationAttrs"
            :error-message="errors.location"
            name="location"
            label="Local"
            placeholder="Ex: Local do evento..."
          />
          <BaseInput
            id="invitationTime"
            v-model="time"
            name="time"
            label="Hora"
            placeholder="Ex: 18:00"
          />

          <BaseInput
            v-if="
              eventTypeSlug === 'celebracao-infantil' ||
              eventTypeSlug === 'aniversario' ||
              eventTypeSlug === 'graduacao'
            "
            id="invitationContact"
            v-model="contact"
            v-bind="contactAttrs"
            :error-message="errors.contact"
            name="contact"
            label="Contacto"
            placeholder="Ex: +258 84..."
          />

          <div class="md:col-span-2">
            <BaseInput
              id="invitationNotes"
              v-model="notes"
              v-bind="notesAttrs"
              :error-message="errors.notes"
              name="notes"
              label="Notas"
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
          <BaseButton
            btn-type="outline-primary"
            :disabled="isExporting"
            @click="exportAll"
          >
            {{ isExporting ? 'A exportar...' : 'Exportar todos os convites' }}
          </BaseButton>

          <BaseButton
            btn-type="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Guardar alterações
          </BaseButton>
        </div>

        <p v-if="isRefreshingSettings" class="text-grey-500 text-xs">
          A actualizar definições...
        </p>
      </form>
    </BaseCard>

    <!-- Preview Modal -->
    <InvitationTemplatePreviewModal
      :show="showPreviewModal"
      :template="previewTemplate"
      :image-url="previewImageUrl"
      @close-modal="closePreview"
      @use-template="useTemplate"
    />
  </section>
</template>
