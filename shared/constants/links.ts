import type { AdminLink } from '#shared/types/nav';

export const ADMIN_MAIN_LINKS: AdminLink[] = [
  {
    label: 'Início',
    link: '/admin',
    icon: 'dashboard-home',
    restricted: false,
  },
  {
    label: 'Convidados',
    link: '/admin/convidados',
    icon: 'dashboard-guests',
    restricted: false,
  },
  {
    label: 'Mesas',
    link: '/admin/mesas',
    icon: 'dashboard-desks',
    restricted: false,
  },
  {
    label: 'Orçamento',
    link: '/admin/orcamento',
    icon: 'dashboard-budget',
    restricted: false,
  },
  {
    label: 'Bebidas',
    link: '/admin/bebidas',
    icon: 'beverage',
    restricted: false,
  },
  {
    label: 'Fornecedores',
    link: '/admin/fornecedores',
    icon: 'dashboard-suppliers',
    restricted: false,
  },
];

export const ADMIN_CONFIGURATION_LINKS: AdminLink[] = [
  {
    label: 'Utilizadores',
    link: '/admin/utilizadores',
    icon: 'user-settings',
    restricted: false,
  },
];

export const ADMIN_EXPERIENCE_LINKS: AdminLink[] = [
  {
    label: 'Cronograma',
    link: '/admin/cronograma',
    icon: 'calendar',
    restricted: false,
  },

  // {
  //   label: 'Menu',
  //   link: '/admin/menu',
  //   icon: 'online-support',
  //   restricted: false,
  // },
];
