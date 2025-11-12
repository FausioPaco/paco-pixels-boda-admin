import { defineStore } from 'pinia';

export interface SelectedEvent {
  id: number;
  name: string;
  slug?: string | undefined;
  eventTypeId?: number | undefined;
}

const COOKIE_ID = 'current_event_id';
const COOKIE_NAME = 'current_event_name';
const COOKIE_SLUG = 'current_event_slug';

export const useEventStore = defineStore('event', () => {
  const selected = ref<SelectedEvent | null>(null);

  // getters
  const hasEvent = computed(() => !!selected.value?.id);
  const eventId = computed<number | null>(() => selected.value?.id ?? null);
  const eventName = computed<string>(() => selected.value?.name ?? '');
  const eventSlug = computed<string | undefined | null>(
    () => selected.value?.slug,
  );

  const persist = (ev: SelectedEvent | null) => {
    const expirationDate = new Date();

    // por padrão, guarda 7 dias (ajusta se precisares)
    expirationDate.setDate(expirationDate.getDate() + 7);

    const idCookie = useCookie<number | null>(COOKIE_ID, {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });
    const nameCookie = useCookie<string | null>(COOKIE_NAME, {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });
    const slugCookie = useCookie<string | null>(COOKIE_SLUG, {
      expires: expirationDate,
      secure: true,
      sameSite: 'lax',
    });

    if (!ev) {
      idCookie.value = null;
      nameCookie.value = null;
      slugCookie.value = null;
      return;
    }

    idCookie.value = ev.id;
    nameCookie.value = ev.name;
    slugCookie.value = ev.slug ?? null;
  };

  // API pública
  const selectEvent = (ev: SelectedEvent) => {
    selected.value = { id: ev.id, name: ev.name, slug: ev.slug ?? undefined };
    persist(selected.value);
  };

  const selectEventById = (id: number, name?: string, slug?: string | null) => {
    selected.value = { id, name: name ?? 'Evento', slug: slug ?? undefined };
    persist(selected.value);
  };

  const clearSelectedEvent = () => {
    selected.value = null;
    persist(null);
  };

  const loadFromCookies = () => {
    const id = useCookie<number | null>(COOKIE_ID);
    const name = useCookie<string | null>(COOKIE_NAME);
    const slug = useCookie<string | null>(COOKIE_SLUG);

    if (id.value) {
      selected.value = {
        id: id.value,
        name: name.value ?? 'Evento',
        slug: slug.value ?? undefined,
      };
    }
  };

  /**
   * Garante que existe um evento selecionado. Lança erro (ou redireciona, se preferires).
   * Útil para chamadas que obrigatoriamente precisam de eventId.
   */
  const ensureSelected = () => {
    if (!selected.value?.id) {
      throw new Error(
        'Nenhum evento selecionado. Por favor, escolha um evento.',
      );
    }
    return selected.value.id;
  };

  return {
    selected,
    hasEvent,
    eventId,
    eventName,
    eventSlug,
    selectEvent,
    selectEventById,
    clearSelectedEvent,
    loadFromCookies,
    ensureSelected,
  };
});
