<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { object, string } from 'yup';
import { toTypedSchema } from '@vee-validate/yup';
import { useAuthStore } from '@/stores/auth';
import { getAuthService } from '~/services/authService';
import { getEventService } from '~/services/eventService';
import { isMultiEventStaffUser } from '~~/shared/constants/roles';

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const router = useRouter();
const authStore = useAuthStore();
const eventStore = useEventStore();

const { siteConfig } = await useClientConfig();

const { errors, handleSubmit, defineField } = useForm({
  validationSchema: toTypedSchema(
    object({
      email: string()
        .email('Deve ser um email válido')
        .required('O seu email é obrigatório'),
      password: string().required('A sua palavra passe é obrigatória'),
    }),
  ),
});

const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');

const nuxtApp = useNuxtApp();
const authService = getAuthService(nuxtApp.$api);
const eventService = getEventService(nuxtApp.$api);

const handlePostLoginRedirect = async () => {
  const loggedUser = authStore.user;

  if (!loggedUser) {
    await router.push('/');
    return;
  }

  // 1) Admin / Super Admin → escolhem evento em /eventos
  if (isMultiEventStaffUser(loggedUser.roleName)) {
    eventStore.clearSelectedEvent?.();
    await router.push('/eventos');
    return;
  }

  // 2) Users por evento → têm de vir com eventId
  if (loggedUser.eventId) {
    const bodaEvent = await eventService.getEvent(loggedUser.eventId);

    const iconName = bodaEvent.eventTypeIcon || 'event-wedding';

    eventStore.selectEvent({
      id: bodaEvent.id,
      name: bodaEvent.name,
      slug: bodaEvent.slug,
      icon: iconName,
      eventTypeId: bodaEvent.eventTypeId ?? undefined,
      initials: bodaEvent.initials,
      qrCodeImage_Url: bodaEvent.qrCodeImage_Url,
      eventTypeName: bodaEvent.eventTypeName,
    });

    await router.push('/admin');
    return;
  }

  // 3) fallback: user sem evento associado
  serverErrors.value = {
    hasErrors: true,
    message:
      'A sua conta não está associada a nenhum evento. Por favor, contacte a equipa de suporte.',
  };
};

const onSubmit = handleSubmit(async (values) => {
  isSubmiting.value = true;
  serverErrors.value = {
    hasErrors: false,
    message: '',
  };

  try {
    const credentials: UserLoginInput = {
      email: values.email.trim(),
      password: values.password,
      context: 'partner-admin',
    };

    const userData = await authService.authenticate(credentials);
    authStore.setUserData(userData);

    setTimeout(async () => {
      await handlePostLoginRedirect();
    }, 100);
  } catch (err: ApiServerError) {
    console.error(err?.data);

    serverErrors.value = {
      hasErrors: true,
      message: getServerErrors(err?.data ?? err),
    };

    isSubmiting.value = false;
  }
});
</script>
<template>
  <div
    class="my-10 flex w-full animate-fadeIn flex-col items-center justify-center px-4"
  >
    <div class="w-full px-4 md:max-w-[700px]">
      <h3 class="text-grey-700 mb-2 text-3xl font-bold md:text-4xl">
        {{ siteConfig.loginTitle }}
      </h3>
      <p
        class="text-grey-600 mb-3 text-base font-normal leading-6 md:max-w-full md:text-xl lg:max-w-2xl"
      >
        {{ siteConfig.loginDescription }}
      </p>

      <form
        id="weedingMessage"
        autocomplete="on"
        class="my-4"
        novalidate
        @submit.prevent="onSubmit"
      >
        <BaseInput
          id="email"
          v-model="email"
          v-bind="emailAttrs"
          :error-message="errors.email"
          autocomplete="email"
          type="email"
          name="email"
          label="Email:"
          placeholder="Coloque o seu endereço eletrônico"
          :readonly="isSubmiting"
        />

        <BaseInput
          id="password"
          v-model="password"
          autocomplete="current-password"
          v-bind="passwordAttrs"
          :error-message="errors.password"
          type="password"
          name="password"
          label="Password:"
          placeholder="Coloque a sua palavra passe"
          :readonly="isSubmiting"
        />

        <BaseLoading
          v-if="isSubmiting"
          size="md"
          orientation="horizontal"
          message="Por favor, espere um momento..."
        />
        <BaseError v-if="serverErrors.hasErrors">{{
          serverErrors.message
        }}</BaseError>

        <BaseButton
          v-if="!isSubmiting"
          type="submit"
          icon="login"
          btn-type="outline-primary"
          class="my-3 flex items-center space-x-3"
          size="md"
          @click="onSubmit"
        >
          Entrar
        </BaseButton>
      </form>
    </div>
  </div>
</template>
