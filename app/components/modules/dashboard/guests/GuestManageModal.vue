<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getGuestService } from '~/services/guestService';

type Tab = 'presence' | 'absence';

type Props = {
  show: boolean;
  guest: Guest | undefined;
};

type Emits = {
  (e: 'close' | 'updated'): void;
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const manageTab = ref<Tab>('presence');
const isSubmitting = ref(false);

const absenceNote = ref<string>('');

/* -------------------------------------------------------------------------- */
/* Watchers                                                                    */
/* -------------------------------------------------------------------------- */
watch(
  () => props.show,
  (v) => {
    if (!v) return;
    manageTab.value = 'presence';
    absenceNote.value = props.guest?.additional_Comments ?? '';
  },
);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
const close = () => emit('close');

const onError = (err: unknown, fallbackMessage: string) => {
  if (isFetchErrorLike(err)) {
    toast.error(getServerErrors(err?.data));
    return;
  }
  toast.error(fallbackMessage);
};

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

const declareAbsence = async () => {
  if (!props.guest) return;

  try {
    isSubmitting.value = true;

    await guestService.declareAbsence(props.guest.id, {
      additional_Comments: absenceNote.value?.trim() || undefined,
    });

    toast.success('Ausência registada.');
    emit('updated');
    close();
  } catch (err: unknown) {
    onError(err, 'Ocorreu um erro ao declarar ausência');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <BaseModal :show="show" title="Confirmar convidado" @close-modal="close">
    <div v-if="guest">
      <!-- Header -->
      <div class="bg-grey-50 mb-6 mt-2 rounded-xl p-3">
        <div class="text-grey-900 text-lg font-semibold">
          {{ guest.name }}
        </div>
        <div class="text-grey-700 text-sm">
          {{
            guest.people_Count === 1
              ? '1 pessoa'
              : `${guest.people_Count} pessoas`
          }}
        </div>
      </div>

      <!-- Tabs  -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <!-- Presença -->
        <button
          type="button"
          class="group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200"
          :class="
            manageTab === 'presence'
              ? 'border-primary-200 bg-primary-50 ring-primary-200 shadow-sm ring-2'
              : 'border-grey-200 hover:border-grey-300 bg-white hover:-translate-y-[1px] hover:shadow-sm'
          "
          @click="manageTab = 'presence'"
        >
          <div class="flex items-start gap-3">
            <span
              class="inline-flex size-10 items-center justify-center rounded-xl transition-transform duration-200"
              :class="
                manageTab === 'presence'
                  ? 'bg-primary-100'
                  : 'bg-grey-100 group-hover:scale-105'
              "
            >
              <IconCheckmark
                :font-controlled="false"
                class="size-[18px]"
                :class="
                  manageTab === 'presence'
                    ? 'text-primary-700'
                    : 'text-grey-700'
                "
              />
            </span>

            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p
                  class="text-sm font-semibold transition-colors"
                  :class="
                    manageTab === 'presence'
                      ? 'text-primary-900'
                      : 'text-grey-900'
                  "
                >
                  Presença
                </p>

                <!-- mini “pill” active -->
                <span
                  class="rounded-full px-2 py-1 text-xs transition-all"
                  :class="
                    manageTab === 'presence'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-transparent text-transparent'
                  "
                >
                  Activo
                </span>
              </div>

              <p class="text-grey-600 mt-1 text-xs">
                Confirmar presença e nº de pessoas.
              </p>
            </div>
          </div>

          <!-- brilho subtil no hover -->
          <span
            class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <span
              class="bg-primary-100/40 absolute -left-10 -top-10 size-40 rounded-full blur-2xl"
            ></span>
          </span>
        </button>

        <!-- Ausência -->
        <button
          type="button"
          class="group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200"
          :class="
            manageTab === 'absence'
              ? 'border-danger-200 bg-danger-50 ring-danger-200 shadow-sm ring-2'
              : 'border-grey-200 hover:border-grey-300 bg-white hover:-translate-y-[1px] hover:shadow-sm'
          "
          @click="manageTab = 'absence'"
        >
          <div class="flex items-start gap-3">
            <span
              class="inline-flex size-10 items-center justify-center rounded-xl transition-transform duration-200"
              :class="
                manageTab === 'absence'
                  ? 'bg-danger-100'
                  : 'bg-grey-50 group-hover:scale-105'
              "
            >
              <IconCloseSimple
                :font-controlled="false"
                class="size-[18px]"
                :class="
                  manageTab === 'absence' ? 'text-danger-700' : 'text-grey-400'
                "
              />
            </span>

            <div class="flex-1">
              <div class="flex items-center justify-between">
                <p
                  class="text-sm font-semibold transition-colors"
                  :class="
                    manageTab === 'absence'
                      ? 'text-danger-900'
                      : 'text-grey-900'
                  "
                >
                  Ausência
                </p>

                <span
                  class="rounded-full px-2 py-1 text-xs transition-all"
                  :class="
                    manageTab === 'absence'
                      ? 'bg-danger-100 text-danger-800'
                      : 'bg-transparent text-transparent'
                  "
                >
                  Activo
                </span>
              </div>

              <p class="text-grey-600 mt-1 text-xs">
                Marcar convidado como ausente.
              </p>
            </div>
          </div>

          <span
            class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          >
            <span
              class="bg-danger-100/40 absolute -left-10 -top-10 size-40 rounded-full blur-2xl"
            ></span>
          </span>
        </button>
      </div>

      <!-- Presence tab -->
      <div v-if="manageTab === 'presence'" class="my-4">
        <div
          v-if="guest.absence_Declared"
          class="bg-warning-50 rounded-xl p-3 text-sm"
        >
          Este convidado está marcado como ausente. Ao confirmar presença, a
          ausência será removida.
        </div>

        <!-- RSVP Advanced (embebido, sem “nested modal”) -->
        <LazyGuestsRSVPModal
          :embedded="true"
          :skip-confirmation="true"
          :guest="guest"
          @close-modal="close"
          @confirmed="
            () => {
              emit('updated');
              close();
              toast.success(
                props.guest?.presence_Confirmed
                  ? 'Presença actualizada'
                  : 'Presença confirmada',
              );
            }
          "
        />
      </div>

      <!-- Absence tab -->
      <div v-else class="space-y-3">
        <div
          v-if="guest.presence_Confirmed"
          class="bg-grey-50 rounded-xl p-3 text-sm"
        >
          Este convidado já confirmou presença. Marcar como ausente irá remover
          a confirmação e libertar mesa/lugar.
        </div>

        <BaseTextArea
          id="absenceNote"
          v-model="absenceNote"
          label="Nota (opcional):"
          placeholder="Ex.: Não consegue comparecer por motivo de viagem."
          rows="4"
        />

        <div class="flex justify-end gap-2">
          <BaseButton
            btn-type="outline-primary"
            :disabled="isSubmitting"
            @click="close"
          >
            Cancelar
          </BaseButton>

          <BaseButton
            btn-type="outline-primary"
            :disabled="isSubmitting"
            @click="declareAbsence"
          >
            Declarar ausência
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
