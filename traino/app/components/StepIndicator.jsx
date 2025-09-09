import React, { useEffect, useState } from 'react';
import { playSound } from '@/app/components/PlaySound';
import { ProgressBar, Step } from 'react-step-progress-bar';

import './StepIndicator.css';

const StepIndicator = ({ currentStep, totalSteps, onPageNumberClick, handleSubmit, stepStatus = [] }) => {
  const [showIndicator, setShowIndicator] = useState(true);
  let lastScrollTop = 0;

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight < window.innerWidth) {
        let scrollTop = window.scrollY || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 50) {
          setShowIndicator(false);
        } else if (scrollTop < lastScrollTop) {
          setShowIndicator(true);
        }

        lastScrollTop = scrollTop;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const generateStepPercentages = (totalSteps) => {
    const stepPercentages = {};
    for (let i = 1; i <= totalSteps; i++) {
      stepPercentages[i] = ((i - 1) / (totalSteps - 1)) * 100;
    }
    return stepPercentages;
  };

  const stepPercentages = generateStepPercentages(totalSteps);
  const stepPercentage = stepPercentages[currentStep] || 0;

  return showIndicator ? (
    <div className="step-indicator-container">
      <ProgressBar percent={stepPercentage}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Step key={index}>
            {({ accomplished }) => {
              const status = stepStatus[index] || 'default'; // 'completed', 'failed', 'current', or 'default'
              const isCurrentStep = index + 1 === currentStep;
              return (
                <div
                  className={`indexedStep ${status} ${isCurrentStep ? 'current' : ''}`}
                  onMouseOver={() => (accomplished || index <= currentStep) && playSound('tickclick', '0.5')}
                  onClick={() => {
                    if (index < currentStep) {
                      // Tillåt att gå tillbaka till tidigare steg
                      playSound('popclick', '0.5');
                      onPageNumberClick(index + 1);
                    } else if (index === currentStep) {
                      // Tillåt att gå framåt om det nuvarande steget är korrekt validerat
                      playSound('popclick', '0.5');
                      handleSubmit();
                    } else if (index > currentStep) {
                      // Om användaren försöker hoppa över steg, kontrollera om det är validerat
                      handleSubmit();
                    }
                  }}
                >
                  {status === 'completed' && <span className="checkmark">✓</span>}
                  {status === 'failed' && <span className="exclamation">!</span>}
                  {status === 'default' && index + 1}
                  {isCurrentStep && <span className="current-step-number"></span>}
                </div>
              );
            }}
          </Step>
        ))}
      </ProgressBar>
    </div>
  ) : null;
};

export default StepIndicator;