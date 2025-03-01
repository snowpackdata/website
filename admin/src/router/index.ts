import { createRouter, createWebHistory } from 'vue-router';
import AccountsView from '../views/accounts/AccountsView.vue';
import TimesheetView from '../views/timesheet/TimesheetView.vue';
import TimesheetAdminView from '../views/timesheet-admin/TimesheetAdminView.vue';
import InvoicesView from '../views/invoices/InvoicesView.vue';
import BillsView from '../views/bills/BillsView.vue';
import ProjectsView from '../views/projects/ProjectsView.vue';
import BillingCodesView from '../views/billing-codes/BillingCodesView.vue';
import RatesView from '../views/rates/RatesView.vue';

// Define routes
const routes = [
  {
    path: '/',
    redirect: '/timesheet'
  },
  {
    path: '/timesheet',
    name: 'timesheet',
    component: TimesheetView,
    meta: {
      title: 'Timesheet'
    }
  },
  {
    path: '/timesheet-admin',
    name: 'timesheet-admin',
    component: TimesheetAdminView,
    meta: {
      title: 'Timesheet Admin'
    }
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: InvoicesView,
    meta: {
      title: 'Invoices'
    }
  },
  {
    path: '/bills',
    name: 'bills',
    component: BillsView,
    meta: {
      title: 'Bills'
    }
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectsView,
    meta: {
      title: 'Projects'
    }
  },
  {
    path: '/billing-codes',
    name: 'billing-codes',
    component: BillingCodesView,
    meta: {
      title: 'Billing Codes'
    }
  },
  {
    path: '/rates',
    name: 'rates',
    component: RatesView,
    meta: {
      title: 'Rates'
    }
  },
  {
    path: '/accounts',
    name: 'accounts',
    component: AccountsView,
    meta: {
      title: 'Accounts'
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