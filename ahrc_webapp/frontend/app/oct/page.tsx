'use client';

import { useState, useRef } from 'react';
import { processNpyFile } from './actions';
import { ProcessResult } from '../types';

export default function OCTSegmentation() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Please select a JPEG or PNG file');
        return;
      }
      
      setSelectedFile(file);
      setResultUrl(null); // Reset previous results
      setError(null);
      
      // Create preview URL for image files
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const result: ProcessResult = await processNpyFile(formData);
      
      if (result.success && result.imageUrl) {
        setResultUrl(result.imageUrl);
      } else {
        setError(result.error || 'Failed to process image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validExtensions = ['.jpg', '.jpeg', '.png'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setResultUrl(null);
        setError(null);
        
        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
        
        // Update the file input
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      } else {
        setError('Please select a JPEG or PNG file');
      }
    }
  };

  const downloadResult = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      const originalName = selectedFile?.name.substring(0, selectedFile.name.lastIndexOf('.'));
      link.download = `segmentation_${originalName}.png`;
      link.href = resultUrl;
      link.click();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-6xl px-4">
        {/* Collapsible Description Block */}
        <div className="w-full mb-6 bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              About This Tool
            </h3>
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${
                isDescriptionExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isDescriptionExpanded ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="p-4 pt-0">
              <p className="text-gray-600 text-sm leading-relaxed">
                This AI-powered OCT (Optical Coherence Tomography) segmentation tool uses advanced deep learning 
                to automatically segment retinal layers in OCT images. The system processes OCT images in JPEG or PNG format 
                and provides color-coded segmentation maps with 11 distinct classes, enabling clinicians to quickly 
                identify different retinal layers and structures. The U-Net based model offers rapid analysis, 
                making it suitable for high-volume clinical workflows and research applications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
                OCT Image Segmentation
              </h2>
              
              {/* File Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  {selectedFile ? (
                    <div className="mb-4">
                      {previewUrl && (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="mx-auto h-32 w-auto mb-4 rounded-lg object-contain"
                        />
                      )}
                      <p className="text-sm text-gray-600 mb-2">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        File size: {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <svg 
                        className="mx-auto h-16 w-16 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop a JPEG or PNG file here, or click to select
                      </p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {selectedFile ? 'Change File' : 'Select Image File'}
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isLoading || !selectedFile}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Segment Image'}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Segmentation Result</h3>
            
            {resultUrl ? (
              <div className="space-y-4">
                {/* Result Image */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <img 
                    src={resultUrl} 
                    alt="Segmentation result" 
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                  
                  <button
                    onClick={downloadResult}
                    className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Download Result
                  </button>
                </div>
                
                {/* Legend */}
                {/* <div className="border-t pt-4">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Color Legend</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-black border border-gray-300 mr-2"></div>
                      <span className="text-sm">Background</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-red-500 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 1</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 2</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 3</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-yellow-400 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 4</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-pink-500 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 5</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-cyan-500 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 6</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-orange-400 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 7</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-orange-600 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 8</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-pink-600 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 9</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-600 border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 10</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-white border border-gray-300 mr-2"></div>
                      <span className="text-sm">Layer 11</span>
                    </div>
                  </div>
                </div> */}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Upload a JPEG or PNG file to see segmentation results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}