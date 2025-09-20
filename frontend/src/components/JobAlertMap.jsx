import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Briefcase, X, Map, List, Navigation } from 'lucide-react';
import axios from 'axios';

const JobAlertMap = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 19.076, lng: 72.8777 });
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('All');
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userLocationMarkerRef = useRef(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapRef.current) {

          if (userLocationMarkerRef.current) {
            mapRef.current.removeLayer(userLocationMarkerRef.current);
          }


          const userIcon = window.L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                background-color: #007bff;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 2px #007bff, 0 2px 8px rgba(0,0,0,0.3);
                filter: none;
              "></div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          userLocationMarkerRef.current = window.L.marker([lat, lng], {
            icon: userIcon
          }).addTo(mapRef.current);

          userLocationMarkerRef.current.bindPopup('Your current location', {
            className: 'custom-popup',
          });

          mapRef.current.setView([lat, lng], 15);
        }
      },
      error => {
        console.error('Geolocation error:', error);
        alert('Unable to get your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };


  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {

    window.applyToJob = (jobId) => {
      window.location.href = `/open-roles/job/${jobId}`;
    };

    const checkNotificationState = () => {
      setNotificationOpen(!!window.notificationModalOpen || !!window.profileMenuOpen);
    };
    
    const interval = setInterval(checkNotificationState, 100);
    
    return () => {
      delete window.applyToJob;
      clearInterval(interval);
    };
  }, [jobs]);

  useEffect(() => {
    if (jobs.length > 0 && window.L) {
      initializeMap();
    }
  }, [jobs, selectedJobType]);


  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href =
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        document.head.appendChild(cssLink);

        const script = document.createElement('script');
        script.src =
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = () => {
          console.log('Leaflet loaded successfully');
          resolve();
        };
        script.onerror = () => {
          console.error('Failed to load Leaflet');
          reject();
        };
        document.head.appendChild(script);
      });
    };

    loadLeaflet()
      .then(() => {
        if (jobs.length > 0) {
          setTimeout(() => initializeMap(), 100);
        }
      })
      .catch(error => {
        console.error('Error loading Leaflet:', error);
      });
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`);
      const data = response.data;

      const jobsWithLocation = data.filter(
        job => job.latitude && job.longitude
      );
      setJobs(jobsWithLocation);

      if (jobsWithLocation.length > 0) {
        setMapCenter({
          lat: jobsWithLocation[0].latitude,
          lng: jobsWithLocation[0].longitude,
        });
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    console.log('Initializing map with jobs:', jobs.length);

    if (!window.L) {
      console.error('Leaflet not loaded');
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      markersRef.current = [];
    }

    const mapContainer = document.getElementById('job-map-container');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }


    const map = window.L.map('job-map-container', {
      center: [mapCenter.lat, mapCenter.lng],
      zoom: 6,
      zoomControl: false,
    });

    console.log('Map created successfully');


    const zoomControl = window.L.control.zoom({
      position: 'topright',
    });
    zoomControl.addTo(map);


    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);


    setTimeout(() => {
      const mapContainer = document.getElementById('job-map-container');
      if (mapContainer) {
        mapContainer.style.filter =
          'grayscale(100%) invert(1) contrast(1.2) brightness(0.85)';
      }
    }, 500);


    const filteredJobs = selectedJobType === 'All' ? jobs : jobs.filter(job => job.type === selectedJobType);


    filteredJobs.forEach(job => {
      console.log(
        'Adding marker for job:',
        job.title,
        job.latitude,
        job.longitude
      );

      const marker = window.L.marker([job.latitude, job.longitude], {
        icon: createCustomIcon(job.type),
      }).addTo(map);


      marker.on('click', () => {
        setSelectedJob(job);
      });


      marker.bindPopup(createPopupContent(job), {
        className: 'custom-popup',
      });

      markersRef.current.push(marker);
    });


    if (filteredJobs.length > 1) {
      const group = new window.L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    console.log('Map initialization complete');
    mapRef.current = map;
  };

  const createCustomIcon = jobType => {
    const color = getJobTypeColor(jobType);
    const shape = getJobTypeShape(jobType);

    return window.L.divIcon({
      className: 'custom-marker',
      html: shape.replace('COLOR_PLACEHOLDER', color),
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const getJobTypeShape = type => {
    const shapes = {
      'Full-time': `
        <div style="
          background-color: COLOR_PLACEHOLDER;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 4px solid black;
          box-shadow: 0 0 0 2px white, 0 4px 12px rgba(0,0,0,0.5);
          filter: none;
        "></div>
      `,
      'Part-time': `
        <div style="
          background-color: COLOR_PLACEHOLDER;
          width: 24px;
          height: 24px;
          border: 4px solid black;
          box-shadow: 0 0 0 2px white, 0 4px 12px rgba(0,0,0,0.5);
          filter: none;
        "></div>
      `,
      'Internship': `
        <div style="
          background-color: COLOR_PLACEHOLDER;
          width: 24px;
          height: 24px;
          transform: rotate(45deg);
          border: 4px solid black;
          box-shadow: 0 0 0 2px white, 0 4px 12px rgba(0,0,0,0.5);
          filter: none;
        "></div>
      `,
      'Contract': `
        <div style="
          width: 0;
          height: 0;
          border-left: 14px solid transparent;
          border-right: 14px solid transparent;
          border-bottom: 26px solid COLOR_PLACEHOLDER;
          position: relative;
          filter: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        "></div>
      `,
    };
    return shapes[type] || shapes['Full-time'];
  };

  const getJobTypeColor = type => {
    const colors = {
      'Full-time': '#4CAF50',
      'Part-time': '#FF9800',
      Internship: '#2196F3',
      Contract: '#9C27B0',
    };
    return colors[type] || '#757575';
  };

  const createPopupContent = job => {
    return `
      <div style="color: black; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${
          job.title
        }</h3>
        <p style="margin: 4px 0; color: #666;"><strong>${
          job.company
        }</strong></p>
        <p style="margin: 4px 0; color: #666;">${job.location}</p>
        <div style="margin: 8px 0;">
          <span style="
            background-color: ${getJobTypeColor(job.type)};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
          ">${job.type}</span>
        </div>
        ${
          job.salary
            ? `<p style="margin: 4px 0; color: #666;"><strong>Salary:</strong> ${job.salary}</p>`
            : ''
        }
        <button onclick="window.applyToJob('${job._id}')" style="
          background-color: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 8px;
          font-size: 12px;
        ">View Job</button>
      </div>
    `;
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading job locations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white">

        <div className="bg-[#111] border-b border-gray-800 p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Job Locations</h1>
              <p className="text-gray-400">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} with location
                data
              </p>
            </div>


          </div>
        </div>


        <div className="flex-1">
          <div className={`relative h-[calc(100vh-140px)] ${notificationOpen ? '-z-10' : ''}`}>

            <div
              id="job-map-container"
              className="w-full h-full bg-gray-900"
            ></div>


            {!window.L && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">Loading map...</p>
                </div>
              </div>
            )}


            <div className="absolute top-4 left-4 bg-[#111] bg-opacity-90 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold mb-3">Job Types</h3>
              <div className="space-y-2">
                {['All', 'Full-time', 'Part-time', 'Internship', 'Contract'].map(
                  type => (
                    <button
                      key={type}
                      onClick={() => setSelectedJobType(type)}
                      className={`flex items-center gap-2 w-full text-left p-1 rounded transition-colors ${
                        selectedJobType === type ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {type === 'All' && (
                          <div className="w-3 h-3 rounded-full bg-white border border-gray-400"></div>
                        )}
                        {type === 'Full-time' && (
                          <div
                            className="w-3 h-3 rounded-full border border-white"
                            style={{ backgroundColor: getJobTypeColor(type) }}
                          ></div>
                        )}
                        {type === 'Part-time' && (
                          <div
                            className="w-3 h-3 border border-white"
                            style={{ backgroundColor: getJobTypeColor(type) }}
                          ></div>
                        )}
                        {type === 'Internship' && (
                          <div
                            className="w-3 h-3 border border-white transform rotate-45"
                            style={{ backgroundColor: getJobTypeColor(type) }}
                          ></div>
                        )}
                        {type === 'Contract' && (
                          <div
                            className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
                            style={{ borderBottomColor: getJobTypeColor(type) }}
                          ></div>
                        )}
                      </div>
                      <span className={`text-sm ${
                        selectedJobType === type ? 'text-white font-medium' : 'text-gray-300'
                      }`}>{type}</span>
                    </button>
                  )
                )}
              </div>
            </div>


            <button
              onClick={getCurrentLocation}
              className="absolute bottom-4 left-4 bg-[#111] bg-opacity-90 hover:bg-[#1f1f1f] rounded-lg p-3 border border-gray-700 transition-colors"
              title="Go to my location"
            >
              <Navigation size={18} className="text-white" />
            </button>


            <div className="absolute bottom-4 right-4 bg-[#111] bg-opacity-90 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                <span className="text-sm">
                  {selectedJobType === 'All' ? jobs.length : jobs.filter(job => job.type === selectedJobType).length} 
                  {selectedJobType === 'All' ? ' Jobs Mapped' : ` ${selectedJobType} Jobs`}
                </span>
              </div>
            </div>
          </div>
        </div>



      </div>


      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .custom-popup .leaflet-popup-tip {
          background-color: white;
        }

        #job-map-container .leaflet-control-zoom {
          background-color: #111;
          border: 1px solid #374151;
        }

        #job-map-container .leaflet-control-zoom a {
          background-color: #1f1f1f;
          color: white;
          border-bottom: 1px solid #374151;
        }

        #job-map-container .leaflet-control-zoom a:hover {
          background-color: #2a2a2a;
        }
      `}</style>
    </>
  );
};

export default JobAlertMap;
