<script setup lang="ts">
import { ref, onMounted } from 'vue';
import projectsApi from '../../api/projects';
import type { Project } from '../../types/Project';

// State
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Fetch projects function
const fetchProjects = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    projects.value = await projectsApi.getProjects();
  } catch (err) {
    console.error('Error fetching projects:', err);
    error.value = 'Failed to load projects. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Fetch projects on component mount
onMounted(async () => {
  await fetchProjects();
});


// Format date for display
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Projects</h1>
        <p class="mt-2 text-sm text-gray">A list of all projects including their status, client, and dates.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-spinner fa-spin text-4xl text-teal mb-4"></i>
      <span class="text-gray-dark">Loading projects...</span>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-exclamation-circle text-4xl text-red mb-4"></i>
      <span class="text-gray-dark mb-2">{{ error }}</span>
      <button @click="fetchProjects" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-project-diagram text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No projects found</p>
      <p class="text-gray mb-4">Projects will appear here once they are created</p>
    </div>
    
    <!-- Projects list placeholder -->
    <div v-else class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-medium text-gray-900">Name</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Account</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Start Date</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">End Date</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-medium text-gray-900">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="project in projects" :key="project.ID">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{{ project.name }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ project.account.name }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDate(project.active_start) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDate(project.active_end) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ project.budget_hours }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-secondary:focus {
  outline: none;
}
</style> 