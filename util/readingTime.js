const calculateReadingTime = (content) => {
  if (!content) return 1; // Default to 1 minute if no content
  
  const wordsPerMinute = 200;
  // Split by whitespace (spaces, tabs, newlines) and filter out empty strings
  const words = content.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(words / wordsPerMinute);
};

module.exports = calculateReadingTime;