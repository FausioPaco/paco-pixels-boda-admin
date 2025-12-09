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
    label: 'Checklist',
    link: '/admin/checklist',
    icon: 'checklist-box',
    restricted: false,
  },
  // {
  //   label: 'Menu',
  //   link: '/admin/menu',
  //   icon: 'online-support',
  //   restricted: false,
  // },
];
