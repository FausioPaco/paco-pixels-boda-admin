<script lang="ts" setup>
interface IConfirmationForm {
  guest: Guest | undefined;
}

defineProps<IConfirmationForm>();
defineEmits(['nextStep', 'previousStep']);
</script>
<template>
  <div class="animate-fadeIn py-2">
    <p>
      Confirma que é <b>{{ guest?.name }}</b
      >?
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
        >Sim,</BaseButton
      >

      <BaseButton
        type="button"
        btn-type="outline-primary"
        class="my-1"
        size="md"
        @click="$emit('previousStep')"
        >Não sou eu</BaseButton
      >
    </div>
  </div>
</template>
