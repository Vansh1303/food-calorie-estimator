
import React from 'react';
import { Spinner } from './Spinner';

interface CalorieDisplayProps {
  isLoading: boolean;
  error: string | null;
  estimationResult: string | null;
}

export const CalorieDisplay: React.FC<CalorieDisplayProps> = ({ isLoading, error, estimationResult }) => {
  if (isLoading) {
    return (
      <div className="mt-6 p-6 bg-slate-50 rounded-lg shadow text-center">
        <div className="flex items-center justify-center space-x-3">
          <Spinner />
          <p className="text-slate-700 font-medium">Estimating calories, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow">
        <p className="font-bold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (estimationResult) {
    return (
      <div className="mt-6 p-6 bg-emerald-50 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-emerald-700 mb-3">Calorie Estimation:</h3>
        <pre className="text-slate-700 text-sm whitespace-pre-wrap bg-white p-4 rounded-md border border-emerald-200">
          {estimationResult}
        </pre>
      </div>
    );
  }

  return null; // Render nothing if no relevant state
};
