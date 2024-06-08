import React, { createContext, useState } from 'react';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ userId: null });

  return (
    <UserContext.Provider value={{ userId: user.userId, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
