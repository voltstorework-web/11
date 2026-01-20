
import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, onChange, min, max, step, unit }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-light-text">{label}</label>
        <span className="text-sm font-mono text-gray-900 dark:text-light-text bg-gray-200 dark:bg-dark-bg px-2 py-0.5 rounded">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-white/10 accent-brand"
      />
    </div>
  );
};

export default SliderControl;