// frontend/src/components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = '← Back', fallbackPath = '/', style = {} }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Try to go back, if fails go to fallback
    try {
      navigate(-1);
    } catch {
      navigate(fallbackPath);
    }
  };

  const defaultStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#475569',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
    marginBottom: '20px',
  };

  return (
    <button
      style={{ ...defaultStyle, ...style }}
      onClick={handleBack}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f8fafc';
        e.currentTarget.style.borderColor = '#94a3b8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {label}
    </button>
  );
};

export default BackButton;