import React from 'react';

interface UserStatsChartProps {
  data: Record<string, number>;
}

const UserStatsChart: React.FC<UserStatsChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const getColor = (role: string) => {
    const colors: Record<string, string> = {
      'Doctor': '#3498db',
      'Patient': '#2ecc71',
      'Lab': '#e74c3c',
      'Admin': '#f39c12'
    };
    return colors[role] || '#95a5a6';
  };

  return (
    <div className="chart-content">
      <div className="chart-bars">
        {Object.entries(data).map(([role, count]) => (
          <div key={role} className="chart-bar-item">
            <div className="bar-label">{role}</div>
            <div className="bar-container">
              <div
                className="bar"
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: getColor(role)
                }}
              />
            </div>
            <div className="bar-value">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStatsChart;
