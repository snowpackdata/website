<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { projectsAPI, fetchProjects as getProjectsAPI, createProject, updateProject } from '../../api';
import type { Project } from '../../types/Project';
// @ts-ignore - Ignore type issues with Vue components for now
import ProjectDrawer from '../../components/projects/ProjectDrawer.vue';

// State
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isProjectDrawerOpen = ref(false);
const selectedProject = ref<Project | null>(null);

// Fetch projects function
const fetchProjects = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    projects.value = await getProjectsAPI();
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

// Project drawer functions
const openProjectDrawer = (project: Project | null = null) => {
  selectedProject.value = project;
  isProjectDrawerOpen.value = true;
};

const closeProjectDrawer = () => {
  isProjectDrawerOpen.value = false;
  selectedProject.value = null;
};

// Function to edit a project
const editProject = (project: Project) => {
  openProjectDrawer(project);
};

// Function to save project
const saveProject = async (projectData: Project) => {
  try {
    if (projectData.ID) {
      // Update existing project
      await updateProject(projectData.ID, projectData);
    } else {
      // Create new project
      await createProject(projectData);
    }
    // Refresh the list
    await fetchProjects();
    closeProjectDrawer();
  } catch (error) {
    console.error('Error saving project:', error);
  }
};
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-blue">Projects</h1>
        <p class="mt-2 text-sm text-gray">A list of all projects including their status, client, and dates.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          type="button"
          @click="openProjectDrawer()"
          class="block rounded-md bg-sage px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-sage-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          Create new project
        </button>
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
    
    <!-- Projects Cards -->
    <div v-else class="mt-6">
      <ul role="list" class="divide-y divide-gray-200">
        <li v-for="project in projects" :key="project.ID" class="py-5">
          <div class="overflow-hidden bg-white shadow sm:rounded-lg">
            <div class="px-4 py-4 sm:px-6 flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ project.name }}</h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ project.account.name }}</p>
              </div>
              <button
                @click="editProject(project)"
                class="text-teal hover:text-teal-dark rounded-full p-2 hover:bg-gray-100 transition-colors"
                title="Edit Project"
              >
                <i class="fas fa-pencil-alt"></i>
              </button>
            </div>
            <div class="border-t border-gray-100">
              <dl class="divide-y divide-gray-100">
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Start Date</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ project.active_start ? project.active_start : 'Not specified' }}
                  </dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">End Date</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ project.active_end ? project.active_end : 'Not specified' }}
                  </dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Budget Hours</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ project.budget_hours !== null && project.budget_hours !== undefined ? project.budget_hours : 'Not specified' }}
                  </dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Project Type</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ project.project_type || 'Not specified' }}
                  </dd>
                </div>
                <div class="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt class="text-sm font-medium text-gray-900">Internal Project</dt>
                  <dd class="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">
                    {{ project.internal ? 'Yes' : 'No' }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Project Drawer -->
    <ProjectDrawer
      :is-open="isProjectDrawerOpen"
      :project-data="selectedProject"
      @close="closeProjectDrawer"
      @save="saveProject"
    />
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