import axios from 'axios';
import type { Project } from '../types/Project';

export default {
  /**
   * Get all projects
   * @returns Promise with array of projects
   */
  async getProjects(): Promise<Project[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.projects;
  },

  /**
   * Get a single project by ID
   * @param id - Project ID
   * @returns Promise with project data
   */
  async getProject(id: number): Promise<Project> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.project;
  },

  /**
   * Create a new project
   * @param project - Project data
   * @returns Promise with created project
   */
  async createProject(project: Project): Promise<Project> {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/projects', project, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.project;
  },

  /**
   * Update an existing project
   * @param project - Project data with ID
   * @returns Promise with updated project
   */
  async updateProject(project: Project): Promise<Project> {
    const token = localStorage.getItem('token');
    const response = await axios.put(`/api/projects/${project.ID}`, project, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.project;
  },

  /**
   * Delete a project
   * @param id - Project ID
   * @returns Promise with response data
   */
  async deleteProject(id: number): Promise<any> {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  /**
   * Get billing codes for a project
   * @param id - Project ID
   * @returns Promise with billing codes
   */
  async getProjectBillingCodes(id: number): Promise<any[]> {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/projects/${id}/billing-codes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.billing_codes;
  }
}; 