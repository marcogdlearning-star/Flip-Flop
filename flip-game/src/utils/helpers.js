export const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance, decimals = 18) => {
  const value = parseFloat(balance) / Math.pow(10, decimals);
  return value.toFixed(2);
};

export const determineWinner = (playerChoice, opponentChoice) => {
  if (playerChoice === opponentChoice) return 'tie';
  
  if (
    (playerChoice === 0 && opponentChoice === 2) ||
    (playerChoice === 1 && opponentChoice === 0) ||
    (playerChoice === 2 && opponentChoice === 1)
  ) {
    return 'win';
  }
  
  return 'lose';
};

export const getChoiceEmoji = (choice) => {
  const emojis = ['✊', '✋', '✌️'];
  return emojis[choice];
};

export const getChoiceName = (choice) => {
  const names = ['Rock', 'Paper', 'Scissors'];
  return names[choice];
};
