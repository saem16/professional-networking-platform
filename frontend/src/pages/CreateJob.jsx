import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  X,
  Search,
  Plus,
  Crosshair,
  Navigation,
  Clock,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import { getSession } from '../utils/Session';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../utils/toast';

const CreateJob = () => {
  const user = getSession('user');
  const navigate = useNavigate();


  if (!user || user.accountType !== 'company') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">Only company accounts can create job posts.</p>
        </div>
      </div>
    );
  }

  const [form, setForm] = useState({
    title: '',
    location: user?.address || '',
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    type: '',
    salary: '',
    skillsRequired: [],
    skillInput: '',
    perks: '',
    description: '',
    whatYouDo: '',
    whatYouGoodAt: '',
    aboutYou: '',
  });

  const [editor, setEditor] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 19.076, lng: 72.8777 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapSearchSuggestions, setMapSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [popularLocations] = useState([
    { name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
    { name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
    { name: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
    { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  ]);

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const mapSearchTimeoutRef = useRef(null);

  const token = getSession('token');


  useEffect(() => {
    const saved = localStorage.getItem('recentJobLocations');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        showToast.error('Failed to load recent searches');
      }
    }
  }, []);

  const saveRecentSearch = location => {
    const newSearch = {
      name: location.display_name || location.name,
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon || location.lng),
      timestamp: Date.now(),
    };

    const updated = [
      newSearch,
      ...recentSearches.filter(r => r.name !== newSearch.name),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentJobLocations', JSON.stringify(updated));
  };


  useEffect(() => {
    const loadLeaflet = () => {
  
      if (window.L) {
        setMapLoaded(true);
        return;
      }

  
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href =
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(cssLink);

  
      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadLeaflet();


    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (mapSearchTimeoutRef.current) {
        clearTimeout(mapSearchTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    if (showMapModal && mapLoaded && window.L) {
  
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [showMapModal, mapLoaded]);

  const initializeMap = () => {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }


    const map = window.L.map('map-container', {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: 10,
    });


    window.L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '© OpenStreetMap contributors, © CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);


    map.on('click', e => {
      handleMapClick(e.latlng, map);
    });


    if (form.latitude && form.longitude) {
      const marker = window.L.marker([form.latitude, form.longitude]).addTo(
        map
      );
      markerRef.current = marker;
      setSelectedMarker({ lat: form.latitude, lng: form.longitude });
      map.setView([form.latitude, form.longitude], 13);
    }

    mapRef.current = map;
  };

  const handleMapClick = (latlng, map) => {
  
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

  
    const marker = window.L.marker([latlng.lat, latlng.lng]).addTo(map);
    markerRef.current = marker;
    setSelectedMarker(latlng);

  
    reverseGeocode(latlng.lat, latlng.lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchLocation(data.display_name);
      }
    } catch (error) {
      showToast.error('Failed to get location details');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

      
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
          handleMapClick({ lat, lng }, mapRef.current);
        }

        setIsLoadingLocation(false);
      },
      error => {
        showToast.error('Unable to get your current location. Please search manually.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleMapSearchInput = value => {
    setSearchLocation(value);

    if (mapSearchTimeoutRef.current) {
      clearTimeout(mapSearchTimeoutRef.current);
    }

    if (value.length <= 2) {
      setMapSearchSuggestions([]);
      return;
    }

    mapSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=8`
        );
        const data = await response.json();
        setMapSearchSuggestions(data);
      } catch (error) {
        showToast.error('Failed to search locations');
        setMapSearchSuggestions([]);
      }
    }, 300);
  };

  const selectMapSuggestion = suggestion => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);

    setSearchLocation(suggestion.display_name);
    setMapSearchSuggestions([]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
      handleMapClick({ lat, lng }, mapRef.current);
    }

    saveRecentSearch(suggestion);
  };

  const selectQuickLocation = location => {
    setSearchLocation(location.name);
    setMapSearchSuggestions([]);

    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 13);
      handleMapClick({ lat: location.lat, lng: location.lng }, mapRef.current);
    }

    saveRecentSearch(location);
  };

  const searchLocationOnMap = async () => {
    if (!searchLocation.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation
        )}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
          handleMapClick({ lat, lng }, mapRef.current);
        }

        saveRecentSearch(result);
      }
    } catch (error) {
      showToast.error('Location search failed');
    }
  };

  const handleLocationInputChange = async value => {
    setForm(prev => ({ ...prev, location: value }));

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.length <= 2) {
      setLocationSuggestions([]);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5`
        );
        const data = await response.json();
        setLocationSuggestions(data);
      } catch (error) {
        showToast.error('Failed to load location suggestions');
        setLocationSuggestions([]);
      }
    }, 500);
  };

  const selectSuggestion = suggestion => {
    setForm(prev => ({
      ...prev,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    }));
    setLocationSuggestions([]);
  };

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSkillKeyDown = e => {
    if (e.key === 'Enter' && form.skillInput.trim()) {
      e.preventDefault();
      if (!form.skillsRequired.includes(form.skillInput.trim())) {
        setForm(prev => ({
          ...prev,
          skillsRequired: [...prev.skillsRequired, form.skillInput.trim()],
          skillInput: '',
        }));
      }
    }
  };

  const removeSkill = skill => {
    setForm(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill),
    }));
  };

  const confirmLocationSelection = () => {
    if (selectedMarker) {
      setForm(prev => ({
        ...prev,
        location: searchLocation,
        latitude: selectedMarker.lat,
        longitude: selectedMarker.lng,
      }));
    }
    setShowMapModal(false);
    setShowMobileSidebar(false);
  };

  const handleSubmit = async () => {
    try {
    
      const description = form.description;

      const payload = {
        title: form.title,
        company: user.companyProfile?.companyName || user.name,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        type: form.type,
        salary: form.salary,
        skillsRequired: form.skillsRequired,
        perks: form.perks,
        description: description,
        whatYouDo: form.whatYouDo,
        whatYouGoodAt: form.whatYouGoodAt,
        aboutYou: form.aboutYou,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/jobs`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      showToast.success('Job posted successfully!');
      navigate('/');
    } catch (error) {
      showToast.error('Failed to post job. Please try again.');
    }
  };

  return (
    <div className="w-full py-4 px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Post a New Job</h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Job Title *"
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              Location {user?.address && <span className="text-xs sm:text-sm text-gray-400">(using company address)</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.location}
                onChange={e => handleLocationInputChange(e.target.value)}
                placeholder={user?.address ? "Company address loaded - modify if needed" : "Enter location or click map icon to select"}
                className="w-full p-3 sm:p-4 pr-12 sm:pr-14 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
              />
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-white transition-colors"
              >
                <MapPin size={18} className="sm:w-5 sm:h-5" />
              </button>

              {locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#1f1f1f] border border-gray-700 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-[#2a2a2a] border-b border-gray-700 last:border-b-0 text-xs sm:text-sm transition-colors"
                    >
                      <div className="font-medium">
                        {suggestion.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.latitude && form.longitude && (
              <p className="text-xs sm:text-sm text-gray-400">
                {user?.address && user?.latitude && user?.longitude && form.latitude === user.latitude && form.longitude === user.longitude
                  ? 'Using company coordinates: '
                  : 'Selected coordinates: '}
                {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
              required
            >
              <option value="">Select Job Type *</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
            <input
              name="salary"
              value={form.salary}
              onChange={handleChange}
              placeholder="Salary (e.g., $50,000 - $70,000)"
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              Skills Required
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
              {form.skillsRequired.map((skill, i) => (
                <span
                  key={i}
                  className="bg-[#1f1f1f] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-gray-600 flex items-center gap-1.5"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-gray-400 hover:text-white transition-colors ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add skills (press Enter)"
              value={form.skillInput}
              onChange={e =>
                setForm(prev => ({ ...prev, skillInput: e.target.value }))
              }
              onKeyDown={handleSkillKeyDown}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              Perks & Benefits
            </label>
            <textarea
              name="perks"
              value={form.perks}
              onChange={handleChange}
              placeholder="List the perks and benefits offered..."
              rows={3}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 resize-vertical text-sm sm:text-base transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              What you'll do *
            </label>
            <textarea
              name="whatYouDo"
              value={form.whatYouDo}
              onChange={handleChange}
              placeholder="Describe the main responsibilities and tasks..."
              rows={4}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 resize-vertical text-sm sm:text-base transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              What you're good at *
            </label>
            <textarea
              name="whatYouGoodAt"
              value={form.whatYouGoodAt}
              onChange={handleChange}
              placeholder="List the required skills and qualifications..."
              rows={4}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 resize-vertical text-sm sm:text-base transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              About you *
            </label>
            <textarea
              name="aboutYou"
              value={form.aboutYou}
              onChange={handleChange}
              placeholder="Describe the ideal candidate and company culture fit..."
              rows={3}
              className="w-full p-3 sm:p-4 rounded-lg bg-[#1f1f1f] border border-gray-700 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 resize-vertical text-sm sm:text-base transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm sm:text-base font-medium text-gray-300">
              Additional Details
            </label>
            <div className="bg-[#1f1f1f] border border-gray-700 rounded-lg p-3 sm:p-4 focus-within:border-white focus-within:ring-2 focus-within:ring-white/20 transition-all">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Any additional information about the role..."
                className="w-full h-32 sm:h-36 bg-transparent border-none outline-none resize-none text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 border border-white text-white rounded-lg hover:bg-white hover:text-black transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
            >
              Publish Job
            </button>
          </div>
        </div>
      </div>

      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-[#111] rounded-lg sm:rounded-xl w-full max-w-7xl h-[95vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Select Job Location
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Click on the map or search for a location
                </p>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="lg:hidden flex-shrink-0 border-b border-gray-700 p-3 sm:p-4">
                <button
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Search size={16} />
                    <span className="text-sm font-medium">Search & Quick Locations</span>
                  </div>
                  {showMobileSidebar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-6 overflow-hidden">
                <div className={`
                  ${showMobileSidebar ? 'block' : 'hidden'} lg:block 
                  w-full lg:w-80 xl:w-96 
                  ${showMobileSidebar ? 'border-b border-gray-700 lg:border-b-0' : ''}
                  flex-shrink-0 overflow-hidden
                `}>
                  <div className="p-3 sm:p-4 lg:p-0 flex flex-col space-y-3 sm:space-y-4 h-full lg:max-h-full overflow-hidden">
                    <div className="relative flex-shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchLocation}
                          onChange={e => handleMapSearchInput(e.target.value)}
                          placeholder="Search for a location..."
                          className="w-full p-3 sm:p-4 pl-10 sm:pl-12 pr-4 rounded-lg sm:rounded-xl bg-[#1a1a1a] border border-gray-600 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 text-sm sm:text-base transition-all"
                          onKeyDown={e =>
                            e.key === 'Enter' && searchLocationOnMap()
                          }
                        />
                        <Search
                          className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400"
                          size={16}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3">
                        <button
                          onClick={searchLocationOnMap}
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-black hover:bg-gray-200 rounded-lg text-sm sm:text-base font-medium transition-colors"
                        >
                          Search
                        </button>
                        <button
                          onClick={getCurrentLocation}
                          disabled={isLoadingLocation}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1f1f1f] border border-gray-600 hover:bg-[#2a2a2a] disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {isLoadingLocation ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Navigation size={16} />
                          )}
                          <span className="hidden sm:inline">
                            {isLoadingLocation ? 'Finding...' : 'Current'}
                          </span>
                          <span className="sm:hidden">
                            {isLoadingLocation ? 'GPS' : 'GPS'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {mapSearchSuggestions.length > 0 && (
                      <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                        <div className="p-3 sm:p-4 border-b border-gray-700">
                          <h4 className="text-sm sm:text-base font-semibold text-gray-300">
                            Search Results
                          </h4>
                        </div>
                        <div className="max-h-32 sm:max-h-48 lg:max-h-60 overflow-y-auto">
                          {mapSearchSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectMapSuggestion(suggestion)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-[#2a2a2a] border-b border-gray-700 last:border-b-0 text-xs sm:text-sm transition-colors group"
                            >
                              <div className="flex items-start gap-2 sm:gap-3">
                                <MapPin
                                  size={14}
                                  className="text-gray-400 group-hover:text-white mt-0.5 flex-shrink-0 sm:w-4 sm:h-4"
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-white group-hover:text-white line-clamp-2 break-words">
                                    {suggestion.display_name}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-h-0 overflow-hidden">
                      {recentSearches.length > 0 &&
                        mapSearchSuggestions.length === 0 && (
                          <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg sm:rounded-xl overflow-hidden h-full flex flex-col">
                            <div className="p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-300 flex items-center gap-2">
                                <Clock size={14} className="sm:w-4 sm:h-4" />
                                Recent Searches
                              </h4>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                              {recentSearches.map((location, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => selectQuickLocation(location)}
                                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-[#2a2a2a] border-b border-gray-700 last:border-b-0 text-xs sm:text-sm transition-colors group"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <Clock
                                      size={12}
                                      className="text-gray-400 group-hover:text-white sm:w-4 sm:h-4"
                                    />
                                    <div className="font-medium text-white group-hover:text-white truncate">
                                      {location.name}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {mapSearchSuggestions.length === 0 && recentSearches.length === 0 && (
                        <div className="bg-[#1a1a1a] border border-gray-600 rounded-lg sm:rounded-xl overflow-hidden h-full flex flex-col">
                          <div className="p-3 sm:p-4 border-b border-gray-700 flex-shrink-0">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-300 flex items-center gap-2">
                              <Star size={14} className="sm:w-4 sm:h-4" />
                              Popular Locations
                            </h4>
                          </div>
                          <div className="flex-1 overflow-y-auto">
                            {popularLocations.map((location, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => selectQuickLocation(location)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-[#2a2a2a] border-b border-gray-700 last:border-b-0 text-xs sm:text-sm transition-colors group"
                              >
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <Star
                                    size={12}
                                    className="text-gray-400 group-hover:text-white sm:w-4 sm:h-4"
                                  />
                                  <div className="font-medium text-white group-hover:text-white">
                                    {location.name}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 lg:p-0">
                  <div className="flex-1 bg-[#1a1a1a] rounded-lg sm:rounded-xl overflow-hidden border border-gray-600 relative min-h-64 sm:min-h-80 lg:min-h-96">
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] text-gray-400">
                        <div className="text-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                          <div className="text-xs sm:text-sm">Loading interactive map...</div>
                        </div>
                      </div>
                    )}
                    <div
                      id="map-container"
                      style={{ height: '100%', width: '100%' }}
                    ></div>

                    {selectedMarker && (
                      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 bg-black/90 backdrop-blur-sm border border-gray-600 rounded-lg p-2 sm:p-3">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Crosshair
                            size={14}
                            className="text-white mt-0.5 flex-shrink-0 sm:w-4 sm:h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-white mb-1">
                              Selected Location
                            </div>
                            <div className="text-xs sm:text-sm text-gray-300 break-words line-clamp-2">
                              {searchLocation}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {selectedMarker.lat.toFixed(6)},{' '}
                              {selectedMarker.lng.toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-4 flex-shrink-0">
                    <button
                      onClick={() => {
                        setShowMapModal(false);
                        setShowMobileSidebar(false);
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-600 rounded-lg hover:bg-[#1f1f1f] text-white text-sm sm:text-base font-medium transition-colors order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmLocationSelection}
                      disabled={!selectedMarker}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <MapPin size={16} />
                      Confirm Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateJob;
