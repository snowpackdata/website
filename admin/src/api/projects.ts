import type { Project } from '../types/Project';
import { fetchAll, fetchById, create, update, remove } from './apiUtils';

/**
 * API service for project-related operations
 */
const projectsAPI = {
  /**
   * Get all projects
   * @returns Promise with array of projects
   */
  async getProjects(): Promise<Project[]> {
    return fetchAll<Project>('projects');
  },

  /**
   * Get a single project by ID
   * @param id - Project ID
   * @returns Promise with project data
   */
  async getProject(id: number): Promise<Project> {
    return fetchById<Project>('projects', id);
  },

  /**
   * Create a new project
   * @param project - Project data
   * @returns Promise with created project
   */
  async createProject(project: Project): Promise<Project> {
    return create<Project>('projects', project);
  },

  /**
   * Update an existing project
   * @param project - Project data to update
   * @returns Promise with updated project
   */
  async updateProject(project: Project): Promise<Project> {
    return update<Project>('projects', project.ID, project);
  },

  /**
   * Delete a project
   * @param id - ID of project to delete
   * @returns Promise with deletion result
   */
  async deleteProject(id: number): Promise<any> {
    return remove('projects', id);
  },
  
  /**
   * Get projects for a specific account
   * @param accountId - ID of the account
   * @returns Promise with array of projects
   */
  async getAccountProjects(accountId: number): Promise<Project[]> {
    return fetchAll<Project>(`accounts/${accountId}/projects`);
  },
  
  /**
   * Get active projects
   * @returns Promise with array of active projects
   */
  async getActiveProjects(): Promise<Project[]> {
    return fetchAll<Project>('active_projects');
  },

  /**
   * Get billing codes for a project
   * @param id - Project ID
   * @returns Promise with billing codes
   */
  async getBillingCodes(id: number): Promise<any[]> {
    return fetchAll(`projects/${id}/billing_codes`);
  },

  /**
   * Fetches projects for a specific account
   * @param accountId Account ID to filter projects
   * @returns Promise with projects data
   */
  async getProjectsByAccount(accountId: number): Promise<Project[]> {
    return fetchAll<Project>(`projects?account_id=${accountId}`);
  }
};

// For backward compatibility, maintain these exported functions
// that delegate to the API methods
/**
 * Fetches all projects or projects for a specific account if accountId is provided
 * @param accountId Optional account ID to filter projects
 * @returns Promise with projects data
 */
export const fetchProjects = async (accountId?: number) => {
  return accountId ? projectsAPI.getProjectsByAccount(accountId) : projectsAPI.getProjects();
};

/**
 * Fetches a single project by ID
 * @param id Project ID
 * @returns Promise with project data
 */
export const fetchProjectById = async (id: number) => {
  return projectsAPI.getProject(id);
};

/**
 * Creates a new project
 * @param projectData Project data to create
 * @returns Promise with created project data
 */
export const createProject = async (projectData: Partial<Project>) => {
  return projectsAPI.createProject(projectData as Project);
};

/**
 * Updates an existing project
 * @param id Project ID
 * @param projectData Updated project data
 * @returns Promise with updated project data
 */
export const updateProject = async (id: number, projectData: Partial<Project>) => {
  const fullProject = { ...projectData, ID: id } as Project;
  return projectsAPI.updateProject(fullProject);
};

/**
 * Deletes a project
 * @param id Project ID to delete
 * @returns Promise with deletion status
 */
export const deleteProject = async (id: number) => {
  return projectsAPI.deleteProject(id);
};

export default projectsAPI; 