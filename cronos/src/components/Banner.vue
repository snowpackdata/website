
<template>
  <div class="bg-gray-900">
    <div class="absolute inset-x-0 top-0 z-50">
      <nav class="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div class="flex lg:flex-1">
          <a href="/" class="-m-1.5 p-1.5">
            <span class="sr-only">Snowpack Data</span>
            <img class="h-8 w-auto" src="" alt="">
          </a>
        </div>
        <div class="flex lg:hidden">
          <button id="openMenu" type="button" class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white">
            <span class="sr-only">Open main menu</span>
            <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
        <div class="hidden lg:flex lg:gap-x-12">
          <a href="/about" class="text-sm/6 font-semibold text-white">About Us</a>
          <a href="/services" class="text-sm/6 font-semibold text-white">Services</a>
          <a href="/blog" class="text-sm/6 font-semibold text-white">Blog</a>
          <a href="/articles/case-study" class="text-sm/6 font-semibold text-white">Case Studies</a>
          <a href="/free-assessment" class="text-sm/6 font-semibold text-white">Free Consultation</a>
          <a href="/contact" class="text-sm/6 font-semibold text-white">Contact</a>
        </div>
        <div class="hidden lg:flex lg:flex-1 lg:justify-end">
          <a id="login" href="#" class="text-sm/6 font-semibold text-white">Log In <span aria-hidden="true">&rarr;</span></a>
        </div>
      </nav>
      <!-- Mobile menu, show/hide based on menu open state. -->
      <div id="menu" class="hidden" role="dialog" aria-modal="true">
        <!-- Background backdrop, show/hide based on slide-over state. -->
        <div class="fixed inset-0 z-50"></div>
        <div class="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div class="flex items-center justify-between">
            <a href="#" class="-m-1.5 p-1.5">
              <span class="sr-only">Snowpack Data</span>
              <img class="h-8 w-auto" src="" alt="">
            </a>
            <span class="text-gray-dark font-bold">Snowpack Data</span>
            <button id="closeMenu" type="button" class="-m-2.5 rounded-md p-2.5 text-gray-dark">
              <span class="sr-only">Close menu</span>
              <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mt-6 flow-root">
            <div class="-my-6 divide-y divide-gray-500/25">
              <div class="space-y-2 py-6">
                <a href="/about" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">About Us</a>
                <a href="/services" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">Services</a>
                <a href="/articles/case-study" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">Case Studies</a>
                <a href="/free-assessment" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">Free Consultation</a>
                <a href="/contact" class="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">Contact</a>
              </div>
              <div class="py-6">
                <a href="/login" class="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-dark hover:bg-gray-800">Log in</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
</style>