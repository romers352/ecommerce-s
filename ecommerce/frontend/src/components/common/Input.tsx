import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  hasError?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    fullWidth = false,
    type = 'text',
    className = '',
    hasError = false,
    ...props
  },
  ref
) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const baseClasses = 'transition-all duration-200 focus:outline-none';
  
  const isError = error || hasError;
  
  const variantClasses = {
    default: `border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 ${isError ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50' : ''}`,
    filled: `bg-gray-100 border-0 rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-primary-200 ${isError ? 'bg-red-100 focus:ring-red-200' : ''}`,
    outlined: `border-2 border-gray-300 rounded-lg px-3 py-2 bg-transparent focus:border-primary-500 ${isError ? 'border-red-500 focus:border-red-500 bg-red-50' : ''}`,
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const paddingClass = leftIcon ? 'pl-10' : rightIcon || type === 'password' ? 'pr-10' : '';
  
  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${widthClass} ${paddingClass} ${className}`;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <motion.label
          className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            isError ? 'text-red-700' : isFocused ? 'text-primary-700' : 'text-gray-700'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`text-gray-400 ${isFocused ? 'text-primary-500' : ''}`}>
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={inputClasses}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {(rightIcon || type === 'password') && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {type === 'password' ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-primary-500 transition-colors duration-200"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            ) : (
              <span className={`text-gray-400 ${isFocused ? 'text-primary-500' : ''}`}>
                {rightIcon}
              </span>
            )}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <motion.p
          className={`mt-1 text-sm ${
            error ? 'text-red-600' : 'text-gray-500'
          }`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;