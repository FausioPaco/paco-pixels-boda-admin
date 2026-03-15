<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

const jobsStore = useBackgroundJobsStore();
const showDropdown = ref(false);
const backgroundMenuRef = ref<HTMLElement | null>(null);

const { apiImageUrl } = useRuntimeConfig().public;

onClickOutside(backgroundMenuRef, () => {
  if (!showDropdown.value) return;
  showDropdown.value = false;
});
</script>

<template>
  <div class="relative z-40 hidden md:block">
    <button
      class="text-grey-700 hover:border-primary-300 hover:bg-primary-100 border-grey-100 flex items-center gap-2 rounded-full border px-3 py-2 shadow-sm transition-colors hover:text-white"
      @click="showDropdown = !showDropdown"
    >
      <div class="relative">
        <icon-download
          :font-controlled="false"
          class="text-grey-400 size-[18px]"
        />
        <span
          v-if="jobsStore.activeCount > 0"
          class="bg-primary-500 absolute -right-2 -top-2 flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold text-white"
        >
          {{ jobsStore.activeCount }}
        </span>
      </div>

      <div class="hidden text-left lg:block">
        <p class="text-grey-400 text-xs font-medium">Processamentos</p>
      </div>
    </button>

    <transition name="fade">
      <div
        v-if="showDropdown"
        ref="backgroundMenuRef"
        class="absolute right-0 top-[calc(100%+10px)] w-[360px] max-w-[90vw] rounded-2xl border bg-white px-4 py-3 shadow-xl"
      >
        <div class="mb-3 flex items-center justify-between">
          <div>
            <p class="text-grey-800 text-sm font-semibold">Centro de tarefas</p>
            <p class="text-grey-400 text-xs">Exportações e envios em massa</p>
          </div>

          <button
            class="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
            @click="showDropdown = false"
          >
            Fechar
          </button>
        </div>

        <div
          v-if="jobsStore.sortedJobs.length === 0"
          class="flex flex-col items-center gap-2 py-6 text-center"
        >
          <icon-download
            :font-controlled="false"
            class="text-grey-400 size-[20px]"
          />
          <p class="text-grey-400 text-sm">
            Ainda não existem tarefas em processamento.
          </p>
        </div>

        <div v-else class="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          <div
            v-for="job in jobsStore.sortedJobs"
            :key="job.key"
            class="border-grey-100 rounded-xl border p-3"
          >
            <div class="mb-2 flex items-start justify-between gap-3">
              <div>
                <p class="text-grey-800 text-sm font-semibold">
                  {{ job.title }}
                </p>
                <p class="text-grey-400 text-xs">
                  {{ job.eventName || 'Evento' }}
                </p>
              </div>

              <span
                class="rounded-full px-2 py-1 text-[11px] font-semibold"
                :class="
                  job.status === 'Completed'
                    ? 'bg-success-50 text-success-600'
                    : job.status === 'Failed'
                      ? 'bg-danger-50 text-danger-600'
                      : job.status === 'Cancelled'
                        ? 'bg-grey-100 text-grey-600'
                        : 'bg-primary-50 text-primary-700'
                "
              >
                {{ jobsStore.getBackgroundJobStatusLabel(job.status) }}
              </span>
            </div>

            <div class="mb-2">
              <div class="bg-grey-50 h-2 w-full overflow-hidden rounded-full">
                <div
                  class="bg-primary-500 h-2 transition-all duration-300"
                  :style="{ width: `${job.percent}%` }"
                ></div>
              </div>
            </div>

            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="text-grey-500">
                {{ job.processed }} / {{ job.total }}
              </span>
              <span class="text-grey-700 font-semibold">
                {{ job.percent }}%
              </span>
            </div>

            <p v-if="job.error" class="text-danger-600 mb-2 text-xs">
              {{ job.error }}
            </p>

            <div class="flex flex-wrap gap-2">
              <a
                v-if="job.status === 'Completed' && job.zipUrl"
                :href="`${apiImageUrl}${job.zipUrl}`"
                target="_blank"
                rel="noopener noreferrer"
                class="bg-primary-500 hover:bg-primary-600 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors"
              >
                Transferir ficheiro
              </a>

              <button
                v-if="
                  job.status === 'Completed' ||
                  job.status === 'Failed' ||
                  job.status === 'Cancelled'
                "
                class="border-grey-200 text-grey-700 hover:border-grey-300 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                @click="jobsStore.removeJob(job.key)"
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="jobsStore.completedJobs.length > 0"
          class="mt-3 border-t pt-3"
        >
          <button
            class="text-primary-700 hover:text-primary-800 text-xs font-semibold"
            @click="jobsStore.dismissCompleted()"
          >
            Limpar concluídas
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
