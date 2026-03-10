import { useState, useEffect } from "react";
import api from "../../lib/api";
import "../../styles/appointments.css";

const Appointments = () => {
  const [currentView, setCurrentView] = useState<"calendar" | "list">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب المواعيد من الـ backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await api.get("/doctor/appointments");
        setAppointments(res.data || []);
      } catch (err: any) {
        console.error("Fetch appointments error:", err);
        setError(err.response?.data?.error || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // باقي الدوال زي ما هي (getDaysInMonth, handlePrevMonth, handleNextMonth, getAppointmentsForDay)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
    );
  };

  const getAppointmentsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((apt) => apt.date === dateStr);
  };

  if (loading) return <div className="loading">Loading appointments...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="appointments">
      <div className="appointment-header">
        <h1>Appointments</h1>
        <div className="view-toggle">
          <button
            className={`toggle-button ${currentView === "list" ? "active" : ""}`}
            onClick={() => setCurrentView("list")}
          >
            List View
          </button>
          <button
            className={`toggle-button ${currentView === "calendar" ? "active" : ""}`}
            onClick={() => setCurrentView("calendar")}
          >
            Calendar View
          </button>
        </div>
      </div>

      {currentView === "list" ? (
        <div className="appointments-list-container">
          <div className="filter-options">
            <select>
              <option value="all">All Appointments</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" className="date-filter" />
          </div>

          <div className="appointments-table">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.patient}</td>
                      <td>
                        {appointment.date} at {appointment.time}
                      </td>
                      <td>{appointment.type}</td>
                      <td>
                        <span className={`status-badge ${appointment.status}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-button">View Details</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-header">
            <button className="nav-button" onClick={handlePrevMonth}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <h2>{monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
            <button className="nav-button" onClick={handleNextMonth}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="day-header">Sun</div>
            <div className="day-header">Mon</div>
            <div className="day-header">Tue</div>
            <div className="day-header">Wed</div>
            <div className="day-header">Thu</div>
            <div className="day-header">Fri</div>
            <div className="day-header">Sat</div>

            {getDaysInMonth(selectedDate).map((day, index) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : [];
              const isToday =
                day === new Date().getDate() &&
                selectedDate.getMonth() === new Date().getMonth() &&
                selectedDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`calendar-day ${!day ? "empty" : ""} ${isToday ? "today" : ""}`}
                >
                  {day && (
                    <>
                      <div className="day-number">{day}</div>
                      <div className="day-appointments">
                        {dayAppointments.slice(0, 2).map((apt, i) => (
                          <div key={i} className="appointment-dot"></div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="more-appointments">
                            +{dayAppointments.length - 2}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
