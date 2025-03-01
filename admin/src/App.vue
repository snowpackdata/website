<template>
  <div>
    <!-- Mobile sidebar -->
    <div class="fixed inset-0 z-50 lg:hidden" v-show="sidebarOpen" @click="sidebarOpen = false">
      <div class="fixed inset-0 bg-gray-900/80" />
      <div class="fixed inset-y-0 left-0 flex max-w-xs w-full" @click.stop>
        <div class="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-gray-900 pt-5 pb-4">
          <div class="absolute right-0 top-0 -mr-12 pt-2">
            <button type="button" class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" @click="sidebarOpen = false">
              <span class="sr-only">Close sidebar</span>
              <i class="fas fa-times h-2 w-2 text-white" aria-hidden="true" />
            </button>
          </div>
          <div class="flex-shrink-0 flex items-center px-4">
            <span class="text-xl font-bold text-white border-b-2 border-sky-600 pb-1">Snowpack Data</span>
          </div>
          <div class="mt-5 flex flex-1 flex-col overflow-y-auto px-4">
            <nav class="flex-1 space-y-1">
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
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
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
          </ul>
        </nav>
      </div>
    </div>

    <div class="lg:pl-64">
      <div class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray bg-gray-800 px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" class="-m-2.5 p-2.5 text-gray-400 hover:text-white lg:hidden" @click.prevent="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <i class="fas fa-bars h-6 w-6" aria-hidden="true" />
        </button>

        <!-- Separator -->
        <div class="h-6 w-px bg-gray-700 lg:hidden" aria-hidden="true" />

        <!-- Mobile title -->
        <div class="lg:hidden flex-1 text-center">
          <span class="text-xl font-bold text-white">Snowpack Data</span>
        </div>

        <div class="hidden lg:flex lg:flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <!-- Separator -->
            <div class="h-6 w-px bg-gray-700" aria-hidden="true" />
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

// Simple function to test the authentication token
const testToken = () => {
  const token = localStorage.getItem('snowpack_token');
  if (token) {
    console.log('Found token in local storage');
    
    // Try both approaches: direct API call and proxied API call
    console.log('Trying direct API call...');
    fetch('http://localhost:8080/api/projects', {
      headers: {
        'x-access-token': token
      }
    })
    .then(response => {
      console.log('Direct API Response Status:', response.status);
      if (response.ok) {
        console.log('Direct API call successful!');
        return response.json();
      } else {
        console.error('Direct API call failed with status:', response.status);
        throw new Error('Direct API call failed');
      }
    })
    .then(data => {
      console.log('Direct API Data:', data);
    })
    .catch(error => {
      console.error('Direct API call error:', error);
      
      // Now try the proxied approach
      console.log('Trying proxied API call...');
      fetch('/api/projects', {
        headers: {
          'x-access-token': token
        }
      })
      .then(response => {
        console.log('Proxied API Response Status:', response.status);
        if (response.ok) {
          console.log('Proxied API call successful!');
          return response.json();
        } else {
          console.error('Proxied API call failed with status:', response.status);
          throw new Error('Both API call methods failed');
        }
      })
      .then(data => {
        console.log('Proxied API Data:', data);
      })
      .catch(proxyError => {
        console.error('All API call methods failed:', proxyError);
      });
    });
  } else {
    console.error('No token found in localStorage!');
  }
};

// Call the test function on app initialization
setTimeout(testToken, 1000);
</script>

<style scoped>
/* Ensure clickable elements aren't covered by anything */
a, button {
  position: relative;
  z-index: 1;
}
</style>

