'use client';

import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'meetingmind_user_id';
const COOKIE_OPTIONS = {
  expires: 365, 
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

interface UserIdProviderProps {
  children: React.ReactNode;
}


export function UserIdProvider({ children }: UserIdProviderProps) {
  useEffect(() => {
    
    const existingUserId = Cookies.get(USER_ID_COOKIE);
    
    if (!existingUserId) {
      
      const newUserId = uuidv4();
      Cookies.set(USER_ID_COOKIE, newUserId, COOKIE_OPTIONS);
      console.log('[UserIdProvider] Generated new userId:', newUserId);
    } else {
      console.log('[UserIdProvider] Found existing userId:', existingUserId);
    }
  }, []);

  return <>{children}</>;
}
