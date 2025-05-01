'use client';

import React, { useState } from 'react';

interface DeleteLogsButtonProps {
  logType: 'api' | 'decisions' | 'records' | 'all';
  onSuccess?: () => void;
  className?: string;
}

export function DeleteLogsButton({ logType, onSuccess, className = '' }: DeleteLogsButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set button labels and messages
  let buttonLabel = 'Clear Logs';
  let confirmMessage = 'Are you sure you want to clear these logs?';
  let iconType = 'trash';
  
  if (logType === 'api') {
    buttonLabel = 'Clear API Logs';
    confirmMessage = 'Are you sure you want to clear all API logs?';
    iconType = 'server';
  } else if (logType === 'decisions') {
    buttonLabel = 'Clear Decision Logs';
    confirmMessage = 'Are you sure you want to clear all decision logs?';
    iconType = 'clipboard';
  } else if (logType === 'records') {
    buttonLabel = 'Clear All Records';
    confirmMessage = 'Are you sure you want to clear all irrigation records? This cannot be undone.';
    iconType = 'database';
  } else if (logType === 'all') {
    buttonLabel = 'Clear All Logs';
    confirmMessage = 'Are you sure you want to clear ALL logs and records? This cannot be undone.';
    iconType = 'alert';
  }
  
  const handleDelete = async () => {
    // Confirm before deletion
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    
    try {
      const response = await fetch(`${API_URL}/logs/clear?log_type=${logType}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to clear logs');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
    
    setIsDeleting(false);
  };
  
  // Build button style based on type
  let buttonStyle = '';
  
  switch(logType) {
    case 'api':
      buttonStyle = 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white';
      break;
    case 'decisions':
      buttonStyle = 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white';
      break;
    case 'records':
      buttonStyle = 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white';
      break;
    case 'all':
      buttonStyle = 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white';
      break;
    default:
      buttonStyle = 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white';
  }
  
  // Get icon based on type
  const renderIcon = () => {
    switch(iconType) {
      case 'trash':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'server':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'database':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        );
      case 'alert':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const baseButtonClass = `
    inline-flex items-center justify-center 
    px-4 py-2 
    rounded-md shadow-sm 
    font-medium text-sm 
    transition-all duration-200 
    transform hover:scale-105 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
  `;
  
  const focusRingColor = logType === 'all' ? 'focus:ring-red-500' : 'focus:ring-blue-500';
  
  const buttonClass = `
    ${baseButtonClass} 
    ${buttonStyle} 
    ${focusRingColor}
    ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''} 
    ${className}
  `;
  
  // Use React Fragment to avoid TSX error
  return (
    <React.Fragment>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={buttonClass}
      >
        {!isDeleting && renderIcon()}
        {isDeleting ? (
          <React.Fragment>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          </React.Fragment>
        ) : (
          buttonLabel
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded border border-red-200">
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </React.Fragment>
  );
}

interface DeleteRecordButtonProps {
  recordId: string;
  onSuccess?: () => void;
  className?: string;
  small?: boolean;
}

export function DeleteRecordButton({ 
  recordId, 
  onSuccess, 
  className = '',
  small = false
}: DeleteRecordButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = async () => {
    // Confirm before deletion
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
    
    try {
      const response = await fetch(`${API_URL}/logs/records/${recordId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete record');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error deleting record:', err);
    }
    
    setIsDeleting(false);
  };
  
  // Small button variant
  if (small) {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete this record"
        className={`
          inline-flex items-center 
          text-red-500 hover:text-red-700 
          transition-colors duration-200
          ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''} 
          ${className}
        `}
      >
        {isDeleting ? (
          <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <React.Fragment>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </React.Fragment>
        )}
      </button>
    );
  }
  
  // Regular button with improved styling
  return (
    <React.Fragment>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`
          inline-flex items-center justify-center
          px-3 py-1.5
          rounded-md shadow-sm
          font-medium text-sm
          bg-gradient-to-r from-red-500 to-red-600
          hover:from-red-600 hover:to-red-700
          text-white
          transition-all duration-200
          transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {isDeleting ? (
          <React.Fragment>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Deleting...
          </React.Fragment>
        ) : (
          <React.Fragment>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Record
          </React.Fragment>
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded border border-red-200">
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </React.Fragment>
  );
}