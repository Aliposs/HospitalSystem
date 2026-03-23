import React from 'react';

interface CaseStatsChartProps {
  data: Record<string, number>;
}

const CaseStatsChart: React.FC<CaseStatsChartProps> = ({ data }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const getColor = (status: string) => {
    const colors: Record<string, string> = {
      'Open': '#e74c3c',
      'In Progress': '#f39c12',
      'Closed': '#2ecc71',
      'Pending': '#95a5a6'
    };
    return colors[status] || '#3498db';
  };

  return (
    <div className="chart-content">
      <div className="chart-pie">
        {Object.entries(data).map(([status, count], index) => {
          const percentage = (count / total) * 100;
          return (
            <div key={status} className="pie-item">
              <div
                className="pie-segment"
                style={{
                  backgroundColor: getColor(status),
                  width: '100%',
                  padding: '8px',
                  marginBottom: '4px',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                {status}: {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseStatsChart;
