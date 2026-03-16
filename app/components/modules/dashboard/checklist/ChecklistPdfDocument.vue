<script setup lang="ts">
defineProps<{
  coupleName: string;
  documentTitle: string;
  sections: {
    id: number;
    title: string;
    tasks: {
      id: number;
      title: string;
      notes?: string | null;
      due_Date?: string | null;
      has_Indefinite_Date?: boolean;
      is_Completed: boolean;
    }[];
  }[];
}>();

const getTaskStatusLabel = (task: {
  is_Completed: boolean;
  due_Date?: string | null;
  has_Indefinite_Date?: boolean;
}) => {
  if (task.is_Completed) return 'Concluída';
  if (task.has_Indefinite_Date) return 'Sem data limite';
  if (!task.due_Date) return 'Pendente';

  const dueDate = new Date(task.due_Date);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (dueDate < today) return 'Atrasada';

  return 'Pendente';
};
</script>

<template>
  <div class="flex h-[1123px] w-[794px] flex-col overflow-hidden bg-white">
    <div
      class="bg-primary-800 flex items-center justify-between px-10 pb-5 pt-3 text-white"
    >
      <div class="pb-2 font-script text-3xl font-medium leading-none">
        {{ coupleName }}
      </div>

      <div class="font-sans text-sm font-extralight tracking-[5px]">
        {{ documentTitle }}
      </div>
    </div>

    <div class="flex-1 px-10 py-8">
      <div
        v-if="sections.length === 0"
        class="text-grey-500 font-sans text-base"
      >
        Sem secções para apresentar.
      </div>

      <div v-for="section in sections" :key="section.id" class="mb-7 last:mb-0">
        <div class="border-primary-400 mb-4 border-b pb-4">
          <h2 class="text-primary-800 font-sans text-xl font-semibold">
            {{ section.title }}
          </h2>
        </div>

        <div
          v-if="section.tasks.length === 0"
          class="text-grey-400 font-sans text-sm italic"
        >
          Sem tarefas nesta secção.
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="task in section.tasks"
            :key="task.id"
            class="border-grey-200 break-inside-avoid rounded-2xl border px-6 py-4"
          >
            <div class="flex items-start gap-4">
              <div
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                :class="
                  task.is_Completed
                    ? 'border-success-500 bg-success-500'
                    : 'border-grey-300 bg-white'
                "
              >
                <span
                  v-if="task.is_Completed"
                  class="text-[11px] font-bold leading-none text-white"
                >
                  ✓
                </span>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-4">
                  <div
                    class="text-grey-900 font-sans text-[15px] font-semibold leading-6"
                  >
                    {{ task.title }}
                  </div>

                  <div
                    class="text-primary-700 shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-[0.5px]"
                  >
                    {{ getTaskStatusLabel(task) }}
                  </div>
                </div>

                <div
                  v-if="task.due_Date && !task.has_Indefinite_Date"
                  class="text-grey-500 mt-1.5 font-sans text-sm leading-5"
                >
                  Data limite: {{ formatDate(task.due_Date) }}
                </div>

                <div
                  v-else-if="task.has_Indefinite_Date"
                  class="text-grey-500 mt-1.5 font-sans text-sm leading-5"
                >
                  Sem data limite
                </div>

                <div
                  v-if="task.notes"
                  class="text-grey-600 mt-2 font-sans text-sm leading-6"
                >
                  {{ task.notes }}
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
