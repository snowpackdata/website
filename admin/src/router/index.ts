import { createRouter, createWebHistory } from 'vue-router';

// Define routes - Use dynamic imports to avoid typecheck errors
const routes = [
  {
    path: '/',
    redirect: '/timesheet'
  },
  {
    path: '/timesheet',
    name: 'timesheet',
    component: () => import('../views/timesheet/TimesheetView.vue'),
    meta: {
      title: 'Timesheet'
    }
  },
  {
    path: '/timesheet-admin',
    name: 'timesheet-admin',
    component: () => import('../views/timesheet-admin/TimesheetAdminView.vue'),
    meta: {
      title: 'Timesheet Admin'
    }
  },
  {
    path: '/accounts-receivable',
    name: 'accounts-receivable',
    component: () => import('../views/invoices/AccountsReceivableView.vue'),
    meta: {
      title: 'Accounts Receivable'
    }
  },
  {
    path: '/accounts-payable',
    name: 'accounts-payable',
    component: () => import('../views/bills/AccountsPayableView.vue'),
    meta: {
      title: 'Accounts Payable'
    }
  },
  // Keep these routes for backward compatibility but redirect to the new routes
  {
    path: '/invoices',
    redirect: '/accounts-receivable'
  },
  {
    path: '/bills',
    redirect: '/accounts-payable'
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('../views/projects/ProjectsView.vue'),
    meta: {
      title: 'Projects'
    }
  },
  {
    path: '/billing-codes',
    name: 'billing-codes',
    // @ts-ignore - Vue component type declaration
    component: () => import('../views/billing-codes/BillingCodesView.vue'),
    meta: {
      title: 'Billing Codes'
    }
  },
  {
    path: '/rates',
    name: 'rates',
    component: () => import('../views/rates/RatesView.vue'),
    meta: {
      title: 'Rates'
    }
  },
  {
    path: '/accounts',
    name: 'accounts',
    // @ts-ignore - Vue component type declaration
    component: () => import('../views/accounts/AccountsView.vue'),
    meta: {
      title: 'Accounts'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings/SettingsView.vue'),
    meta: {
      title: 'System Settings'
    }
  }
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
});

// Update page title based on route meta
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || 'Admin'} | Cronos`;
  next();
});

export default router; 