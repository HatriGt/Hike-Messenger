import React from 'react';
import './ChatWindowSkeletonLoader.css';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-header"></div>
      <div className="skeleton-content">
        <div className="skeleton-sidebar">
          <div className="skeleton-user"></div>
          <div className="skeleton-user"></div>
          <div className="skeleton-user"></div>
        </div>
        <div className="skeleton-chat">
          <div className="skeleton-message"></div>
          <div className="skeleton-message"></div>
          <div className="skeleton-message"></div>
          <div className="skeleton-input"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
