'use client';

import {useState, useEffect} from 'react';

// Define a type for the value that can be stored in local storage
type Value<T> = T | null;

function useLocalStorage<T>(key: string, initialValue: T): [Value<T>, (value: T) => void] {
  // State to store the value
  const [storedValue, setStoredValue] = useState<Value<T>>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initial value
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initial value
      console.error(error);
      return initialValue;
    }
  });

  // Function to update the local storage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue as T) : value;
      // Save the state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(error);
    }
  };

  useEffect(() => {
    // When the key changes, update the stored value in state
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
