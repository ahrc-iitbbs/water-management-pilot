// 'use client';
// import { FormEvent, useState, useRef } from 'react';
// import { SubmitButton } from '@/app/ui/projects/form-components';
// import { analyzeCervicalCancer } from './actions';
// import { CancerDetectionResult } from '../types';
// import Image from 'next/image';



// export default function CervicalCancerDetection() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [serverOutput, setServerOutput] = useState<CancerDetectionResult | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setSelectedFile(file);
//       const url = URL.createObjectURL(file);
//       setPreviewUrl(url);
//       setServerOutput(null); // Reset previous results
//     }
//   };

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     if (!selectedFile) return;

//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('file', selectedFile);
      
//       const result = await analyzeCervicalCancer(formData);
//       setServerOutput(result);
//     } catch (error) {
//       console.error('Error processing image:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     const files = e.dataTransfer.files;
//     if (files.length > 0) {
//       const file = files[0];
//       if (file.type.startsWith('image/')) {
//         setSelectedFile(file);
//         const url = URL.createObjectURL(file);
//         setPreviewUrl(url);
//         setServerOutput(null);
        
//         // Update the file input
//         if (fileInputRef.current) {
//           const dataTransfer = new DataTransfer();
//           dataTransfer.items.add(file);
//           fileInputRef.current.files = dataTransfer.files;
//         }
//       }
//     }
//   };

//   const getPredictionColor = (className: string) => {
//     switch (className.toLowerCase()) {
//       case 'benign':
//         return 'text-green-600';
//       case 'malignant':
//         return 'text-red-600';
//       case 'suspicious':
//         return 'text-orange-600';
//       default:
//         return 'text-gray-600';
//     }
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50">
//       <div className="w-full max-w-lg">
//         <form onSubmit={handleSubmit} className="w-full p-8 bg-white rounded-lg shadow-lg space-y-6 mb-6">
//           <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
//             AHRC Cervical Cancer Detection
//           </h2>
          
//           {/* File Upload Area */}
//           <div 
//             className="border-2 border-dashed border-gray-300 rounded-lg p-6"
//             onDragOver={handleDragOver}
//             onDrop={handleDrop}
//           >
//             <div className="text-center">
//               {previewUrl ? (
//                 <div className="mb-4">
//                   <img 
//                     src={previewUrl} 
//                     alt="Preview" 
//                     className="mx-auto max-h-64 rounded-lg shadow-md"
//                   />
//                   <p className="mt-2 text-sm text-gray-600">{selectedFile?.name}</p>
//                 </div>
//               ) : (
//                 <div className="mb-4">
//                   <svg 
//                     className="mx-auto h-16 w-16 text-gray-400"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path 
//                       strokeLinecap="round" 
//                       strokeLinejoin="round" 
//                       strokeWidth={2} 
//                       d="M12 6v6m0 0v6m0-6h6m-6 0H6"
//                     />
//                   </svg>
//                   <p className="mt-2 text-sm text-gray-600">
//                     Drag and drop an image here, or click to select
//                   </p>
//                 </div>
//               )}
              
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="hidden"
//                 id="file-upload"
//                 required
//               />
              
//               <label
//                 htmlFor="file-upload"
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
//               >
//                 {previewUrl ? 'Change Image' : 'Select Image'}
//               </label>
//             </div>
//           </div>
          
//           <SubmitButton disabled={isLoading || !selectedFile}>
//             {isLoading ? 'Analyzing...' : 'Analyze Image'}
//           </SubmitButton>
//         </form>
        
//         {/* Results Display */}
//         {serverOutput && (
//           <div className="w-full p-6 bg-white rounded-lg shadow-lg">
//             <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h3>
            
//             <div className="space-y-4">
//               {/* Prediction Output Section */}
//               <div className={`bg-blue-50 p-4 rounded-md border border-blue-200 mb-6`}>
//                 <h4 className="text-lg font-semibold text-blue-800 mb-3">Prediction</h4>
//                 <div className="flex items-center mb-2">
//                   <span className="font-medium w-40">Predicted Class:</span>
//                   <span className={`font-bold ${getPredictionColor(serverOutput.predicted_class)}`}>
//                     {serverOutput.predicted_class}
//                   </span>
//                 </div>
                
//                 {/* <div className="flex items-center mb-2">
//                   <span className="font-medium w-40">Confidence:</span>
//                   <span className="font-bold text-blue-700">
//                     {(serverOutput.confidence * 100).toFixed(2)}%
//                   </span>
//                 </div> */}
                
//                 <div className="mt-3">
//                   <p className="text-sm text-gray-700">{serverOutput.message}</p>
//                 </div>
//               </div>
              
//               {/* Analysis Details */}
//               <div className="grid grid-cols-1 gap-y-2">
//                 <div>
//                   <h4 className="text-md font-semibold text-gray-700 mb-2">Analysis Details</h4>
//                 </div>
                
//                 <div className="flex">
//                   <span className="font-medium w-32">Filename:</span>
//                   <span className="text-gray-700">{serverOutput.filename || selectedFile?.name}</span>
//                 </div>
                
//                 <div className="flex">
//                   <span className="font-medium w-32">Model Type:</span>
//                   <span className="text-gray-700">InceptionV3 Transfer Learning</span>
//                 </div>
                
//                 <div className="flex">
//                   <span className="font-medium w-32">Input Size:</span>
//                   <span className="text-gray-700">299x299 pixels</span>
//                 </div>
//               </div>
              
//               <div className="text-xs text-gray-500 mt-4">
//                 Analysis performed on: {new Date(serverOutput.timestamp).toLocaleString()}
//               </div>
              
//               {/* Error display if API had issues */}
//               {serverOutput.error && (
//                 <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
//                   {serverOutput.error}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';
import { FormEvent, useState, useRef } from 'react';
import { SubmitButton } from '@/app/ui/projects/form-components';
import { analyzeCervicalCancer } from './actions';
import { CancerDetectionResult } from '../types';
import Image from 'next/image';

export default function CervicalCancerDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverOutput, setServerOutput] = useState<CancerDetectionResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setServerOutput(null); // Reset previous results
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const result = await analyzeCervicalCancer(formData);
      setServerOutput(result);
    } catch (error) {
      console.error('Error processing image:', error);
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
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setServerOutput(null);
        
        // Update the file input
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    }
  };

  const getPredictionColor = (className: string) => {
    switch (className.toLowerCase()) {
      case 'benign':
        return 'text-green-600';
      case 'malignant':
        return 'text-red-600';
      case 'suspicious':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-lg">
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
                Cervical cancer remains a leading cause of cancer-related deaths among women, particularly in 
                low-resource settings like rural India where access to skilled cytologists and diagnostic 
                infrastructure is limited. To address this gap, we have collaborated with a tertiary cancer 
                center at AIIMS Bhubaneswar to develop an AI-powered web tool for cervical cancer screening 
                using Pap smear images. Leveraging deep learning, the system uses an ensemble of advanced 
                convolutional neural networks (CNNs) to automatically classify Pap smear images into benign, 
                malignant, or suspicious categories. The tool integrates image upload, automated analysis, 
                and result visualization through a user-friendly interface. By offering rapid and reliable 
                predictions within seconds, it supports clinicians in early diagnosis and helps reduce the 
                burden of manual screening, bringing scalable and high-accuracy screening closer to underserved 
                communities.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="w-full p-8 bg-white rounded-lg shadow-lg space-y-6 mb-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            AHRC Cervical Cancer Detection
          </h2>
          
          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              {previewUrl ? (
                <div className="mb-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="mx-auto max-h-64 rounded-lg shadow-md"
                  />
                  <p className="mt-2 text-sm text-gray-600">{selectedFile?.name}</p>
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
                    Drag and drop an image here, or click to select
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required
              />
              
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                {previewUrl ? 'Change Image' : 'Select Image'}
              </label>
            </div>
          </div>
          
          <SubmitButton disabled={isLoading || !selectedFile}>
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </SubmitButton>
        </form>
        
        {/* Results Display */}
        {serverOutput && (
          <div className="w-full p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h3>
            
            <div className="space-y-4">
              {/* Prediction Output Section */}
              <div className={`bg-blue-50 p-4 rounded-md border border-blue-200 mb-6`}>
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Prediction</h4>
                <div className="flex items-center mb-2">
                  <span className="font-medium w-40">Predicted Class:</span>
                  <span className={`font-bold ${getPredictionColor(serverOutput.predicted_class)}`}>
                    {serverOutput.predicted_class}
                  </span>
                </div>
                
                {/* <div className="flex items-center mb-2">
                  <span className="font-medium w-40">Confidence:</span>
                  <span className="font-bold text-blue-700">
                    {(serverOutput.confidence * 100).toFixed(2)}%
                  </span>
                </div> */}
                
                <div className="mt-3">
                  <p className="text-sm text-gray-700">{serverOutput.message}</p>
                </div>
              </div>
              
              {/* Analysis Details */}
              <div className="grid grid-cols-1 gap-y-2">
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Analysis Details</h4>
                </div>
                
                <div className="flex">
                  <span className="font-medium w-32">Filename:</span>
                  <span className="text-gray-700">{serverOutput.filename || selectedFile?.name}</span>
                </div>
                
                <div className="flex">
                  <span className="font-medium w-32">Model Type:</span>
                  <span className="text-gray-700">InceptionV3 Transfer Learning</span>
                </div>
                
                <div className="flex">
                  <span className="font-medium w-32">Input Size:</span>
                  <span className="text-gray-700">299x299 pixels</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                Analysis performed on: {new Date(serverOutput.timestamp).toLocaleString()}
              </div>
              
              {/* Error display if API had issues */}
              {serverOutput.error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {serverOutput.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}