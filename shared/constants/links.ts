import type { AdminLink } from '#shared/types/nav';

export const ADMIN_MAIN_LINKS: AdminLink[] = [
  {
    label: 'Início',
    link: '/admin',
    icon: 'home-alt',
    restricted: false,
  },
  {
    label: 'Convidados',
    link: '/admin/convidados',
    icon: 'shopping-bag',
    restricted: false,
  },
  {
    label: 'Mesas',
    link: '/admin/mesas',
    icon: 'boxes',
    restricted: false,
  },
];

// export const ADMIN_EXPERIENCE_LINKS: AdminLink[] = [
//   {
//     label: 'Menu',
//     link: '/admin/menu',
//     icon: 'online-support',
//     restricted: false,
//   },
//   // {
//   //   label: 'Checklist',
//   //   link: '/admin/checklist',
//   //   icon: 'checklist-box',
//   //   restricted: true,
//   // },
// ];
