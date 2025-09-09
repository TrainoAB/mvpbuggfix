export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  // Calculate the difference in milliseconds
  const diff = now - date;

  // Convert difference to days
  const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  // If it's today
  if (diffInDays === 0 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // If it's yesterday or within the past week
  if (diffInDays === 1) {
    return '1 day ago';
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // If it's within the past month
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) {
      return '1 week ago';
    }
    return `${diffInWeeks} weeks ago`;
  }

  // Otherwise, show date in the format "Dec 21, 2024, 12:00"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
