'use client';

import React, { useState, useEffect } from 'react';
import { DeleteLogsButton, DeleteRecordButton } from './delete-buttons';
import { fetchDecisionLogs, fetchIrrigationRecords, fetchSystemStatus } from './log-utils';
import { IrrigationRecord, SystemStatus } from './log-utils';

export default function LogViewer() {
  const [decisionLogs, setDecisionLogs] = useState<string[]>([]);
  const [irrigationRecords, setIrrigationRecords] = useState<IrrigationRecord[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'decisions' | 'records' | 'status'>('decisions');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Function to refresh data
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Function to handle success after deletion
  const handleActionSuccess = () => {
    handleRefresh();
  };

  // Fetch logs using server actions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (activeTab === 'decisions') {
          const logs = await fetchDecisionLogs();
          setDecisionLogs(logs);
        } 
        else if (activeTab === 'records') {
          const records = await fetchIrrigationRecords();
          setIrrigationRecords(records);
        } 
        else if (activeTab === 'status') {
          const status = await fetchSystemStatus();
          if (status) {
            setSystemStatus(status);
          } else {
            // Provide fallback status data if null
            setSystemStatus({
              status: 'unknown',
              timestamp: new Date().toISOString(),
              logs: {
                api_log_size_kb: 0,
                decision_log_size_kb: 0,
                record_file_size_kb: 0,
                record_count: 0
              }
            });
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab, refreshKey]);

  // Tab button component for consistent styling
  const TabButton = ({ name, label }: { name: 'decisions' | 'records' | 'status'; label: string }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
        activeTab === name
          ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-semibold'
          : 'bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Irrigation System Logs</h1>
      
      <div className="flex border-b mb-4">
        <TabButton name="decisions" label="Decision Logs" />
        <TabButton name="records" label="Irrigation Records" />
        <TabButton name="status" label="System Status" />
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            {activeTab === 'decisions' && 'Irrigation Decision Logs'}
            {activeTab === 'records' && 'Detailed Irrigation Records'}
            {activeTab === 'status' && 'System Status'}
          </h2>
          
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm transition-colors shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <React.Fragment>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </React.Fragment>
              )}
            </button>
            
            {/* Delete buttons - only show for appropriate tabs */}
            {activeTab === 'decisions' && (
              <DeleteLogsButton 
                logType="decisions" 
                onSuccess={handleActionSuccess} 
              />
            )}
            
            {activeTab === 'records' && (
              <DeleteLogsButton 
                logType="records" 
                onSuccess={handleActionSuccess}
              />
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Error loading data</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={handleRefresh} 
                className="mt-2 text-sm bg-white hover:bg-red-50 text-red-700 font-medium py-1 px-2 border border-red-300 rounded inline-flex items-center"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <React.Fragment>
            {/* Decision Logs Tab */}
            {activeTab === 'decisions' && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto font-mono text-sm">
                {(!decisionLogs || decisionLogs.length === 0) ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 italic">No decision logs available</p>
                    <p className="text-gray-400 text-xs mt-2">
                      Submit an irrigation form to generate logs
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {decisionLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="p-3 bg-white rounded border-l-4 border-blue-500 shadow-sm hover:shadow transition-shadow"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Irrigation Records Tab */}
            {activeTab === 'records' && (
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                {(!irrigationRecords || irrigationRecords.length === 0) ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500 italic">No irrigation records available</p>
                    <p className="text-gray-400 text-xs mt-2">
                      Records will appear after irrigation recommendations are made
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {irrigationRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.cropName} ({record.croppedArea} acres)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.latitude}, {record.longitude}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.turnOnPump ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.turnOnPump ? `Irrigate (${record.pumpRunningTime})` : 'Skip'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Last irrigation: {record.daysSinceIrrigation} days ago
                            {record.notes && <p className="text-xs mt-1 italic">{record.notes}</p>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <DeleteRecordButton
                              recordId={record.id}
                              onSuccess={handleActionSuccess}
                              small={true}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {/* System Status Tab */}
            {activeTab === 'status' && systemStatus && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-2">System Status</h3>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        systemStatus.status === 'operational' ? 'bg-green-500' : systemStatus.status === 'unknown' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="capitalize">{systemStatus.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="font-medium text-gray-700 mb-2">Log Statistics</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>API Log Size:</span>
                        <span>{systemStatus.logs.api_log_size_kb} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Decision Log Size:</span>
                        <span>{systemStatus.logs.decision_log_size_kb} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Record File Size:</span>
                        <span>{systemStatus.logs.record_file_size_kb} KB</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Records:</span>
                        <span>{systemStatus.logs.record_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {systemStatus.error && (
                  <div className="bg-red-50 p-3 rounded text-red-600 text-sm border border-red-200">
                    <span className="font-medium">System Error:</span> {systemStatus.error}
                  </div>
                )}
                
                {/* Add Clear All Logs button in status tab */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-700 mb-3">Log Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <DeleteLogsButton
                      logType="api"
                      onSuccess={handleActionSuccess}
                    />
                    <DeleteLogsButton
                      logType="decisions"
                      onSuccess={handleActionSuccess}
                    />
                    <DeleteLogsButton
                      logType="records"
                      onSuccess={handleActionSuccess}
                    />
                    <div className="md:col-span-3">
                      <DeleteLogsButton
                        logType="all"
                        onSuccess={handleActionSuccess}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}