import { useState, useEffect } from 'react';

export const useNFC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkNFCSupport();
  }, []);

  const checkNFCSupport = () => {
    if ('NDEFReader' in window) {
      setIsSupported(true);
    }
  };

  const startScan = async (onGameDataReceived) => {
    if (!isSupported) {
      setError('NFC is not supported on this device');
      return false;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      setIsScanning(true);
      setError(null);

      ndef.addEventListener('reading', ({ message }) => {
        try {
          const record = message.records[0];
          const textDecoder = new TextDecoder();
          const gameData = JSON.parse(textDecoder.decode(record.data));
          onGameDataReceived(gameData);
        } catch (err) {
          setError('Failed to read NFC data');
        }
      });

      ndef.addEventListener('readingerror', () => {
        setError('Error reading NFC tag');
        setIsScanning(false);
      });

      return true;
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
      return false;
    }
  };

  const writeGameChallenge = async (gameData) => {
    if (!isSupported) {
      setError('NFC is not supported on this device');
      return false;
    }

    try {
      const ndef = new NDEFReader();
      await ndef.write({
        records: [{
          recordType: "text",
          data: JSON.stringify(gameData)
        }]
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  return {
    isSupported,
    isScanning,
    error,
    startScan,
    writeGameChallenge,
    stopScan
  };
};
