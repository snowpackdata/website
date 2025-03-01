import axios from 'axios';
import type { Project } from '../types/Project';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * API service for project-related operations
 */
export default {
  /**
   * Get all projects
   * @returns Promise with array of projects
   */
  async getProjects(): Promise<Project[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get('/api/projects', {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Get a single project by ID
   * @param id - Project ID
   * @returns Promise with project data
   */
  async getProject(id: number): Promise<Project> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/projects/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.project;
  },

  /**
   * Create a new project
   * @param project - Project data
   * @returns Promise with created project
   */
  async createProject(project: Project): Promise<Project> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.post('/api/projects', project, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.project;
  },

  /**
   * Update an existing project
   * @param project - Project data with ID
   * @returns Promise with updated project
   */
  async updateProject(project: Project): Promise<Project> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.put(`/api/projects/${project.ID}`, project, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.project;
  },

  /**
   * Delete a project
   * @param id - Project ID
   * @returns Promise with response data
   */
  async deleteProject(id: number): Promise<any> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.delete(`/api/projects/${id}`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data;
  },

  /**
   * Get billing codes for a project
   * @param id - Project ID
   * @returns Promise with billing codes
   */
  async getProjectBillingCodes(id: number): Promise<any[]> {
    const token = localStorage.getItem('snowpack_token');
    const response = await axios.get(`/api/projects/${id}/billing-codes`, {
      headers: { 
        'Content-Type': 'application/json', 
        'x-access-token': token 
      }
    });
    return response.data.billing_codes;
  }
};

/**
 * Fetches all projects or projects for a specific account if accountId is provided
 * @param accountId Optional account ID to filter projects
 * @returns Promise with projects data
 */
export const fetchProjects = async (accountId?: number) => {
  try {
    const url = accountId 
      ? `${API_URL}/api/projects?account_id=${accountId}`
      : `${API_URL}/api/projects`;
      
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

/**
 * Fetches a single project by ID
 * @param id Project ID
 * @returns Promise with project data
 */
export const fetchProjectById = async (id: number) => {
  try {
    const response = await axios.get(`${API_URL}/api/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    throw error;
  }
};

/**
 * Creates a new project
 * @param projectData Project data to create
 * @returns Promise with created project data
 */
export const createProject = async (projectData: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/projects`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Updates an existing project
 * @param id Project ID
 * @param projectData Updated project data
 * @returns Promise with updated project data
 */
export const updateProject = async (id: number, projectData: any) => {
  try {
    const response = await axios.put(`${API_URL}/api/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a project
 * @param id Project ID to delete
 * @returns Promise with deletion status
 */
export const deleteProject = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/api/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    throw error;
  }
}; 