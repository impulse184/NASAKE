
import React from 'react';
import { Button } from "@/components/ui/button";
import { COLORS, ColorConfig } from '../types/colorShift';

interface ColorButtonsProps {
  onColorSelect: (color: ColorConfig) => void;
}

export const ColorButtons: React.FC<ColorButtonsProps> = ({ onColorSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
      {COLORS.map((color) => (
        <Button
          key={color.name}
          style={{ backgroundColor: color.value }}
          className="h-12 w-24 text-white font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
          onClick={() => onColorSelect(color)}
        >
          {color.name}
        </Button>
      ))}
    </div>
  );
};
