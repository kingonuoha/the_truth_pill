export const getVisitorId = (): string => {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem("tp_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("tp_visitor_id", id);
  }
  return id;
};

export const getAuthRedirect = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("tp_auth_redirect");
};

export const setAuthRedirect = (url: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("tp_auth_redirect", url);
};

export const clearAuthRedirect = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("tp_auth_redirect");
};
