import React, { useState, useMemo, useCallback } from "react";
import { useQHSERunningProjects } from '../../hooks/useQHSEProjects'; // Add this import
import {
  Paper, Typography, Box, Chip, Button, Stack, TextField, InputAdornment, IconButton, Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { AlertTriangle, Star, Info, User, Calendar, ClipboardList, BadgeCheck, TrendingUp, Search, X, Edit, RefreshCw, Plus } from "lucide-react";
import { withDashboardControls } from '../../../../hoc/withPageControls';
import { PageControlButtons } from '../../../../components/PageControlButtons';

// Import common components for consistent loading/error states
import { LoadingState } from "../Common/LoadingState"
import { ErrorState } from "../Common/ErrorState"
import { EmptyDataState } from "../Common/EmptyDataState"
import { MainHeader } from "../Common/MainHeader";
import { PageLayout } from '@/layouts/PageLayout';
import ProjectEditModal from '../Common/ProjectEditModal';
import CreateProjectModal from './CreateProjectModal';

// Field labels using the correct Google Sheets field names
const fieldLabels = {
  srNo: "Sr No",
  projectNo: "Project No", 
  projectTitle: "Project Title",
  client: "Client",
  projectManager: "Project Manager",
  projectQualityEng: "Project Quality Engineer",
  projectStartingDate: "Project Starting Date",
  projectClosingDate: "Project Closing Date",
  projectExtension: "Project Extension",
  manHourForQuality: "Manhours for Quality",
  manhoursUsed: "Manhours Used",
  manhoursBalance: "Manhours Balance",
  qualityBillabilityPercent: "Quality Billability %",
  projectQualityPlanStatusRev: "Project Quality Plan Status - Rev",
  projectQualityPlanStatusIssueDate: "Project Quality Plan Status - Issue Date",
  projectAudit1: "Project Audit -1",
  projectAudit2: "Project Audit -2",
  projectAudit3: "Project Audit -3",
  projectAudit4: "Project Audit -4",
  clientAudit1: "Client Audit -1",
  clientAudit2: "Client Audit -2",
  delayInAuditsNoDays: "Delay in Audits - No. of Days",
  carsOpen: "CARs Open",
  carsDelayedClosingNoDays: "CARs Delayed Closing No. Days",
  carsClosed: "CARs Closed",
  obsOpen: "No. of Obs Open",
  obsDelayedClosingNoDays: "Obs Delayed Closing No. of Days",
  obsClosed: "Obs Closed",
  projectKPIsAchievedPercent: "Project KPIs Achieved %",
  projectCompletionPercent: "Project Completion %",
  remarks: "Remarks"
};

// Remove priority/color logic, just use allHeaders with label only
const allHeaders = Object.keys(fieldLabels).map((key) => ({
  key,
  label: fieldLabels[key] || key
}));

const DetailedView = ({ pageControls }) => {
  const { data: projectsData, loading, error, lastUpdated, refetch } = useQHSERunningProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Debug: Log first project to verify field structure (only when data exists)
  if (projectsData && projectsData.length > 0) {
    console.log('🔍 DetailedView - First project structure:', {
      srNo: projectsData[0].srNo,
      projectNo: projectsData[0].projectNo,
      projectTitle: projectsData[0].projectTitle,
      client: projectsData[0].client,
      qualityBillabilityPercent: projectsData[0].qualityBillabilityPercent,
      carsOpen: projectsData[0].carsOpen,
      obsOpen: projectsData[0].obsOpen,
      projectKPIsAchievedPercent: projectsData[0].projectKPIsAchievedPercent
    });
  }

  // Show all columns, no tabs or viewMode
  const filteredHeaders = allHeaders;

  // Smart column width calculation
  const getColumnWidth = (header) => {
    const baseWidth = header.label.length * 10;
    switch (header.key) {
      case "srNo":
        return 80;
      case "projectNo":
        return 140;
      case "projectTitle":
        return Math.max(250, baseWidth);
      case "client":
        return Math.max(150, baseWidth);
      case "projectManager":
      case "projectQualityEng":
        return Math.max(180, baseWidth);
      case "remarks":
        return 300;
      case "qualityBillabilityPercent":
      case "projectKPIsAchievedPercent":
        return 180;
      case "carsOpen":
      case "obsOpen":
      case "carsClosed":
      case "obsClosed":
        return 120;
      case "delayInAuditsNoDays":
      case "carsDelayedClosingNoDays":
      case "obsDelayedClosingNoDays":
        return 160;
      default:
        return Math.max(120, Math.min(200, baseWidth));
    }
  };

  // Enhanced empty value handling
  const formatCellValue = (value, header) => {
    if (value === null || value === undefined || value === '' || value === 'N/A' ||
        value === '#DIV/0!' || String(value).includes('#DIV/0!') || String(value).includes('#ERROR')) {
      if (header.key.includes('Percent') || header.key.includes('%')) {
        return 'N/A';
      }
      if (['carsOpen', 'obsOpen', 'carsClosed', 'obsClosed'].includes(header.key)) {
        return '0';
      }
      if (header.key.includes('manhour') || header.key.includes('manHour')) {
        return '0';
      }
      if (header.key.includes('Date')) {
        return 'TBD';
      }
      return '-';
    }
    return value;
  };

  // Enhanced rows with search filtering
  const rows = useMemo(() => {
    if (!projectsData) return [];
    let filteredData = projectsData;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = projectsData.filter(row => {
        const searchableFields = [
          row.projectNo,
          row.projectTitle,
          row.client,
          row.projectManager,
          row.projectQualityEng
        ];
        return searchableFields.some(field =>
          field && field.toString().toLowerCase().includes(searchLower)
        );
      });
    }
    // Only include rows where srNo has a value (not empty, not 0, not undefined)
    return filteredData
      .filter(row => row.srNo && Number(row.srNo) > 0)
      .map((row, idx) => ({
        id: idx + 1, // DataGrid unique id
        ...row,
      }));
  }, [projectsData, searchTerm]);

  // Clear search function
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Handle edit project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  // Handle project update
  const handleProjectUpdate = (updatedProject) => {
    // Refresh data after update
    refetch();
  };

  // Handle project creation success
  const handleProjectCreateSuccess = (newProject) => {
    // Refresh data after creation
    refetch();
  };

  // DataGrid columns with simple rendering
  const columns = useMemo(
    () => [
      // Actions column
      {
        field: 'actions',
        headerName: 'Actions',
        width: 100,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderHeader: () => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700 }}>
              Actions
            </Typography>
          </Box>
        ),
        renderCell: (params) => (
          <Tooltip title="Edit Project">
            <IconButton
              size="small"
              onClick={() => handleEditProject(params.row)}
              sx={{ color: 'primary.main' }}
            >
              <Edit size={18} />
            </IconButton>
          </Tooltip>
        ),
      },
      // Existing columns
      ...filteredHeaders.map((header) => ({
        field: header.key,
        headerName: header.label,
        width: getColumnWidth(header),
        headerAlign: "center",
        align: ["remarks", "projectTitle"].includes(header.key) ? "left" : "center",
        sortable: true,
        resizable: true,
        renderHeader: () => (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
            py: 0.5
          }}>
            <Typography variant="caption" sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              lineHeight: 1.1,
              textAlign: 'center',
              color: "#374151 !important",
              '.dark &': {
                color: 'rgb(241 245 249) !important',
              }
            }}>
              {header.label}
            </Typography>
          </Box>
        ),
        renderCell: (params) => {
          const value = params.value;
          const formattedValue = formatCellValue(value, header);
          return (
            <Typography variant="body2" sx={{
              color: "#374151 !important",
              fontSize: '0.7rem',
              fontWeight: 500,
              wordBreak: header.key === "remarks" ? 'break-word' : 'normal',
              textAlign: ["remarks", "projectTitle"].includes(header.key) ? 'left' : 'center',
              width: '100%',
              fontStyle: formattedValue === 'N/A' || formattedValue === 'TBD' ? 'italic' : 'normal',
              '.dark &': {
                color: "rgb(241 245 249) !important",
              }
            }}>
              {formattedValue}
            </Typography>
          );
        },
      })),
    ],
    [filteredHeaders]
  );

  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <MainHeader 
          title="Detailed Project View"
          subtitle="Comprehensive table view of all project data with advanced filtering and search capabilities."
        />
        <LoadingState message="Loading detailed project data from Google Sheets..." />
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout>
        <MainHeader 
          title="Detailed Project View"
          subtitle="Error loading project data"
        />
        <ErrorState error={error} onRetry={refetch} />
      </PageLayout>
    );
  }

  // Empty state
  if (!projectsData || projectsData.length === 0) {
    return (
      <PageLayout>
        <MainHeader 
          title="Detailed Project View"
          subtitle="Comprehensive table view of all project data with advanced filtering and search capabilities."
        />
        <EmptyDataState />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <MainHeader 
        title="Detailed Project View"
        subtitle="Comprehensive table view of all project data with advanced filtering and search capabilities."
        lastUpdated={lastUpdated}
      >
        <div className="flex items-center gap-3">
          <PageControlButtons controls={pageControls} />
          <div className="text-xs text-green-600 dark:text-green-400">
            • Live data ({projectsData.length} projects)
          </div>
        </div>
      </MainHeader>

      <DetailedViewContent 
        projectsData={projectsData}
        rows={rows}
        columns={columns}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        clearSearch={clearSearch}
        filteredHeaders={filteredHeaders}
        onCreateProject={() => setCreateModalOpen(true)}
      />

      {/* Edit Modal */}
      <ProjectEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={selectedProject}
        onUpdate={handleProjectUpdate}
      />

      {/* Create Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleProjectCreateSuccess}
      />
    </PageLayout>
  );
};

// Remove viewMode and setViewMode from props
const DetailedViewContent = ({
  projectsData,
  rows,
  columns,
  searchTerm,
  setSearchTerm,
  clearSearch,
  filteredHeaders,
  onCreateProject
}) => {
  return (
    <div className="space-y-3">
      <Paper
        elevation={2}
        className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-lg"
        sx={{
          height: 'calc(100vh - 140px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'white',
          '.dark &': {
            backgroundColor: 'rgb(15 23 42)',
          }
        }}
      >
        {/* Compact Header - Inside table container */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}
                className="!text-gray-900 dark:!text-slate-100 whitespace-nowrap"
              >
                📊 Project Data
              </Typography>
              <Box sx={{ flex: '0 0 auto', minWidth: '240px', maxWidth: '320px' }}>
                <TextField
                  className="bg-white dark:bg-slate-700"
                  variant="outlined"
                  size="small"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={14} style={{ color: '#6b7280' }} className="text-gray-500 dark:text-slate-400" />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <Box
                          component="button"
                          onClick={clearSearch}
                          sx={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                            '&:hover': {
                              backgroundColor: '#f3f4f6',
                              color: '#374151'
                            }
                          }}
                        >
                          <X size={12} />
                        </Box>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      height: '32px',
                      border: '1px solid #d1d5db',
                      color: '#374151',
                      '&:hover': {
                        borderColor: '#9ca3af',
                      },
                      '&.Mui-focused': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.1)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                        }
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent'
                      },
                      '& input': {
                        padding: '6px 10px',
                        color: '#374151',
                        '&::placeholder': {
                          color: '#9ca3af',
                          opacity: 1
                        }
                      }
                    },
                    // Dark mode overrides
                    '.dark & .MuiOutlinedInput-root': {
                      backgroundColor: '#334155', // Tailwind slate-700
                      border: '1px solid #475569', // Tailwind slate-600
                      color: '#f1f5f9',
                      '&:hover': {
                        borderColor: '#64748b', // Tailwind slate-500
                      },
                      '&.Mui-focused': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                        }
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent'
                      },
                      '& input': {
                        color: '#f1f5f9',
                        '&::placeholder': {
                          color: '#94a3b8', // Tailwind slate-400
                          opacity: 1
                        }
                      }
                    }
                  }}
                />
              </Box>
              {searchTerm && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backgroundColor: '#f1f5f9',
                  borderRadius: '3px',
                  px: 1,
                  py: 0.3,
                  fontSize: '0.7rem'
                }}>
                  <Box sx={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    backgroundColor: rows.length > 0 ? '#10b981' : '#f59e0b'
                  }} />
                  <Typography variant="caption" sx={{
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: '#374151'
                  }}>
                    {rows.length} result{rows.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              )}
            </div>
            
            {/* Create New Project Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={onCreateProject}
              sx={{
                backgroundColor: '#3b82f6',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 2,
                py: 0.75,
                borderRadius: '6px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  backgroundColor: '#2563eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              New Project
            </Button>
          </div>
          <Typography className="!text-gray-500 dark:!text-slate-400 mt-1"
            variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
            {rows.length} projects • {filteredHeaders.length} columns
          </Typography>
        </div>
        <Box sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
          <DataGrid
            className="bg-white dark:bg-slate-900"
            rows={rows}
            columns={columns}
            pagination={true}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            disableRowSelectionOnClick
            sortingOrder={['asc', 'desc']}
            disableColumnMenu={false}
            columnHeaderHeight={44}
            rowHeight={38}
            sx={{
              height: '100%',
              width: '100%',
              border: 'none',
              '& .MuiDataGrid-main': {
                overflow: 'hidden'
              },
              // Table header styles for dark mode only
              '& .MuiDataGrid-columnHeader': { 
                backgroundColor: "#fff !important",
                borderBottom: "2px solid #e2e8f0",
                // Dark mode override
                '.dark &': {
                  backgroundColor: "rgb(30 41 59) !important",
                  borderBottom: "2px solid #334155",
                   borderTop: "1px solid #334155",
                }
              },
              '& .MuiDataGrid-cell': { 
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f1f5f9',
                color: '#374151',
                fontSize: '0.75rem',
                // Dark mode override
                '.dark &': {
                  color: 'rgb(241 245 249)',
                  borderBottom: '1px solid #334155',
                  backgroundColor: 'rgb(15 23 42)',
                }
              },
              '& .MuiDataGrid-row': {
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: "#f8fafc",
                },
                '&:nth-of-type(even)': {
                  backgroundColor: '#fafbfb',
                },
                // Dark mode override
                '.dark &': {
                  backgroundColor: 'rgb(15 23 42)',
                  '&:hover': {
                    backgroundColor: "rgb(30 41 59)",
                  },
                  '&:nth-of-type(even)': {
                    backgroundColor: 'rgb(30 41 59)',
                  }
                }
              },
              '& .MuiDataGrid-columnSeparator': {
                visibility: 'visible',
                color: '#e2e8f0',
                // Dark mode override
                '.dark &': {
                  color: '#334155',
                }
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e2e8f0',
                backgroundColor: '#fff',
                minHeight: '36px',
                '& .MuiTablePagination-root': {
                  color: '#374151',
                  fontSize: '0.75rem',
                },
                '& .MuiIconButton-root': {
                  color: '#6b7280',
                  padding: '4px',
                },
                // Dark mode override
                '.dark &': {
                  borderTop: '2px solid #334155',
                  backgroundColor: 'rgb(30 41 59)',
                  '& .MuiTablePagination-root': {
                    color: 'rgb(241 245 249)',
                  },
                  '& .MuiIconButton-root': {
                    color: 'rgb(148 163 184)',
                  }
                }
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#6b7280',
                // Dark mode override
                '.dark &': {
                  color: 'rgb(148 163 184)',
                }
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: '#374151',
                fontSize: '0.75rem',
                // Dark mode override
                '.dark &': {
                  color: 'rgb(241 245 249)',
                }
              },
              '& .MuiDataGrid-filler': {
                backgroundColor: "#fff !important",
                // Dark mode override
                '.dark &': {
                  backgroundColor: "rgb(15 23 42) !important",
                }
              },
              '& .MuiDataGrid-scrollbarFiller': {
                backgroundColor: "#fff !important",
                // Dark mode override
                '.dark &': {
                  backgroundColor: "rgb(15 23 42) !important",
                }
              },
              '& .MuiDataGrid-scrollbarFiller--header': {
                backgroundColor: "#fff !important",
                // Dark mode override
                '.dark &': {
                  backgroundColor: "rgb(30 41 59) !important",
                }
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: 'white',
                // Dark mode override
                '.dark &': {
                  backgroundColor: 'rgb(15 23 42)',
                }
              },
              '& .MuiDataGrid-overlayWrapper': {
                backgroundColor: 'white',
                // Dark mode override
                '.dark &': {
                  backgroundColor: 'rgb(15 23 42)',
                }
              },
            }}
          />
        </Box>
      </Paper>
    </div>
  );
};

// Wrapper component to provide refetch functionality
const DetailedViewWithRefresh = (props) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return <DetailedView {...props} refetch={refetch} key={refreshTrigger} />;
};

export default withDashboardControls(DetailedViewWithRefresh, {
  autoRefreshInterval: 30000, // 30 seconds
  storageKey: 'qhseDetailedViewPageControls',
});