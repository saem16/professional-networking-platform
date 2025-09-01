
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchableSelect from './SearchableSelect';

const ProfessionSelect = ({ value, onChange, onBlur }) => {
  const [professions, setProfessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfessions = async () => {
      try {

        const modernProfessions = [

          'Full Stack Developer',
          'Frontend Developer',
          'Backend Developer',
          'Web Developer',
          'Software Engineer',
          'Software Developer',
          'Mobile App Developer',
          'iOS Developer',
          'Android Developer',
          'Data Scientist',
          'Data Analyst',
          'Data Engineer',
          'Machine Learning Engineer',
          'AI Engineer',
          'DevOps Engineer',
          'Cloud Engineer',
          'Cloud Architect',
          'Site Reliability Engineer (SRE)',
          'Cybersecurity Specialist',
          'Information Security Analyst',
          'Penetration Tester',
          'UI/UX Designer',
          'Product Designer',
          'Graphic Designer',
          'Web Designer',
          'Product Manager',
          'Technical Product Manager',
          'Project Manager',
          'Scrum Master',
          'Business Analyst',
          'Systems Analyst',
          'Quality Assurance Engineer',
          'Test Engineer',
          'Database Administrator',
          'System Administrator',
          'Network Engineer',
          'IT Support Specialist',
          'Technical Writer',
          'Documentation Specialist',
          'Developer Relations Engineer',


          'Digital Marketing Specialist',
          'SEO Specialist',
          'Social Media Manager',
          'Content Creator',
          'Content Marketing Manager',
          'Email Marketing Specialist',
          'PPC Specialist',
          'Growth Hacker',
          'Influencer Marketing Manager',
          'Community Manager',
          'Brand Manager',


          'Sales Engineer',
          'Business Development Manager',
          'Account Manager',
          'Customer Success Manager',
          'Sales Representative',
          'Inside Sales Representative',
          'Account Executive',
          'Marketing Manager',
          'Marketing Coordinator',
          'Brand Strategist',


          'Financial Analyst',
          'Accountant',
          'Controller',
          'CFO',
          'Investment Analyst',
          'Operations Manager',
          'Supply Chain Manager',
          'Logistics Coordinator',
          'Human Resources Manager',
          'HR Specialist',
          'Recruiter',
          'Talent Acquisition Specialist',


          'Video Editor',
          'Motion Graphics Designer',
          'Photographer',
          'Videographer',
          'Copywriter',
          'Creative Director',
          'Art Director',
          'Brand Designer',


          'Consultant',
          'Management Consultant',
          'Strategy Consultant',
          'IT Consultant',
          'Freelancer',
          'Independent Contractor',
          'Entrepreneur',
          'Startup Founder',


          'Teacher',
          'Professor',
          'Research Scientist',
          'Academic Researcher',
          'Training Specialist',
          'Instructional Designer',
          'Curriculum Developer',


          'Biomedical Engineer',
          'Health Informatics Specialist',
          'Clinical Research Coordinator',


          'Student',
          'Intern',
          'Graduate Student',
          'Job Seeker',
          'Career Changer',
        ];

        let allProfessions = [...modernProfessions];


        try {
          const res = await axios.get(
            'https://ec.europa.eu/esco/api/search?type=occupation&limit=500',
            { timeout: 8000 }
          );

          if (res.data._embedded?.results) {
            const apiJobs = res.data._embedded.results
              .map(job => job.title)
              .filter(title => title && title.length < 60);

            allProfessions = [...allProfessions, ...apiJobs];
          }
        } catch (err) {

        }


        const uniqueProfessions = [...new Set(allProfessions)].sort();
        setProfessions(uniqueProfessions);
      } catch (error) {
        console.error('Error setting up professions:', error);

        setProfessions([
          'Full Stack Developer',
          'Frontend Developer',
          'Backend Developer',
          'Software Engineer',
          'Data Scientist',
          'Product Manager',
          'UI/UX Designer',
          'DevOps Engineer',
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessions();
  }, []);

  return (
    <SearchableSelect
      label="Profession"
      options={professions}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      loading={loading}
      allowCustomInput={true}
      placeholder="Search or type your profession..."
      dropdownPosition="above"
    />
  );
};

export default ProfessionSelect;
