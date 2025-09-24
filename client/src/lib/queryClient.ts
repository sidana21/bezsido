import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
): Promise<any> {
  const token = localStorage.getItem("auth_token");
  
  // Build headers object
  const headers: Record<string, string> = {};
  
  // Copy existing headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // If body is present and no Content-Type is set, assume JSON
  if (options.body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `${response.status}: ${response.statusText}`;
    let errorCode = 'UNKNOWN_ERROR';
    
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      if (errorData.errorCode) {
        errorCode = errorData.errorCode;
      }
      
      // Enhanced error for debugging
      console.error('API Error Details:', {
        url,
        status: response.status,
        errorData,
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.error('Failed to parse error response:', errorText);
      // If not JSON, use default message with better context
      errorMessage = `خطأ في الشبكة (${response.status}): ${response.statusText}`;
    }
    
    const error = new Error(errorMessage);
    (error as any).code = errorCode;
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("auth_token");
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
