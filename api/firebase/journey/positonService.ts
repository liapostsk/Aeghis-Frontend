import { auth, db } from '@/firebaseconfig';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type { Position, JourneyDoc, Participation } from '../types';


