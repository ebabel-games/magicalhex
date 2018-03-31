define([], () => {
  const round = (input, decimals = 0) => {
    const factor = Math.pow(10, decimals);
    return Math.round(input * factor) / factor;
  };

  return round;
});
