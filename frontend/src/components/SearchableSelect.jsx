
import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({
  label,
  options,
  value,
  onChange,
  onBlur,
  loading,
  allowCustomInput = false,
  placeholder = 'Search...',
  dropdownPosition = 'below', // "above" or "below"
}) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isMouseDownOnOption, setIsMouseDownOnOption] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);


  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);


  useEffect(() => {
    const handleClickOutside = event => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (options.length > 0) {

      const filtered = options.filter(option => {
        const search = searchTerm.toLowerCase().trim();
        const opt = option.toLowerCase();


        if (opt === search) return true;


        if (opt.startsWith(search)) return true;


        const searchWords = search.split(' ').filter(word => word.length > 0);
        return searchWords.every(word => opt.includes(word));
      });

      setFilteredOptions(filtered.slice(0, 50));
    }
  }, [searchTerm, options]);

  const handleInputChange = e => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);

    if (allowCustomInput) {
      onChange(inputValue);
    }

    setIsOpen(inputValue.length > 0);
  };

  const handleOptionMouseDown = () => {
    setIsMouseDownOnOption(true);
  };

  const handleOptionClick = option => {
    setSearchTerm(option);
    onChange(option);
    setIsOpen(false);
    setIsMouseDownOnOption(false);

  };

  const handleInputBlur = () => {

    if (isMouseDownOnOption) {
      setIsMouseDownOnOption(false);
      return;
    }


    setIsOpen(false);
    if (onBlur) {
      onBlur();
    }


    if (!allowCustomInput && searchTerm && !options.includes(searchTerm)) {
      setSearchTerm('');
      onChange('');
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      if (allowCustomInput) {
        setIsOpen(false);
        onChange(searchTerm);
      } else if (filteredOptions.length > 0) {

        handleOptionClick(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {

      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading...' : placeholder}
          disabled={loading}
          className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto ${
            dropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onMouseDown={handleOptionMouseDown}
              onClick={() => handleOptionClick(option)}
              className="px-4 py-2 hover:bg-neutral-700 cursor-pointer text-white border-b border-neutral-700 last:border-b-0"
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && !loading && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg ${
            dropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <div className="px-4 py-2 text-gray-400">
            {allowCustomInput
              ? `Press Enter to use "${searchTerm}"`
              : 'No matches found'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
