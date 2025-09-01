import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSession } from '../utils/Session';
import { showToast } from '../utils/toast';

const UniversitySelect = ({ value, onChange, placeholder = "Enter university name" }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchUniversities = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const token = getSession('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/universities/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(response.data.universities || []);
    } catch (error) {
      showToast.error('Failed to search universities');
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchUniversities(newValue);
    setShowSuggestions(true);
  };

  const selectUniversity = async (university) => {
    onChange(university.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((university, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectUniversity(university)}
              className="w-full px-4 py-2 text-left hover:bg-neutral-700 border-b border-neutral-700 last:border-b-0 text-sm transition-colors"
            >
              <div className="font-medium text-white">{university.name}</div>
              {university.city && university.country && (
                <div className="text-xs text-neutral-400">
                  {university.city}, {university.country}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniversitySelect;