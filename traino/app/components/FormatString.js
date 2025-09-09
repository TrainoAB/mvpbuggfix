export function formatString(str) {
    // Replace camelCase and PascalCase with spaces
    let formatted = str.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Replace snake_case with spaces
    formatted = formatted.replace(/_/g, ' ');
    // Capitalize the first letter of each word
    formatted = formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return formatted;
  }