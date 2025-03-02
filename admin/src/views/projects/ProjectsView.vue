<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchProjects, createProject, updateProject } from '../../api/projects';
import { getUsers } from '../../api/timesheet';
import type { Project } from '../../types/Project';
// @ts-ignore - Ignore type issues with Vue components for now
import ProjectDrawer from '../../components/projects/ProjectDrawer.vue';
// @ts-ignore - Ignore type issues with Vue components for now
import ProjectCard from '../../components/projects/ProjectCard.vue';

// State
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isProjectDrawerOpen = ref(false);
const selectedProject = ref<Project | null>(null);
const staffMembers = ref<any[]>([]);

// Fetch projects function
const fetchProjectsData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    console.log('Fetching projects from API...');
    // Use exported fetchProjects function
    const response = await fetchProjects();
    console.log('Raw API response:', response);
    
    if (!response || !Array.isArray(response)) {
      console.error('Invalid response format - expected array but got:', typeof response);
      error.value = 'Invalid response format from API';
      projects.value = [];
      return;
    }
    
    // Map the response to ensure it has the expected structure
    projects.value = response.map(project => ({
      ID: project.ID,
      name: project.name || '',
      account_id: project.account_id || 0,
      account: project.account || { ID: 0, name: 'Unknown' },
      active_start: project.active_start || '',
      active_end: project.active_end || '',
      budget_hours: Number(project.budget_hours) || 0,
      budget_dollars: Number(project.budget_dollars) || 0,
      internal: !!project.internal,
      billing_frequency: project.billing_frequency || '',
      project_type: project.project_type || '',
      ae_id: project.ae_id !== undefined ? Number(project.ae_id) : undefined,
      sdr_id: project.sdr_id !== undefined ? Number(project.sdr_id) : undefined,
      billing_codes: project.billing_codes || [], // Include billing codes if available
      // We don't need to map CreatedAt, UpdatedAt, DeletedAt as they're optional
    }));
    
    console.log('Processed projects:', projects.value);
  } catch (err) {
    console.error('Error fetching projects:', err);
    error.value = 'Failed to load projects. Please try again.';
    projects.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Fetch projects on component mount
onMounted(async () => {
  await fetchProjectsData();
  
  // Fetch staff members for AE and SDR mapping
  try {
    const staff = await getUsers();
    staffMembers.value = staff || [];
    console.log('Fetched staff members:', staffMembers.value);
  } catch (err) {
    console.error('Error fetching staff members:', err);
  }
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

// Save project
const saveProject = async (projectData: Project) => {
  try {
    if (projectData.ID && projectData.ID > 0) {
      // Use exported updateProject function
      await updateProject(Number(projectData.ID), projectData);
    } else {
      // Use exported createProject function
      await createProject(projectData);
    }
    
    // Refresh projects
    await fetchProjectsData();
    
    // Close drawer
    closeProjectDrawer();
  } catch (error) {
    console.error('Error saving project:', error);
    alert('Failed to save project. Please try again.');
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
          <i class="fas fa-plus-circle mr-1"></i> Create new project
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
      <button @click="fetchProjectsData" class="btn-secondary mt-4">
        <i class="fas fa-sync mr-2"></i> Retry
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow mt-6">
      <i class="fas fa-project-diagram text-5xl text-teal mb-4"></i>
      <p class="text-lg font-medium text-gray-dark">No projects found</p>
      <p class="text-gray mb-4">Projects will appear here once they are created</p>
    </div>
    
    <!-- Projects List - Full Width -->
    <div v-else class="mt-8 flow-root">
      <ul role="list" class="grid grid-cols-1 gap-6">
        <li v-for="project in projects" :key="project.ID">
          <ProjectCard 
            :project="project" 
            :staff-members="staffMembers"
            @edit="editProject"
          />
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
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background-color: white;
  border: 1px solid var(--color-gray-300);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: var(--color-gray-50);
}
</style> 