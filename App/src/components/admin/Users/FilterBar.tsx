import React, { useState } from "react";

interface FilterBarProps {
  onFilterChange: (filters: {
    role: string;
    status: string;
    search: string;
  }) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    search: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = { role: "", status: "", search: "" };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <input
          type="text"
          name="search"
          placeholder="Search by email or name..."
          value={filters.search}
          onChange={handleChange}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <select
          name="role"
          value={filters.role}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="Doctor">Doctor</option>
          <option value="Patient">Patient</option>
          <option value="Lab">Lab</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <div className="filter-group">
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="\">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending Approval">Pending Approval</option>
        </select>
      </div>
      <button className="reset-btn" onClick={handleReset}>
        🔄 Reset
      </button>
    </div>
  );
};

export default FilterBar;
