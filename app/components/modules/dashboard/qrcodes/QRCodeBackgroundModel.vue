<script setup lang="ts">
interface IQRCodeProps {
  guest: Guest;
  color?: 'white' | 'black';
  indicatorColor?: 'white' | 'black';
}

withDefaults(defineProps<IQRCodeProps>(), {
  color: 'black',
  indicatorColor: 'white',
});

const eventStore = useEventStore();
const { apiImageUrl } = useRuntimeConfig().public;
const { siteConfig } = await useClientConfig();

const backgroundStyle = ref<Record<string, string>>({
  backgroundImage: `url('${apiImageUrl}${eventStore.eventQRCodeUrl}')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  color: 'white',
});
</script>
<template>
  <div
    :style="backgroundStyle"
    class="flex h-[900px] w-[900px] flex-col justify-between p-4"
  >
    <div class="mx-2 flex justify-between">
      <NuxtImg
        :src="
          color === 'black'
            ? siteConfig.logoPrimarySmall
            : siteConfig.logoSecondarySmall
        "
        width="537"
        height="185"
        format="webp"
        class="block h-auto w-[220px] max-w-full"
        alt="Logotipo"
      />

      <div
        class="flex flex-col px-3"
        :class="color === 'black' ? 'text-grey-800' : 'text-white'"
      >
        <p class="font-script text-lg">{{ eventStore.eventTypeName }} de</p>
        <p class="font-script text-5xl">{{ eventStore.eventName }}</p>
      </div>
    </div>

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
      <small
        class="text-lg"
        :class="indicatorColor === 'black' ? 'text-grey-800' : 'text-white'"
        >Indicador de mesa</small
      >
    </div>
  </div>
</template>
