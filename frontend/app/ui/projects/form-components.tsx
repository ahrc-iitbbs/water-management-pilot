// FloatingLabelInput.tsx
import React, { InputHTMLAttributes } from 'react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  name: string;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  label,
  name,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        required={required}
        className={`block px-2.5 pb-2.5 pt-4 w-full text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-blue-600 peer ${className}`}
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
      >
        {label}
      </label>
    </div>
  );
};

// Button component
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <button
      type="submit"
      className={`w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};