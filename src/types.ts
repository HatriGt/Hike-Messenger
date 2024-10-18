import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface User extends FirebaseUser {
  id: string;
}

export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  uid: string;
  recipientUid: string;
  delivered: boolean;
  read: boolean;
  participants: string[];
}
