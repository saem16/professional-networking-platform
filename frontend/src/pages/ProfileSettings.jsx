import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import UniversitySelect from '../components/UniversitySelect';
import { showToast } from '../utils/toast';
import {
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Settings,
  Phone,
  Mail,
  Calendar,
  Globe,
  Camera,
  Plus,
  X,
} from 'lucide-react';
import { getSession } from '../utils/Session';

export default function ProfileSettings() {
  const [form, setForm] = useState({
    name: '',
    headline: '',
    bio: '',
    website: '',
    profilePicture: '',
    coverPhoto: '',

    status: 'student',
    accountType: 'student',

    location: {
      city: '',
      country: '',
      address: '',
    },

    education: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      gpa: null,
      description: '',
    },

    experience: [
      {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ],

    skills: [],

    certifications: [
      {
        name: '',
        issuer: '',
        date: '',
        credentialId: '',
        url: '',
      },
    ],

    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      portfolio: '',
    },

    profession: '',
  });

  const [openSections, setOpenSections] = useState({
    basic: true,
    location: false,
    education: false,
    experience: false,
    skills: false,
    certifications: false,
    social: false,
  });

  const [newSkill, setNewSkill] = useState('');
  const skillInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [previewProfile, setPreviewProfile] = useState('');
  const [previewCover, setPreviewCover] = useState('');

  const educationBufferRef = useRef({});

  const user = getSession('user');

  const toggleSection = section => {
    setOpenSections(prev => {
      const wasOpen = !!prev[section];
      return {
        basic: false,
        location: false,
        education: false,
        experience: false,
        skills: false,
        certifications: false,
        social: false,
        [section]: !wasOpen,
      };
    });
  };

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setForm(prevForm => ({
        ...prevForm,
        [parent]: {
          ...prevForm[parent],
          [child]: value,
        },
      }));
    } else {
      setForm(prevForm => ({
        ...prevForm,
        [name]: value,
      }));
    }
  };

  const handleEducationChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value },
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const addExperience = () => {
    setForm(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
        },
      ],
    }));
  };

  const removeExperience = index => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    const fromRef = skillInputRef.current?.value;
    const buffered = tempValuesRef.current['skills.input'];
    const skillValue =
      (fromRef && fromRef.trim()) ||
      (buffered && buffered.trim()) ||
      (newSkill && newSkill.trim());
    if (!skillValue) return;

    setForm(prev => {
      const current = Array.isArray(prev.skills) ? prev.skills.slice() : [];
      const exists = current.some(
        s =>
          (typeof s === 'string' ? s : s && s.name ? s.name : '')
            .toLowerCase()
            .trim() === skillValue.toLowerCase().trim()
      );
      if (!exists) current.push(skillValue.trim());
      return { ...prev, skills: current };
    });

    if (skillInputRef.current) skillInputRef.current.value = '';
    delete tempValuesRef.current['skills.input'];
    setNewSkill('');
  };

  const removeSkill = index => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleCertificationChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const addCertification = () => {
    setForm(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          name: '',
          issuer: '',
          date: '',
          credentialId: '',
          url: '',
        },
      ],
    }));
  };

  const removeCertification = index => {
    setForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/profile/${user.username}`,
          {
            headers: {
              Authorization: `Bearer ${getSession('token')}`,
            },
          }
        );

        const skillsFromBackend = Array.isArray(res.data.skills)
          ? res.data.skills
            .map(s => (typeof s === 'string' ? s : s && s.name ? s.name : ''))
            .filter(Boolean)
          : [];

        setForm(prev => ({
          ...prev,
          ...res.data,
          skills: skillsFromBackend,
          education: res.data.education?.[0] || prev.education,
          experience:
            Array.isArray(res.data.experience) && res.data.experience.length
              ? res.data.experience
              : prev.experience,
          certifications:
            Array.isArray(res.data.certifications) &&
              res.data.certifications.length
              ? res.data.certifications
              : prev.certifications,
        }));
      } catch (err) {
        showToast.error('Failed to load profile');
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const uploadFile = async file => {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/profile/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${getSession('token')}`,
        },
        withCredentials: true,
      }
    );
    return res.data.url;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let profilePictureUrl = form.profilePicture;
      let coverPhotoUrl = form.coverPhoto;
      if (profilePicFile) profilePictureUrl = await uploadFile(profilePicFile);
      if (coverPhotoFile) coverPhotoUrl = await uploadFile(coverPhotoFile);

      const payload = {
        ...form,
        profilePicture: profilePictureUrl,
        coverPhoto: coverPhotoUrl,
        education: [form.education],
        skills: Array.isArray(form.skills)
          ? form.skills.map(s => (typeof s === 'string' ? { name: s } : s))
          : [],
      };

      await axios.put(
        `${import.meta.env.VITE_API_URL}/profile/${user.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${getSession('token')}`,
          },
          withCredentials: true,
        }
      );
      showToast.success('Profile updated successfully!');
    } catch (err) {
      showToast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const AccordionSection = ({
    id,
    title,
    icon: Icon,
    children,
    isOpen,
    onToggle,
  }) => (
    <div className="border border-neutral-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-neutral-900 hover:bg-neutral-800 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Icon size={16} className="sm:w-5 sm:h-5 text-white" />
          <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="sm:w-5 sm:h-5 text-neutral-400" />
        ) : (
          <ChevronDown size={16} className="sm:w-5 sm:h-5 text-neutral-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 sm:p-4 bg-black border-t border-neutral-800">
          {children}
        </div>
      )}
    </div>
  );

  const handleProfilePicClick = () => {
    profileInputRef.current?.click();
  };

  const handleCoverPhotoClick = () => {
    coverInputRef.current?.click();
  };

  const tempValuesRef = useRef({});

  const handleTempChange = e => {
    const { name, value } = e.target;
    if (!name) return;
    tempValuesRef.current[name] = value;
  };

  const handleCommit = e => {
    const { name } = e.target;
    if (!name) return;
    const value = tempValuesRef.current[name] ?? e.target.value;

    const parts = name.split('.');
    if (parts.length === 2) {
      const [parent, child] = parts;
      setForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else if (parts.length === 3) {
      const [parent, idxStr, field] = parts;
      const idx = parseInt(idxStr, 10);
      if (Number.isInteger(idx)) {
        if (parent === 'experience') {
          setForm(prev => ({
            ...prev,
            experience: prev.experience.map((item, i) =>
              i === idx ? { ...item, [field]: value } : item
            ),
          }));
        } else if (parent === 'certifications') {
          setForm(prev => ({
            ...prev,
            certifications: prev.certifications.map((item, i) =>
              i === idx ? { ...item, [field]: value } : item
            ),
          }));
        } else {
          setForm(prev => {
            const arr = Array.isArray(prev[parent]) ? [...prev[parent]] : [];
            if (!arr[idx]) arr[idx] = {};
            arr[idx] = { ...arr[idx], [field]: value };
            return { ...prev, [parent]: arr };
          });
        }
      } else {
        const [parent, child] = parts;
        setForm(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: value },
        }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    delete tempValuesRef.current[name];
  };

  const handleImageSelect = async (file, field) => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    if (field === 'profilePicture') {
      if (previewProfile) URL.revokeObjectURL(previewProfile);
      setPreviewProfile(objectUrl);
      setProfilePicFile(file);
    } else if (field === 'coverPhoto') {
      if (previewCover) URL.revokeObjectURL(previewCover);
      setPreviewCover(objectUrl);
      setCoverPhotoFile(file);
    }

    try {
      const url = await uploadFile(file);
      if (url) {
        setForm(prev => ({ ...prev, [field]: url }));
        if (field === 'profilePicture') {
          if (previewProfile) URL.revokeObjectURL(previewProfile);
          setPreviewProfile('');
        } else {
          if (previewCover) URL.revokeObjectURL(previewCover);
          setPreviewCover('');
        }
      }
    } catch (err) {
      showToast.error('Image upload failed');
    }
  };

  const handleEducationTempChange = (field, value) => {
    educationBufferRef.current[field] = value;
  };

  const commitEducationChange = (field) => {
    const value = educationBufferRef.current[field];
    if (value !== undefined) {
      setForm(prev => ({
        ...prev,
        education: { ...prev.education, [field]: value },
      }));
      delete educationBufferRef.current[field];
    }
  };

  useEffect(() => {
    return () => {
      if (previewProfile) URL.revokeObjectURL(previewProfile);
      if (previewCover) URL.revokeObjectURL(previewCover);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 bg-neutral-800">
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={e => handleImageSelect(e.target.files[0], 'coverPhoto')}
          className="hidden"
        />
        {previewCover || form.coverPhoto ? (
          <img
            src={previewCover || form.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={handleCoverPhotoClick}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors text-sm sm:text-base"
            >
              <Camera size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Cover Photo</span>
              <span className="sm:hidden">Add Cover</span>
            </button>
          </div>
        )}
        {form.coverPhoto && (
          <button
            type="button"
            onClick={handleCoverPhotoClick}
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors text-xs sm:text-sm"
          >
            <Camera size={14} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Change Cover</span>
            <span className="sm:hidden">Change</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 relative -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 xl:-mt-32">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full border-2 sm:border-4 border-black bg-neutral-800 overflow-hidden">
          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            onChange={e =>
              handleImageSelect(e.target.files[0], 'profilePicture')
            }
            className="hidden"
          />
          {previewProfile || form.profilePicture ? (
            <img
              src={previewProfile || form.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={24} className="sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 text-neutral-400" />
            </div>
          )}
          <button
            type="button"
            onClick={handleProfilePicClick}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
          >
            <Camera size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-sm sm:text-base text-neutral-400">
            Customize your professional profile
          </p>
        </div>



        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <AccordionSection
            id="basic"
            title="Basic Information"
            icon={User}
            isOpen={openSections.basic}
            onToggle={toggleSection}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={form.name}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Professional Headline *
                  </label>
                  <input
                    type="text"
                    name="headline"
                    defaultValue={form.headline}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="e.g. Senior Software Engineer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  defaultValue={form.bio}
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 h-20 sm:h-24 text-sm sm:text-base"
                  placeholder="Tell us about yourself and your professional journey..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm sm:text-base"
                  >
                    <option value="student">Student</option>
                    <option value="employed">Employed</option>
                    <option value="looking">Looking for Job</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="hiring">Hiring</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={form.accountType}
                    onChange={handleChange}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm sm:text-base"
                  >
                    <option value="student">Student</option>
                    <option value="employee">Employee</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="location"
            title="Location"
            icon={MapPin}
            isOpen={openSections.location}
            onToggle={toggleSection}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    defaultValue={form.location.city}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="location.country"
                    defaultValue={form.location.country}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="United States"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Full Address (Optional)
                </label>
                <input
                  type="text"
                  name="location.address"
                  defaultValue={form.location.address}
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                  placeholder="123 Main St, San Francisco, CA 94105"
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="education"
            title="Education"
            icon={GraduationCap}
            isOpen={openSections.education}
            onToggle={toggleSection}
          >
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Institution
                </label>
                <UniversitySelect
                  value={form.education.institution}
                  onChange={(value) => handleEducationChange('institution', value)}
                  placeholder="e.g. IITB"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Degree
                  </label>
                  <input
                    type="text"
                    name="education.degree"
                    defaultValue={form.education.degree}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="e.g. B.Sc, M.Sc, PhD"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    GPA (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    name="education.gpa"
                    defaultValue={form.education.gpa || ''}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="9.8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Field of Study
                </label>
                <input
                  type="text"
                  name="education.fieldOfStudy"
                  defaultValue={form.education.fieldOfStudy}
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                  placeholder="e.g. Computer Engineering"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="education.description"
                  defaultValue={form.education.description}
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 h-16 sm:h-20 text-sm sm:text-base"
                  placeholder="Awards, achievements, relevant coursework..."
                />
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="experience"
            title="Work Experience"
            icon={Briefcase}
            isOpen={openSections.experience}
            onToggle={toggleSection}
          >
            <div className="space-y-4 sm:space-y-6">
              {form.experience.map((exp, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          name={`experience.${index}.title`}
                          defaultValue={exp.title}
                          onChange={handleTempChange}
                          onBlur={handleCommit}
                          className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                          placeholder="Software Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          name={`experience.${index}.company`}
                          defaultValue={exp.company}
                          onChange={handleTempChange}
                          onBlur={handleCommit}
                          className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                          placeholder="TechCorp Inc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name={`experience.${index}.location`}
                        defaultValue={exp.location}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name={`experience.${index}.startDate`}
                          defaultValue={
                            exp.startDate ? exp.startDate.split('T')[0] : ''
                          }
                          onChange={handleTempChange}
                          onBlur={handleCommit}
                          className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name={`experience.${index}.endDate`}
                          defaultValue={
                            exp.endDate ? exp.endDate.split('T')[0] : ''
                          }
                          onChange={handleTempChange}
                          onBlur={handleCommit}
                          disabled={exp.current}
                          className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`current-${index}`}
                        checked={exp.current}
                        onChange={e =>
                          handleExperienceChange(
                            index,
                            'current',
                            e.target.checked
                          )
                        }
                        className="rounded border-neutral-600 bg-neutral-800 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <label
                        htmlFor={`current-${index}`}
                        className="text-xs sm:text-sm text-neutral-300"
                      >
                        I currently work here
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Description
                      </label>
                      <textarea
                        name={`experience.${index}.description`}
                        defaultValue={exp.description}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 h-20 sm:h-24 text-sm sm:text-base"
                        placeholder="Describe your role, responsibilities, and achievements..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addExperience}
                className="w-full py-2.5 sm:py-3 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
                Add Another Experience
              </button>
            </div>
          </AccordionSection>

          <AccordionSection
            id="skills"
            title="Skills"
            icon={Settings}
            isOpen={openSections.skills}
            onToggle={toggleSection}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-2">
                <input
                  ref={skillInputRef}
                  name="skills.input"
                  className="flex-1 p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                  type="text"
                  placeholder="Add a skill"
                  defaultValue=""
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    addSkill();
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(Array.isArray(form.skills) ? form.skills : []).map(
                  (skill, index) => {
                    const label =
                      typeof skill === 'string'
                        ? skill
                        : (skill && skill.name) || String(skill);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 sm:gap-2 bg-neutral-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                      >
                        <span className="text-white text-xs sm:text-sm">{label}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-neutral-400 hover:text-red-400 transition-colors"
                        >
                          <X size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </AccordionSection>

          <AccordionSection
            id="certifications"
            title="Certifications"
            icon={Award}
            isOpen={openSections.certifications}
            onToggle={toggleSection}
          >
            <div className="space-y-4 sm:space-y-6">
              {form.certifications.map((cert, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 bg-neutral-900 rounded-xl border border-neutral-800"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Certification Name
                      </label>
                      <input
                        type="text"
                        name={`certifications.${index}.name`}
                        defaultValue={cert.name}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                        placeholder="AWS Solutions Architect"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Issuing Organization
                      </label>
                      <input
                        type="text"
                        name={`certifications.${index}.issuer`}
                        defaultValue={cert.issuer}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                        placeholder="Amazon Web Services"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Issue Date
                      </label>
                      <input
                        type="date"
                        name={`certifications.${index}.date`}
                        defaultValue={cert.date ? cert.date.split('T')[0] : ''}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                        Credential ID
                      </label>
                      <input
                        type="text"
                        name={`certifications.${index}.credentialId`}
                        defaultValue={cert.credentialId}
                        onChange={handleTempChange}
                        onBlur={handleCommit}
                        className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                        placeholder="AWS-SAA-2023-001"
                      />
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                      Credential URL
                    </label>
                    <input
                      type="url"
                      name={`certifications.${index}.url`}
                      defaultValue={cert.url}
                      onChange={handleTempChange}
                      onBlur={handleCommit}
                      className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                      placeholder="https://credentials.aws.com/..."
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCertification}
                className="w-full py-2.5 sm:py-3 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus size={16} className="sm:w-4.5 sm:h-4.5" />
                Add Another Certification
              </button>
            </div>
          </AccordionSection>

          <AccordionSection
            id="social"
            title="Social Links & Portfolio"
            icon={Globe}
            isOpen={openSections.social}
            onToggle={toggleSection}
          >
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    defaultValue={form.socialLinks.linkedin}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    name="socialLinks.github"
                    defaultValue={form.socialLinks.github}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Twitter/X Profile
                  </label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    defaultValue={form.socialLinks.twitter}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                    Portfolio Website
                  </label>
                  <input
                    type="url"
                    name="socialLinks.portfolio"
                    defaultValue={form.socialLinks.portfolio}
                    onChange={handleTempChange}
                    onBlur={handleCommit}
                    className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 sm:mb-2">
                  Personal Website
                </label>
                <input
                  type="url"
                  name="website"
                  defaultValue={form.website}
                  onChange={handleTempChange}
                  onBlur={handleCommit}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 text-sm sm:text-base"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </AccordionSection>

          <div className="pt-4 sm:pt-6 border-t border-neutral-800">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
              <button
                type="button"
                className="px-4 sm:px-6 py-2.5 sm:py-3 border border-neutral-600 text-neutral-300 rounded-xl hover:border-neutral-500 hover:text-white transition-colors text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
              >
                <User size={16} className="sm:w-4.5 sm:h-4.5" />
                Save Profile
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              Profile Completion
            </span>
            <span className="text-xs sm:text-sm text-neutral-400">
              {Math.round(
                (((form.name ? 1 : 0) +
                  (form.headline ? 1 : 0) +
                  (form.bio ? 1 : 0) +
                  (form.location.city ? 1 : 0) +
                  (form.education.institution ? 1 : 0) +
                  (form.skills.length > 0 ? 1 : 0)) /
                  6) *
                100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-white to-neutral-300 h-1.5 sm:h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(
                  (((form.name ? 1 : 0) +
                    (form.headline ? 1 : 0) +
                    (form.bio ? 1 : 0) +
                    (form.location.city ? 1 : 0) +
                    (form.education.institution ? 1 : 0) +
                    (form.skills.length > 0 ? 1 : 0)) /
                    6) *
                  100
                )}%`,
              }}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Complete all sections to optimize your profile visibility
          </p>
        </div>
      </div>
    </div>
  );
}
