import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExport: (format: 'excel' | 'pdf' | 'word') => void;
}

export function ExportDropdown({ onExport }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (format: 'excel' | 'pdf' | 'word') => {
    setIsOpen(false);
    onExport(format);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#D3D1C7] text-[#5F5E5A] hover:bg-[#F1EFE8] rounded-lg text-xs font-semibold transition-colors shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-[#D3D1C7] rounded-lg shadow-lg z-50 overflow-hidden">
          <button
            onClick={() => handleSelect('excel')}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8] hover:text-[#2C2C2A] transition-colors"
          >
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleSelect('pdf')}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8] hover:text-[#2C2C2A] transition-colors"
          >
            PDF (.pdf)
          </button>
          <button
            onClick={() => handleSelect('word')}
            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8] hover:text-[#2C2C2A] transition-colors border-t border-[#F1EFE8]"
          >
            Word (.docx)
          </button>
        </div>
      )}
    </div>
  );
}
