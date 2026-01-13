import React from 'react';
import { STEPS } from '../constants';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
  setStep: (step: AppStep) => void;
  completedSteps: AppStep[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, setStep, completedSteps }) => {
  return (
    <div className="w-full py-6 px-4 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10" />
          
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isClickable = isCompleted || step.id === currentStep || (index > 0 && completedSteps.includes(STEPS[index - 1].id));

            return (
              <button
                key={step.id}
                onClick={() => isClickable && setStep(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center group transition-all duration-200 ${!isClickable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white
                    ${isActive ? 'border-primary-700 text-primary-700 scale-110 shadow-lg' : 
                      isCompleted ? 'border-green-500 text-green-500' : 'border-slate-300 text-slate-400'}
                  `}
                >
                  <step.icon size={18} />
                </div>
                <span className={`mt-2 text-xs font-medium uppercase tracking-wider
                   ${isActive ? 'text-primary-900' : 'text-slate-500'}
                `}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};