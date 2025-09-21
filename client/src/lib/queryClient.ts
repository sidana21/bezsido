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
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
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
