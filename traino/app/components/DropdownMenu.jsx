import Select from 'react-select';
import { useAppState } from '@/app/hooks/useAppState';
/**
 * DropdownMenu component.
 * @param {Object[]} sportsCategories - Options array which populates the dropdown menu.
 * @param {function} handleAddSport - The function to handle adding a sport.
 * @param {React.Ref} selectInputRef - The ref for the select input.
 * @param {boolean} sportsError - The error state for the sports input.
 */

import './DropdownMenu.css';

function DropdownMenu({ sportsCategories, handleAddSport, selectInputRef, sportsError }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);

  // Create options with translated labels but keep original category_name as value for compatibility
  const translatedOptions = sportsCategories.map((sport) => ({
    value: sport.category_name, // Keep original for compatibility with existing handleAddSport
    label: translate(`cat_${sport.category_link}`, language),
    sport: sport, // Include the full sport object for reference
  }));

  // Sort by translated label
  const sortedOptions = translatedOptions.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <Select
        ref={selectInputRef}
        options={sortedOptions}
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: 'var(--bgcolor)',
            color: 'var(--fgcolor)',
            textAlign: 'left',
            borderColor: 'var(--secondary-light-grey)',
            borderRadius: 'var(--radius)',
            boxShadow: 'none',
            outline: sportsError ? '0.2rem solid var(--red)' : '',
          }),
          container: (baseStyles) => ({
            ...baseStyles,
            width: '100%',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            zIndex: 9999, // Ensure the drodown menu stays on top
          }),
          menuList: (baseStyles) => ({
            ...baseStyles,
            maxHeight: '12rem',
            overflowY: 'auto',
            padding: 0,
            scrollbarColor: 'var(--secondary-light-grey) transparent',
          }),
          option: (baseStyles, { isFocused }) => ({
            ...baseStyles,
            backgroundColor: isFocused ? 'var(--maincolor)' : 'var(--bgcolor)',
            color: isFocused ? 'white' : 'var(--fgcolor)',
          }),
          valueContainer: (baseStyles) => ({
            ...baseStyles,
            padding: '0.5rem 1rem',
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            color: 'var(--fgcolor)',
          })
        }}
        onChange={(selectedOption) => handleAddSport(selectedOption.value)}
        blurInputOnSelect={true}
        closeMenuOnSelect={true}
        tabSelectsValue={false}
        value={null}
        noOptionsMessage={() => translate('noresultsfound', language)}
        placeholder={translate('searchorbrowseforsport', language)}
      />
    </>
  );
}

export default DropdownMenu;
