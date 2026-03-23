import React from 'react';

interface StatisticsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`statistics-card ${color}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h4 className="card-title">{title}</h4>
        <p className="card-value">{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default StatisticsCard;
