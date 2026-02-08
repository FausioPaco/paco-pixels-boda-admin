<script lang="ts" setup>
interface IRSVPForm {
  show?: boolean;
  guest?: Guest | undefined;
  embedded?: boolean;
  skipConfirmation?: boolean;
}

const props = withDefaults(defineProps<IRSVPForm>(), {
  show: false,
  guest: undefined,
  embedded: false,
  skipConfirmation: true,
});

const emit = defineEmits(['closeModal', 'confirmed']);

const currentStep = ref<'confirmation' | 'details'>(
  props.skipConfirmation ? 'details' : 'confirmation',
);

watch(
  () => [props.show, props.guest, props.skipConfirmation],
  () => {
    currentStep.value = props.skipConfirmation ? 'details' : 'confirmation';
  },
);

const closeModal = () => {
  currentStep.value = props.skipConfirmation ? 'details' : 'confirmation';
  emit('closeModal');
};

const confirmGuest = () => {
  emit('confirmed');

  // se estiver embedded, não fechamos nenhum modal extra
  if (!props.embedded) {
    emit('closeModal');
  }

  currentStep.value = props.skipConfirmation ? 'details' : 'confirmation';
};

const goToDetails = () => {
  currentStep.value = 'details';
};

const goBackToConfirmation = () => {
  if (props.skipConfirmation) {
    closeModal();
    return;
  }
  currentStep.value = 'confirmation';
};
</script>

<template>
  <template v-if="embedded">
    <Transition name="fade" mode="out-in">
      <div :key="currentStep">
        <GuestsRSVPConfirmation
          v-if="currentStep === 'confirmation'"
          :guest="guest"
          @next-step="goToDetails"
          @previous-step="closeModal"
        />

        <GuestsRSVPDetails
          v-else
          :guest="guest"
          @previous-step="goBackToConfirmation"
          @next-step="confirmGuest"
        />
      </div>
    </Transition>
  </template>

  <BaseModal
    v-else
    :show="show"
    title="Confirmar Presença"
    @close-modal="closeModal"
  >
    <Transition name="fade" mode="out-in">
      <div :key="currentStep">
        <GuestsRSVPConfirmation
          v-if="currentStep === 'confirmation'"
          :guest="guest"
          @next-step="goToDetails"
          @previous-step="closeModal"
        />

        <GuestsRSVPDetails
          v-else
          :guest="guest"
          @previous-step="goBackToConfirmation"
          @next-step="confirmGuest"
        />
      </div>
    </Transition>
  </BaseModal>
</template>
