<template>
  <div>
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog as="div" class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity ease-linear duration-300" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-900/80" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild as="template" enter="transition ease-in-out duration-300 transform" enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0" leave-to="-translate-x-full">
            <DialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0">
                <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>
              <!-- Sidebar component for mobile -->
              <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 shadow-lg px-6 pb-4">
                <div class="flex h-16 shrink-0 items-center">
                  <span class="text-xl font-bold text-white">Snowpack Data</span>
                </div>
                <nav class="flex flex-1 flex-col">
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <!-- Sidebar component, for desktop -->
      <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 shadow-xl px-6 pb-4">
        <div class="flex h-16 shrink-0 items-center">
          <span class="text-xl font-bold text-white border-b-2 border-sky-600 pb-1">Snowpack Data</span>
        </div>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in navigationItems" :key="item.path">
                  <router-link :to="item.path" :class="[
                    $route.path === item.path 
                      ? 'bg-sky-900 text-white shadow-md' 
                      : 'text-gray-400 hover:bg-sky-800 hover:text-white', 
                    'group flex gap-x-3 rounded-md p-2.5 text-sm font-semibold transition-all duration-200'
                  ]">
                    <i :class="['fas', item.icon, 'h-5 w-5 shrink-0']" aria-hidden="true" />
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
            <li class="mt-auto">
              <a href="#" class="group -mx-2 flex gap-x-3 rounded-md p-2.5 text-sm font-semibold text-gray-400 hover:bg-sky-800 hover:text-white transition-all duration-200">
                <i class="fas fa-cog h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" aria-hidden="true" />
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="lg:pl-72">
      <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray bg-gray-800 px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" class="-m-2.5 p-2.5 text-gray-400 hover:text-white lg:hidden" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <i class="fas fa-bars h-6 w-6" aria-hidden="true" />
        </button>

        <!-- Separator -->
        <div class="h-6 w-px bg-gray-700 lg:hidden" aria-hidden="true" />

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <!-- Separator -->
            <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-700" aria-hidden="true" />

            <!-- Profile dropdown -->
          </div>
        </div>
      </div>

      <main class="py-10 bg-gray-50 min-h-screen">
        <div class="px-4 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import {
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const route = useRoute();

// Define navigation items with paths and icons
const navigationItems = [
  { name: 'Timesheet', path: '/timesheet', icon: 'fa-clock' },
  { name: 'Timesheet Admin', path: '/timesheet-admin', icon: 'fa-toolbox' },
  { name: 'Invoices', path: '/invoices', icon: 'fa-file-invoice-dollar' },
  { name: 'Bills', path: '/bills', icon: 'fa-file-invoice-dollar' },
  { name: 'Projects', path: '/projects', icon: 'fa-bars-progress' },
  { name: 'Billing Codes', path: '/billing-codes', icon: 'fa-barcode' },
  { name: 'Rates', path: '/rates', icon: 'fa-percent' },
  { name: 'Accounts', path: '/accounts', icon: 'fa-building' }
];

// State for mobile sidebar
const sidebarOpen = ref(false);

// Dynamically set page title based on current route
const pageTitle = computed(() => {
  if (route.name) {
    return String(route.name);
  }
  return 'Dashboard';
});

// Set document title when route changes
watch(() => route.name, () => {
  document.title = `Cronos Admin - ${pageTitle.value}`;
}, { immediate: true });
</script>

