import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('http://localhost:3000/')) {
    return next(req);
  }

  return next(
    req.clone({
      withCredentials: true,
    }),
  );
};
