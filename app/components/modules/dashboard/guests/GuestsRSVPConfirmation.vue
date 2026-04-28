<script lang="ts" setup>
const { t } = useI18n();

interface IConfirmationForm {
  guest: Guest | undefined;
}

defineProps<IConfirmationForm>();
defineEmits(['nextStep', 'previousStep']);
</script>
<template>
  <div class="animate-fadeIn py-2">
    <p>
      {{ t('guests.rsvp_confirm_question', { name: guest?.name }) }}
    </p>

    <div
      class="mt-3 flex w-full animate-fadeIn items-center justify-center space-x-3"
    >
      <BaseButton
        type="submit"
        btn-type="primary"
        class="my-1"
        size="md"
        @click="$emit('nextStep')"
        >{{ t('guests.rsvp_confirm_yes') }}</BaseButton
      >

      <BaseButton
        type="button"
        btn-type="outline-primary"
        class="my-1"
        size="md"
        @click="$emit('previousStep')"
        >{{ t('guests.rsvp_confirm_no') }}</BaseButton
      >
    </div>
  </div>
</template>
