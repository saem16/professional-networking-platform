import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import SearchableSelect from './SearchableSelect';
import { showToast } from '../utils/toast';

const CourseSelect = ({ value, onChange, onBlur }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCSV = async () => {
      try {
        const url =
          'https://raw.githubusercontent.com/fivethirtyeight/data/master/college-majors/recent-grads.csv';
        const res = await axios.get(url);
        const parsed = Papa.parse(res.data, { header: true });
        const majors = parsed.data
          .map(row => row.Major)
          .filter(Boolean)
          .sort();
        setFields(majors);
      } catch (err) {
        showToast.error('Failed to load course data');
        setFields([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCSV();
  }, []);

  return (
    <SearchableSelect
      label="Field of Study"
      options={fields}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      loading={loading}
      allowCustomInput={true}
      placeholder="Search or type your field of study..."
    />
  );
};

export default CourseSelect;
