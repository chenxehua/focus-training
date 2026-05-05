import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/Users.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'children',
          name: 'Children',
          component: () => import('@/views/Children.vue'),
          meta: { title: '儿童管理' }
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/Orders.vue'),
          meta: { title: '订单管理' }
        },
        {
          path: 'members',
          name: 'Members',
          component: () => import('@/views/Members.vue'),
          meta: { title: '会员管理' }
        },
        {
          path: 'articles',
          name: 'Articles',
          component: () => import('@/views/Articles.vue'),
          meta: { title: '文章管理' }
        },
        {
          path: 'questions',
          name: 'Questions',
          component: () => import('@/views/Questions.vue'),
          meta: { title: '问答管理' }
        },
        {
          path: 'games',
          name: 'Games',
          component: () => import('@/views/Games.vue'),
          meta: { title: '游戏配置' }
        },
        {
          path: 'today-training',
          name: 'TodayTraining',
          component: () => import('@/views/TodayTraining.vue'),
          meta: { title: '今日训练' }
        },
        {
          path: 'training-records',
          name: 'TrainingRecords',
          component: () => import('@/views/TrainingRecords.vue'),
          meta: { title: '训练记录' }
        },
        {
          path: 'assessment-reports',
          name: 'AssessmentReports',
          component: () => import('@/views/AssessmentReports.vue'),
          meta: { title: '评估报告' }
        },
        {
          path: 'analytics',
          name: 'Analytics',
          component: () => import('@/views/Analytics.vue'),
          meta: { title: '数据分析' }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router