'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'meetingmind_user_id';
const COOKIE_OPTIONS = {
  expires: 365, 
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    
    let existingUserId = Cookies.get(USER_ID_COOKIE);
    
    if (!existingUserId) {
      
      existingUserId = uuidv4();
      Cookies.set(USER_ID_COOKIE, existingUserId, COOKIE_OPTIONS);
      console.log('[useUserId] Generated new userId:', existingUserId);
    } else {
      console.log('[useUserId] Found existing userId:', existingUserId);
    }
    
    setUserId(existingUserId);
  }, []);

  return userId;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(USER_ID_COOKIE) || null;
}

export function setUserId(userId: string): void {
  Cookies.set(USER_ID_COOKIE, userId, COOKIE_OPTIONS);
}

export function clearUserId(): void {
  Cookies.remove(USER_ID_COOKIE);
}
