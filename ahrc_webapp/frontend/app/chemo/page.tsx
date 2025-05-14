// // app/chemo/chemo-form.tsx
// 'use client';
// import { FormEvent, useState, useRef } from 'react';
// import { FloatingLabelInput, SubmitButton } from '@/app/ui/projects/form-components';
// import { analyzeToxicity } from './actions';
// import { ChemoFormData } from '../types';

// export default function ChemoForm() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [serverOutput, setServerOutput] = useState<ChemoFormData | null>(null);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setIsLoading(true);
    
//     try {
//       const formData = new FormData(event.currentTarget);
      
//       if (selectedFile) {
//         formData.append('file', selectedFile);
//       }
      
//       // Call the server action and get the processed result
//       const result = await analyzeToxicity(formData);
//       setServerOutput(result);
//     } catch (error) {
//       console.error('Error processing form:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setSelectedFile(file);
//     }
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-50">
//       <div className="w-full max-w-lg">
//         <form onSubmit={handleSubmit} className="w-full p-8 bg-white rounded-lg shadow-lg space-y-6 mb-6">
//           <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
//             Chemotherapy Toxicity Prediction
//           </h2>
          
//           {/* File Number Input */}
//           <FloatingLabelInput 
//             id="fileNumber" 
//             name="fileNumber" 
//             label="Patient File Number" 
//             required 
//           />
          
//           {/* File Upload */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Patient Data Excel File
//             </label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept=".xlsx,.xls"
//               onChange={handleFileChange}
//               className="block w-full text-sm text-gray-500
//                 file:mr-4 file:py-2 file:px-4
//                 file:rounded-full file:border-0
//                 file:text-sm file:font-semibold
//                 file:bg-blue-50 file:text-blue-700
//                 hover:file:bg-blue-100
//                 cursor-pointer"
//               required
//             />
//             {selectedFile && (
//               <p className="text-sm text-gray-600">
//                 Selected: {selectedFile.name}
//               </p>
//             )}
//           </div>
          
//           <SubmitButton disabled={isLoading}>
//             {isLoading ? 'Analyzing...' : 'Predict Toxicity'}
//           </SubmitButton>
//         </form>
        
//         {/* Server processed output display */}
//         {serverOutput && (
//           <div className="w-full p-6 bg-white rounded-lg shadow-lg">
//             <h3 className="text-xl font-semibold text-gray-800 mb-4">Prediction Results</h3>
            
//             <div className="space-y-4">
//               {/* Prediction Output Section */}
//               <div className={`p-4 rounded-md border ${
//                 serverOutput.severity 
//                   ? 'bg-red-50 border-red-200' 
//                   : 'bg-green-50 border-green-200'
//               } mb-6`}>
//                 <h4 className={`text-lg font-semibold mb-3 ${
//                   serverOutput.severity ? 'text-red-800' : 'text-green-800'
//                 }`}>
//                   Prediction Result
//                 </h4>
//                 <div className="space-y-2">
//                   <div className="flex items-center">
//                     <span className="font-medium w-32">Patient File:</span>
//                     <span className="font-bold">{serverOutput.file_number}</span>
//                   </div>
//                   <div className="flex items-center">
//                     <span className="font-medium w-32">Prediction:</span>
//                     <span className={`font-bold ${
//                       serverOutput.severity ? 'text-red-600' : 'text-green-600'
//                     }`}>
//                       {serverOutput.prediction}
//                     </span>
//                   </div>
//                   {serverOutput.confidence !== null && (
//                     <div className="flex items-center">
//                       <span className="font-medium w-32">Confidence:</span>
//                       <span className="font-bold">
//                         {(serverOutput.confidence * 100).toFixed(2)}%
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>
              
//               {/* Risk Indicator */}
//               <div className="flex justify-center">
//                 <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
//                   serverOutput.severity 
//                     ? 'bg-red-100 border-4 border-red-500' 
//                     : 'bg-green-100 border-4 border-green-500'
//                 }`}>
//                   <span className={`text-4xl font-bold ${
//                     serverOutput.severity ? 'text-red-600' : 'text-green-600'
//                   }`}>
//                     {serverOutput.severity ? 'HIGH' : 'LOW'}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="text-xs text-gray-500 mt-4">
//                 Analysis performed on: {new Date(serverOutput.timestamp).toLocaleString()}
//               </div>
              
//               {/* Error display if API had issues */}
//               {serverOutput.apiData?.error && (
//                 <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
//                   {serverOutput.apiData.error}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// app/chemo/chemo-form.tsx
'use client';
import { FormEvent, useState, useRef } from 'react';
import { FloatingLabelInput, SubmitButton } from '@/app/ui/projects/form-components';
import { analyzeToxicity } from './actions';
import { ChemoFormData } from '../types';

export default function ChemoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverOutput, setServerOutput] = useState<ChemoFormData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      // Call the server action and get the processed result
      const result = await analyzeToxicity(formData);
      setServerOutput(result);
    } catch (error) {
      console.error('Error processing form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
                Chemotherapy, while essential in cancer treatment, often leads to severe hematological toxicities, 
                particularly in elderly patients, impacting their quality of life and treatment outcomes. To address 
                this, we collaborated with a tertiary cancer center at AIIMS Bhubaneswar to develop a web-based tool 
                that leverages machine learning to predict the risk of such toxicities. The tool accepts a set of 
                clinical parameters extracted from patient records, such as blood counts, kidney function, comorbidities, 
                and body metrics, and uses a trained Deep Neural Network (DNN) model to assess the likelihood of severe 
                toxicity. By capturing complex patterns in clinical data, the model helps clinicians identify high-risk 
                patients early, enabling safer and more personalized chemotherapy planning.
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="w-full p-8 bg-white rounded-lg shadow-lg space-y-6 mb-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Chemotherapy Toxicity Prediction
          </h2>
          
          {/* File Number Input */}
          <FloatingLabelInput 
            id="fileNumber" 
            name="fileNumber" 
            label="Patient File Number" 
            required 
          />
          
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Data Excel File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
              required
            />
            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          
          <SubmitButton disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Predict Toxicity'}
          </SubmitButton>
        </form>
        
        {/* Server processed output display */}
        {serverOutput && (
          <div className="w-full p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Prediction Results</h3>
            
            <div className="space-y-4">
              {/* Prediction Output Section */}
              <div className={`p-4 rounded-md border ${
                serverOutput.severity 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              } mb-6`}>
                <h4 className={`text-lg font-semibold mb-3 ${
                  serverOutput.severity ? 'text-red-800' : 'text-green-800'
                }`}>
                  Prediction Result
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium w-32">Patient File:</span>
                    <span className="font-bold">{serverOutput.file_number}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium w-32">Prediction:</span>
                    <span className={`font-bold ${
                      serverOutput.severity ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {serverOutput.prediction}
                    </span>
                  </div>
                  {/* {serverOutput.confidence !== null && (
                    <div className="flex items-center">
                      <span className="font-medium w-32">Confidence:</span>
                      <span className="font-bold">
                        {(serverOutput.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
              
              {/* Risk Indicator */}
              <div className="flex justify-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  serverOutput.severity 
                    ? 'bg-red-100 border-4 border-red-500' 
                    : 'bg-green-100 border-4 border-green-500'
                }`}>
                  <span className={`text-4xl font-bold ${
                    serverOutput.severity ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {serverOutput.severity ? 'HIGH' : 'LOW'}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                Analysis performed on: {new Date(serverOutput.timestamp).toLocaleString()}
              </div>
              
              {/* Error display if API had issues */}
              {serverOutput.apiData?.error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {serverOutput.apiData.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}