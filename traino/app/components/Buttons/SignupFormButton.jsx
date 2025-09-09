import React, { useState } from 'react';
import { playSound } from '@/app/components/PlaySound';
import ButtonLoader from '@/app/components/ButtonLoader';
import Loader from '@/app/components/Loader';

const SignupFormButton = ({
  emailExistsMessage,
  emailValidationLoading,
  isValidEmail,
  isLoading,
  licenseSkipped,
  formData,
  translate,
  language,
  currentStep,
  totalSteps,
}) => {
  const isButtonDisabled =
    emailExistsMessage !== '' ||
    emailValidationLoading === true ||
    isValidEmail !== true ||
    formData.firstname?.length <= 0 ||
    formData.lastname?.length <= 0 ||
    formData.email?.length <= 0 ||
    !formData.mobilephone ||
    formData.mobilephone?.length <= 0 ||
    formData.password?.length < 8 ||
    formData.terms === false ||
    isLoading === true ||
    ((formData.files?.length ?? 0) <= 0 && licenseSkipped === false);

  if (isLoading) {
    return (
      <button type="submit" className="button" style={{ paddingTop: '2px', paddingBottom: '3px' }} disabled>
        <ButtonLoader language={language} translate={translate} />
      </button>
    );
  } else {
    return (
      <button type="submit" className="button" onClick={() => playSound('popclick', '0.5')} disabled={isButtonDisabled}>
        {currentStep === 4
          ? translate('finishsignup', language)
          : `${translate('next', language)} ${currentStep}/${totalSteps}`}
      </button>
    );
  }
};

export default SignupFormButton;
