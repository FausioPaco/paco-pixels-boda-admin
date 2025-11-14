<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth';

interface DeskViewProps {
  desk: Desk;
}

const props = defineProps<DeskViewProps>();

const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const { isAdministrator, isSuperAdministrator } = useAuthStore();
const { refreshDesk } = await useDesk(props.desk.id);

const getAvaliablePlaces = computed(() => {
  return props.desk.seats_Limit - props.desk.seats_Filled;
});

const guestsPeopleCount = computed(() => {
  if (props.desk.guests == null) return 0;

  return props.desk.guests.reduce((accumulator: number, guest) => {
    return accumulator + guest.people_Count;
  }, 0);
});
</script>
<template>
  <BaseCard
    :title="desk.name"
    description="Verifique todos os detalhes desta mesa aqui"
    back-link="/admin/mesas"
  >
    <div
      class="flex w-full animate-fadeIn flex-col px-3 md:flex-row md:justify-between"
    >
      <!-- Desk Info -->
      <div class="md:w-1/2">
        <BaseDescriptionList>
          <BaseDescriptionListItem
            title="Nome da Mesa"
            :description="desk.name"
          />
          <BaseDescriptionListItem
            title="Número de Pessoas"
            :description="
              desk.seats_Limit == 1 ? '1 Pessoa' : `${desk.seats_Limit} Pessoas`
            "
          />

          <BaseDescriptionListItem
            title="Lugares Ocupados"
            :description="
              desk.seats_Limit == 1
                ? '1 Pessoa'
                : `${props.desk?.seats_Filled} Lugares`
            "
          />
          <BaseDescriptionListItem
            title="Lugares Disponíveis"
            :description="
              getAvaliablePlaces == 1
                ? '1 Pessoa'
                : `${getAvaliablePlaces} Lugares`
            "
          />
        </BaseDescriptionList>

        <div
          v-if="isAdministrator || isSuperAdministrator"
          class="my-4 flex items-center space-x-2"
        >
          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            icon="pencil"
            @click="showFormModal = true"
          >
            Modificar
          </BaseButton>

          <BaseButton
            type="button"
            size="sm"
            btn-type="outline-primary"
            class="flex items-center space-x-1"
            icon="cancel"
            @click="showRemoveModal = true"
          >
            Remover
          </BaseButton>
        </div>
      </div>

      <!-- Desk Guests -->
      <LazyDesksTableView
        v-if="desk"
        :desk-name="desk.name"
        :guests="desk.guests"
        :people-count="guestsPeopleCount"
      />

      <LazyDesksFormModal
        v-if="desk"
        :show="showFormModal"
        :desk="desk"
        @close-modal="showFormModal = false"
        @success="refreshDesk({ force: true })"
      />

      <LazyDesksRemoveModal
        :show="showRemoveModal"
        :desk="desk"
        @close-modal="showRemoveModal = false"
        @success="$router.push('/admin/mesas')"
      />
    </div>
  </BaseCard>
</template>
