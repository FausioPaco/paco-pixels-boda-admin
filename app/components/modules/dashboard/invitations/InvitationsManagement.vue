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
const showRemoveCover = ref(false);

const { apiImageUrl } = useRuntimeConfig().public;

// -------------------------
// Data
// -------------------------
const {
  templates,
  refreshTemplates,
  isRefreshing: isRefreshingTemplates,
} = await useInvitationTemplates();

const {
  settings,
  refreshSettings,
  canExport,
  isRefreshing: isRefreshingSettings,
} = await useInvitationSettings();

const activeTemplateId = computed(
  () => settings.value?.activeTemplateId ?? null,
);

const activeTemplate = computed(
  () => templates.value.find((t) => t.id === activeTemplateId.value) || null,
);

const eventTypeSlug = computed(
  () => eventStore.eventTypeSlug as InvitationEventTypeSlug | null,
);

const invitationSlug = computed(
  () => eventTypeSlug.value as keyof InvitationDetailsMap | null,
);

// -------------------------
// Helpers
// -------------------------
function safeParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

const initialDetails = computed(
  () => safeParse(settings.value?.settingsJson) ?? {},
);

// -------------------------
// Preview modal
// -------------------------
const showPreviewModal = ref(false);
const previewTemplate = ref<InvitationTemplate | null>(null);

const previewImageUrl = computed(() => {
  const url = previewTemplate.value?.thumbnail_Url;
  return url ? `${apiImageUrl}${url}` : null;
});

const openPreview = (t: InvitationTemplate) => {
  previewTemplate.value = t;
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewTemplate.value = null;
};

// -------------------------
// Template actions
// -------------------------
const isSettingTemplate = ref(false);

const useTemplate = async (templateId: number) => {
  try {
    isSettingTemplate.value = true;

    await invitationService.setActiveTemplate(eventId, templateId);
    closePreview();

    await Promise.all([
      refreshSettings({ force: true }),
      refreshTemplates({ force: true }),
    ]);

    toast.success('Modelo actualizado com sucesso!');
  } catch (err) {
    console.error(err);
    toast.error('Ocorreu um erro ao activar o modelo.');
  } finally {
    isSettingTemplate.value = false;
  }
};

// -------------------------
// Upload cover image (click only)
// -------------------------
const fileInputRef = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const fileToUpload = ref<File | null>(null);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const coverImageUrl = computed(() => {
  const url = settings.value?.coverImage_Url;
  return url ? `${apiImageUrl}${url}` : null;
});

const openFileDialog = () => fileInputRef.value?.click();

const resetUpload = () => {
  fileToUpload.value = null;

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
};

const validateSelectedFile = (file: File): string | null => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
  const maxSizeBytes = 8 * 1024 * 1024;

  if (!allowed.includes(file.type))
    return 'Por favor seleccione um ficheiro PNG ou JPG.';
  if (file.size > maxSizeBytes) return 'O tamanho máximo permitido é 8MB.';

  return null;
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploadError.value = null;

  const error = validateSelectedFile(file);
  if (error) {
    uploadError.value = error;
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
    await invitationService.uploadCoverImage({
      eventId,
      file: fileToUpload.value,
    });

    await refreshSettings({ force: true });

    resetUpload();
    toast.success('Imagem do convite actualizada com sucesso!');
  } catch (err) {
    console.error(err);
    uploadError.value =
      'Ocorreu um erro ao carregar a imagem. Por favor tente novamente.';
  } finally {
    isUploading.value = false;
  }
};

// -------------------------
// Form
// -------------------------
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
      base.notes = d.notes ?? null;
      base.contact = 'contact' in d ? (d.contact ?? null) : null;
      break;
    }
  }

  return base;
}

const { handleSubmit, values, errors, defineField, setValues, isSubmitting } =
  useForm<InvitationFormValues>({
    validationSchema: schema,
    initialValues: buildInitialFormValues(),
  });

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

// sync values when settings load
watch(
  () => settings.value?.settingsJson,
  () => {
    // keep your current behaviour (do not change semantics)
    setValues(initialDetails.value as unknown as InvitationFormValues);
  },
);

// -------------------------
// Payload builder
// -------------------------
function buildSettingsPayload() {
  const s = invitationSlug.value;

  const base: EventInvitationSettingsForUpdateInput = {
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
      const v = values as unknown as InvitationDetailsMap['casamento'];
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
      const v = values as unknown as InvitationDetailsMap['pre-casamento'];
      base.preWedding = {
        location: v.location ?? null,
        time: v.time ?? null,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'evento-corporativo': {
      const v = values as unknown as InvitationDetailsMap['evento-corporativo'];
      base.corporate = {
        title: v.title ?? null,
        description: v.description ?? null,
        location: v.location ?? null,
        time: v.time ?? null,
      };
      break;
    }

    case 'evento-familiar': {
      const v = values as unknown as InvitationDetailsMap['evento-familiar'];
      base.family = {
        location: v.location ?? null,
        time: v.time ?? null,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'celebracao-infantil': {
      const v =
        values as unknown as InvitationDetailsMap['celebracao-infantil'];
      base.kidsCelebration = {
        location: v.location ?? null,
        time: v.time ?? null,
        contact: v.contact ?? null,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'aniversario': {
      const v = values as unknown as InvitationDetailsMap['aniversario'];
      base.birthday = {
        location: v.location ?? null,
        time: v.time ?? null,
        contact: v.contact ?? null,
        notes: v.notes ?? null,
      };
      break;
    }

    case 'graduacao': {
      const v = values as unknown as InvitationDetailsMap['graduacao'];
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

// -------------------------
// Submit
// -------------------------
const onSubmit = handleSubmit(async () => {
  try {
    await invitationService.updateSettings(eventId, buildSettingsPayload());
    await refreshSettings({ force: true });
    toast.success('Definições guardadas com sucesso!');
  } catch (err: unknown) {
    console.error(err);

    if (isFetchErrorLike(err)) {
      toast.error(getServerErrors(err.data));
      return;
    }

    toast.error(
      'Não foi possível guardar as definições. Verifique os dados e tente novamente.',
    );
  }
});

// -------------------------
// Export
// -------------------------
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

const hasCover = computed(() => {
  const s = settings.value;
  return !!(s?.coverImage_Url || s?.coverImageExport_Url);
});
</script>

<template>
  <section class="my-8 space-y-6">
    <!-- Selecionar Modelo -->
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
                :disabled="activeTemplateId === t.id || isSettingTemplate"
                @click="useTemplate(t.id)"
              >
                {{ activeTemplateId === t.id ? 'Seleccionado' : 'Usar' }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>

      <BaseLoading
        v-if="isRefreshingTemplates"
        message="A actualizar modelos..."
      />
    </BaseCard>

    <!-- Carregar imagem do convite -->
    <BaseCard
      v-if="activeTemplateId"
      title="Carregar imagem do convite"
      description="Carregue a imagem (cover) que será utilizada na composição do convite."
      class="animate-fadeIn"
      outline
    >
      <button
        type="button"
        class="hover:border-primary-200 hover:bg-primary-25 group flex items-center justify-center overflow-hidden rounded-3xl p-2 transition"
        :class="
          previewUrl || coverImageUrl
            ? undefined
            : 'border-grey-200 bg-grey-100/30 border-2 border-dashed'
        "
        @click="openFileDialog"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          class="h-full w-full rounded-2xl object-cover md:h-[450px] md:w-[450px]"
        />
        <img
          v-else-if="coverImageUrl"
          :src="coverImageUrl"
          class="h-full w-full rounded-2xl object-cover md:h-[450px] md:w-[450px]"
          alt="Cover actual"
        />

        <!-- Placeholder -->
        <div
          v-else
          class="text-grey-400 flex h-full w-full flex-col items-center justify-center gap-3 py-8 md:h-[450px] md:w-[450px] md:py-0"
        >
          <IconMenuGallery
            :font-controlled="false"
            class="text-grey-300 group-hover:text-primary-700 block size-[80px]"
          />
          <p
            class="text-grey-400 group-hover:text-primary-700 text-lg font-semibold"
          >
            Clique aqui para carregar a imagem
          </p>

          <p
            class="text-grey-400 group-hover:text-primary-700 text-xs font-medium"
          >
            Formatos: <b>PNG ou JPG</b> · Tamanho máximo: <b>8MB</b>
          </p>

          <p
            v-if="activeTemplateId"
            class="text-grey-400 group-hover:text-primary-700 text-xs font-medium"
          >
            Resolução recomendada:
            <b
              >{{ activeTemplate?.coverWidth }}x{{
                activeTemplate?.coverHeight
              }}px</b
            >
          </p>
        </div>
      </button>

      <div
        v-if="fileToUpload && previewUrl && !isUploading"
        class="text-primary-700 my-4 flex gap-2 text-xs"
      >
        <IconInformation :font-controlled="false" class="block size-[18px]" />
        <p>Pré-visualização pronta. Clique em <b>“Guardar imagem”</b>.</p>
      </div>

      <BaseError v-if="uploadError" :message="uploadError" />

      <div class="flex flex-wrap gap-2 pt-2">
        <BaseButton
          v-if="hasCover && !previewUrl"
          btn-type="outline-primary"
          @click="showRemoveCover = true"
        >
          Remover imagem
        </BaseButton>

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
    </BaseCard>

    <!-- Definições do convite -->
    <BaseCard
      title="Definições do convite"
      description="Preencha os dados do convite conforme o tipo de evento."
      outline
    >
      <form class="space-y-4" @submit.prevent="onSubmit">
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
            v-bind="civilTimeAttrs"
            :error-message="errors.civilTime"
            name="civilTime"
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
            <BaseTextArea
              id="invitationNotes"
              v-model="notes"
              rows="8"
              v-bind="notesAttrs"
              :error-message="errors.notes"
              name="notes"
              label="Notas"
              placeholder="Coloque informações adicionais (se tiver)..."
            />
          </div>
        </div>

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

        <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BaseInput
            id="invitationLocationDefault"
            v-model="location"
            v-bind="locationAttrs"
            :error-message="errors.location"
            name="location"
            label="Local"
            placeholder="Ex: Local do evento..."
          />
          <BaseInput
            id="invitationTimeDefault"
            v-model="time"
            v-bind="timeAttrs"
            :error-message="errors.time"
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
              id="invitationNotesDefault"
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
            :disabled="isExporting || !canExport"
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

        <BaseLoading
          v-if="isRefreshingSettings"
          message="A guardar definições..."
        />
      </form>
    </BaseCard>

    <LazyInvitationTemplatePreviewModal
      :show="showPreviewModal"
      :template="previewTemplate"
      :image-url="previewImageUrl"
      @close-modal="closePreview"
      @use-template="useTemplate"
    />

    <LazyInvitationsRemoveCoverModal
      :show="showRemoveCover"
      :event-id="eventId!"
      @close-modal="showRemoveCover = false"
      @success="refreshSettings({ force: true })"
    />
  </section>
</template>
