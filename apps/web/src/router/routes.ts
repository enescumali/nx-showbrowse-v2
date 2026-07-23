// Shared real app routes for both main app and tests
// Use dynamic imports for real components

export const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Homepage.vue'),
  },
  {
    path: '/catalog',
    name: 'Catalog',
    component: () => import('../views/Catalog.vue'),
  },
  {
    path: '/today',
    name: 'Today',
    component: () => import('../views/Today.vue'),
  },
  {
    path: '/shows/:id',
    name: 'ShowDetail',
    component: () => import('../views/ShowDetail.vue'),
    props: true,
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found',
  },
];
