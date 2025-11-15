<script setup lang="ts">
interface IQRCodeProps {
  guest: Guest;
}

defineProps<IQRCodeProps>();

const { eventQRCodeUrl } = useEventStore();

const backgroundStyle = ref<Record<string, string>>({
  backgroundImage: `url('${eventQRCodeUrl}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  color: 'white',
});
</script>
<template>
  <div :style="backgroundStyle" class="h-[1000px] w-[1000px] py-2">
    <h2>Hello World</h2>

    <!-- QR Code -->
    <div
      class="mx-auto my-6 flex w-full flex-col items-center justify-center gap-2"
    >
      <Qrcode
        :value="`${guest.name} - Mesa: ${guest.deskName}`"
        variant="pixelated"
        width="180"
        height="180"
      />
      <small class="text-grey-200">Indicador de mesa</small>
    </div>
  </div>
</template>
