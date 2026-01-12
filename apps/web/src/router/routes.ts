import type { RouteRecordRaw } from 'vue-router'

export const staticRoutes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/core/Auth.vue'),
    meta: {
      hideInTab: true,
      title: 'Authentication'
    },
    name: 'Authentication',
    path: '/auth',
    redirect: '/auth/login',
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('#/views/core/Login.vue'),
        meta: {
          title: '登录'
        }
      }
    ]
  },
  {
    component: () => import('#/views/core/Layout.vue'),
    name: 'Layout',
    path: '/',
    meta: {},
    children: []
    // {
    //   path: '/:catchAll(.*)',
    //   redirect: '/404',
    //   meta: {
    //     hideInBreadcrumb: true,
    //     hideInMenu: true,
    //     hideInTab: true,
    //     title: '404'
    //   }
    // }
  }
]

export const matchRoutes: RouteRecordRaw[] = [
  {
    path: '/:path(.*)',
    redirect: '/404',
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      title: '404'
    }
  }
]
