<script lang="ts" setup>
const { eventId } = useEventStore();
const queryParameters = reactive<UserParameters>({
  eventId: Number(eventId!),
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 8,
});

const { users, pagination, isRefreshing, isError, refreshUsers } =
  await useUsersList(queryParameters);
const { isAdministrator, isSuperAdministrator } = useAuthStore();

const searchQuery = ref('');
const showFormModal = ref<boolean>(false);
const showRemoveModal = ref<boolean>(false);
const showPasswordModal = ref<boolean>(false);
const userSelected = ref<User | undefined>(undefined);

const debouncedSearch = useDebounceFn(() => {
  queryParameters.searchQuery = searchQuery.value;
  queryParameters.pageNumber = 1;
}, 600);

watch(searchQuery, () => {
  debouncedSearch();
});

watch(queryParameters, () => {
  refreshUsers({ force: true });
});

function onPageChange(newPage: number) {
  queryParameters.pageNumber = newPage;
}

function onPageSelected(newPage: number) {
  queryParameters.pageNumber = newPage;
}

const isFirstTime = computed(
  () =>
    !isRefreshing &&
    !isError &&
    users.value.length === 0 &&
    searchQuery.value === '',
);

const addUser = () => {
  userSelected.value = undefined;
  showFormModal.value = true;
};

const updateUser = (user: User) => {
  userSelected.value = user;
  showFormModal.value = true;
};

const removeUser = (user: User) => {
  userSelected.value = user;
  showRemoveModal.value = true;
};

const updatePassword = (user: User) => {
  userSelected.value = user;
  showPasswordModal.value = true;
};

const reloadUsers = () => {
  userSelected.value = undefined;
  refreshUsers({ force: true });
};

onMounted(() => {
  refreshUsers({ force: true });
});
</script>
<template>
  <BaseCard
    title="Gestão de Utilizadores"
    description="Faça a gestão utilizadores deste evento aqui"
  >
    <section
      id="users"
      class="relative flex min-h-[450px] w-full flex-col items-center px-4 py-5"
    >
      <div
        class="flex min-w-full max-w-full flex-col items-stretch justify-stretch"
      >
        <!-- Filters & Counter -->
        <div
          class="flex w-full animate-fadeIn flex-col md:flex-row md:justify-between"
        >
          <div class="w-full md:w-1/2">
            <BaseInput
              id="userName"
              v-model="searchQuery"
              autocomplete="name"
              type="search"
              name="userName"
              label="Pesquisa:"
              placeholder="Pesquise o nome do utilizador"
              :readonly="isRefreshing"
            />

            <!-- Counter & Limit -->
            <div v-if="!isRefreshing" class="flex items-center justify-between">
              <div class="my-4 flex items-center space-x-2">
                <icon-funnel
                  :font-controlled="false"
                  class="text-primary-700 block h-7 w-7"
                ></icon-funnel>
                <h3 class="text-primary-700 text-2xl font-bold">
                  {{
                    pagination?.totalCount === 1
                      ? '1 Utilizador'
                      : `${pagination ? pagination.totalCount : 0} Utilizadores`
                  }}
                </h3>
              </div>
            </div>
          </div>

          <div
            class="flex w-full flex-col justify-start gap-4 md:w-1/2 md:flex-row md:items-end md:justify-end md:gap-2 md:pt-5"
          >
            <BaseButton
              icon="add"
              size="md"
              btn-type="primary"
              @click.prevent="addUser"
            >
              Adicionar Utilizador
            </BaseButton>
          </div>
        </div>

        <!-- Loading -->
        <BaseTableLoading v-if="isRefreshing" class="hidden md:block" />

        <BaseLoading
          v-if="isRefreshing"
          size="lg"
          orientation="vertical"
          class="block md:hidden"
        />

        <!-- SearchNotFound -->
        <BaseSearchNotFound
          v-if="!isFirstTime && users.length === 0"
          @fallback="refreshUsers"
        >
          Infelizmente, não encontramos fornecedores para o filtro aplicado
        </BaseSearchNotFound>

        <!-- No user: first Time -->
        <LazyBaseFirstEmptyState
          v-if="isFirstTime"
          icon="icon-account"
          title="Ainda não adicionou nenhum utilizador"
          description="Crie o seu primeiro utilizador para começar a gerir o acesso ao sistema de forma mais eficiente."
          :show-button="isAdministrator || isSuperAdministrator"
          button-label="Criar primeiro utilizador"
          button-icon="add"
          @action="showFormModal = true"
        />

        <!-- Data -->
        <BaseTable
          v-if="!isRefreshing && !isError && users.length > 0"
          summary="Tabela sobre a lista de utilizadores"
        >
          <template #thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Email</th>
              <th scope="col">Papel</th>
              <th scope="col">Palavra-passe</th>
              <th scope="col">Acções</th>
            </tr>
          </template>
          <template #tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.roleName }}</td>
              <td>
                <BaseButton
                  v-if="isAdministrator || isSuperAdministrator"
                  size="sm"
                  btn-type="outline-primary"
                  @click.prevent="updatePassword(user)"
                >
                  Alterar password
                </BaseButton>
              </td>
              <td>
                <div class="flex space-x-2">
                  <BaseButton
                    v-if="isAdministrator || isSuperAdministrator"
                    size="sm"
                    btn-type="primary"
                    @click.prevent="updateUser(user)"
                  >
                    Modificar
                  </BaseButton>

                  <BaseButton
                    v-if="isAdministrator || isSuperAdministrator"
                    size="sm"
                    btn-type="outline-primary"
                    @click.prevent="removeUser(user)"
                  >
                    Remover
                  </BaseButton>
                </div>
              </td>
            </tr>
          </template>
        </BaseTable>

        <!-- Pagination -->
        <BasePagination
          v-if="pagination && pagination.totalPages > 1"
          :pagination-data="pagination"
          @page-change="onPageChange"
          @page-selected="onPageSelected"
        />
      </div>

      <!-- Modals -->
      <LazyUsersFormModal
        :show="showFormModal"
        :user="userSelected"
        @close-modal="showFormModal = false"
        @success="reloadUsers"
      />

      <LazyUsersRemoveModal
        :show="showRemoveModal"
        :user="userSelected"
        @close-modal="showRemoveModal = false"
        @success="reloadUsers"
      />

      <LazyUsersResetPasswordModal
        :show="showPasswordModal"
        :user="userSelected"
        @close-modal="showPasswordModal = false"
        @reload="reloadUsers"
      />
    </section>
  </BaseCard>
</template>
