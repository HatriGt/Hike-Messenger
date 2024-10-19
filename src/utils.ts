import { Timestamp } from 'firebase/firestore';

export const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
