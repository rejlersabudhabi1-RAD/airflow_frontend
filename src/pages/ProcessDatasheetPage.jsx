/**
 * Process Datasheet Main Page
 * Entry point for process datasheet module
 * Soft-coded routing and navigation
 */

import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api.service';
import {
  Box,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import {
  Dashboard,
  CloudUpload,
  Add,
  List
} from '@mui/icons-material';

// Import components
import DatasheetDashboard from '../components/ProcessDatasheet/DatasheetDashboard';
import DatasheetFormBuilder from '../components/ProcessDatasheet/DatasheetFormBuilder';
import PDFUploadExtractor from '../components/ProcessDatasheet/PDFUploadExtractor';
import ValidationFeedback from '../components/ProcessDatasheet/ValidationFeedback';
import WorkflowProgressTracker from '../components/ProcessDatasheet/WorkflowProgressTracker';
import DatasheetUpload from './ProcessDatasheet/DatasheetUpload';

/**
 * Create/Edit Datasheet Page
 */
const CreateEditDatasheetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedEquipmentType, setSelectedEquipmentType] = useState(null);

  // Get datasheet ID from URL if editing
  const datasheetId = location.pathname.includes('/edit/') 
    ? location.pathname.split('/edit/')[1]
    : null;

  const handleSave = (datasheet) => {
    alert('Datasheet saved successfully!');
    navigate('/engineering/process/datasheet/dashboard');
  };

  const handleCalculate = (result) => {
    alert('Calculations completed!');
  };

  const handleValidate = (result) => {
    alert('Validation completed!');
  };

  return (
    <Container maxWidth="xl">
      {!selectedEquipmentType ? (
        <EquipmentTypeSelector onSelect={setSelectedEquipmentType} />
      ) : (
        <DatasheetFormBuilder
          equipmentTypeId={selectedEquipmentType}
          datasheetId={datasheetId}
          onSave={handleSave}
          onCalculate={handleCalculate}
          onValidate={handleValidate}
        />
      )}
    </Container>
  );
};

/**
 * Equipment Type Selector
 */
const EquipmentTypeSelector = ({ onSelect }) => {
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadEquipmentTypes();
  }, []);

  const loadEquipmentTypes = async () => {
    try {
      const response = await api.get('/process-datasheet/equipment-types/');
      console.log('🔍 [Equipment Types] Raw response:', response.data);
      console.log('🔍 [Equipment Types] Is Array?', Array.isArray(response.data));
      console.log('🔍 [Equipment Types] Has results?', response.data?.results);
      
      // API returns paginated response: { count, results }
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('🔍 [Equipment Types] Final data:', data);
      console.log('🔍 [Equipment Types] Is data array?', Array.isArray(data));
      
      setEquipmentTypes(data);
    } catch (error) {
      console.error('❌ Error loading equipment types:', error);
      if (error.response?.status === 401) {
        alert('Please log in to access Process Datasheet. Redirecting to login...');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading equipment types...</div>;
  }

  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Select Equipment Type</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipmentTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => onSelect(type.id)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{type.name}</h3>
            <p className="text-gray-600 text-sm">{type.description}</p>
            <div className="mt-4 text-sm text-gray-500">
              {type.field_count || 0} fields configured
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Upload PDF Page
 */
const UploadPDFPage = () => {
  const navigate = useNavigate();
  const [selectedEquipmentType, setSelectedEquipmentType] = useState(null);

  const handleExtractionComplete = (job) => {
    alert('Extraction completed successfully!');
  };

  const handleDatasheetCreated = (datasheet) => {
    navigate(`/engineering/process/datasheet/view/${datasheet.id}`);
  };

  return (
    <Container maxWidth="lg">
      {!selectedEquipmentType ? (
        <EquipmentTypeSelector onSelect={setSelectedEquipmentType} />
      ) : (
        <PDFUploadExtractor
          equipmentTypeId={selectedEquipmentType}
          onExtractionComplete={handleExtractionComplete}
          onDatasheetCreated={handleDatasheetCreated}
        />
      )}
    </Container>
  );
};

/**
 * View Datasheet Page
 */
const ViewDatasheetPage = () => {
  const location = useLocation();
  const datasheetId = location.pathname.split('/view/')[1];

  return (
    <Container maxWidth="xl">
      <DatasheetFormBuilder
        equipmentTypeId="dummy" // Will be loaded from datasheet
        datasheetId={datasheetId}
        readonly={true}
      />
    </Container>
  );
};

/**
 * Main Process Datasheet Page with Routing
 */
const ProcessDatasheetPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from route
  const getActiveTab = () => {
    if (location.pathname.includes('/dashboard')) return 0;
    if (location.pathname.includes('/create')) return 1;
    if (location.pathname.includes('/upload')) return 2;
    return 0;
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/engineering/process/datasheet/dashboard');
        break;
      case 1:
        navigate('/engineering/process/datasheet/create');
        break;
      case 2:
        navigate('/engineering/process/datasheet/upload');
        break;
    }
  };

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <Box className="bg-white shadow-sm">
        <Container maxWidth="xl">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<Dashboard />} label="Dashboard" iconPosition="start" />
            <Tab icon={<Add />} label="Create New" iconPosition="start" />
            <Tab icon={<CloudUpload />} label="Upload PDF" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      {/* Routes */}
      <Box className="py-6">
        <Routes>
          <Route path="/dashboard" element={<DatasheetDashboard />} />
          <Route path="/create" element={<CreateEditDatasheetPage />} />
          <Route path="/edit/:id" element={<CreateEditDatasheetPage />} />
          <Route path="/view/:id" element={<ViewDatasheetPage />} />
          <Route path="/upload" element={<DatasheetUpload />} />
          <Route path="/" element={<DatasheetDashboard />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default ProcessDatasheetPage;
