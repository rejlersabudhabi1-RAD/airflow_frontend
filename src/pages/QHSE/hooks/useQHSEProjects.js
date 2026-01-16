import { useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../../../config/app.config';
import { API_BASE_URL } from '../../../config/api.config';

/**
 * Custom hook to fetch QHSE Running Projects from Django API
 * Replaces Google Sheets with PostgreSQL backend
 */
export const useQHSERunningProjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataLastChanged, setDataLastChanged] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('🔑 Auth token exists:', !!token);
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      // Fetch all projects (handling pagination)
      let allProjects = [];
      let nextUrl = `${API_BASE_URL}/api/v1/qhse/projects/?page_size=1000`; // Get all at once
      
      console.log('🌐 Fetching from:', nextUrl);
      
      while (nextUrl) {
        const response = await fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 API Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log('📦 Raw API response:', {
          hasResults: !!jsonData.results,
          isArray: Array.isArray(jsonData),
          resultCount: jsonData.results?.length || jsonData.length || 0
        });
        
        // Handle paginated response (DRF format: {count, next, previous, results})
        // or direct array response
        if (jsonData.results && Array.isArray(jsonData.results)) {
          allProjects = [...allProjects, ...jsonData.results];
          nextUrl = jsonData.next; // Continue to next page if exists
        } else if (Array.isArray(jsonData)) {
          allProjects = jsonData;
          nextUrl = null; // No pagination, exit loop
        } else {
          throw new Error('Unexpected API response format');
        }
      }
      
      // API already returns data in correct camelCase format from serializer
      // Just ensure defaults for missing fields
      const transformedData = allProjects.map(project => ({
        ...project,
        srNo: project.srNo || '',
        projectNo: project.projectNo || '',
        projectTitle: project.projectTitle || '',
        projectTitleKey: project.projectTitleKey || (project.projectTitle ? project.projectTitle.substring(0, 30) : ''),
        client: project.client || '',
        projectManager: project.projectManager || '',
        projectStartingDate: project.projectStartingDate || '',
        projectClosingDate: project.projectClosingDate || '',
        projectExtension: project.projectExtension || null,
        projectQualityEng: project.projectQualityEng || '',
        manHourForQuality: Number(project.manHourForQuality || 0),
        manhoursUsed: Number(project.manhoursUsed || 0),
        manhoursBalance: Number(project.manhoursBalance || 0),
        qualityBillabilityPercent: project.qualityBillabilityPercent || '0%',
        projectQualityPlanStatusRev: project.projectQualityPlanStatusRev || '',
        projectQualityPlanStatusIssueDate: project.projectQualityPlanStatusIssueDate || '',
        projectAudit1: project.projectAudit1 || null,
        projectAudit2: project.projectAudit2 || null,
        projectAudit3: project.projectAudit3 || null,
        projectAudit4: project.projectAudit4 || null,
        clientAudit1: project.clientAudit1 || null,
        clientAudit2: project.clientAudit2 || null,
        delayInAuditsNoDays: Number(project.delayInAuditsNoDays || 0),
        carsOpen: Number(project.carsOpen || 0),
        carsDelayedClosingNoDays: Number(project.carsDelayedClosingNoDays || 0),
        carsClosed: Number(project.carsClosed || 0),
        obsOpen: Number(project.obsOpen || 0),
        obsDelayedClosingNoDays: Number(project.obsDelayedClosingNoDays || 0),
        obsClosed: Number(project.obsClosed || 0),
        projectKPIsAchievedPercent: project.projectKPIsAchievedPercent || '0%',
        projectCompletionPercent: project.projectCompletionPercent || '0%',
        rejectionOfDeliverablesPercent: project.rejectionOfDeliverablesPercent || '0%',
        costOfPoorQualityAED: Number(project.costOfPoorQualityAED || 0),
        remarks: project.remarks || ''
      }));

      console.log('📊 Transformed data sample (first project):', transformedData[0]);
      console.log('📊 Field check - carsOpen:', transformedData[0]?.carsOpen, 'obsOpen:', transformedData[0]?.obsOpen, 'projectKPIsAchievedPercent:', transformedData[0]?.projectKPIsAchievedPercent);
      console.log('✅ Total projects loaded:', transformedData.length);

      setData(transformedData);
      const now = new Date().toISOString();
      setLastUpdated(now);
      setDataLastChanged(now);
    } catch (err) {
      console.error('Error fetching QHSE projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    refetch,
    lastUpdated,
    dataLastChanged
  };
};
