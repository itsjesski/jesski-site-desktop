// CSS animations for smooth plant growth and progress bars
export const gardenStyles = `
  @keyframes grow-smooth {
    0% { transform: scale(0.9); opacity: 0.8; }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes progress-fill {
    0% { transform: scaleX(0); }
    100% { transform: scaleX(1); }
  }
  
  .plant-growth {
    animation: grow-smooth 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .progress-bar-fill {
    transform-origin: left;
    animation: progress-fill 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .tooltip-slide-up {
    animation: slideUp 0.2s ease-out;
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translate(-50%, 4px); 
    }
    to { 
      opacity: 1; 
      transform: translate(-50%, 0); 
    }
  }
  
  .btn {
    background-color: #3b82f6;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-height: 2.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
  
  .btn:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
  
  .btn:active:not(:disabled) {
    transform: translateY(0);
  }
  
  .btn:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    .btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      min-height: 2.25rem;
    }
  }
`;
