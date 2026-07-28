import React, { useState } from "react";

const MyCourses = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      tutor: "Aftab",
      degree: "Master's Degree",
      subject: "Mathematics",
      mode: "Physical",
      schedule: "Flexible",
      fee: 50, // ← Set actual fee here
      isPaid: false,
      isConfirmed: false,
    },
  ]);

  const handlePayment = (course) => {
    alert(`💳 Proceed to payment of $${course.fee} for ${course.subject}`);
    // Redirect to payment page or open modal
  };

  const confirmEnrollment = (courseId) => {
    setCourses(prev =>
      prev.map(c =>
        c.id === courseId
          ? { ...c, isConfirmed: true, isPaid: true }
          : c
      )
    );
    alert("✅ Course confirmed successfully!");
  };

  return (
    <div className="my-courses">
      <h2>My Courses</h2>
      <p>You have {courses.length} course</p>

      <div className="tabs">
        <span>All (1)</span>
        <span>Active (1)</span>
        <span>Upcoming (0)</span>
        <span>Completed (0)</span>
      </div>

      {courses.map((course) => (
        <div key={course.id} className="course-card">
          <h3>{course.tutor}</h3>
          <p>{course.degree}</p>

          <div className="course-details">
            <p><strong>Subject:</strong> {course.subject}</p>
            <p><strong>Mode:</strong> {course.mode}</p>
            <p><strong>Schedule:</strong> {course.schedule}</p>
            <p><strong>Fee:</strong> ${course.fee}</p>  {/* ← Shows actual fee */}
            <p><strong>Payment Status:</strong> {course.isPaid ? "✅ Paid" : "✘ Not Paid"}</p>
          </div>

          <div className="action-buttons">
            <button>Chat</button>
            <button>Attendance</button>
            <button onClick={() => handlePayment(course)}>
              Payment - ${course.fee}
            </button>
            <button>View Details</button>
          </div>

          {/* ✅ Direct Confirm Button */}
          {!course.isConfirmed && (
            <button 
              className="confirm-btn"
              onClick={() => confirmEnrollment(course.id)}
            >
              ✅ Confirm
            </button>
          )}

          <button>View Location</button>
        </div>
      ))}
    </div>
  );
};

export default MyCourses;