'use client';
import { FormEvent, useState } from 'react';
import { FloatingLabelInput, SubmitButton } from '@/app/ui/projects/form-components';
import { createInvoice } from './actions';
import { ProcessedFormData } from '../types';

export default function IrrigationForm() {
  // State to store the processed output from the server
  const [isLoading, setIsLoading] = useState(false);
  const [serverOutput, setServerOutput] = useState<ProcessedFormData | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      // Call the server action and get the processed result
      const result = await createInvoice(formData);
      setServerOutput(result);
    } catch (error) {
      console.error('Error processing form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-lg">
        <form onSubmit={handleSubmit} className="w-full p-8 bg-white rounded-lg shadow-lg space-y-6 mb-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Irrigation Management System</h2>
          
          {/* Location Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingLabelInput id="latitude" name="latitude" label="Latitude" required />
            <FloatingLabelInput id="longitude" name="longitude" label="Longitude" required />
          </div>
          
          {/* Crop Information */}
          <FloatingLabelInput 
            id="croppedArea" 
            name="croppedArea" 
            label="Cropped Area (acres)" 
            type="number" 
            step="0.01"
            required 
          />
          <FloatingLabelInput id="cropName" name="cropName" label="Crop Name" required />
          <FloatingLabelInput 
            id="sowingDate" 
            name="sowingDate" 
            label="Sowing/Transplanting Date" 
            type="date" 
            required 
          />
          <FloatingLabelInput 
            id="basePeriod" 
            name="basePeriod" 
            label="Base Period of Crops (days)" 
            type="number" 
            required 
          />
          <FloatingLabelInput 
            id="lastIrrigationDate" 
            name="lastIrrigationDate" 
            label="Last Irrigation Date" 
            type="date" 
            required 
          />
          
          {/* Pump Information */}
          <FloatingLabelInput 
            id="pumpHP" 
            name="pumpHP" 
            label="Pump HP" 
            type="number" 
            step="0.1"
            required 
          />
          <FloatingLabelInput 
            id="pumpDischargeRate" 
            name="pumpDischargeRate" 
            label="Pump Discharge Rate (li/min)" 
            type="number" 
            step="0.1"
            required 
          />
          
          {/* Dropdown for Pump Type */}
          <div className="relative">
            <label htmlFor="pumpType" className="block text-sm font-medium text-gray-700 mb-1">
              Pump Type
            </label>
            <select 
              id="pumpType" 
              name="pumpType" 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select Pump Type</option>
              <option value="Submersible">Submersible</option>
              <option value="Centrifugal">Centrifugal</option>
              <option value="Turbine">Turbine</option>
              <option value="Jet">Jet</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Dropdown for Irrigation Method */}
          <div className="relative">
            <label htmlFor="irrigationMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Method of Irrigation
            </label>
            <select 
              id="irrigationMethod" 
              name="irrigationMethod" 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Select Irrigation Method</option>
              <option value="Drip">Drip Irrigation</option>
              <option value="Sprinkler">Sprinkler</option>
              <option value="Flood">Flood Irrigation</option>
              <option value="Furrow">Furrow Irrigation</option>
              <option value="Basin">Basin Irrigation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <SubmitButton disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Calculate Irrigation Needs'}
          </SubmitButton>
        </form>
        
        {/* Server processed output display */}
        {serverOutput && (
          <div className="w-full p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Irrigation Recommendation</h3>
            
            <div className="space-y-4">
              {/* Recommendation Output Section */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Recommendation</h4>
                <div className="flex items-center mb-2">
                  <span className="font-medium w-40">Turn on the pump:</span>
                  <span className={`font-bold ${serverOutput.turnOnPump ? 'text-green-600' : 'text-red-600'}`}>
                    {serverOutput.turnOnPump ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {serverOutput.turnOnPump && (
                  <div className="flex items-center">
                    <span className="font-medium w-40">Pump running time:</span>
                    <span className="font-bold text-blue-700">{serverOutput.pumpRunningTime}</span>
                  </div>
                )}
              </div>
              
              {/* Input Parameters Summary */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-2">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Location</h4>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Latitude:</span>
                  <span className="text-gray-700">{serverOutput.latitude}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Longitude:</span>
                  <span className="text-gray-700">{serverOutput.longitude}</span>
                </div>
                
                <div className="col-span-2 mt-3">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Crop Information</h4>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Crop:</span>
                  <span className="text-gray-700">{serverOutput.cropName}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Area:</span>
                  <span className="text-gray-700">{serverOutput.croppedArea} acres</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Sowing:</span>
                  <span className="text-gray-700">{new Date(serverOutput.sowingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Base Period:</span>
                  <span className="text-gray-700">{serverOutput.basePeriod} days</span>
                </div>
                
                <div className="col-span-2 mt-3">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Irrigation Details</h4>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Last Date:</span>
                  <span className="text-gray-700">{new Date(serverOutput.lastIrrigationDate).toLocaleDateString()}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Method:</span>
                  <span className="text-gray-700">{serverOutput.irrigationMethod}</span>
                </div>
                
                <div className="col-span-2 mt-3">
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Pump Details</h4>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Type:</span>
                  <span className="text-gray-700">{serverOutput.pumpType}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">HP:</span>
                  <span className="text-gray-700">{serverOutput.pumpHP}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Discharge:</span>
                  <span className="text-gray-700">{serverOutput.pumpDischargeRate} li/min</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                Calculation performed on: {new Date(serverOutput.timestamp).toLocaleString()}
              </div>
              
              {/* Error display if API had issues */}
              {'error' in serverOutput.apiData && (
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