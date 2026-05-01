const generateToken = (id) => {
  // Simple mock token for now to avoid dependency issues
  return `mock_token_${id}_${Date.now()}`;
};

export default generateToken;
