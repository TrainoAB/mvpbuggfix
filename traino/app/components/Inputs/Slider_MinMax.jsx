'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import './Slider_MinMax.css';

/////////////////////////////////////////////////////////////////////////////////////
// min      = minimum value
// max      = maximum value
// step     = step between values
// minRange = minimum range between the two values
// suffix   = suffix for the values
// prefix   = prefix for the values
// value    = function that takes an object with min and max values
/////////////////////////////////////////////////////////////////////////////////////

export const Slider_MinMax = ({
  startMin,
  startMax,
  min = 0,
  max = 100,
  step = 1,
  minRange = 0,
  suffix = false,
  prefix,
  value,
  onMouseUp,
}) => {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);

  const diff = max - min;
  const [val, setVal] = useState(
    typeof startMin == 'number' && startMin >= min ? startMin : Math.round((diff * 0.25 + min) / step) * step,
    2,
  );
  const [val2, setVal2] = useState(
    typeof startMax == 'number' && startMax <= max ? startMax : Math.round((diff * 0.75 + min) / step) * step,
    2,
  );

  useEffect(() => {
    value({ min: val, max: val2, suffix: suffix });
  }, [val, val2]);

  const handleLeft = (e, v = e.target.value) => {
    v = Math.min(v, val2 - minRange);
    setVal(v);
  };
  const handleRight = (e, v = e.target.value) => {
    v = Math.max(v, val + minRange);
    setVal2(v);
  };

  const handleUp = () => {
    onMouseUp({ min: val, max: val2 });
  };

  function getPercentage(number) {
    return Math.round((number - min) / step) * (step / diff) * 100;
  }
  const valP = getPercentage(val);
  const val2P = getPercentage(val2);

  return (
    <>
      <div className="tworange-body">
        <div className="tworangehandle-container">
          <p>
            {min} {suffix}
          </p>
          <p>
            {max} {suffix}
          </p>
          <section className="tworangehandle-bar" style={{ left: `${valP}%`, width: `${val2P - valP}%` }}></section>
          <input
            className="tworangehandle-inp"
            type="range"
            min={min}
            max={max}
            value={val}
            step={step}
            onChange={handleLeft}
            onMouseUp={handleUp}
          />
          <input
            className="tworangehandle-inp"
            type="range"
            min={min}
            max={max}
            value={val2}
            step={step}
            onChange={handleRight}
            onMouseUp={handleUp}
          />
        </div>
        <div className="tworangehandle-values">
          <p>
            {prefix && translate('from', language)} {val} {suffix}
          </p>
          <p>
            {prefix && translate('to', language)} {val2} {suffix}
          </p>
        </div>
      </div>
    </>
  );
};
