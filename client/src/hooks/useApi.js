import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { successMsg, errorMsg, onSuccess, onError } = options;
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      const data = response.data;
      if (successMsg) toast.success(successMsg);
      if (onSuccess) onSuccess(data);
      return data;
    } catch (err) {
      const message = err.message || errorMsg || 'Une erreur est survenue';
      setError(message);
      if (errorMsg !== false) toast.error(message);
      if (onError) onError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};

export default useApi;
